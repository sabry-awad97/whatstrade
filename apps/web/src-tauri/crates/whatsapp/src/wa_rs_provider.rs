//! wa-rs provider implementation
//!
//! This provider uses the native Rust wa-rs library for WhatsApp operations.

use crate::{
    error::{ProviderError, ProviderResult},
    events::*,
    provider::{EventStream, WhatsAppProvider},
    types::{ConnectionStatus, GroupInfo, MessageId, OutgoingMessage, QRCode, SyncConfig},
};
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{debug, error, info, warn};
use wa_rs::Client;
use wa_rs::bot::Bot;
use wa_rs::pair_code::PairCodeOptions;
use wa_rs::types::events::Event as WaRsEvent;
use wa_rs_proto::whatsapp::device_props::{AppVersion, PlatformType};
use wa_rs_sqlite_storage::SqliteStore;
use wa_rs_tokio_transport::TokioWebSocketTransportFactory;
use wa_rs_ureq_http::UreqHttpClient;

/// Configuration for WaRsProvider
#[derive(Debug, Clone)]
pub struct WaRsConfig {
    /// Path to SQLite database for storing WhatsApp session data
    pub db_path: PathBuf,

    /// Device ID for this WhatsApp instance (allows multiple accounts)
    pub device_id: i32,

    /// Whether to skip history sync on connection
    pub skip_history_sync: bool,
}

impl Default for WaRsConfig {
    fn default() -> Self {
        Self {
            db_path: PathBuf::from("whatsapp.db"),
            device_id: 1,
            skip_history_sync: true,
        }
    }
}

/// Provider that uses wa-rs library
pub struct WaRsProvider {
    client: Arc<Client>,
    event_tx: broadcast::Sender<WhatsAppEvent>,
    bot_task: tokio::sync::Mutex<Option<tokio::task::JoinHandle<()>>>,
}

impl WaRsProvider {
    /// Create a new wa-rs provider
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for the provider
    ///
    /// # Returns
    ///
    /// * `Ok(WaRsProvider)` - Successfully initialized provider
    /// * `Err(ProviderError)` - If initialization fails
    pub async fn new(config: WaRsConfig) -> ProviderResult<Self> {
        info!(
            "Initializing WaRsProvider with device_id={}, db_path={}",
            config.device_id,
            config.db_path.display()
        );

        // Ensure parent directory exists
        if let Some(parent) = config.db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                ProviderError::internal(format!("Failed to create db directory: {}", e))
            })?;
        }

        // Initialize SQLite storage backend
        let backend = Arc::new(
            SqliteStore::new_for_device(
                config.db_path.to_string_lossy().as_ref(),
                config.device_id,
            )
            .await
            .map_err(|e| {
                ProviderError::internal(format!("Failed to initialize SQLite store: {}", e))
            })?,
        );

        // Create broadcast channel for events
        // NOTE: tokio::sync::broadcast only delivers messages to receivers that are already
        // subscribed at the time of sending. Events emitted before event_stream() is called
        // will be lost. The capacity (100) is a ring buffer for lagging existing receivers.
        // Frontend should call get_qr_code() or fetch_status() after subscribing to ensure
        // it receives the current state.
        let (event_tx, _) = broadcast::channel(100);
        let event_tx_clone = event_tx.clone();

        // Build the bot with wa-rs components and event handler
        let mut bot_builder = Bot::builder()
            .with_backend(backend)
            .with_transport_factory(TokioWebSocketTransportFactory::new())
            .with_http_client(UreqHttpClient::new())
            .with_device_props(
                Some("Windows".to_string()),
                Some(AppVersion {
                    primary: Some(2),
                    secondary: Some(3000),
                    tertiary: Some(1015901307),
                    ..Default::default()
                }),
                Some(PlatformType::Chrome),
            )
            .on_event(move |event, _client| {
                let tx = event_tx_clone.clone();
                async move {
                    if let Some(domain_event) = map_wa_rs_event(event) {
                        // Attempt to send event - broadcast returns Ok(receiver_count) or Err
                        match tx.send(domain_event) {
                            Ok(receiver_count) => {
                                debug!("Event sent to {} active receiver(s)", receiver_count);
                            }
                            Err(_) => {
                                // Debug level since this is expected when no receivers are listening
                                debug!("No active event listeners (event queued for future subscribers)");
                            }
                        }
                    }
                }
            });

        if config.skip_history_sync {
            bot_builder = bot_builder.skip_history_sync();
        }

        let mut bot = bot_builder
            .build()
            .await
            .map_err(|e| ProviderError::internal(format!("Failed to build wa-rs bot: {}", e)))?;

        let client = bot.client();

        // Spawn the bot run loop in the background
        let bot_task = tokio::spawn(async move {
            match bot.run().await {
                Ok(handle) => {
                    if let Err(e) = handle.await {
                        error!("wa-rs bot run loop error: {:?}", e);
                    } else {
                        info!("wa-rs bot run loop exited cleanly");
                    }
                }
                Err(e) => error!("wa-rs bot failed to start: {:?}", e),
            }
        });

        info!("WaRsProvider initialized successfully");

        Ok(Self {
            client,
            event_tx,
            bot_task: tokio::sync::Mutex::new(Some(bot_task)),
        })
    }

    /// Create a new provider with default configuration
    pub async fn with_defaults() -> ProviderResult<Self> {
        Self::new(WaRsConfig::default()).await
    }

    /// Wait for the WebSocket connection to be established
    async fn ensure_connected(&self) -> ProviderResult<()> {
        self.client
            .wait_for_socket(std::time::Duration::from_secs(15))
            .await
            .map_err(|e| ProviderError::connection(format!("Failed to connect: {}", e)))
    }
}

#[async_trait]
impl WhatsAppProvider for WaRsProvider {
    fn event_stream(&self) -> ProviderResult<EventStream> {
        let mut rx = self.event_tx.subscribe();
        let stream = async_stream::stream! {
            // Yield all events from the broadcast channel
            loop {
                match rx.recv().await {
                    Ok(event) => yield event,
                    Err(broadcast::error::RecvError::Lagged(skipped)) => {
                        // Receiver is too slow, some events were skipped
                        warn!("Event stream lagged, skipped {} events", skipped);
                        continue;
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        // Channel closed, end the stream
                        break;
                    }
                }
            }
        };

        Ok(Box::pin(stream))
    }

    async fn sync_groups(&self, _config: &SyncConfig) -> ProviderResult<Vec<GroupInfo>> {
        debug!("Syncing groups from WhatsApp");

        if !self.client.is_connected() {
            return Err(ProviderError::connection("Client not connected"));
        }

        if !self.client.is_logged_in() {
            return Err(ProviderError::authentication("Client not logged in"));
        }

        // TODO: Implement group fetching using wa-rs client
        // The wa-rs library should provide methods to fetch groups
        // For now, return empty list as placeholder

        debug!("Group sync not yet fully implemented");
        Ok(vec![])
    }

    async fn get_status(&self) -> ProviderResult<ConnectionStatus> {
        debug!("Getting WhatsApp connection status");

        let connected = self.client.is_connected();
        let logged_in = self.client.is_logged_in();

        let phone_number = if logged_in {
            self.client.get_pn().await.map(|jid| jid.to_string())
        } else {
            None
        };

        Ok(ConnectionStatus {
            connected,
            logged_in,
            phone_number,
            timestamp: chrono::Utc::now(),
        })
    }

    async fn get_qr_code(&self) -> ProviderResult<QRCode> {
        debug!("Requesting QR code for authentication");

        if self.client.is_logged_in() {
            return Err(ProviderError::authentication("Already logged in"));
        }

        self.ensure_connected().await?;

        // In wa-rs, QR codes are emitted through events when the bot connects
        // and is not logged in. The QR code is automatically generated.
        //
        // To get the QR code, you need to:
        // 1. Subscribe to the event stream
        // 2. Listen for WhatsAppEvent::QrCode events
        //
        // Since this is a synchronous method and QR codes come through events,
        // we return an error directing users to use the event-based approach.

        Err(ProviderError::unavailable(
            "QR code is provided through events. Subscribe to event_stream() and listen for QrCode events. The QR code will be automatically emitted when the client connects without a saved session.",
        ))
    }

    async fn send_message(&self, message: &OutgoingMessage) -> ProviderResult<MessageId> {
        debug!("Sending message to {}", message.recipient_jid);

        if message.text.is_empty() {
            return Err(ProviderError::SendFailed("Message text is empty".into()));
        }

        if !self.client.is_connected() {
            return Err(ProviderError::connection("Client not connected"));
        }

        if !self.client.is_logged_in() {
            return Err(ProviderError::authentication("Client not logged in"));
        }

        let to = message
            .recipient_jid
            .parse()
            .map_err(|e| ProviderError::InvalidJid(format!("Invalid JID: {}", e)))?;

        let msg = wa_rs_proto::whatsapp::Message {
            conversation: Some(message.text.clone()),
            ..Default::default()
        };

        let id = self
            .client
            .send_message(to, msg)
            .await
            .map_err(|e| ProviderError::SendFailed(format!("Failed to send message: {}", e)))?;

        Ok(MessageId {
            id,
            timestamp: chrono::Utc::now(),
        })
    }

    async fn logout(&self) -> ProviderResult<()> {
        debug!("Logging out from WhatsApp");

        // Disconnect the client
        self.client.disconnect().await;

        // Abort the bot run loop task
        let mut bot_task = self.bot_task.lock().await;
        if let Some(handle) = bot_task.take() {
            debug!("Aborting bot run loop task");
            handle.abort();

            // Wait for the task to finish with a timeout
            match tokio::time::timeout(std::time::Duration::from_secs(5), handle).await {
                Ok(Ok(())) => debug!("Bot task completed successfully"),
                Ok(Err(e)) if e.is_cancelled() => debug!("Bot task aborted successfully"),
                Ok(Err(e)) => warn!("Bot task panicked: {:?}", e),
                Err(_) => warn!("Bot task abort timed out"),
            }
        }

        info!("Successfully logged out");
        Ok(())
    }

    async fn is_ready(&self) -> ProviderResult<bool> {
        Ok(self.client.is_connected())
    }

    async fn request_pair_code(&self, phone_number: String) -> ProviderResult<String> {
        if phone_number.trim().is_empty() {
            return Err(ProviderError::InvalidJid(
                "Phone number cannot be empty".into(),
            ));
        }

        self.ensure_connected().await?;

        let code = self
            .client
            .pair_with_code(PairCodeOptions {
                phone_number: phone_number.trim().to_string(),
                custom_code: None,
                ..Default::default()
            })
            .await
            .map_err(|e| {
                ProviderError::authentication(format!("Pair code request failed: {}", e))
            })?;

        Ok(code)
    }
}

/// Map wa-rs events to domain events
fn map_wa_rs_event(event: WaRsEvent) -> Option<WhatsAppEvent> {
    use chrono::Utc;

    match event {
        WaRsEvent::Connected(_) => Some(WhatsAppEvent::StateChanged(StateChangeEvent {
            state: ConnectionState::Connected,
            timestamp: Utc::now(),
        })),

        WaRsEvent::Disconnected(_) => Some(WhatsAppEvent::StateChanged(StateChangeEvent {
            state: ConnectionState::Disconnected,
            timestamp: Utc::now(),
        })),

        WaRsEvent::LoggedOut(_) => Some(WhatsAppEvent::StateChanged(StateChangeEvent {
            state: ConnectionState::LoggedOut { reason: None },
            timestamp: Utc::now(),
        })),

        WaRsEvent::StreamReplaced(_) => Some(WhatsAppEvent::StateChanged(StateChangeEvent {
            state: ConnectionState::StreamReplaced,
            timestamp: Utc::now(),
        })),

        WaRsEvent::ConnectFailure(inner) => Some(WhatsAppEvent::StateChanged(StateChangeEvent {
            state: ConnectionState::ConnectFailure {
                reason: format!("{:?}", inner),
            },
            timestamp: Utc::now(),
        })),

        WaRsEvent::TemporaryBan(inner) => Some(WhatsAppEvent::StateChanged(StateChangeEvent {
            state: ConnectionState::TemporaryBan {
                reason: format!("{:?}", inner.code),
                expires_in_secs: inner.expire.num_seconds().max(0) as u64,
            },
            timestamp: Utc::now(),
        })),

        WaRsEvent::PairingQrCode { code, timeout } => Some(WhatsAppEvent::QrCode(QrCodeEvent {
            code,
            timeout_secs: timeout.as_secs(),
            timestamp: Utc::now(),
        })),

        WaRsEvent::PairingCode { code, timeout } => Some(WhatsAppEvent::PairCode(PairCodeEvent {
            code,
            timeout_secs: timeout.as_secs(),
            timestamp: Utc::now(),
        })),

        WaRsEvent::PairSuccess(success) => Some(WhatsAppEvent::PairSuccess(PairSuccessEvent {
            jid: success.id.to_string(),
            lid: Some(success.lid.to_string()),
            push_name: success.business_name,
            platform: success.platform,
            timestamp: Utc::now(),
        })),

        WaRsEvent::PairError(err) => Some(WhatsAppEvent::PairError(PairErrorEvent {
            reason: format!("{:?}", err),
            timestamp: Utc::now(),
        })),

        WaRsEvent::StreamError(inner) => Some(WhatsAppEvent::Error(ErrorEvent {
            message: format!("Stream error: {:?}", inner),
            timestamp: Utc::now(),
        })),

        WaRsEvent::QrScannedWithoutMultidevice(_) => Some(WhatsAppEvent::Error(ErrorEvent {
            message: "QR scanned but multi-device is not enabled on this phone".into(),
            timestamp: Utc::now(),
        })),

        WaRsEvent::ClientOutdated(_) => Some(WhatsAppEvent::Error(ErrorEvent {
            message: "wa-rs client version outdated; rebuild with a newer version".into(),
            timestamp: Utc::now(),
        })),

        // TODO: Map message, receipt, presence, and other events
        // For now, we skip them
        _ => None,
    }
}

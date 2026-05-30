//! WhatsApp Tauri commands
//!
//! Provides IPC commands for WhatsApp operations with proper event streaming to the frontend.

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use utilities::CreateParams;
use whatsapp::{OutgoingMessage, WhatsAppEvent};

/// Request to send a WhatsApp message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    /// Recipient JID (e.g., "1234567890@s.whatsapp.net" or "123456789@g.us")
    pub recipient_jid: String,

    /// Message text
    pub text: String,
}

/// Request to pair with phone number
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairCodeRequest {
    /// Phone number with country code (e.g., "+1234567890")
    pub phone_number: String,
}

/// Response for pair code request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairCodeResponse {
    /// 8-character pairing code
    pub code: String,
}

/// Response for send message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageResponse {
    /// Message ID
    pub message_id: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Response for WhatsApp status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatsAppStatusResponse {
    /// Whether connected to WhatsApp servers
    pub connected: bool,

    /// Whether logged in (authenticated)
    pub logged_in: bool,

    /// Phone number (if logged in)
    pub phone_number: Option<String>,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Get WhatsApp connection status
#[tauri::command]
pub async fn whatsapp_status(app: AppHandle) -> IpcResponse<WhatsAppStatusResponse> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        // Check if provider is initialized
        if let Some(provider) = service.provider().await {
            let status = provider.get_status().await?;

            Ok(WhatsAppStatusResponse {
                connected: status.connected,
                logged_in: status.logged_in,
                phone_number: status.phone_number,
                timestamp: status.timestamp,
            })
        } else {
            // Provider not initialized yet
            Ok(WhatsAppStatusResponse {
                connected: false,
                logged_in: false,
                phone_number: None,
                timestamp: Utc::now(),
            })
        }
    }
    .await
    .into()
}

/// Connect to WhatsApp (initialize provider if needed)
#[tauri::command]
pub async fn whatsapp_connect(app: AppHandle) -> IpcResponse<()> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        service.connect().await?;

        Ok(())
    }
    .await
    .into()
}

/// Disconnect from WhatsApp
#[tauri::command]
pub async fn whatsapp_disconnect(app: AppHandle) -> IpcResponse<()> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        service.disconnect().await?;

        Ok(())
    }
    .await
    .into()
}

/// Request a pairing code for phone number authentication
#[tauri::command]
pub async fn whatsapp_request_pair_code(
    app: AppHandle,
    params: CreateParams<PairCodeRequest>,
) -> IpcResponse<PairCodeResponse> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        // Get or initialize provider
        let provider = service.provider().await.ok_or_else(|| {
            db_service::error::ServiceError::internal(
                "WhatsApp provider not initialized. Call whatsapp_connect first.".to_string(),
            )
        })?;

        let data = params.data();
        let code = provider
            .request_pair_code(data.phone_number.clone())
            .await?;

        Ok(PairCodeResponse { code })
    }
    .await
    .into()
}

/// Send a WhatsApp message
#[tauri::command]
pub async fn whatsapp_send_message(
    app: AppHandle,
    params: CreateParams<SendMessageRequest>,
) -> IpcResponse<SendMessageResponse> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        // Get or initialize provider
        let provider = service.provider().await.ok_or_else(|| {
            db_service::error::ServiceError::internal(
                "WhatsApp provider not initialized. Call whatsapp_connect first.".to_string(),
            )
        })?;

        let data = params.data();
        let message = OutgoingMessage::text(&data.recipient_jid, &data.text);

        let result = provider.send_message(&message).await?;

        Ok(SendMessageResponse {
            message_id: result.id,
            timestamp: result.timestamp,
        })
    }
    .await
    .into()
}

/// Logout from WhatsApp
#[tauri::command]
pub async fn whatsapp_logout(app: AppHandle) -> IpcResponse<()> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        // Get or initialize provider
        let provider = service.provider().await.ok_or_else(|| {
            db_service::error::ServiceError::internal(
                "WhatsApp provider not initialized. Call whatsapp_connect first.".to_string(),
            )
        })?;

        provider.logout().await?;

        Ok(())
    }
    .await
    .into()
}

/// Response for sync groups
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncGroupsResponse {
    /// Whether sync was successful
    pub success: bool,

    /// Number of groups synced
    pub count: u64,
}

/// Sync WhatsApp groups from WhatsApp to database
#[tauri::command]
pub async fn whatsapp_sync_groups(app: AppHandle) -> IpcResponse<SyncGroupsResponse> {
    async {
        let state = app.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        let result = service.sync_groups().await?;

        Ok(SyncGroupsResponse {
            success: result.success,
            count: result.count,
        })
    }
    .await
    .into()
}

/// Start listening to WhatsApp events and emit them to the frontend
///
/// This should be called once when the app starts to set up event streaming.
/// If the provider is not initialized yet, this will wait until it is.
/// The listener will automatically reconnect if the stream ends or errors.
pub async fn start_whatsapp_event_listener(
    app: AppHandle,
) -> Result<(), Box<dyn std::error::Error>> {
    let state = app.state::<AppState>();

    // Check if listener is already running to prevent duplicates
    if state.has_whatsapp_listener().await {
        tracing::warn!("WhatsApp event listener is already running, skipping duplicate spawn");
        return Ok(());
    }

    // Clone app handle for the spawned task
    let app_clone = app.clone();

    // Spawn a task that continuously listens for events with reconnection
    let handle = tokio::spawn(async move {
        let state = app_clone.state::<AppState>();
        let service = state.service_manager().whatsapp_service();

        loop {
            // Check if provider is initialized
            if let Some(provider) = service.provider().await {
                tracing::info!("WhatsApp provider initialized, starting event listener");

                match provider.event_stream() {
                    Ok(mut event_stream) => {
                        // Listen to events and emit them to the frontend
                        while let Some(event) = event_stream.next().await {
                            let event_name = match &event {
                                WhatsAppEvent::StateChanged(_) => "whatsapp:state",
                                WhatsAppEvent::QrCode(_) => "whatsapp:qr",
                                WhatsAppEvent::PairCode(_) => "whatsapp:pair-code",
                                WhatsAppEvent::PairSuccess(_) => "whatsapp:pair-success",
                                WhatsAppEvent::PairError(_) => "whatsapp:pair-error",
                                WhatsAppEvent::Message(_) => "whatsapp:message",
                                WhatsAppEvent::Receipt(_) => "whatsapp:receipt",
                                WhatsAppEvent::Presence(_) => "whatsapp:presence",
                                WhatsAppEvent::ChatState(_) => "whatsapp:chat-state",
                                WhatsAppEvent::GroupsSynced(_) => "whatsapp:groups-synced",
                                WhatsAppEvent::Error(_) => "whatsapp:error",
                            };

                            if let Err(e) = app_clone.emit(event_name, &event) {
                                tracing::error!(
                                    "Failed to emit WhatsApp event {}: {}",
                                    event_name,
                                    e
                                );
                            }
                        }

                        // Stream ended, treat as transient disconnect
                        tracing::warn!("WhatsApp event stream ended, will retry in 2 seconds");
                        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                        // Continue to retry by looping back
                    }
                    Err(e) => {
                        tracing::error!("Failed to get event stream: {}, retrying in 5 seconds", e);
                        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                        // Continue to retry by looping back
                    }
                }
            } else {
                // Provider not initialized yet, wait and retry
                tracing::debug!("WhatsApp provider not initialized yet, waiting...");
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            }
        }
    });

    // Store the handle for graceful shutdown
    state.set_whatsapp_listener_handle(handle).await;

    Ok(())
}

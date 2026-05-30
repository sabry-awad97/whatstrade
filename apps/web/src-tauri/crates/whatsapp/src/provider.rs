//! WhatsApp provider trait definition
//!
//! This trait defines the contract that all WhatsApp provider implementations
//! must fulfill. It abstracts away the specific WhatsApp library being used.

use crate::{
    error::ProviderResult,
    events::WhatsAppEvent,
    types::{ConnectionStatus, GroupInfo, MessageId, OutgoingMessage, QRCode, SyncConfig},
};
use async_trait::async_trait;
use futures::Stream;
use std::pin::Pin;

/// Type alias for event stream
pub type EventStream = Pin<Box<dyn Stream<Item = WhatsAppEvent> + Send>>;

/// Trait for WhatsApp provider implementations
///
/// This trait provides a unified interface for different WhatsApp backends:
/// - wa-rs (native Rust library)
/// - Mock (for testing)
#[async_trait]
pub trait WhatsAppProvider: Send + Sync {
    /// Get an event stream for WhatsApp events
    ///
    /// This stream emits events like:
    /// - Connection state changes
    /// - QR codes for authentication
    /// - Pairing codes
    /// - Incoming messages
    /// - Receipts
    /// - Presence updates
    ///
    /// # Returns
    ///
    /// * `Ok(EventStream)` - Stream of WhatsApp events
    /// * `Err(ProviderError)` - If stream creation fails
    fn event_stream(&self) -> ProviderResult<EventStream>;

    /// Sync groups from WhatsApp
    ///
    /// Fetches the latest list of groups the user is part of.
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for the sync operation
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<GroupInfo>)` - List of groups
    /// * `Err(ProviderError)` - If sync fails
    async fn sync_groups(&self, config: &SyncConfig) -> ProviderResult<Vec<GroupInfo>>;

    /// Get current connection status
    ///
    /// Checks whether the client is connected and authenticated.
    ///
    /// # Returns
    ///
    /// * `Ok(ConnectionStatus)` - Current status
    /// * `Err(ProviderError)` - If status check fails
    async fn get_status(&self) -> ProviderResult<ConnectionStatus>;

    /// Get QR code for authentication
    ///
    /// Note: In wa-rs, QR codes are emitted through events automatically.
    /// This method may return an error directing you to use the event stream.
    ///
    /// # Returns
    ///
    /// * `Ok(QRCode)` - QR code data
    /// * `Err(ProviderError)` - If already logged in or generation fails
    async fn get_qr_code(&self) -> ProviderResult<QRCode>;

    /// Send a message
    ///
    /// Sends a text message to a group or individual.
    ///
    /// # Arguments
    ///
    /// * `message` - Message to send
    ///
    /// # Returns
    ///
    /// * `Ok(MessageId)` - ID of the sent message
    /// * `Err(ProviderError)` - If sending fails
    async fn send_message(&self, message: &OutgoingMessage) -> ProviderResult<MessageId>;

    /// Logout from WhatsApp
    ///
    /// Disconnects and clears authentication state.
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Successfully logged out
    /// * `Err(ProviderError)` - If logout fails
    async fn logout(&self) -> ProviderResult<()>;

    /// Check if the provider is ready to handle requests
    ///
    /// This can be used for health checks and readiness probes.
    ///
    /// # Returns
    ///
    /// * `Ok(true)` - Provider is ready
    /// * `Ok(false)` - Provider is not ready
    /// * `Err(ProviderError)` - If health check fails
    async fn is_ready(&self) -> ProviderResult<bool>;

    /// Request a pairing code for phone number authentication
    ///
    /// This is an alternative to QR code scanning.
    ///
    /// # Arguments
    ///
    /// * `phone_number` - Phone number with country code (e.g., "+1234567890")
    ///
    /// # Returns
    ///
    /// * `Ok(String)` - 8-character pairing code
    /// * `Err(ProviderError)` - If request fails
    async fn request_pair_code(&self, phone_number: String) -> ProviderResult<String>;
}

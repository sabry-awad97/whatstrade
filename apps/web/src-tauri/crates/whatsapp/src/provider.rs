//! WhatsApp provider trait definition
//!
//! This trait defines the contract that all WhatsApp provider implementations
//! must fulfill. It abstracts away the specific WhatsApp library being used.

use crate::{
    error::ProviderResult,
    types::{ConnectionStatus, GroupInfo, MessageId, OutgoingMessage, QRCode, SyncConfig},
};
use async_trait::async_trait;

/// Trait for WhatsApp provider implementations
///
/// This trait provides a unified interface for different WhatsApp backends:
/// - Go service (HTTP-based, temporary)
/// - wa-rs (native Rust library, future)
/// - Mock (for testing)
#[async_trait]
pub trait WhatsAppProvider: Send + Sync {
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
    /// Generates a QR code that can be scanned with WhatsApp mobile app
    /// to authenticate the client.
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
}

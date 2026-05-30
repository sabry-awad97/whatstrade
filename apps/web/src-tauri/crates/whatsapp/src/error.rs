//! Error types for WhatsApp provider operations

use thiserror::Error;

/// Result type for provider operations
pub type ProviderResult<T> = Result<T, ProviderError>;

/// Errors that can occur during WhatsApp provider operations
#[derive(Debug, Error)]
pub enum ProviderError {
    /// Connection error with the WhatsApp service
    #[error("Connection error: {0}")]
    Connection(String),

    /// Authentication error (not logged in, QR code expired, etc.)
    #[error("Authentication error: {0}")]
    Authentication(String),

    /// Invalid JID (WhatsApp identifier) format
    #[error("Invalid JID: {0}")]
    InvalidJid(String),

    /// Message sending failed
    #[error("Failed to send message: {0}")]
    SendFailed(String),

    /// Group operation failed
    #[error("Group operation failed: {0}")]
    GroupOperationFailed(String),

    /// Timeout waiting for operation
    #[error("Operation timed out: {0}")]
    Timeout(String),

    /// Service unavailable or not ready
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),

    /// Internal provider error
    #[error("Internal error: {0}")]
    Internal(String),

    /// Serialization/deserialization error
    #[error("Serialization error: {0}")]
    Serialization(String),
}

impl ProviderError {
    /// Create a connection error
    pub fn connection(msg: impl Into<String>) -> Self {
        Self::Connection(msg.into())
    }

    /// Create an authentication error
    pub fn authentication(msg: impl Into<String>) -> Self {
        Self::Authentication(msg.into())
    }

    /// Create an internal error
    pub fn internal(msg: impl Into<String>) -> Self {
        Self::Internal(msg.into())
    }

    /// Create a service unavailable error
    pub fn unavailable(msg: impl Into<String>) -> Self {
        Self::ServiceUnavailable(msg.into())
    }
}

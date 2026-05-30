//! Domain types for WhatsApp operations
//!
//! These types are provider-agnostic and represent the business domain,
//! not specific to any WhatsApp library implementation.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Information about a WhatsApp group
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupInfo {
    /// Group JID (e.g., "123456789@g.us")
    pub jid: String,

    /// Group name/subject
    pub name: String,

    /// Number of participants in the group
    pub participant_count: usize,

    /// Group description (if available)
    pub description: Option<String>,

    /// Group creation timestamp (if available)
    pub created_at: Option<DateTime<Utc>>,
}

/// WhatsApp connection status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionStatus {
    /// Whether the client is connected to WhatsApp servers
    pub connected: bool,

    /// Whether the user is logged in (authenticated)
    pub logged_in: bool,

    /// Phone number associated with the account (if logged in)
    pub phone_number: Option<String>,

    /// Timestamp of the status check
    pub timestamp: DateTime<Utc>,
}

/// QR code for WhatsApp authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QRCode {
    /// Base64-encoded QR code image or raw QR code string
    pub data: String,

    /// When the QR code expires
    pub expires_at: DateTime<Utc>,
}

/// Message ID returned after sending a message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageId {
    /// Unique message identifier
    pub id: String,

    /// Timestamp when the message was sent
    pub timestamp: DateTime<Utc>,
}

/// Message to be sent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutgoingMessage {
    /// Recipient JID (group or individual)
    pub recipient_jid: String,

    /// Message text content
    pub text: String,

    /// Optional quoted message ID (for replies)
    pub quoted_message_id: Option<String>,
}

impl OutgoingMessage {
    /// Create a simple text message
    pub fn text(recipient_jid: impl Into<String>, text: impl Into<String>) -> Self {
        Self {
            recipient_jid: recipient_jid.into(),
            text: text.into(),
            quoted_message_id: None,
        }
    }

    /// Create a reply to another message
    pub fn reply(
        recipient_jid: impl Into<String>,
        text: impl Into<String>,
        quoted_message_id: impl Into<String>,
    ) -> Self {
        Self {
            recipient_jid: recipient_jid.into(),
            text: text.into(),
            quoted_message_id: Some(quoted_message_id.into()),
        }
    }
}

/// Configuration for sync operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    /// Maximum number of groups to sync (None = all)
    pub max_groups: Option<usize>,

    /// Whether to include archived groups
    pub include_archived: bool,

    /// Timeout for the sync operation in seconds
    pub timeout_seconds: u64,
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            max_groups: None,
            include_archived: false,
            timeout_seconds: 30,
        }
    }
}

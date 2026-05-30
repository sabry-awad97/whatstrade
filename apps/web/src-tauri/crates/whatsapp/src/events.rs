//! WhatsApp event types
//!
//! This module defines domain events emitted by the WhatsApp provider.
//! These events are mapped from wa-rs internal events to our domain model.

use crate::types::GroupInfo;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Events emitted by the WhatsApp provider
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WhatsAppEvent {
    /// Connection state changed
    StateChanged(StateChangeEvent),

    /// QR code ready for scanning
    QrCode(QrCodeEvent),

    /// Pairing code ready (8-character code for phone linking)
    PairCode(PairCodeEvent),

    /// Pairing successful
    PairSuccess(PairSuccessEvent),

    /// Pairing failed
    PairError(PairErrorEvent),

    /// Incoming or outgoing message
    Message(MessageEvent),

    /// Message receipt (delivered/read)
    Receipt(ReceiptEvent),

    /// Contact presence update (online/offline)
    Presence(PresenceEvent),

    /// Typing/recording indicator
    ChatState(ChatStateEvent),

    /// Groups synced
    GroupsSynced(GroupsSyncedEvent),

    /// Non-fatal error
    Error(ErrorEvent),
}

/// Connection state change event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateChangeEvent {
    pub state: ConnectionState,
    pub timestamp: DateTime<Utc>,
}

/// Connection state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionState {
    Connected,
    Disconnected,
    LoggedOut {
        reason: Option<String>,
    },
    StreamReplaced,
    ConnectFailure {
        reason: String,
    },
    TemporaryBan {
        reason: String,
        expires_in_secs: u64,
    },
}

/// QR code event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrCodeEvent {
    /// QR code string to display
    pub code: String,

    /// Timeout in seconds
    pub timeout_secs: u64,

    /// Timestamp when generated
    pub timestamp: DateTime<Utc>,
}

/// Pairing code event (8-character code)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairCodeEvent {
    /// 8-character pairing code
    pub code: String,

    /// Timeout in seconds
    pub timeout_secs: u64,

    /// Timestamp when generated
    pub timestamp: DateTime<Utc>,
}

/// Pairing success event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairSuccessEvent {
    /// User's JID
    pub jid: String,

    /// LID (if available)
    pub lid: Option<String>,

    /// Push name
    pub push_name: String,

    /// Platform
    pub platform: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Pairing error event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairErrorEvent {
    /// Error reason
    pub reason: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Message event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEvent {
    /// Message ID
    pub id: String,

    /// Chat JID
    pub chat: String,

    /// Sender JID
    pub sender: String,

    /// Whether message is from us
    pub from_me: bool,

    /// Message timestamp
    pub timestamp_ms: i64,

    /// Message kind
    pub kind: MessageKind,

    /// Text content (if text message)
    pub text: Option<String>,

    /// Caption (if media message)
    pub caption: Option<String>,

    /// Whether from a group
    pub is_group: bool,

    /// Sender's push name
    pub push_name: Option<String>,
}

/// Message kind
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageKind {
    Text,
    Image,
    Video,
    Audio,
    Document,
    Sticker,
    Location,
    Contact,
    Reaction,
    Other,
}

/// Receipt event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiptEvent {
    /// Chat JID
    pub chat: String,

    /// Sender JID
    pub from: String,

    /// Message IDs
    pub message_ids: Vec<String>,

    /// Receipt kind (delivered, read, etc.)
    pub kind: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Presence event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceEvent {
    /// Contact JID
    pub from: String,

    /// Whether online
    pub online: bool,

    /// Last seen timestamp (milliseconds)
    pub last_seen_ms: Option<i64>,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Chat state event (typing, recording, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatStateEvent {
    /// Chat JID
    pub chat: String,

    /// Participant JID
    pub from: String,

    /// State (typing, recording, paused)
    pub state: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Groups synced event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupsSyncedEvent {
    /// Synced groups
    pub groups: Vec<GroupInfo>,

    /// Total count
    pub count: usize,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Error event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorEvent {
    /// Error message
    pub message: String,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

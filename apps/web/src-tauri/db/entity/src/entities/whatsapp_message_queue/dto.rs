//! WhatsAppMessageQueue DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageQueueStatusDto {
    Pending,
    Processing,
    Completed,
    Failed,
    DeadLetter,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct WhatsAppMessageQueueDto {
    id: Id,
    whatsapp_message_id: Id,
    whatsapp_group_id: Id,
    group_name: String,
    sender_phone: String,
    #[builder(default, setter(into))]
    sender_name: Option<String>,
    raw_text: String,
    received_at: DateTime<Utc>,
    status: MessageQueueStatusDto,
    retry_count: i32,
    max_retries: i32,
    #[builder(default, setter(into))]
    next_retry_at: Option<DateTime<Utc>>,
    #[builder(default, setter(into))]
    last_error: Option<String>,
    #[builder(default, setter(into))]
    last_error_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    #[builder(default, setter(into))]
    processed_at: Option<DateTime<Utc>>,
    #[builder(default, setter(into))]
    completed_at: Option<DateTime<Utc>>,
    #[builder(default, setter(into))]
    extracted_data: Option<JsonValue>,
    #[builder(default, setter(into))]
    created_offer_id: Option<Id>,
    #[builder(default, setter(into))]
    created_request_id: Option<Id>,
}

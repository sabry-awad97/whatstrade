//! WhatsAppMessageQueue DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use typed_builder::TypedBuilder;

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
    id: String,
    whatsapp_message_id: String,
    whatsapp_group_id: String,
    group_name: String,
    sender_phone: String,
    #[builder(default, setter(strip_option))]
    sender_name: Option<String>,
    raw_text: String,
    received_at: DateTime<Utc>,
    status: MessageQueueStatusDto,
    retry_count: i32,
    max_retries: i32,
    #[builder(default, setter(strip_option))]
    next_retry_at: Option<DateTime<Utc>>,
    #[builder(default, setter(strip_option))]
    last_error: Option<String>,
    #[builder(default, setter(strip_option))]
    last_error_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    #[builder(default, setter(strip_option))]
    processed_at: Option<DateTime<Utc>>,
    #[builder(default, setter(strip_option))]
    completed_at: Option<DateTime<Utc>>,
    #[builder(default, setter(strip_option))]
    extracted_data: Option<JsonValue>,
    #[builder(default, setter(strip_option))]
    created_offer_id: Option<String>,
    #[builder(default, setter(strip_option))]
    created_request_id: Option<String>,
}

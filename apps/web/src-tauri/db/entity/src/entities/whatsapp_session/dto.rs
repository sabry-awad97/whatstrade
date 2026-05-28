//! WhatsAppSession DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use typed_builder::TypedBuilder;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct WhatsAppSessionDto {
    id: String,
    phone_number: String,
    session_data: JsonValue,
    is_connected: bool,
    #[builder(default, setter(strip_option))]
    last_connected: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

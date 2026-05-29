//! Request DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RequestStatusDto {
    Active,
    Fulfilled,
    Expired,
    Cancelled,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct RequestDto {
    id: Id,
    medication_name: String,
    #[builder(default, setter(into))]
    dosage: Option<String>,
    quantity: i32,
    #[builder(default, setter(into))]
    max_price: Option<Decimal>,
    group_name: String,
    sender_phone: String,
    status: RequestStatusDto,
    #[builder(default, setter(into))]
    raw_text: Option<String>,
    #[builder(default, setter(into))]
    whatsapp_message_id: Option<Id>,
    #[builder(default, setter(into))]
    whatsapp_group_id: Option<Id>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

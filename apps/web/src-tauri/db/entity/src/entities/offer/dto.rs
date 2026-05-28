//! Offer DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OfferStatusDto {
    Active,
    Matched,
    Expired,
    Cancelled,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct OfferDto {
    id: String,
    medication_name: String,
    #[builder(default, setter(strip_option))]
    dosage: Option<String>,
    quantity: i32,
    #[builder(default, setter(strip_option))]
    price: Option<Decimal>,
    group_name: String,
    sender_phone: String,
    status: OfferStatusDto,
    #[builder(default, setter(strip_option))]
    raw_text: Option<String>,
    #[builder(default, setter(strip_option))]
    whatsapp_message_id: Option<String>,
    #[builder(default, setter(strip_option))]
    whatsapp_group_id: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

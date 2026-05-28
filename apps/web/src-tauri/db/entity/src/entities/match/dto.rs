//! Match DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConfidenceBandDto {
    Auto,
    Suggest,
    Review,
    None,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MatchStatusDto {
    Pending,
    Confirmed,
    Rejected,
    AutoConfirmed,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct MatchDto {
    id: Id,
    offer_id: Id,
    request_id: Id,
    score: Decimal,
    confidence_band: ConfidenceBandDto,
    status: MatchStatusDto,
    #[builder(default, setter(strip_option))]
    operator_note: Option<String>,
    medication_name: String,
    offer_quantity: i32,
    request_quantity: i32,
    #[builder(default, setter(strip_option))]
    offer_price: Option<Decimal>,
    #[builder(default, setter(strip_option))]
    max_price: Option<Decimal>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

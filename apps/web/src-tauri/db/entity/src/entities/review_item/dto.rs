//! ReviewItem DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReviewStatusDto {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReviewTypeDto {
    Offer,
    Request,
    Match,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct ReviewItemDto {
    id: Id,
    r#type: ReviewTypeDto,
    medication_name: String,
    #[builder(default, setter(into))]
    dosage: Option<String>,
    #[builder(default, setter(into))]
    quantity: Option<i32>,
    raw_text: String,
    group_name: String,
    sender_phone: String,
    status: ReviewStatusDto,
    #[builder(default, setter(into))]
    parsed_data: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

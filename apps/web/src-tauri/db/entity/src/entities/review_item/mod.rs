//! ReviewItem entity
//!
//! ⚠️ SECURITY NOTICE: Contains sensitive PII/PHI data
//! - medicationName: Health information (PHI)
//! - senderPhone: Personal identifier (PII) - CRITICAL: Never log or expose
//! - rawText: May contain unstructured PII/PHI
//! - parsedData: May contain extracted PII/PHI

use derive_getters::Getters;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;

pub mod dto;

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "review_status")]
pub enum ReviewStatus {
    #[sea_orm(string_value = "pending")]
    Pending,
    #[sea_orm(string_value = "approved")]
    Approved,
    #[sea_orm(string_value = "rejected")]
    Rejected,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "review_type")]
pub enum ReviewType {
    #[sea_orm(string_value = "offer")]
    Offer,
    #[sea_orm(string_value = "request")]
    Request,
    #[sea_orm(string_value = "match")]
    Match,
}

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "review_items")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    r#type: ReviewType,
    #[sea_orm(column_name = "medication_name")]
    medication_name: String,
    dosage: Option<String>,
    quantity: Option<i32>,
    #[sea_orm(column_name = "raw_text")]
    raw_text: String,
    #[sea_orm(column_name = "group_name")]
    group_name: String,
    #[sea_orm(column_name = "sender_phone")]
    sender_phone: String,
    status: ReviewStatus,
    #[sea_orm(column_name = "parsed_data")]
    parsed_data: Option<String>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,
}

impl ActiveModelBehavior for ActiveModel {}

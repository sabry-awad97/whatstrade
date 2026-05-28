//! Request entity
//!
//! ⚠️ SECURITY NOTICE: Contains sensitive PII/PHI data
//! - medicationName: Health information (PHI)
//! - senderPhone: Personal identifier (PII)
//! - rawText: May contain unstructured PII/PHI

use rust_decimal::Decimal;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "request_status")]
pub enum RequestStatus {
    #[sea_orm(string_value = "active")]
    Active,
    #[sea_orm(string_value = "fulfilled")]
    Fulfilled,
    #[sea_orm(string_value = "expired")]
    Expired,
    #[sea_orm(string_value = "cancelled")]
    Cancelled,
}

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "requests")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    #[sea_orm(column_name = "medication_name")]
    medication_name: String,
    dosage: Option<String>,
    quantity: i32,
    #[sea_orm(column_name = "max_price")]
    max_price: Option<Decimal>,
    #[sea_orm(column_name = "group_name")]
    group_name: String,
    #[sea_orm(column_name = "sender_phone")]
    sender_phone: String,
    status: RequestStatus,
    #[sea_orm(column_name = "raw_text")]
    raw_text: Option<String>,
    #[sea_orm(column_name = "whatsapp_message_id")]
    whatsapp_message_id: Option<String>,
    #[sea_orm(column_name = "whatsapp_group_id")]
    whatsapp_group_id: Option<String>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeWithTimeZone,

    // Relations
    #[sea_orm(has_many)]
    matches: HasMany<super::r#match::Entity>,
    #[sea_orm(belongs_to, from = "whatsapp_message_id", to = "whatsapp_message_id")]
    whatsapp_message: Option<super::whatsapp_message_queue::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

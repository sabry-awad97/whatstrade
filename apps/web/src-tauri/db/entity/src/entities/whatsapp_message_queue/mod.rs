//! WhatsAppMessageQueue entity
//!
//! ⚠️ SECURITY NOTICE: Contains sensitive PII/PHI data
//! - senderPhone: Personal identifier (PII)
//! - rawText: May contain unstructured PII/PHI

use derive_getters::Getters;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

pub mod dto;

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(
    rs_type = "String",
    db_type = "Enum",
    enum_name = "message_queue_status"
)]
pub enum MessageQueueStatus {
    #[sea_orm(string_value = "pending")]
    Pending,
    #[sea_orm(string_value = "processing")]
    Processing,
    #[sea_orm(string_value = "completed")]
    Completed,
    #[sea_orm(string_value = "failed")]
    Failed,
    #[sea_orm(string_value = "dead_letter")]
    DeadLetter,
}

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "whatsapp_message_queue")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: Id,
    #[sea_orm(unique, column_name = "whatsapp_message_id")]
    whatsapp_message_id: Id,
    #[sea_orm(column_name = "whatsapp_group_id")]
    whatsapp_group_id: Id,
    #[sea_orm(column_name = "group_name")]
    group_name: String,
    #[sea_orm(column_name = "sender_phone")]
    sender_phone: String,
    #[sea_orm(column_name = "sender_name")]
    sender_name: Option<String>,
    #[sea_orm(column_name = "raw_text")]
    raw_text: String,
    #[sea_orm(column_name = "received_at")]
    received_at: DateTimeUtc,
    status: MessageQueueStatus,
    #[sea_orm(column_name = "retry_count")]
    retry_count: i32,
    #[sea_orm(column_name = "max_retries")]
    max_retries: i32,
    #[sea_orm(column_name = "next_retry_at")]
    next_retry_at: Option<DateTimeUtc>,
    #[sea_orm(column_name = "last_error")]
    last_error: Option<String>,
    #[sea_orm(column_name = "last_error_at")]
    last_error_at: Option<DateTimeUtc>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "processed_at")]
    processed_at: Option<DateTimeUtc>,
    #[sea_orm(column_name = "completed_at")]
    completed_at: Option<DateTimeUtc>,
    #[sea_orm(column_name = "extracted_data")]
    extracted_data: Option<Json>,
    #[sea_orm(column_name = "created_offer_id")]
    created_offer_id: Option<Id>,
    #[sea_orm(column_name = "created_request_id")]
    created_request_id: Option<Id>,

    // Relations
    // Note: These are tracking references only, not true FK relationships
    // The queue creates offers/requests, but doesn't own them via FK constraints
    #[sea_orm(
        has_one,
        relation_enum = "CreatedOffer",
        from = "created_offer_id",
        to = "id",
        on_delete = "NoAction"
    )]
    created_offer: Option<super::offer::Entity>,
    #[sea_orm(
        has_one,
        relation_enum = "CreatedRequest",
        from = "created_request_id",
        to = "id",
        on_delete = "NoAction"
    )]
    created_request: Option<super::request::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

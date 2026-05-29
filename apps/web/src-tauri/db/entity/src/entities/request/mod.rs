//! Request entity
//!
//! ⚠️ SECURITY NOTICE: Contains sensitive PII/PHI data
//! - medicationName: Health information (PHI)
//! - senderPhone: Personal identifier (PII)
//! - rawText: May contain unstructured PII/PHI

use derive_getters::Getters;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveValue::{NotSet, Set},
    entity::prelude::*,
};
use serde::{Deserialize, Serialize};
use std::fmt;
use typed_builder::TypedBuilder;
use utilities::Id;

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

impl fmt::Display for RequestStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let value = match self {
            Self::Active => "active",
            Self::Fulfilled => "fulfilled",
            Self::Expired => "expired",
            Self::Cancelled => "cancelled",
        };

        write!(f, "{value}")
    }
}

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "requests")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: Id,
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
    #[sea_orm(column_name = "whatsapp_message_queue_id")]
    whatsapp_message_queue_id: Option<Id>,
    #[sea_orm(column_name = "whatsapp_group_id")]
    whatsapp_group_id: Option<Id>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,

    // Relations
    #[sea_orm(has_many)]
    matches: HasMany<super::r#match::Entity>,
    #[sea_orm(belongs_to, from = "whatsapp_message_queue_id", to = "id")]
    whatsapp_message_queue: Option<super::whatsapp_message_queue::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

impl ActiveModel {
    /// Create a new ActiveModel with all required fields
    ///
    /// # Arguments
    ///
    /// * `id` - Request ID
    /// * `medication_name` - Name of the medication
    /// * `quantity` - Quantity requested
    /// * `group_name` - WhatsApp group name
    /// * `sender_phone` - Phone number of sender
    /// * `status` - Request status
    ///
    /// # Returns
    ///
    /// A new ActiveModel with all optional fields set to NotSet
    pub fn new(
        id: impl Into<Id>,
        medication_name: impl Into<String>,
        quantity: i32,
        group_name: impl Into<String>,
        sender_phone: impl Into<String>,
        status: RequestStatus,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Set(id.into()),
            medication_name: Set(medication_name.into()),
            dosage: NotSet,
            quantity: Set(quantity),
            max_price: NotSet,
            group_name: Set(group_name.into()),
            sender_phone: Set(sender_phone.into()),
            status: Set(status),
            raw_text: NotSet,
            whatsapp_message_queue_id: NotSet,
            whatsapp_group_id: NotSet,
            created_at: Set(now),
            updated_at: Set(now),
        }
    }

    /// Set the dosage
    pub fn with_dosage(mut self, dosage: Option<impl Into<String>>) -> Self {
        self.dosage = Set(dosage.map(Into::into));
        self
    }

    /// Set the max price
    pub fn with_max_price(mut self, max_price: Option<Decimal>) -> Self {
        self.max_price = Set(max_price);
        self
    }

    /// Set the raw text
    pub fn with_raw_text(mut self, raw_text: Option<impl Into<String>>) -> Self {
        self.raw_text = Set(raw_text.map(Into::into));
        self
    }

    /// Set the WhatsApp message queue ID
    pub fn with_whatsapp_message_queue_id(
        mut self,
        message_queue_id: Option<impl Into<Id>>,
    ) -> Self {
        self.whatsapp_message_queue_id = Set(message_queue_id.map(Into::into));
        self
    }

    /// Set the WhatsApp group ID
    pub fn with_whatsapp_group_id(mut self, group_id: Option<impl Into<Id>>) -> Self {
        self.whatsapp_group_id = Set(group_id.map(Into::into));
        self
    }

    /// Set the created_at timestamp
    pub fn with_created_at(mut self, created_at: DateTimeUtc) -> Self {
        self.created_at = Set(created_at);
        self
    }

    /// Set the updated_at timestamp
    pub fn with_updated_at(mut self, updated_at: DateTimeUtc) -> Self {
        self.updated_at = Set(updated_at);
        self
    }
}

//! WhatsAppSession entity
//!
//! Represents WhatsApp session storage for authentication persistence.

use derive_getters::Getters;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;

pub mod dto;

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "whatsapp_sessions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    #[sea_orm(unique, column_name = "phone_number")]
    phone_number: String,
    #[sea_orm(column_name = "session_data")]
    session_data: Json,
    #[sea_orm(column_name = "is_connected")]
    is_connected: bool,
    #[sea_orm(column_name = "last_connected")]
    last_connected: Option<DateTimeUtc>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,
}

impl ActiveModelBehavior for ActiveModel {}

//! Group entity
//!
//! Represents WhatsApp groups being monitored.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "groups")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    #[sea_orm(unique)]
    jid: String,
    name: String,
    #[sea_orm(column_name = "is_monitored")]
    is_monitored: bool,
    #[sea_orm(column_name = "member_count")]
    member_count: i32,
    #[sea_orm(column_name = "last_message_at")]
    last_message_at: Option<DateTimeWithTimeZone>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeWithTimeZone,
}

impl ActiveModelBehavior for ActiveModel {}

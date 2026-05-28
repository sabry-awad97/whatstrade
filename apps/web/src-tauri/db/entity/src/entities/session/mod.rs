//! Session entity
//!
//! Represents user authentication sessions.

use derive_getters::Getters;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;

pub mod dto;

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "session")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    #[sea_orm(column_name = "expires_at")]
    expires_at: DateTimeUtc,
    #[sea_orm(unique)]
    token: String,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,
    #[sea_orm(column_name = "ip_address")]
    ip_address: Option<String>,
    #[sea_orm(column_name = "user_agent")]
    user_agent: Option<String>,
    #[sea_orm(column_name = "user_id")]
    user_id: String,

    // Relations
    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    user: HasOne<super::user::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

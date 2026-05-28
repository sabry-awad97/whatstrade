//! Verification entity
//!
//! Represents email/phone verification tokens.

use derive_getters::Getters;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;

pub mod dto;

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "verification")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    identifier: String,
    value: String,
    #[sea_orm(column_name = "expires_at")]
    expires_at: DateTimeUtc,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,
}

impl ActiveModelBehavior for ActiveModel {}

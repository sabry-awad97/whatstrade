//! Verification entity
//!
//! Represents email/phone verification tokens.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "verification")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    identifier: String,
    value: String,
    #[sea_orm(column_name = "expires_at")]
    expires_at: DateTime,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTime,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTime,
}

impl ActiveModelBehavior for ActiveModel {}

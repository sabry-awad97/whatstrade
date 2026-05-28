//! User entity
//!
//! Represents authenticated users in the system.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "user")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    name: String,
    email: String,
    #[sea_orm(column_name = "email_verified")]
    email_verified: bool,
    image: Option<String>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTime,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTime,

    // Relations
    #[sea_orm(has_many)]
    sessions: HasMany<super::session::Entity>,
    #[sea_orm(has_many)]
    accounts: HasMany<super::account::Entity>,
    #[sea_orm(has_many)]
    audit_logs: HasMany<super::audit_log::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

//! Account entity
//!
//! Represents OAuth/authentication provider accounts linked to users.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "account")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    #[sea_orm(column_name = "account_id")]
    account_id: String,
    #[sea_orm(column_name = "provider_id")]
    provider_id: String,
    #[sea_orm(column_name = "user_id")]
    user_id: String,
    #[sea_orm(column_name = "access_token")]
    access_token: Option<String>,
    #[sea_orm(column_name = "refresh_token")]
    refresh_token: Option<String>,
    #[sea_orm(column_name = "id_token")]
    id_token: Option<String>,
    #[sea_orm(column_name = "access_token_expires_at")]
    access_token_expires_at: Option<DateTime>,
    #[sea_orm(column_name = "refresh_token_expires_at")]
    refresh_token_expires_at: Option<DateTime>,
    scope: Option<String>,
    password: Option<String>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTime,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTime,

    // Relations
    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    user: HasOne<super::user::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

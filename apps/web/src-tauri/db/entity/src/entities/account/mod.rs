//! Account entity
//!
//! Represents OAuth/authentication provider accounts linked to users.

use derive_getters::Getters;
use sea_orm::{
    ActiveValue::{NotSet, Set},
    entity::prelude::*,
};
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

pub mod dto;

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "account")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: Id,
    #[sea_orm(column_name = "account_id")]
    account_id: Id,
    #[sea_orm(column_name = "provider_id")]
    provider_id: String,
    #[sea_orm(column_name = "user_id")]
    user_id: Id,
    #[sea_orm(column_name = "access_token")]
    access_token: Option<String>,
    #[sea_orm(column_name = "refresh_token")]
    refresh_token: Option<String>,
    #[sea_orm(column_name = "id_token")]
    id_token: Option<String>,
    #[sea_orm(column_name = "access_token_expires_at")]
    access_token_expires_at: Option<DateTimeUtc>,
    #[sea_orm(column_name = "refresh_token_expires_at")]
    refresh_token_expires_at: Option<DateTimeUtc>,
    scope: Option<String>,
    password: Option<String>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,

    // Relations
    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    user: HasOne<super::user::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

impl ActiveModel {
    /// Create a new ActiveModel with all required fields
    ///
    /// # Arguments
    ///
    /// * `id` - Account ID
    /// * `account_id` - External account ID
    /// * `provider_id` - Provider identifier (e.g., "credentials", "google", "github")
    /// * `user_id` - User ID this account belongs to
    ///
    /// # Returns
    ///
    /// A new ActiveModel with all optional fields set to NotSet
    pub fn new(
        id: impl Into<Id>,
        account_id: impl Into<Id>,
        provider_id: impl Into<String>,
        user_id: impl Into<Id>,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Set(id.into()),
            account_id: Set(account_id.into()),
            provider_id: Set(provider_id.into()),
            user_id: Set(user_id.into()),
            access_token: NotSet,
            refresh_token: NotSet,
            id_token: NotSet,
            access_token_expires_at: NotSet,
            refresh_token_expires_at: NotSet,
            scope: NotSet,
            password: NotSet,
            created_at: Set(now),
            updated_at: Set(now),
        }
    }

    /// Set the access token
    pub fn with_access_token(mut self, token: impl Into<String>) -> Self {
        self.access_token = Set(Some(token.into()));
        self
    }

    /// Set the refresh token
    pub fn with_refresh_token(mut self, token: impl Into<String>) -> Self {
        self.refresh_token = Set(Some(token.into()));
        self
    }

    /// Set the ID token
    pub fn with_id_token(mut self, token: impl Into<String>) -> Self {
        self.id_token = Set(Some(token.into()));
        self
    }

    /// Set the access token expiration
    pub fn with_access_token_expires_at(mut self, expires_at: DateTimeUtc) -> Self {
        self.access_token_expires_at = Set(Some(expires_at));
        self
    }

    /// Set the refresh token expiration
    pub fn with_refresh_token_expires_at(mut self, expires_at: DateTimeUtc) -> Self {
        self.refresh_token_expires_at = Set(Some(expires_at));
        self
    }

    /// Set the scope
    pub fn with_scope(mut self, scope: impl Into<String>) -> Self {
        self.scope = Set(Some(scope.into()));
        self
    }

    /// Set the password hash
    pub fn with_password(mut self, password: impl Into<String>) -> Self {
        self.password = Set(Some(password.into()));
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

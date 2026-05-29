//! User entity
//!
//! Represents authenticated users in the system.

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
#[sea_orm(table_name = "user")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: Id,
    name: String,
    email: String,
    #[sea_orm(column_name = "email_verified")]
    email_verified: bool,
    image: Option<String>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,

    // Relations
    #[sea_orm(has_many)]
    sessions: HasMany<super::session::Entity>,
    #[sea_orm(has_many)]
    accounts: HasMany<super::account::Entity>,
    #[sea_orm(has_many)]
    audit_logs: HasMany<super::audit_log::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

impl ActiveModel {
    /// Create a new ActiveModel with all required fields
    ///
    /// # Arguments
    ///
    /// * `id` - User ID
    /// * `name` - User name
    /// * `email` - User email
    /// * `email_verified` - Email verification status
    ///
    /// # Returns
    ///
    /// A new ActiveModel with all optional fields set to NotSet
    pub fn new(
        id: impl Into<Id>,
        name: impl Into<String>,
        email: impl Into<String>,
        email_verified: bool,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Set(id.into()),
            name: Set(name.into()),
            email: Set(email.into()),
            email_verified: Set(email_verified),
            image: NotSet,
            created_at: Set(now),
            updated_at: Set(now),
        }
    }

    /// Set the image
    pub fn with_image(mut self, image: Option<impl Into<String>>) -> Self {
        self.image = Set(image.map(Into::into));
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

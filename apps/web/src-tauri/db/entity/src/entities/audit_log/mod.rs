//! AuditLog entity
//!
//! Represents audit trail for system operations.
//! The operatorId is nullable to preserve audit history when users are deleted.

use derive_getters::Getters;
use sea_orm::{ActiveValue::{NotSet, Set}, entity::prelude::*};
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

pub mod dto;

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "audit_log")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: Id,
    action: String,
    #[sea_orm(column_name = "entity_type")]
    entity_type: String,
    #[sea_orm(column_name = "entity_id")]
    entity_id: Id,
    #[sea_orm(column_name = "operator_id")]
    operator_id: Option<Id>,
    details: Option<Json>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,

    // Relations
    #[sea_orm(belongs_to, from = "operator_id", to = "id")]
    operator: Option<super::user::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

impl ActiveModel {
    /// Create a new ActiveModel with all required fields
    ///
    /// # Arguments
    ///
    /// * `id` - Audit log ID
    /// * `action` - Action performed (e.g., "create", "update", "delete")
    /// * `entity_type` - Type of entity affected
    /// * `entity_id` - ID of entity affected
    ///
    /// # Returns
    ///
    /// A new ActiveModel with all optional fields set to NotSet
    pub fn new(
        id: impl Into<Id>,
        action: impl Into<String>,
        entity_type: impl Into<String>,
        entity_id: impl Into<Id>,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Set(id.into()),
            action: Set(action.into()),
            entity_type: Set(entity_type.into()),
            entity_id: Set(entity_id.into()),
            operator_id: NotSet,
            details: NotSet,
            created_at: Set(now),
        }
    }

    /// Set the operator ID
    pub fn with_operator_id(mut self, operator_id: Option<impl Into<Id>>) -> Self {
        self.operator_id = Set(operator_id.map(Into::into));
        self
    }

    /// Set the details
    pub fn with_details(mut self, details: Option<Json>) -> Self {
        self.details = Set(details);
        self
    }

    /// Set the created_at timestamp
    pub fn with_created_at(mut self, created_at: DateTimeUtc) -> Self {
        self.created_at = Set(created_at);
        self
    }
}

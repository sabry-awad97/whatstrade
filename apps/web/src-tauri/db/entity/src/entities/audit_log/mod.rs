//! AuditLog entity
//!
//! Represents audit trail for system operations.
//! The operatorId is nullable to preserve audit history when users are deleted.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "audit_log")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    action: String,
    #[sea_orm(column_name = "entity_type")]
    entity_type: String,
    #[sea_orm(column_name = "entity_id")]
    entity_id: String,
    #[sea_orm(column_name = "operator_id")]
    operator_id: Option<String>,
    details: Option<Json>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeWithTimeZone,

    // Relations
    #[sea_orm(belongs_to, from = "operator_id", to = "id")]
    operator: Option<super::user::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

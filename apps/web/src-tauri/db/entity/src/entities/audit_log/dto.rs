//! AuditLog DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct AuditLogDto {
    id: Id,
    action: String,
    entity_type: String,
    entity_id: Id,
    #[builder(default, setter(into))]
    operator_id: Option<Id>,
    #[builder(default, setter(into))]
    details: Option<JsonValue>,
    created_at: DateTime<Utc>,
}

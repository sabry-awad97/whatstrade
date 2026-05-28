//! Verification DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct VerificationDto {
    id: Id,
    identifier: String,
    value: String,
    expires_at: DateTime<Utc>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

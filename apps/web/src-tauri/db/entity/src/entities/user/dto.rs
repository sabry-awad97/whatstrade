//! User DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct UserDto {
    id: Id,
    name: String,
    email: String,
    email_verified: bool,
    image: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

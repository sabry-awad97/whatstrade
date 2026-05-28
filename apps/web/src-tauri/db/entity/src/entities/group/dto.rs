//! Group DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct GroupDto {
    id: Id,
    jid: String,
    name: String,
    is_monitored: bool,
    member_count: i32,
    #[builder(default, setter(strip_option))]
    last_message_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

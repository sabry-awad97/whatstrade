//! Account DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct AccountDto {
    id: Id,
    account_id: Id,
    provider_id: Id,
    user_id: Id,
    #[builder(default, setter(into))]
    access_token: Option<String>,
    #[builder(default, setter(into))]
    refresh_token: Option<String>,
    #[builder(default, setter(into))]
    id_token: Option<String>,
    #[builder(default, setter(into))]
    access_token_expires_at: Option<DateTime<Utc>>,
    #[builder(default, setter(into))]
    refresh_token_expires_at: Option<DateTime<Utc>>,
    #[builder(default, setter(into))]
    scope: Option<String>,
    #[builder(default, setter(into))]
    password: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

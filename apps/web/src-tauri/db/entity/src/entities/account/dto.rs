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
    #[builder(default, setter(strip_option))]
    access_token: Option<String>,
    #[builder(default, setter(strip_option))]
    refresh_token: Option<String>,
    #[builder(default, setter(strip_option))]
    id_token: Option<String>,
    #[builder(default, setter(strip_option))]
    access_token_expires_at: Option<DateTime<Utc>>,
    #[builder(default, setter(strip_option))]
    refresh_token_expires_at: Option<DateTime<Utc>>,
    #[builder(default, setter(strip_option))]
    scope: Option<String>,
    #[builder(default, setter(strip_option))]
    password: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

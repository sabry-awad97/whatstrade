//! Match entity
//!
//! Represents matches between offers and requests.

use derive_getters::Getters;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveValue::{NotSet, Set},
    entity::prelude::*,
};
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

pub mod dto;

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "confidence_band")]
pub enum ConfidenceBand {
    #[sea_orm(string_value = "auto")]
    Auto,
    #[sea_orm(string_value = "suggest")]
    Suggest,
    #[sea_orm(string_value = "review")]
    Review,
    #[sea_orm(string_value = "none")]
    None,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "match_status")]
pub enum MatchStatus {
    #[sea_orm(string_value = "pending")]
    Pending,
    #[sea_orm(string_value = "confirmed")]
    Confirmed,
    #[sea_orm(string_value = "rejected")]
    Rejected,
    #[sea_orm(string_value = "auto_confirmed")]
    AutoConfirmed,
}

#[sea_orm::model]
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, Getters, TypedBuilder,
)]
#[sea_orm(table_name = "matches")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: Id,
    #[sea_orm(column_name = "offer_id")]
    offer_id: Id,
    #[sea_orm(column_name = "request_id")]
    request_id: Id,
    score: Decimal,
    #[sea_orm(column_name = "confidence_band")]
    confidence_band: ConfidenceBand,
    status: MatchStatus,
    #[sea_orm(column_name = "operator_note")]
    operator_note: Option<String>,
    #[sea_orm(column_name = "medication_name")]
    medication_name: String,
    #[sea_orm(column_name = "offer_quantity")]
    offer_quantity: i32,
    #[sea_orm(column_name = "request_quantity")]
    request_quantity: i32,
    #[sea_orm(column_name = "offer_price")]
    offer_price: Option<Decimal>,
    #[sea_orm(column_name = "max_price")]
    max_price: Option<Decimal>,
    #[sea_orm(column_name = "created_at")]
    created_at: DateTimeUtc,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeUtc,

    // Relations
    #[sea_orm(belongs_to, from = "offer_id", to = "id")]
    offer: HasOne<super::offer::Entity>,
    #[sea_orm(belongs_to, from = "request_id", to = "id")]
    request: HasOne<super::request::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

impl ActiveModel {
    /// Create a new ActiveModel with all required fields
    ///
    /// # Arguments
    ///
    /// * `id` - Match ID
    /// * `offer_id` - Offer ID
    /// * `request_id` - Request ID
    /// * `score` - Match score
    /// * `confidence_band` - Confidence band
    /// * `status` - Match status
    /// * `medication_name` - Medication name
    /// * `offer_quantity` - Offer quantity
    /// * `request_quantity` - Request quantity
    ///
    /// # Returns
    ///
    /// A new ActiveModel with all optional fields set to NotSet
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: impl Into<Id>,
        offer_id: impl Into<Id>,
        request_id: impl Into<Id>,
        score: Decimal,
        confidence_band: ConfidenceBand,
        status: MatchStatus,
        medication_name: impl Into<String>,
        offer_quantity: i32,
        request_quantity: i32,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Set(id.into()),
            offer_id: Set(offer_id.into()),
            request_id: Set(request_id.into()),
            score: Set(score),
            confidence_band: Set(confidence_band),
            status: Set(status),
            operator_note: NotSet,
            medication_name: Set(medication_name.into()),
            offer_quantity: Set(offer_quantity),
            request_quantity: Set(request_quantity),
            offer_price: NotSet,
            max_price: NotSet,
            created_at: Set(now),
            updated_at: Set(now),
        }
    }

    /// Set the operator note
    pub fn with_operator_note(mut self, note: Option<impl Into<String>>) -> Self {
        self.operator_note = Set(note.map(Into::into));
        self
    }

    /// Set the offer price
    pub fn with_offer_price(mut self, price: Option<Decimal>) -> Self {
        self.offer_price = Set(price);
        self
    }

    /// Set the max price
    pub fn with_max_price(mut self, price: Option<Decimal>) -> Self {
        self.max_price = Set(price);
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

//! Match entity
//!
//! Represents matches between offers and requests.

use rust_decimal::Decimal;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

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
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "matches")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    #[sea_orm(column_name = "offer_id")]
    offer_id: String,
    #[sea_orm(column_name = "request_id")]
    request_id: String,
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
    created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeWithTimeZone,

    // Relations
    #[sea_orm(belongs_to, from = "offer_id", to = "id")]
    offer: HasOne<super::offer::Entity>,
    #[sea_orm(belongs_to, from = "request_id", to = "id")]
    request: HasOne<super::request::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

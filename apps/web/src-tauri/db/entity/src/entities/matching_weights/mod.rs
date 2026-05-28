//! MatchingWeights entity
//!
//! Represents configurable weights for the matching algorithm.

use rust_decimal::Decimal;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub mod dto;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "matching_weights")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    id: String,
    medication: Decimal,
    quantity: Decimal,
    dosage: Decimal,
    price: Decimal,
    recency: Decimal,
    #[sea_orm(column_name = "updated_at")]
    updated_at: DateTimeWithTimeZone,
}

impl ActiveModelBehavior for ActiveModel {}

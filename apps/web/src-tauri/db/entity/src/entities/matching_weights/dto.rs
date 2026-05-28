//! MatchingWeights DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TypedBuilder, Getters)]
pub struct MatchingWeightsDto {
    id: Id,
    medication: Decimal,
    quantity: Decimal,
    dosage: Decimal,
    price: Decimal,
    recency: Decimal,
    updated_at: DateTime<Utc>,
}

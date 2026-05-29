//! MatchingWeights DTO

use chrono::{DateTime, Utc};
use derive_getters::Getters;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;
use validator::{Validate, ValidationError, ValidationErrors};

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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TypedBuilder, Getters, Validate)]
pub struct UpdateWeightsDto {
    #[validate(custom(function = "validate_weight"))]
    medication: Decimal,
    #[validate(custom(function = "validate_weight"))]
    quantity: Decimal,
    #[validate(custom(function = "validate_weight"))]
    dosage: Decimal,
    #[validate(custom(function = "validate_weight"))]
    price: Decimal,
    #[validate(custom(function = "validate_weight"))]
    recency: Decimal,
}

fn validate_weight(value: &Decimal) -> Result<(), ValidationError> {
    if *value < Decimal::ZERO || *value > Decimal::ONE {
        let mut error = ValidationError::new("weight_range");
        error.message = Some("weight must be between 0 and 1".into());

        return Err(error);
    }

    Ok(())
}

impl UpdateWeightsDto {
    /// Calculate the sum of all weights
    ///
    /// # Returns
    ///
    /// The sum of medication, quantity, dosage, price, and recency weights
    pub fn total_weight(&self) -> Decimal {
        self.medication + self.quantity + self.dosage + self.price + self.recency
    }

    pub fn validate_total(&self) -> Result<(), ValidationErrors> {
        self.validate()?;

        let weight_tolerance: Decimal = Decimal::new(1, 2); // 0.01

        let sum = self.total_weight();

        if (sum - Decimal::ONE).abs() > weight_tolerance {
            let mut errors = ValidationErrors::new();

            let mut error = ValidationError::new("invalid_total_weight");

            error.message = Some(format!("weights must sum to 1.0 (got {sum})").into());

            errors.add("__all__", error);

            return Err(errors);
        }

        Ok(())
    }
}

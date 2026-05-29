//! Weights service for managing matching algorithm weights

use crate::{
    entities::matching_weights::{self, dto::MatchingWeightsDto},
    error::{ServiceError, ServiceResult},
};
use rust_decimal::Decimal;
use sea_orm::{DatabaseConnection, Set, entity::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for managing matching weights
pub struct WeightsService {
    db: Arc<DatabaseConnection>,
}

impl WeightsService {
    /// Create a new weights service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create an Arc-wrapped weights service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>) -> Arc<Self> {
        Arc::new(Self::new(db))
    }

    /// Get current matching weights
    ///
    /// Creates default weights if none exist.
    ///
    /// # Returns
    ///
    /// * `Ok(MatchingWeightsDto)` - Current weights
    /// * `Err(ServiceError)` - If query fails
    pub async fn get_weights(&self) -> ServiceResult<MatchingWeightsDto> {
        let weights = matching_weights::Entity::find()
            .one(self.db.as_ref())
            .await?;

        match weights {
            Some(w) => Ok(Self::model_to_dto(w)),
            None => {
                // Create default weights
                let default_weights = self.create_default_weights().await?;
                Ok(Self::model_to_dto(default_weights))
            }
        }
    }

    /// Update matching weights
    ///
    /// Validates that weights sum to 1.0 before updating.
    ///
    /// # Arguments
    ///
    /// * `medication` - Medication name similarity weight
    /// * `quantity` - Quantity match weight
    /// * `dosage` - Dosage similarity weight
    /// * `price` - Price match weight
    /// * `recency` - Recency weight
    ///
    /// # Returns
    ///
    /// * `Ok(MatchingWeightsDto)` - Updated weights
    /// * `Err(ServiceError)` - If validation fails or update fails
    pub async fn update_weights(
        &self,
        medication: Decimal,
        quantity: Decimal,
        dosage: Decimal,
        price: Decimal,
        recency: Decimal,
    ) -> ServiceResult<MatchingWeightsDto> {
        // Validate weights sum to 1.0 (with small tolerance for floating point)
        let sum = medication + quantity + dosage + price + recency;
        let one = Decimal::from(1);
        let tolerance = Decimal::new(1, 2); // 0.01

        if (sum - one).abs() > tolerance {
            return Err(ServiceError::validation(format!(
                "Weights must sum to 1.0 (got {})",
                sum
            )));
        }

        // Validate each weight is between 0 and 1
        for (name, value) in [
            ("medication", medication),
            ("quantity", quantity),
            ("dosage", dosage),
            ("price", price),
            ("recency", recency),
        ] {
            if value < Decimal::ZERO || value > Decimal::ONE {
                return Err(ServiceError::validation(format!(
                    "{} must be between 0 and 1 (got {})",
                    name, value
                )));
            }
        }

        // Get existing weights or create new
        let existing = matching_weights::Entity::find()
            .one(self.db.as_ref())
            .await?;

        let updated = match existing {
            Some(w) => {
                let mut active: matching_weights::ActiveModel = w.into();
                active.medication = Set(medication);
                active.quantity = Set(quantity);
                active.dosage = Set(dosage);
                active.price = Set(price);
                active.recency = Set(recency);
                active.updated_at = Set(chrono::Utc::now());
                active.update(self.db.as_ref()).await?
            }
            None => {
                let new_weights = matching_weights::ActiveModel {
                    id: Set(Id::new()),
                    medication: Set(medication),
                    quantity: Set(quantity),
                    dosage: Set(dosage),
                    price: Set(price),
                    recency: Set(recency),
                    updated_at: Set(chrono::Utc::now()),
                };
                new_weights.insert(self.db.as_ref()).await?
            }
        };

        info!(
            weights_id = %updated.id(),
            medication = %medication,
            quantity = %quantity,
            dosage = %dosage,
            price = %price,
            recency = %recency,
            "Matching weights updated"
        );

        Ok(Self::model_to_dto(updated))
    }

    /// Create default weights
    async fn create_default_weights(&self) -> ServiceResult<matching_weights::Model> {
        let default_weights = matching_weights::ActiveModel {
            id: Set(Id::new()),
            medication: Set(Decimal::new(40, 2)), // 0.40
            quantity: Set(Decimal::new(20, 2)),   // 0.20
            dosage: Set(Decimal::new(15, 2)),     // 0.15
            price: Set(Decimal::new(15, 2)),      // 0.15
            recency: Set(Decimal::new(10, 2)),    // 0.10
            updated_at: Set(chrono::Utc::now()),
        };

        let weights = default_weights.insert(self.db.as_ref()).await?;

        info!(weights_id = %weights.id(), "Default matching weights created");

        Ok(weights)
    }

    /// Convert model to DTO
    fn model_to_dto(weights: matching_weights::Model) -> MatchingWeightsDto {
        MatchingWeightsDto::builder()
            .id(*weights.id())
            .medication(*weights.medication())
            .quantity(*weights.quantity())
            .dosage(*weights.dosage())
            .price(*weights.price())
            .recency(*weights.recency())
            .updated_at(*weights.updated_at())
            .build()
    }
}

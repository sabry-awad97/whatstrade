//! Matching service for creating matches between offers and requests

use crate::{
    entities::r#match::{self, ConfidenceBand, MatchStatus},
    error::{ServiceError, ServiceResult},
    services::{AuditService, OfferService, RequestService},
    types::{CreateMatchDto, MatchResponseDto},
};
use chrono::Utc;
use rust_decimal::Decimal;
use sea_orm::{DatabaseConnection, Set, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for managing matches between offers and requests
pub struct MatchingService {
    db: Arc<DatabaseConnection>,
    audit_service: Arc<AuditService>,
    offer_service: Arc<OfferService>,
    request_service: Arc<RequestService>,
}

impl MatchingService {
    /// Create a new matching service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `audit_service` - Audit service for logging operations
    /// * `offer_service` - Offer service
    /// * `request_service` - Request service
    pub fn new(
        db: Arc<DatabaseConnection>,
        audit_service: Arc<AuditService>,
        offer_service: Arc<OfferService>,
        request_service: Arc<RequestService>,
    ) -> Self {
        Self {
            db,
            audit_service,
            offer_service,
            request_service,
        }
    }

    /// Create an Arc-wrapped matching service for dependency injection
    pub fn arc(
        db: Arc<DatabaseConnection>,
        audit_service: Arc<AuditService>,
        offer_service: Arc<OfferService>,
        request_service: Arc<RequestService>,
    ) -> Arc<Self> {
        Arc::new(Self::new(db, audit_service, offer_service, request_service))
    }

    /// Create a new match
    ///
    /// # Arguments
    ///
    /// * `dto` - Match creation data
    ///
    /// # Returns
    ///
    /// * `Ok(MatchResponseDto)` - Created match
    /// * `Err(ServiceError)` - If creation fails
    pub async fn create(&self, dto: CreateMatchDto) -> ServiceResult<MatchResponseDto> {
        // Validate that offer and request exist
        self.offer_service.get_by_id(*dto.offer_id()).await?;
        self.request_service.get_by_id(*dto.request_id()).await?;

        // Validate score
        if *dto.score() < Decimal::ZERO || *dto.score() > Decimal::ONE {
            return Err(ServiceError::validation("Score must be between 0 and 1"));
        }

        // Parse confidence band
        let confidence_band = self.parse_confidence_band(dto.confidence_band())?;

        let now = Utc::now();
        let match_id = Id::new();

        let match_model = r#match::ActiveModel::new(
            match_id,
            *dto.offer_id(),
            *dto.request_id(),
            *dto.score(),
            confidence_band,
            MatchStatus::Pending,
            dto.medication_name().clone(),
            *dto.offer_quantity(),
            *dto.request_quantity(),
        )
        .with_operator_note(None::<String>)
        .with_offer_price(*dto.offer_price())
        .with_max_price(*dto.max_price())
        .with_created_at(now)
        .with_updated_at(now);

        let match_result = match_model.insert(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_create("Match", match_result.id(), None)
            .await?;

        info!(
            match_id = %match_result.id(),
            offer_id = %dto.offer_id(),
            request_id = %dto.request_id(),
            score = %dto.score(),
            "Match created"
        );

        Ok(self.model_to_response(match_result))
    }

    /// Get a match by ID
    ///
    /// # Arguments
    ///
    /// * `match_id` - Match ID
    ///
    /// # Returns
    ///
    /// * `Ok(MatchResponseDto)` - Match if found
    /// * `Err(ServiceError)` - If match not found or query fails
    pub async fn get_by_id(&self, match_id: Id) -> ServiceResult<MatchResponseDto> {
        let match_result = r#match::Entity::find_by_id(match_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Match", match_id))?;

        Ok(self.model_to_response(match_result))
    }

    /// List matches for an offer
    ///
    /// # Arguments
    ///
    /// * `offer_id` - Offer ID
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<MatchResponseDto>)` - List of matches
    /// * `Err(ServiceError)` - If query fails
    pub async fn list_by_offer(&self, offer_id: &str) -> ServiceResult<Vec<MatchResponseDto>> {
        let matches = r#match::Entity::find()
            .filter(r#match::COLUMN.offer_id.eq(offer_id))
            .order_by_desc(r#match::COLUMN.score)
            .all(self.db.as_ref())
            .await?;

        Ok(matches
            .into_iter()
            .map(|m| self.model_to_response(m))
            .collect())
    }

    /// List matches for a request
    ///
    /// # Arguments
    ///
    /// * `request_id` - Request ID
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<MatchResponseDto>)` - List of matches
    /// * `Err(ServiceError)` - If query fails
    pub async fn list_by_request(&self, request_id: &str) -> ServiceResult<Vec<MatchResponseDto>> {
        let matches = r#match::Entity::find()
            .filter(r#match::COLUMN.request_id.eq(request_id))
            .order_by_desc(r#match::COLUMN.score)
            .all(self.db.as_ref())
            .await?;

        Ok(matches
            .into_iter()
            .map(|m| self.model_to_response(m))
            .collect())
    }

    /// Update match status
    ///
    /// # Arguments
    ///
    /// * `match_id` - Match ID
    /// * `status` - New status
    /// * `operator_note` - Optional operator note
    ///
    /// # Returns
    ///
    /// * `Ok(MatchResponseDto)` - Updated match
    /// * `Err(ServiceError)` - If update fails
    pub async fn update_status(
        &self,
        match_id: Id,
        status: MatchStatus,
        operator_note: Option<String>,
    ) -> ServiceResult<MatchResponseDto> {
        let match_result = r#match::Entity::find_by_id(match_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Match", match_id))?;

        let mut match_active: r#match::ActiveModel = match_result.into();
        match_active.status = Set(status.clone());
        if let Some(note) = operator_note {
            match_active.operator_note = Set(Some(note));
        }
        match_active.updated_at = Set(Utc::now());

        let updated_match = match_active.update(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_update(
                "Match",
                match_id,
                None,
                Some(serde_json::json!({ "status": format!("{:?}", status) })),
            )
            .await?;

        Ok(self.model_to_response(updated_match))
    }

    /// Parse confidence band from string
    fn parse_confidence_band(&self, band: &str) -> ServiceResult<ConfidenceBand> {
        match band.to_lowercase().as_str() {
            "auto" => Ok(ConfidenceBand::Auto),
            "suggest" => Ok(ConfidenceBand::Suggest),
            "review" => Ok(ConfidenceBand::Review),
            "none" => Ok(ConfidenceBand::None),
            _ => Err(ServiceError::validation(format!(
                "Invalid confidence band: {}",
                band
            ))),
        }
    }

    /// Convert model to response DTO
    fn model_to_response(&self, match_result: r#match::Model) -> MatchResponseDto {
        MatchResponseDto::builder()
            .id(match_result.id())
            .offer_id(*match_result.offer_id())
            .request_id(match_result.request_id())
            .score(*match_result.score())
            .confidence_band(format!("{:?}", match_result.confidence_band()))
            .status(format!("{:?}", match_result.status()))
            .operator_note(match_result.operator_note().clone())
            .medication_name(match_result.medication_name())
            .offer_quantity(*match_result.offer_quantity())
            .request_quantity(*match_result.request_quantity())
            .offer_price(*match_result.offer_price())
            .max_price(*match_result.max_price())
            .created_at(*match_result.created_at())
            .updated_at(*match_result.updated_at())
            .build()
    }
}

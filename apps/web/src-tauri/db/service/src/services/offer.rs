//! Offer service for managing medication offers

use crate::{
    entities::offer::{self, OfferStatus},
    error::{ServiceError, ServiceResult},
    services::AuditService,
    types::{CreateOfferDto, OfferResponseDto},
};
use chrono::Utc;
use sea_orm::{DatabaseConnection, Set, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for managing offers
pub struct OfferService {
    db: Arc<DatabaseConnection>,
    audit_service: Arc<AuditService>,
}

impl OfferService {
    /// Create a new offer service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `audit_service` - Audit service for logging operations
    pub fn new(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Self {
        Self { db, audit_service }
    }

    /// Create an Arc-wrapped offer service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Arc<Self> {
        Arc::new(Self::new(db, audit_service))
    }

    /// Create a new offer
    ///
    /// # Arguments
    ///
    /// * `dto` - Offer creation data
    ///
    /// # Returns
    ///
    /// * `Ok(OfferResponseDto)` - Created offer
    /// * `Err(ServiceError)` - If creation fails
    pub async fn create(&self, dto: CreateOfferDto) -> ServiceResult<OfferResponseDto> {
        // Validate quantity
        if *dto.quantity() <= 0 {
            return Err(ServiceError::validation("Quantity must be positive"));
        }

        // Validate price if provided
        if let Some(price) = dto.price()
            && price.is_sign_negative()
        {
            return Err(ServiceError::validation("Price cannot be negative"));
        }

        let now = Utc::now();
        let offer_id = Id::new();

        let offer_model = offer::ActiveModel::new(
            offer_id,
            dto.medication_name().clone(),
            *dto.quantity(),
            dto.group_name().clone(),
            dto.sender_phone().clone(),
            OfferStatus::Active,
        )
        .with_dosage(dto.dosage().clone())
        .with_price(*dto.price())
        .with_raw_text(dto.raw_text().clone())
        .with_whatsapp_message_queue_id(*dto.whatsapp_message_queue_id())
        .with_whatsapp_group_id(*dto.whatsapp_group_id())
        .with_created_at(now)
        .with_updated_at(now);

        let offer = offer_model.insert(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_create("Offer", offer.id(), None)
            .await?;

        info!(
            offer_id = %offer.id(),
            medication = %offer.medication_name(),
            quantity = offer.quantity(),
            "Offer created"
        );

        Ok(OfferResponseDto::from(offer))
    }

    /// Get an offer by ID
    ///
    /// # Arguments
    ///
    /// * `offer_id` - Offer ID
    ///
    /// # Returns
    ///
    /// * `Ok(OfferResponseDto)` - Offer if found
    /// * `Err(ServiceError)` - If offer not found or query fails
    pub async fn get_by_id(&self, offer_id: Id) -> ServiceResult<OfferResponseDto> {
        let offer = offer::Entity::find_by_id(offer_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Offer", offer_id))?;

        Ok(OfferResponseDto::from(offer))
    }

    /// List active offers
    ///
    /// # Arguments
    ///
    /// * `page` - Page number (0-indexed)
    /// * `page_size` - Number of items per page
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<OfferResponseDto>)` - List of active offers
    /// * `Err(ServiceError)` - If query fails
    pub async fn list_active(
        &self,
        page: u64,
        page_size: u64,
    ) -> ServiceResult<Vec<OfferResponseDto>> {
        let offers = offer::Entity::find()
            .filter(offer::COLUMN.status.eq(OfferStatus::Active))
            .order_by_desc(offer::COLUMN.created_at)
            .paginate(self.db.as_ref(), page_size)
            .fetch_page(page)
            .await?;

        Ok(offers.into_iter().map(OfferResponseDto::from).collect())
    }

    /// Count active offers
    ///
    /// # Returns
    ///
    /// * `Ok(u64)` - Total count of active offers
    /// * `Err(ServiceError)` - If query fails
    pub async fn count_active(&self) -> ServiceResult<u64> {
        let count = offer::Entity::find()
            .filter(offer::COLUMN.status.eq(OfferStatus::Active))
            .count(self.db.as_ref())
            .await?;

        Ok(count)
    }

    /// Search offers by medication name
    ///
    /// # Arguments
    ///
    /// * `medication_name` - Medication name to search for
    /// * `page` - Page number (0-indexed)
    /// * `page_size` - Number of items per page
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<OfferResponseDto>)` - List of matching offers
    /// * `Err(ServiceError)` - If query fails
    pub async fn search_by_medication(
        &self,
        medication_name: &str,
        page: u64,
        page_size: u64,
    ) -> ServiceResult<Vec<OfferResponseDto>> {
        let offers = offer::Entity::find()
            .filter(offer::COLUMN.medication_name.contains(medication_name))
            .filter(offer::COLUMN.status.eq(OfferStatus::Active))
            .order_by_desc(offer::COLUMN.created_at)
            .paginate(self.db.as_ref(), page_size)
            .fetch_page(page)
            .await?;

        Ok(offers.into_iter().map(OfferResponseDto::from).collect())
    }

    /// Count offers by medication name search
    ///
    /// # Arguments
    ///
    /// * `medication_name` - Medication name to search for
    ///
    /// # Returns
    ///
    /// * `Ok(u64)` - Total count of matching offers
    /// * `Err(ServiceError)` - If query fails
    pub async fn count_by_medication(&self, medication_name: &str) -> ServiceResult<u64> {
        let count = offer::Entity::find()
            .filter(offer::COLUMN.medication_name.contains(medication_name))
            .filter(offer::COLUMN.status.eq(OfferStatus::Active))
            .count(self.db.as_ref())
            .await?;

        Ok(count)
    }

    /// Update offer status
    ///
    /// # Arguments
    ///
    /// * `offer_id` - Offer ID
    /// * `status` - New status
    ///
    /// # Returns
    ///
    /// * `Ok(OfferResponseDto)` - Updated offer
    /// * `Err(ServiceError)` - If update fails
    pub async fn update_status(
        &self,
        offer_id: Id,
        status: OfferStatus,
    ) -> ServiceResult<OfferResponseDto> {
        let offer = offer::Entity::find_by_id(offer_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Offer", offer_id))?;

        let mut offer_active: offer::ActiveModel = offer.into();
        offer_active.status = Set(status.clone());
        offer_active.updated_at = Set(Utc::now());

        let updated_offer = offer_active.update(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_update(
                "Offer",
                offer_id,
                None,
                Some(serde_json::json!({ "status": format!("{:?}", status) })),
            )
            .await?;

        Ok(OfferResponseDto::from(updated_offer))
    }

    /// Delete an offer
    ///
    /// # Arguments
    ///
    /// * `offer_id` - Offer ID
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If deletion succeeds
    /// * `Err(ServiceError)` - If deletion fails
    pub async fn delete(&self, offer_id: Id) -> ServiceResult<()> {
        let offer = offer::Entity::find_by_id(offer_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Offer", offer_id))?;

        offer.delete(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_delete("Offer", offer_id, None)
            .await?;

        info!(offer_id = %offer_id, "Offer deleted");

        Ok(())
    }
}

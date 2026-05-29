//! Review service for managing review queue

use crate::{
    entities::review_item::{
        self, ReviewStatus,
        dto::{ReviewItemDto, ReviewStatusDto, ReviewTypeDto},
    },
    error::{ServiceError, ServiceResult},
    services::AuditService,
};
use sea_orm::{DatabaseConnection, Set, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for managing review queue
pub struct ReviewService {
    db: Arc<DatabaseConnection>,
    audit_service: Arc<AuditService>,
}

impl ReviewService {
    /// Create a new review service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `audit_service` - Audit service for logging operations
    pub fn new(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Self {
        Self { db, audit_service }
    }

    /// Create an Arc-wrapped review service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Arc<Self> {
        Arc::new(Self::new(db, audit_service))
    }

    /// Get pending review queue
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<ReviewItemDto>)` - List of pending review items
    /// * `Err(ServiceError)` - If query fails
    pub async fn get_queue(&self) -> ServiceResult<Vec<ReviewItemDto>> {
        let items = review_item::Entity::find()
            .filter(review_item::Column::Status.eq(ReviewStatus::Pending))
            .order_by_desc(review_item::Column::CreatedAt)
            .all(self.db.as_ref())
            .await?;

        Ok(items.into_iter().map(Self::model_to_dto).collect())
    }

    /// Get review statistics
    ///
    /// # Returns
    ///
    /// * `Ok(ReviewStatsDto)` - Review statistics
    /// * `Err(ServiceError)` - If query fails
    pub async fn get_stats(&self) -> ServiceResult<ReviewStatsDto> {
        let total = review_item::Entity::find().count(self.db.as_ref()).await?;

        let pending = review_item::Entity::find()
            .filter(review_item::Column::Status.eq(ReviewStatus::Pending))
            .count(self.db.as_ref())
            .await?;

        let approved = review_item::Entity::find()
            .filter(review_item::Column::Status.eq(ReviewStatus::Approved))
            .count(self.db.as_ref())
            .await?;

        let rejected = review_item::Entity::find()
            .filter(review_item::Column::Status.eq(ReviewStatus::Rejected))
            .count(self.db.as_ref())
            .await?;

        // Calculate average processing time (created_at to updated_at for non-pending items)
        // This is a simplified version - in production, use raw SQL for better performance
        let processed_items = review_item::Entity::find()
            .filter(review_item::Column::Status.ne(ReviewStatus::Pending))
            .all(self.db.as_ref())
            .await?;

        let avg_processing_time = if !processed_items.is_empty() {
            let total_seconds: i64 = processed_items
                .iter()
                .map(|item| {
                    let diff = item.updated_at().timestamp() - item.created_at().timestamp();
                    std::cmp::max(diff, 0)
                })
                .sum();
            (total_seconds as f64) / (processed_items.len() as f64)
        } else {
            0.0
        };

        Ok(ReviewStatsDto {
            total,
            pending,
            approved,
            rejected,
            avg_processing_time,
        })
    }

    /// Approve a review item
    ///
    /// # Arguments
    ///
    /// * `id` - Review item ID
    ///
    /// # Returns
    ///
    /// * `Ok(ReviewItemDto)` - Updated review item
    /// * `Err(ServiceError)` - If item not found or update fails
    pub async fn approve_item(&self, id: Id) -> ServiceResult<ReviewItemDto> {
        let item = review_item::Entity::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("ReviewItem", id))?;

        let mut item_active: review_item::ActiveModel = item.into();
        item_active.status = Set(ReviewStatus::Approved);
        item_active.updated_at = Set(chrono::Utc::now());

        let updated_item = item_active.update(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_update(
                "ReviewItem",
                id,
                None,
                Some(serde_json::json!({ "status": "approved" })),
            )
            .await?;

        info!(review_item_id = %id, "Review item approved");

        Ok(Self::model_to_dto(updated_item))
    }

    /// Reject a review item
    ///
    /// # Arguments
    ///
    /// * `id` - Review item ID
    ///
    /// # Returns
    ///
    /// * `Ok(ReviewItemDto)` - Updated review item
    /// * `Err(ServiceError)` - If item not found or update fails
    pub async fn reject_item(&self, id: Id) -> ServiceResult<ReviewItemDto> {
        let item = review_item::Entity::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("ReviewItem", id))?;

        let mut item_active: review_item::ActiveModel = item.into();
        item_active.status = Set(ReviewStatus::Rejected);
        item_active.updated_at = Set(chrono::Utc::now());

        let updated_item = item_active.update(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_update(
                "ReviewItem",
                id,
                None,
                Some(serde_json::json!({ "status": "rejected" })),
            )
            .await?;

        info!(review_item_id = %id, "Review item rejected");

        Ok(Self::model_to_dto(updated_item))
    }

    /// Convert model to DTO
    fn model_to_dto(item: review_item::Model) -> ReviewItemDto {
        ReviewItemDto::builder()
            .id(*item.id())
            .r#type(match item.r#type() {
                review_item::ReviewType::Offer => ReviewTypeDto::Offer,
                review_item::ReviewType::Request => ReviewTypeDto::Request,
                review_item::ReviewType::Match => ReviewTypeDto::Match,
            })
            .medication_name(item.medication_name().clone())
            .dosage(item.dosage().clone())
            .quantity(item.quantity().clone())
            .raw_text(item.raw_text().clone())
            .group_name(item.group_name().clone())
            .sender_phone(item.sender_phone().clone())
            .status(match item.status() {
                ReviewStatus::Pending => ReviewStatusDto::Pending,
                ReviewStatus::Approved => ReviewStatusDto::Approved,
                ReviewStatus::Rejected => ReviewStatusDto::Rejected,
            })
            .parsed_data(item.parsed_data().as_ref().map(|s| s.clone()))
            .created_at(*item.created_at())
            .updated_at(*item.updated_at())
            .build()
    }
}

/// Review statistics DTO
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ReviewStatsDto {
    pub total: u64,
    pub pending: u64,
    pub approved: u64,
    pub rejected: u64,
    pub avg_processing_time: f64,
}

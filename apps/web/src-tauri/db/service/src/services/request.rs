//! Request service for managing medication requests

use crate::{
    entities::request::{self, RequestStatus},
    error::{ServiceError, ServiceResult},
    services::AuditService,
    types::{CreateRequestDto, RequestResponseDto},
};
use chrono::Utc;
use sea_orm::{DatabaseConnection, Set, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for managing requests
pub struct RequestService {
    db: Arc<DatabaseConnection>,
    audit_service: Arc<AuditService>,
}

impl RequestService {
    /// Create a new request service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `audit_service` - Audit service for logging operations
    pub fn new(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Self {
        Self { db, audit_service }
    }

    /// Create an Arc-wrapped request service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Arc<Self> {
        Arc::new(Self::new(db, audit_service))
    }

    /// Create a new request
    ///
    /// # Arguments
    ///
    /// * `dto` - Request creation data
    ///
    /// # Returns
    ///
    /// * `Ok(RequestResponseDto)` - Created request
    /// * `Err(ServiceError)` - If creation fails
    pub async fn create(&self, dto: CreateRequestDto) -> ServiceResult<RequestResponseDto> {
        // Validate quantity
        if *dto.quantity() <= 0 {
            return Err(ServiceError::validation("Quantity must be positive"));
        }

        // Validate max_price if provided
        if let Some(max_price) = dto.max_price()
            && max_price.is_sign_negative()
        {
            return Err(ServiceError::validation("Max price cannot be negative"));
        }

        let now = Utc::now();
        let request_id = Id::new();

        let request_model = request::ActiveModel::new(
            request_id,
            dto.medication_name().clone(),
            *dto.quantity(),
            dto.group_name().clone(),
            dto.sender_phone().clone(),
            RequestStatus::Active,
        )
        .with_dosage(dto.dosage().clone())
        .with_max_price(*dto.max_price())
        .with_raw_text(dto.raw_text().clone())
        .with_whatsapp_message_queue_id(*dto.whatsapp_message_queue_id())
        .with_whatsapp_group_id(*dto.whatsapp_group_id())
        .with_created_at(now)
        .with_updated_at(now);

        let request = request_model.insert(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_create("Request", request.id(), None)
            .await?;

        info!(
            request_id = %request.id(),
            medication = %request.medication_name(),
            quantity = request.quantity(),
            "Request created"
        );

        Ok(RequestResponseDto::from(request))
    }

    /// Get a request by ID
    ///
    /// # Arguments
    ///
    /// * `request_id` - Request ID
    ///
    /// # Returns
    ///
    /// * `Ok(RequestResponseDto)` - Request if found
    /// * `Err(ServiceError)` - If request not found or query fails
    pub async fn get_by_id(&self, request_id: Id) -> ServiceResult<RequestResponseDto> {
        let request = request::Entity::find_by_id(request_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Request", request_id))?;

        Ok(RequestResponseDto::from(request))
    }

    /// List active requests
    ///
    /// # Arguments
    ///
    /// * `page` - Page number (0-indexed)
    /// * `page_size` - Number of items per page
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<RequestResponseDto>)` - List of active requests
    /// * `Err(ServiceError)` - If query fails
    pub async fn list_active(
        &self,
        page: u64,
        page_size: u64,
    ) -> ServiceResult<Vec<RequestResponseDto>> {
        let requests = request::Entity::find()
            .filter(request::COLUMN.status.eq(RequestStatus::Active))
            .order_by_desc(request::COLUMN.created_at)
            .paginate(self.db.as_ref(), page_size)
            .fetch_page(page)
            .await?;

        Ok(requests.into_iter().map(RequestResponseDto::from).collect())
    }

    /// Search requests by medication name
    ///
    /// # Arguments
    ///
    /// * `medication_name` - Medication name to search for
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<RequestResponseDto>)` - List of matching requests
    /// * `Err(ServiceError)` - If query fails
    pub async fn search_by_medication(
        &self,
        medication_name: &str,
    ) -> ServiceResult<Vec<RequestResponseDto>> {
        let requests = request::Entity::find()
            .filter(request::COLUMN.medication_name.contains(medication_name))
            .filter(request::COLUMN.status.eq(RequestStatus::Active))
            .order_by_desc(request::COLUMN.created_at)
            .all(self.db.as_ref())
            .await?;

        Ok(requests.into_iter().map(RequestResponseDto::from).collect())
    }

    /// Update request status
    ///
    /// # Arguments
    ///
    /// * `request_id` - Request ID
    /// * `status` - New status
    ///
    /// # Returns
    ///
    /// * `Ok(RequestResponseDto)` - Updated request
    /// * `Err(ServiceError)` - If update fails
    pub async fn update_status(
        &self,
        request_id: Id,
        status: RequestStatus,
    ) -> ServiceResult<RequestResponseDto> {
        let request = request::Entity::find_by_id(request_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Request", request_id))?;

        let mut request_active: request::ActiveModel = request.into();
        request_active.status = Set(status.clone());
        request_active.updated_at = Set(Utc::now());

        let updated_request = request_active.update(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_update(
                "Request",
                request_id,
                None,
                Some(serde_json::json!({ "status": format!("{:?}", status) })),
            )
            .await?;

        Ok(RequestResponseDto::from(updated_request))
    }

    /// Delete a request
    ///
    /// # Arguments
    ///
    /// * `request_id` - Request ID
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If deletion succeeds
    /// * `Err(ServiceError)` - If deletion fails
    pub async fn delete(&self, request_id: Id) -> ServiceResult<()> {
        let request = request::Entity::find_by_id(request_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Request", request_id))?;

        request.delete(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_delete("Request", request_id, None)
            .await?;

        info!(request_id = %request_id, "Request deleted");

        Ok(())
    }
}

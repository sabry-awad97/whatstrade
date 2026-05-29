//! WhatsApp service for WhatsApp integration
//!
//! Handles communication with Go WhatsApp service and message queue operations.

use crate::{
    entities::{
        group,
        whatsapp_message_queue::{
            self, MessageQueueStatus,
            dto::{MessageQueueStatusDto, WhatsAppMessageQueueDto},
        },
    },
    error::{ServiceError, ServiceResult},
};
use sea_orm::{DatabaseConnection, TransactionTrait, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for WhatsApp integration
pub struct WhatsAppService {
    db: Arc<DatabaseConnection>,
    go_service_url: String,
}

impl WhatsAppService {
    /// Create a new WhatsApp service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `go_service_url` - URL of the Go WhatsApp service
    pub fn new(db: Arc<DatabaseConnection>, go_service_url: String) -> Self {
        Self { db, go_service_url }
    }

    /// Create an Arc-wrapped WhatsApp service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, go_service_url: String) -> Arc<Self> {
        Arc::new(Self::new(db, go_service_url))
    }

    /// Sync groups from WhatsApp
    ///
    /// Calls Go service to fetch latest group list and updates database.
    ///
    /// # Returns
    ///
    /// * `Ok(SyncGroupsResponseDto)` - Sync result with group count
    /// * `Err(ServiceError)` - If sync fails
    pub async fn sync_groups(&self) -> ServiceResult<SyncGroupsResponseDto> {
        // Call Go service to trigger sync
        let client = reqwest::Client::new();
        let url = format!("{}/api/whatsapp/groups/sync", self.go_service_url);

        let response = client
            .post(&url)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
            .map_err(|e| ServiceError::internal(format!("Go service request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ServiceError::internal(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        // Get updated group count from database
        let count = group::Entity::find().count(self.db.as_ref()).await?;

        info!(group_count = count, "Groups synced from WhatsApp");

        Ok(SyncGroupsResponseDto {
            success: true,
            count,
        })
    }

    /// Get failed messages with pagination
    ///
    /// # Arguments
    ///
    /// * `page` - Page number (0-indexed)
    /// * `limit` - Items per page
    /// * `group_name` - Optional group name filter
    ///
    /// # Returns
    ///
    /// * `Ok(FailedMessagesDto)` - Failed messages with pagination
    /// * `Err(ServiceError)` - If query fails
    pub async fn get_failed_messages(
        &self,
        page: u64,
        limit: u64,
        group_name: Option<String>,
    ) -> ServiceResult<FailedMessagesDto> {
        let offset = page * limit;

        let mut query = whatsapp_message_queue::Entity::find()
            .filter(whatsapp_message_queue::Column::Status.eq(MessageQueueStatus::Failed));

        if let Some(name) = &group_name {
            query = query.filter(whatsapp_message_queue::Column::GroupName.contains(name));
        }

        let messages = query
            .order_by_desc(whatsapp_message_queue::Column::LastErrorAt)
            .limit(limit)
            .offset(offset)
            .all(self.db.as_ref())
            .await?;

        // Get total count
        let mut count_query = whatsapp_message_queue::Entity::find()
            .filter(whatsapp_message_queue::Column::Status.eq(MessageQueueStatus::Failed));

        if let Some(name) = &group_name {
            count_query =
                count_query.filter(whatsapp_message_queue::Column::GroupName.contains(name));
        }

        let total = count_query.count(self.db.as_ref()).await?;

        Ok(FailedMessagesDto {
            messages: messages.into_iter().map(Self::model_to_dto).collect(),
            total,
            page,
            limit,
        })
    }

    /// Retry a failed message
    ///
    /// Resets message status to pending and clears error information.
    ///
    /// # Arguments
    ///
    /// * `id` - Message queue ID
    ///
    /// # Returns
    ///
    /// * `Ok(WhatsAppMessageQueueDto)` - Updated message
    /// * `Err(ServiceError)` - If message not found or update fails
    pub async fn retry_message(&self, id: Id) -> ServiceResult<WhatsAppMessageQueueDto> {
        let txn = self.db.begin().await?;

        // Perform atomic update
        let update_result = whatsapp_message_queue::Entity::update_many()
            .col_expr(
                whatsapp_message_queue::Column::Status,
                sea_orm::sea_query::Expr::value(MessageQueueStatus::Pending),
            )
            .col_expr(
                whatsapp_message_queue::Column::RetryCount,
                sea_orm::sea_query::Expr::value(0),
            )
            .col_expr(
                whatsapp_message_queue::Column::NextRetryAt,
                sea_orm::sea_query::Expr::value(sea_orm::sea_query::Value::ChronoDateTimeUtc(None)),
            )
            .col_expr(
                whatsapp_message_queue::Column::LastError,
                sea_orm::sea_query::Expr::value(sea_orm::sea_query::Value::String(None)),
            )
            .col_expr(
                whatsapp_message_queue::Column::LastErrorAt,
                sea_orm::sea_query::Expr::value(sea_orm::sea_query::Value::ChronoDateTimeUtc(None)),
            )
            .filter(whatsapp_message_queue::Column::Id.eq(id))
            .exec(&txn)
            .await?;

        // Check if any row was updated
        if update_result.rows_affected == 0 {
            txn.rollback().await?;
            return Err(ServiceError::not_found("WhatsAppMessageQueue", id));
        }

        // Fetch the updated row within the same transaction
        let updated_message = whatsapp_message_queue::Entity::find_by_id(id)
            .one(&txn)
            .await?
            .ok_or_else(|| ServiceError::not_found("WhatsAppMessageQueue", id))?;

        txn.commit().await?;

        info!(message_id = %id, "Message retry initiated");

        Ok(Self::model_to_dto(updated_message))
    }

    /// Fetch WhatsApp status from Go service
    ///
    /// # Returns
    ///
    /// * `Ok(WhatsAppStatusDto)` - Current status
    /// * `Err(ServiceError)` - If request fails
    pub async fn fetch_status(&self) -> ServiceResult<WhatsAppStatusDto> {
        let client = reqwest::Client::new();
        let url = format!("{}/api/whatsapp/status", self.go_service_url);

        let response = client
            .get(&url)
            .timeout(std::time::Duration::from_secs(5))
            .send()
            .await
            .map_err(|e| ServiceError::internal(format!("Go service request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ServiceError::internal(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        let status: GoServiceStatus = response
            .json()
            .await
            .map_err(|e| ServiceError::internal(format!("Failed to parse response: {}", e)))?;

        Ok(WhatsAppStatusDto {
            connected: status.connected,
            logged_in: status.logged_in,
            timestamp: chrono::Utc::now(),
        })
    }

    /// Fetch QR code from Go service
    ///
    /// # Returns
    ///
    /// * `Ok(QRCodeDto)` - QR code data
    /// * `Err(ServiceError)` - If request fails or already logged in
    pub async fn fetch_qr_code(&self) -> ServiceResult<QRCodeDto> {
        let client = reqwest::Client::new();
        let url = format!("{}/api/whatsapp/qr", self.go_service_url);

        let response = client
            .get(&url)
            .timeout(std::time::Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| ServiceError::internal(format!("Go service request failed: {}", e)))?;

        if response.status() == 400 {
            return Err(ServiceError::validation("Already logged in"));
        }

        if !response.status().is_success() {
            return Err(ServiceError::internal(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        let qr_data: GoServiceQRCode = response
            .json()
            .await
            .map_err(|e| ServiceError::internal(format!("Failed to parse response: {}", e)))?;

        Ok(QRCodeDto {
            qr_code: qr_data.qr_code,
            expires_at: chrono::Utc::now() + chrono::Duration::seconds(60),
        })
    }

    /// Convert model to DTO
    fn model_to_dto(message: whatsapp_message_queue::Model) -> WhatsAppMessageQueueDto {
        WhatsAppMessageQueueDto::builder()
            .id(*message.id())
            .whatsapp_message_id(*message.whatsapp_message_id())
            .whatsapp_group_id(*message.whatsapp_group_id())
            .group_name(message.group_name().clone())
            .sender_phone(message.sender_phone().clone())
            .sender_name(message.sender_name().clone())
            .raw_text(message.raw_text().clone())
            .received_at(*message.received_at())
            .status(match message.status() {
                MessageQueueStatus::Pending => MessageQueueStatusDto::Pending,
                MessageQueueStatus::Processing => MessageQueueStatusDto::Processing,
                MessageQueueStatus::Completed => MessageQueueStatusDto::Completed,
                MessageQueueStatus::Failed => MessageQueueStatusDto::Failed,
                MessageQueueStatus::DeadLetter => MessageQueueStatusDto::DeadLetter,
            })
            .retry_count(*message.retry_count())
            .max_retries(*message.max_retries())
            .next_retry_at(*message.next_retry_at())
            .last_error(message.last_error().clone())
            .last_error_at(*message.last_error_at())
            .created_at(*message.created_at())
            .processed_at(*message.processed_at())
            .completed_at(*message.completed_at())
            .extracted_data(message.extracted_data().clone())
            .created_offer_id(*message.created_offer_id())
            .created_request_id(*message.created_request_id())
            .build()
    }
}

// Go service response types
#[derive(Debug, serde::Deserialize)]
struct GoServiceStatus {
    connected: bool,
    logged_in: bool,
}

#[derive(Debug, serde::Deserialize)]
struct GoServiceQRCode {
    qr_code: String,
}

// Response DTOs
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SyncGroupsResponseDto {
    pub success: bool,
    pub count: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FailedMessagesDto {
    pub messages: Vec<WhatsAppMessageQueueDto>,
    pub total: u64,
    pub page: u64,
    pub limit: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WhatsAppStatusDto {
    pub connected: bool,
    pub logged_in: bool,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QRCodeDto {
    pub qr_code: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

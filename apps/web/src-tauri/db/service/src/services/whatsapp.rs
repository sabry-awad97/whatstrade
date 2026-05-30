//! WhatsApp service for WhatsApp integration
//!
//! Handles WhatsApp operations and message queue management using a provider-based architecture.
//! The service is decoupled from specific WhatsApp implementations through the WhatsAppProvider trait.

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
use whatsapp::{SyncConfig, WhatsAppProvider};

/// Service for WhatsApp integration
pub struct WhatsAppService {
    db: Arc<DatabaseConnection>,
    provider: Arc<dyn WhatsAppProvider>,
}

impl WhatsAppService {
    /// Create a new WhatsApp service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `provider` - WhatsApp provider implementation (Go service, wa-rs, or mock)
    pub fn new(db: Arc<DatabaseConnection>, provider: Arc<dyn WhatsAppProvider>) -> Self {
        Self { db, provider }
    }

    /// Create an Arc-wrapped WhatsApp service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, provider: Arc<dyn WhatsAppProvider>) -> Arc<Self> {
        Arc::new(Self::new(db, provider))
    }

    /// Sync groups from WhatsApp
    ///
    /// Calls provider to fetch latest group list and updates database.
    ///
    /// # Returns
    ///
    /// * `Ok(SyncGroupsResponseDto)` - Sync result with group count
    /// * `Err(ServiceError)` - If sync fails
    pub async fn sync_groups(&self) -> ServiceResult<SyncGroupsResponseDto> {
        // Call provider to sync groups
        let _groups = self
            .provider
            .sync_groups(&SyncConfig::default())
            .await
            .map_err(|e| ServiceError::internal(format!("Provider sync failed: {}", e)))?;

        // TODO: Save groups to database
        // This would involve inserting/updating group records based on the synced data

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

    /// Fetch WhatsApp status from provider
    ///
    /// # Returns
    ///
    /// * `Ok(WhatsAppStatusDto)` - Current status
    /// * `Err(ServiceError)` - If request fails
    pub async fn fetch_status(&self) -> ServiceResult<WhatsAppStatusDto> {
        let status =
            self.provider.get_status().await.map_err(|e| {
                ServiceError::internal(format!("Provider status check failed: {}", e))
            })?;

        Ok(WhatsAppStatusDto {
            connected: status.connected,
            logged_in: status.logged_in,
            timestamp: status.timestamp,
        })
    }

    /// Fetch QR code from provider
    ///
    /// # Returns
    ///
    /// * `Ok(QRCodeDto)` - QR code data
    /// * `Err(ServiceError)` - If request fails or already logged in
    pub async fn fetch_qr_code(&self) -> ServiceResult<QRCodeDto> {
        let qr_code = self.provider.get_qr_code().await.map_err(|e| {
            // Map authentication errors to validation errors
            match e {
                whatsapp::ProviderError::Authentication(msg) => ServiceError::validation(msg),
                _ => ServiceError::internal(format!("Provider QR code fetch failed: {}", e)),
            }
        })?;

        Ok(QRCodeDto {
            qr_code: qr_code.data,
            expires_at: qr_code.expires_at,
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

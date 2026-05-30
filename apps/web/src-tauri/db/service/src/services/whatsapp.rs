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
use tokio::sync::RwLock;
use tracing::info;
use utilities::Id;
use whatsapp::{SyncConfig, WaRsConfig, WaRsProvider, WhatsAppProvider};

/// Service for WhatsApp integration
pub struct WhatsAppService {
    db: Arc<DatabaseConnection>,
    provider: Arc<RwLock<Option<Arc<dyn WhatsAppProvider>>>>,
    config: WaRsConfig,
}

impl WhatsAppService {
    /// Create a new WhatsApp service (provider not initialized yet)
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `config` - Configuration for wa-rs provider
    pub fn new(db: Arc<DatabaseConnection>, config: WaRsConfig) -> Self {
        Self {
            db,
            provider: Arc::new(RwLock::new(None)),
            config,
        }
    }

    /// Create an Arc-wrapped WhatsApp service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, config: WaRsConfig) -> Arc<Self> {
        Arc::new(Self::new(db, config))
    }

    /// Get the provider, initializing it if necessary
    async fn get_or_init_provider(&self) -> ServiceResult<Arc<dyn WhatsAppProvider>> {
        // Fast path: provider already initialized
        {
            let provider = self.provider.read().await;
            if let Some(p) = provider.as_ref() {
                return Ok(p.clone());
            }
        }

        // Slow path: initialize provider
        let mut provider = self.provider.write().await;

        // Double-check in case another task initialized it
        if let Some(p) = provider.as_ref() {
            return Ok(p.clone());
        }

        info!("Initializing WhatsApp provider");
        let new_provider: Arc<dyn WhatsAppProvider> =
            Arc::new(WaRsProvider::new(self.config.clone()).await.map_err(|e| {
                ServiceError::internal(format!("Failed to initialize WhatsApp provider: {}", e))
            })?);

        *provider = Some(new_provider.clone());
        Ok(new_provider)
    }

    /// Connect to WhatsApp (initialize provider if not already done)
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Successfully connected or already connected
    /// * `Err(ServiceError)` - If connection fails
    pub async fn connect(&self) -> ServiceResult<()> {
        let provider = self.get_or_init_provider().await?;

        // Wait for the provider to be ready with timeout and retry
        let max_attempts = 30; // 30 attempts * 500ms = 15 seconds total
        let retry_delay = tokio::time::Duration::from_millis(500);

        for attempt in 1..=max_attempts {
            match provider.is_ready().await {
                Ok(true) => {
                    info!("WhatsApp provider connected and ready");
                    return Ok(());
                }
                Ok(false) => {
                    if attempt == max_attempts {
                        return Err(ServiceError::internal(
                            "WhatsApp provider failed to become ready within timeout",
                        ));
                    }
                    tokio::time::sleep(retry_delay).await;
                }
                Err(e) => {
                    return Err(ServiceError::internal(format!(
                        "Failed to check provider readiness: {}",
                        e
                    )));
                }
            }
        }

        Err(ServiceError::internal(
            "WhatsApp provider failed to become ready",
        ))
    }

    /// Disconnect from WhatsApp
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Successfully disconnected
    /// * `Err(ServiceError)` - If disconnect fails
    pub async fn disconnect(&self) -> ServiceResult<()> {
        let mut provider = self.provider.write().await;

        if let Some(p) = provider.take() {
            p.logout()
                .await
                .map_err(|e| ServiceError::internal(format!("Failed to disconnect: {}", e)))?;
            info!("WhatsApp provider disconnected");
        }

        Ok(())
    }

    /// Check if provider is initialized and connected
    pub async fn is_connected(&self) -> bool {
        let provider = self.provider.read().await;
        if let Some(p) = provider.as_ref() {
            p.is_ready().await.unwrap_or(false)
        } else {
            false
        }
    }

    /// Get the provider (for direct access by commands)
    ///
    /// Returns None if not yet initialized
    pub async fn provider(&self) -> Option<Arc<dyn WhatsAppProvider>> {
        self.provider.read().await.clone()
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
        let provider = self.get_or_init_provider().await?;

        // Call provider to sync groups
        let _groups = provider
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
        let provider = self.get_or_init_provider().await?;

        let status = provider
            .get_status()
            .await
            .map_err(|e| ServiceError::internal(format!("Provider status check failed: {}", e)))?;

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
        let provider = self.get_or_init_provider().await?;

        let qr_code = provider.get_qr_code().await.map_err(|e| {
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

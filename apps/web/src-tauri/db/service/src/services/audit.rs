//! Audit service for logging system operations

use crate::{entities::audit_log, error::ServiceResult, types::CreateAuditLogDto};
use chrono::Utc;
use sea_orm::{DatabaseConnection, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

/// Service for managing audit logs
pub struct AuditService {
    db: Arc<DatabaseConnection>,
}

impl AuditService {
    /// Create a new audit service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create an Arc-wrapped audit service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>) -> Arc<Self> {
        Arc::new(Self::new(db))
    }

    /// Log an audit entry
    ///
    /// # Arguments
    ///
    /// * `dto` - Audit log creation data
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If audit log is created successfully
    /// * `Err(ServiceError)` - If creation fails
    pub async fn log(&self, dto: CreateAuditLogDto) -> ServiceResult<()> {
        let details_json = dto
            .details()
            .clone()
            .and_then(|d| serde_json::to_value(d).ok());

        let audit_log = audit_log::ActiveModel::new(
            Uuid::new_v4().to_string(),
            dto.action().clone(),
            dto.entity_type().clone(),
            dto.entity_id().clone(),
        )
        .with_operator_id(dto.operator_id().clone())
        .with_details(details_json)
        .with_created_at(Utc::now());

        audit_log.insert(self.db.as_ref()).await?;

        info!(
            action = %dto.action(),
            entity_type = %dto.entity_type(),
            entity_id = %dto.entity_id(),
            operator_id = ?dto.operator_id(),
            "Audit log created"
        );

        Ok(())
    }

    /// Log a create operation
    pub async fn log_create(
        &self,
        entity_type: impl Into<String>,
        entity_id: impl Into<String>,
        operator_id: Option<String>,
    ) -> ServiceResult<()> {
        self.log(
            CreateAuditLogDto::builder()
                .action("create")
                .entity_type(entity_type)
                .entity_id(entity_id)
                .operator_id(operator_id)
                .build(),
        )
        .await
    }

    /// Log an update operation
    pub async fn log_update(
        &self,
        entity_type: impl Into<String>,
        entity_id: impl Into<String>,
        operator_id: Option<String>,
        details: Option<serde_json::Value>,
    ) -> ServiceResult<()> {
        self.log(
            CreateAuditLogDto::builder()
                .action("update")
                .entity_type(entity_type)
                .entity_id(entity_id)
                .operator_id(operator_id)
                .details(details)
                .build(),
        )
        .await
    }

    /// Log a delete operation
    pub async fn log_delete(
        &self,
        entity_type: impl Into<String>,
        entity_id: impl Into<String>,
        operator_id: Option<String>,
    ) -> ServiceResult<()> {
        self.log(
            CreateAuditLogDto::builder()
                .action("delete")
                .entity_type(entity_type)
                .entity_id(entity_id)
                .operator_id(operator_id)
                .build(),
        )
        .await
    }

    /// Get audit logs for a specific entity
    pub async fn get_entity_logs(
        &self,
        entity_type: impl Into<String>,
        entity_id: impl Into<String>,
    ) -> ServiceResult<Vec<audit_log::Model>> {
        let logs = audit_log::Entity::find()
            .filter(audit_log::COLUMN.entity_type.eq(entity_type.into()))
            .filter(audit_log::COLUMN.entity_id.eq(entity_id.into()))
            .order_by_desc(audit_log::COLUMN.created_at)
            .all(self.db.as_ref())
            .await?;

        Ok(logs)
    }
}

//! Group service for managing WhatsApp groups

use crate::{
    entities::group::{self, dto::GroupDto},
    error::{ServiceError, ServiceResult},
};
use sea_orm::{DatabaseConnection, Set, entity::*, query::*};
use std::sync::Arc;
use tracing::info;

/// Service for managing WhatsApp groups
pub struct GroupService {
    db: Arc<DatabaseConnection>,
}

impl GroupService {
    /// Create a new group service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create an Arc-wrapped group service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>) -> Arc<Self> {
        Arc::new(Self::new(db))
    }

    /// List all groups
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<GroupDto>)` - List of all groups
    /// * `Err(ServiceError)` - If query fails
    pub async fn list_all(&self) -> ServiceResult<Vec<GroupDto>> {
        let groups = group::Entity::find()
            .order_by_asc(group::Column::Name)
            .all(self.db.as_ref())
            .await?;

        Ok(groups.into_iter().map(Self::model_to_dto).collect())
    }

    /// List monitored groups only
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<GroupDto>)` - List of monitored groups
    /// * `Err(ServiceError)` - If query fails
    pub async fn list_monitored(&self) -> ServiceResult<Vec<GroupDto>> {
        let groups = group::Entity::find()
            .filter(group::Column::IsMonitored.eq(true))
            .order_by_asc(group::Column::Name)
            .all(self.db.as_ref())
            .await?;

        Ok(groups.into_iter().map(Self::model_to_dto).collect())
    }

    /// Enable monitoring for a group
    ///
    /// # Arguments
    ///
    /// * `jid` - WhatsApp group JID
    ///
    /// # Returns
    ///
    /// * `Ok(GroupDto)` - Updated group
    /// * `Err(ServiceError)` - If group not found or update fails
    pub async fn enable_monitoring(&self, jid: &str) -> ServiceResult<GroupDto> {
        let group = group::Entity::find()
            .filter(group::Column::Jid.eq(jid))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Group", jid))?;

        let mut group_active: group::ActiveModel = group.into();
        group_active.is_monitored = Set(true);
        group_active.updated_at = Set(chrono::Utc::now());

        let updated_group = group_active.update(self.db.as_ref()).await?;

        info!(
            group_id = %updated_group.id(),
            jid = %updated_group.jid(),
            "Group monitoring enabled"
        );

        Ok(Self::model_to_dto(updated_group))
    }

    /// Disable monitoring for a group
    ///
    /// # Arguments
    ///
    /// * `jid` - WhatsApp group JID
    ///
    /// # Returns
    ///
    /// * `Ok(GroupDto)` - Updated group
    /// * `Err(ServiceError)` - If group not found or update fails
    pub async fn disable_monitoring(&self, jid: &str) -> ServiceResult<GroupDto> {
        let group = group::Entity::find()
            .filter(group::Column::Jid.eq(jid))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Group", jid))?;

        let mut group_active: group::ActiveModel = group.into();
        group_active.is_monitored = Set(false);
        group_active.updated_at = Set(chrono::Utc::now());

        let updated_group = group_active.update(self.db.as_ref()).await?;

        info!(
            group_id = %updated_group.id(),
            jid = %updated_group.jid(),
            "Group monitoring disabled"
        );

        Ok(Self::model_to_dto(updated_group))
    }

    /// Convert model to DTO
    fn model_to_dto(group: group::Model) -> GroupDto {
        GroupDto::builder()
            .id(*group.id())
            .jid(group.jid().clone())
            .name(group.name().clone())
            .is_monitored(*group.is_monitored())
            .member_count(*group.member_count())
            .last_message_at(group.last_message_at().clone())
            .created_at(*group.created_at())
            .updated_at(*group.updated_at())
            .build()
    }
}

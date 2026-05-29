//! Group service for managing WhatsApp groups

use crate::{
    entities::group::{
        self,
        dto::{GroupDto, UpdateGroupDto},
    },
    error::{ServiceError, ServiceResult},
};
use sea_orm::{DatabaseConnection, entity::*, query::*};
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
        let update_dto = UpdateGroupDto::builder()
            .jid(jid)
            .is_monitored(true)
            .build();

        let updated_group = self.update_group(update_dto).await?;

        info!(
            group_id = %updated_group.id(),
            jid = %updated_group.jid(),
            "Group monitoring enabled"
        );

        Ok(updated_group)
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
        let update_dto = UpdateGroupDto::builder()
            .jid(jid)
            .is_monitored(false)
            .build();

        let updated_group = self.update_group(update_dto).await?;

        info!(
            group_id = %updated_group.id(),
            jid = %updated_group.jid(),
            "Group monitoring disabled"
        );

        Ok(updated_group)
    }

    /// Update a group with partial fields
    ///
    /// # Arguments
    ///
    /// * `jid` - WhatsApp group JID
    /// * `update_dto` - DTO containing fields to update
    ///
    /// # Returns
    ///
    /// * `Ok(GroupDto)` - Updated group
    /// * `Err(ServiceError)` - If group not found or update fails
    pub async fn update_group(&self, update_dto: UpdateGroupDto) -> ServiceResult<GroupDto> {
        // Build the update query dynamically based on provided fields
        let mut update_query = group::Entity::update_many();

        // Always update the updated_at timestamp
        update_query = update_query.col_expr(
            group::Column::UpdatedAt,
            sea_orm::sea_query::Expr::value(chrono::Utc::now()),
        );

        // Add optional fields if provided
        if let Some(name) = update_dto.name() {
            update_query =
                update_query.col_expr(group::Column::Name, sea_orm::sea_query::Expr::value(name));
        }

        if let Some(is_monitored) = update_dto.is_monitored() {
            update_query = update_query.col_expr(
                group::Column::IsMonitored,
                sea_orm::sea_query::Expr::value(*is_monitored),
            );
        }

        if let Some(member_count) = update_dto.member_count() {
            update_query = update_query.col_expr(
                group::Column::MemberCount,
                sea_orm::sea_query::Expr::value(*member_count),
            );
        }

        if let Some(last_message_at) = update_dto.last_message_at() {
            update_query = update_query.col_expr(
                group::Column::LastMessageAt,
                sea_orm::sea_query::Expr::value(*last_message_at),
            );
        }

        // Execute the update
        let update_result = update_query
            .filter(group::Column::Jid.eq(update_dto.jid()))
            .exec(self.db.as_ref())
            .await?;

        // Check if any row was updated
        if update_result.rows_affected == 0 {
            return Err(ServiceError::not_found("Group", update_dto.jid()));
        }

        // Fetch the updated row
        let updated_group = group::Entity::find()
            .filter(group::Column::Jid.eq(update_dto.jid()))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("Group", update_dto.jid()))?;

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
            .last_message_at(*group.last_message_at())
            .created_at(*group.created_at())
            .updated_at(*group.updated_at())
            .build()
    }
}

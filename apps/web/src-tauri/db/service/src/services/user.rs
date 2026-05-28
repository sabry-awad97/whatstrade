//! User service for managing user accounts

use crate::{
    entities::user,
    error::{ServiceError, ServiceResult},
    services::AuditService,
    types::{CreateUserDto, UserResponseDto},
};
use chrono::Utc;
use sea_orm::{DatabaseConnection, Set, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for managing users
pub struct UserService {
    db: Arc<DatabaseConnection>,
    audit_service: Arc<AuditService>,
}

impl UserService {
    /// Create a new user service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `audit_service` - Audit service for logging operations
    pub fn new(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Self {
        Self { db, audit_service }
    }

    /// Create an Arc-wrapped user service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>, audit_service: Arc<AuditService>) -> Arc<Self> {
        Arc::new(Self::new(db, audit_service))
    }

    /// Create a new user
    ///
    /// # Arguments
    ///
    /// * `dto` - User creation data
    ///
    /// # Returns
    ///
    /// * `Ok(UserResponseDto)` - Created user
    /// * `Err(ServiceError)` - If creation fails
    pub async fn create(&self, dto: CreateUserDto) -> ServiceResult<UserResponseDto> {
        // Check if user with email already exists
        let existing = user::Entity::find()
            .filter(user::COLUMN.email.eq(dto.email()))
            .one(self.db.as_ref())
            .await?;

        if existing.is_some() {
            return Err(ServiceError::duplicate("User", "email", dto.email()));
        }

        let now = Utc::now();
        let user_model = user::ActiveModel::new(
            *dto.id(),
            dto.name().clone(),
            dto.email().clone(),
            *dto.email_verified(),
        )
        .with_image(dto.image().clone())
        .with_created_at(now)
        .with_updated_at(now);

        let user = user_model.insert(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_create("User", user.id(), None)
            .await?;

        info!(user_id = %user.id(), email = %user.email(), "User created");

        Ok(UserResponseDto::from(user))
    }

    /// Get a user by ID
    ///
    /// # Arguments
    ///
    /// * `user_id` - User ID
    ///
    /// # Returns
    ///
    /// * `Ok(UserResponseDto)` - User if found
    /// * `Err(ServiceError)` - If user not found or query fails
    pub async fn get_by_id(&self, user_id: Id) -> ServiceResult<UserResponseDto> {
        let user = user::Entity::find_by_id(user_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("User", user_id))?;

        Ok(UserResponseDto::from(user))
    }

    /// Get a user by email
    ///
    /// # Arguments
    ///
    /// * `email` - User email
    ///
    /// # Returns
    ///
    /// * `Ok(UserResponseDto)` - User if found
    /// * `Err(ServiceError)` - If user not found or query fails
    pub async fn get_by_email(&self, email: &str) -> ServiceResult<UserResponseDto> {
        let user = user::Entity::find()
            .filter(user::COLUMN.email.eq(email))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("User", email))?;

        Ok(UserResponseDto::from(user))
    }

    /// Update user email verification status
    ///
    /// # Arguments
    ///
    /// * `user_id` - User ID
    /// * `verified` - Verification status
    ///
    /// # Returns
    ///
    /// * `Ok(UserResponseDto)` - Updated user
    /// * `Err(ServiceError)` - If update fails
    pub async fn update_email_verification(
        &self,
        user_id: Id,
        verified: bool,
    ) -> ServiceResult<UserResponseDto> {
        let user = user::Entity::find_by_id(user_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("User", user_id))?;

        let mut user_active: user::ActiveModel = user.into();
        user_active.email_verified = Set(verified);
        user_active.updated_at = Set(Utc::now());

        let updated_user = user_active.update(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service
            .log_update(
                "User",
                user_id,
                None,
                Some(serde_json::json!({ "email_verified": verified })),
            )
            .await?;

        Ok(UserResponseDto::from(updated_user))
    }

    /// List all users (with pagination)
    ///
    /// # Arguments
    ///
    /// * `page` - Page number (0-indexed)
    /// * `page_size` - Number of items per page
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<UserResponseDto>)` - List of users
    /// * `Err(ServiceError)` - If query fails
    pub async fn list(&self, page: u64, page_size: u64) -> ServiceResult<Vec<UserResponseDto>> {
        let users = user::Entity::find()
            .order_by_desc(user::COLUMN.created_at)
            .paginate(self.db.as_ref(), page_size)
            .fetch_page(page)
            .await?;

        Ok(users.into_iter().map(UserResponseDto::from).collect())
    }

    /// Delete a user
    ///
    /// # Arguments
    ///
    /// * `user_id` - User ID
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If deletion succeeds
    /// * `Err(ServiceError)` - If deletion fails
    pub async fn delete(&self, user_id: Id) -> ServiceResult<()> {
        let user = user::Entity::find_by_id(user_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("User", user_id))?;

        user.delete(self.db.as_ref()).await?;

        // Log audit entry
        self.audit_service.log_delete("User", user_id, None).await?;

        info!(user_id = %user_id, "User deleted");

        Ok(())
    }
}

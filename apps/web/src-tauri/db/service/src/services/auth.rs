//! Authentication service

use crate::{
    entities::{account, user},
    error::{ServiceError, ServiceResult},
    services::{JwtService, UserService},
    types::{AuthResponseDto, LoginDto, RegisterDto, UserResponseDto},
};
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use sea_orm::{DatabaseConnection, TransactionTrait, entity::*, query::*};
use std::sync::Arc;
use tracing::info;
use utilities::Id;

/// Service for authentication operations
pub struct AuthService {
    db: Arc<DatabaseConnection>,
    user_service: Arc<UserService>,
    jwt_service: Arc<JwtService>,
}

impl AuthService {
    /// Create a new auth service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `user_service` - User service
    /// * `jwt_service` - JWT service
    pub fn new(
        db: Arc<DatabaseConnection>,
        user_service: Arc<UserService>,
        jwt_service: Arc<JwtService>,
    ) -> Self {
        Self {
            db,
            user_service,
            jwt_service,
        }
    }

    /// Create an Arc-wrapped auth service for dependency injection
    pub fn arc(
        db: Arc<DatabaseConnection>,
        user_service: Arc<UserService>,
        jwt_service: Arc<JwtService>,
    ) -> Arc<Self> {
        Arc::new(Self::new(db, user_service, jwt_service))
    }

    /// Register a new user
    ///
    /// # Arguments
    ///
    /// * `dto` - Registration data
    ///
    /// # Returns
    ///
    /// * `Ok(AuthResponseDto)` - User and tokens
    /// * `Err(ServiceError)` - If registration fails
    pub async fn register(&self, dto: RegisterDto) -> ServiceResult<AuthResponseDto> {
        // Hash password
        let password_hash = self.hash_password(dto.password())?;

        // Start transaction to ensure both user and account are created atomically
        let txn = self.db.begin().await?;

        // Check if user with email already exists
        let existing = user::Entity::find()
            .filter(user::COLUMN.email.eq(dto.email()))
            .one(&txn)
            .await?;

        if existing.is_some() {
            return Err(ServiceError::duplicate("User", "email", dto.email()));
        }

        // Create user within transaction
        let user_id = Id::new();
        let now = chrono::Utc::now();
        let user_model =
            user::ActiveModel::new(user_id, dto.name().clone(), dto.email().clone(), false)
                .with_created_at(now)
                .with_updated_at(now);

        let user = user_model.insert(&txn).await?;

        // Create account with password within same transaction
        let account_model = account::ActiveModel::new(Id::new(), user_id, "credentials", user_id)
            .with_password(password_hash);

        account_model.insert(&txn).await?;

        // Commit transaction - both user and account are now persisted
        txn.commit().await?;

        // Generate tokens after successful transaction
        let access_token = self
            .jwt_service
            .generate_access_token(user.id(), user.email())?;
        let refresh_token = self
            .jwt_service
            .generate_refresh_token(user.id(), user.email())?;

        info!(user_id = %user.id(), email = %user.email(), "User registered");

        Ok(AuthResponseDto::builder()
            .user(UserResponseDto::from(user))
            .access_token(access_token)
            .refresh_token(refresh_token)
            .build())
    }

    /// Login a user
    ///
    /// # Arguments
    ///
    /// * `dto` - Login credentials
    ///
    /// # Returns
    ///
    /// * `Ok(AuthResponseDto)` - User and tokens
    /// * `Err(ServiceError)` - If login fails
    pub async fn login(&self, dto: LoginDto) -> ServiceResult<AuthResponseDto> {
        // Find user by email
        let user_model = user::Entity::find()
            .filter(user::COLUMN.email.eq(dto.email()))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::authentication("Invalid email or password"))?;

        // Find account with password
        let account_model = account::Entity::find()
            .filter(account::COLUMN.user_id.eq(*user_model.id()))
            .filter(account::COLUMN.provider_id.eq("credentials"))
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::authentication("Invalid email or password"))?;

        let stored_password = account_model
            .password()
            .clone()
            .ok_or_else(|| ServiceError::authentication("Invalid email or password"))?;

        // Verify password
        self.verify_password(dto.password(), &stored_password)?;

        // Generate tokens
        let access_token = self
            .jwt_service
            .generate_access_token(user_model.id(), user_model.email())?;
        let refresh_token = self
            .jwt_service
            .generate_refresh_token(user_model.id(), user_model.email())?;

        info!(user_id = %user_model.id(), email = %user_model.email(), "User logged in");

        Ok(AuthResponseDto::builder()
            .user(
                UserResponseDto::builder()
                    .id(user_model.id())
                    .name(user_model.name())
                    .email(user_model.email())
                    .email_verified(*user_model.email_verified())
                    .image(user_model.image().clone())
                    .created_at(*user_model.created_at())
                    .updated_at(*user_model.updated_at())
                    .build(),
            )
            .access_token(access_token)
            .refresh_token(refresh_token)
            .build())
    }

    /// Refresh access token using refresh token
    ///
    /// # Arguments
    ///
    /// * `refresh_token` - Refresh token
    ///
    /// # Returns
    ///
    /// * `Ok(AuthResponseDto)` - User and new tokens
    /// * `Err(ServiceError)` - If refresh fails
    pub async fn refresh_token(&self, refresh_token: &str) -> ServiceResult<AuthResponseDto> {
        // Validate refresh token and ensure it's the correct token type
        let claims = self.jwt_service.validate_refresh_token(refresh_token)?;

        // Get user
        let user = self.user_service.get_by_id(*claims.sub()).await?;

        // Generate new tokens
        let new_access_token = self
            .jwt_service
            .generate_access_token(user.id(), user.email())?;
        let new_refresh_token = self
            .jwt_service
            .generate_refresh_token(user.id(), user.email())?;

        Ok(AuthResponseDto::builder()
            .user(user)
            .access_token(new_access_token)
            .refresh_token(new_refresh_token)
            .build())
    }

    /// Validate an access token and return user
    ///
    /// # Arguments
    ///
    /// * `access_token` - Access token
    ///
    /// # Returns
    ///
    /// * `Ok(UserResponseDto)` - User if token is valid
    /// * `Err(ServiceError)` - If token is invalid
    pub async fn validate_token(&self, access_token: &str) -> ServiceResult<UserResponseDto> {
        let claims = self.jwt_service.validate_token(access_token)?;
        self.user_service.get_by_id(*claims.sub()).await
    }

    /// Hash a password using Argon2
    fn hash_password(&self, password: &str) -> ServiceResult<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| ServiceError::PasswordHash(e.to_string()))?
            .to_string();

        Ok(password_hash)
    }

    /// Verify a password against a hash
    fn verify_password(&self, password: &str, hash: &str) -> ServiceResult<()> {
        let parsed_hash =
            PasswordHash::new(hash).map_err(|e| ServiceError::PasswordHash(e.to_string()))?;

        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .map_err(|_| ServiceError::authentication("Invalid email or password"))?;

        Ok(())
    }
}

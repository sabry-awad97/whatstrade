//! Service layer error types

use sea_orm::DbErr;
use thiserror::Error;

/// Service layer result type
pub type ServiceResult<T> = Result<T, ServiceError>;

/// Service layer errors
#[derive(Debug, Error)]
pub enum ServiceError {
    /// Database error
    #[error("Database error: {0}")]
    Database(#[from] DbErr),

    /// Entity not found
    #[error("Entity not found: {entity_type} with id {id}")]
    NotFound { entity_type: String, id: String },

    /// Validation error
    #[error("Validation error: {0}")]
    Validation(String),

    /// Authentication error
    #[error("Authentication error: {0}")]
    Authentication(String),

    /// Authorization error
    #[error("Authorization error: {0}")]
    Authorization(String),

    /// Duplicate entity error
    #[error("Duplicate entity: {entity_type} with {field}={value}")]
    Duplicate {
        entity_type: String,
        field: String,
        value: String,
    },

    /// Business logic error
    #[error("Business logic error: {0}")]
    BusinessLogic(String),

    /// Internal error
    #[error("Internal error: {0}")]
    Internal(String),

    /// JWT error
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    /// Password hashing error
    #[error("Password hashing error: {0}")]
    PasswordHash(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

impl ServiceError {
    /// Create a not found error
    pub fn not_found(entity_type: impl Into<String>, id: impl Into<String>) -> Self {
        Self::NotFound {
            entity_type: entity_type.into(),
            id: id.into(),
        }
    }

    /// Create a duplicate error
    pub fn duplicate(
        entity_type: impl Into<String>,
        field: impl Into<String>,
        value: impl Into<String>,
    ) -> Self {
        Self::Duplicate {
            entity_type: entity_type.into(),
            field: field.into(),
            value: value.into(),
        }
    }

    /// Create a validation error
    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation(message.into())
    }

    /// Create an authentication error
    pub fn authentication(message: impl Into<String>) -> Self {
        Self::Authentication(message.into())
    }

    /// Create an authorization error
    pub fn authorization(message: impl Into<String>) -> Self {
        Self::Authorization(message.into())
    }

    /// Create a business logic error
    pub fn business_logic(message: impl Into<String>) -> Self {
        Self::BusinessLogic(message.into())
    }

    /// Create an internal error
    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal(message.into())
    }
}

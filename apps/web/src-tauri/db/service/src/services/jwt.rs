//! JWT service for token generation and validation

use crate::{error::ServiceResult, types::JwtClaims};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use std::sync::Arc;

/// JWT service for handling authentication tokens
pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    access_token_expiry: Duration,
    refresh_token_expiry: Duration,
}

impl JwtService {
    /// Create a new JWT service
    ///
    /// # Arguments
    ///
    /// * `secret` - Secret key for signing tokens
    /// * `access_token_expiry_hours` - Access token expiry in hours (default: 1)
    /// * `refresh_token_expiry_days` - Refresh token expiry in days (default: 30)
    pub fn new(
        secret: impl AsRef<[u8]>,
        access_token_expiry_hours: Option<i64>,
        refresh_token_expiry_days: Option<i64>,
    ) -> Self {
        let secret_bytes = secret.as_ref();
        Self {
            encoding_key: EncodingKey::from_secret(secret_bytes),
            decoding_key: DecodingKey::from_secret(secret_bytes),
            access_token_expiry: Duration::hours(access_token_expiry_hours.unwrap_or(1)),
            refresh_token_expiry: Duration::days(refresh_token_expiry_days.unwrap_or(30)),
        }
    }

    /// Generate an access token for a user
    ///
    /// # Arguments
    ///
    /// * `user_id` - User ID
    /// * `email` - User email
    ///
    /// # Returns
    ///
    /// * `Ok(String)` - JWT access token
    /// * `Err(ServiceError)` - If token generation fails
    pub fn generate_access_token(
        &self,
        user_id: impl Into<String>,
        email: impl Into<String>,
    ) -> ServiceResult<String> {
        let now = Utc::now();
        let exp = (now + self.access_token_expiry).timestamp() as usize;
        let iat = now.timestamp() as usize;

        let claims = JwtClaims::builder()
            .sub(user_id)
            .email(email)
            .exp(exp)
            .iat(iat)
            .token_type("access")
            .build();

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    /// Generate a refresh token for a user
    ///
    /// # Arguments
    ///
    /// * `user_id` - User ID
    /// * `email` - User email
    ///
    /// # Returns
    ///
    /// * `Ok(String)` - JWT refresh token
    /// * `Err(ServiceError)` - If token generation fails
    pub fn generate_refresh_token(
        &self,
        user_id: impl Into<String>,
        email: impl Into<String>,
    ) -> ServiceResult<String> {
        let now = Utc::now();
        let exp = (now + self.refresh_token_expiry).timestamp() as usize;
        let iat = now.timestamp() as usize;

        let claims = JwtClaims::builder()
            .sub(user_id)
            .email(email)
            .exp(exp)
            .iat(iat)
            .token_type("refresh")
            .build();

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    /// Validate and decode a JWT token
    ///
    /// # Arguments
    ///
    /// * `token` - JWT token to validate
    ///
    /// # Returns
    ///
    /// * `Ok(JwtClaims)` - Decoded claims if valid
    /// * `Err(ServiceError)` - If token is invalid or expired
    pub fn validate_token(&self, token: &str) -> ServiceResult<JwtClaims> {
        let token_data = decode::<JwtClaims>(token, &self.decoding_key, &Validation::default())?;
        Ok(token_data.claims)
    }

    /// Validate a refresh token and ensure it has the correct token type
    ///
    /// # Arguments
    ///
    /// * `token` - JWT refresh token to validate
    ///
    /// # Returns
    ///
    /// * `Ok(JwtClaims)` - Decoded claims if valid and token_type is "refresh"
    /// * `Err(ServiceError)` - If token is invalid, expired, or not a refresh token
    pub fn validate_refresh_token(&self, token: &str) -> ServiceResult<JwtClaims> {
        let claims = self.validate_token(token)?;

        if claims.token_type() != "refresh" {
            return Err(crate::error::ServiceError::authentication(
                "Invalid token type: expected refresh token",
            ));
        }

        Ok(claims)
    }

    /// Extract user ID from a validated token
    ///
    /// # Arguments
    ///
    /// * `token` - JWT token
    ///
    /// # Returns
    ///
    /// * `Ok(String)` - User ID
    /// * `Err(ServiceError)` - If token is invalid or expired
    pub fn extract_user_id(&self, token: &str) -> ServiceResult<String> {
        let claims = self.validate_token(token)?;
        Ok(claims.sub().clone())
    }
}

impl JwtService {
    /// Create an Arc-wrapped JWT service for dependency injection
    pub fn arc(
        secret: impl AsRef<[u8]>,
        access_token_expiry_hours: Option<i64>,
        refresh_token_expiry_days: Option<i64>,
    ) -> Arc<Self> {
        Arc::new(Self::new(
            secret,
            access_token_expiry_hours,
            refresh_token_expiry_days,
        ))
    }
}

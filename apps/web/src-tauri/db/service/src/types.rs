//! Common types and DTOs for services

use crate::entities::{offer, request, user};
use chrono::{DateTime, Utc};
use derive_getters::Getters;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use typed_builder::TypedBuilder;
use utilities::Id;

// ============================================================================
// User DTOs
// ============================================================================

/// DTO for creating a new user
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct CreateUserDto {
    #[builder(setter(into))]
    id: Id,
    #[builder(setter(into))]
    name: String,
    #[builder(setter(into))]
    email: String,
    #[builder(default = false, setter(into))]
    email_verified: bool,
    #[builder(default, setter(into))]
    image: Option<String>,
}

/// Response DTO for user operations
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct UserResponseDto {
    #[builder(setter(into))]
    id: Id,
    #[builder(setter(into))]
    name: String,
    #[builder(setter(into))]
    email: String,
    #[builder(setter(into))]
    email_verified: bool,
    #[builder(setter(into))]
    image: Option<String>,
    #[builder(setter(into))]
    created_at: DateTime<Utc>,
    #[builder(setter(into))]
    updated_at: DateTime<Utc>,
}

impl From<user::Model> for UserResponseDto {
    /// Convert model to response DTO
    fn from(user: user::Model) -> Self {
        UserResponseDto::builder()
            .id(user.id())
            .name(user.name())
            .email(user.email())
            .email_verified(*user.email_verified())
            .image(user.image().clone())
            .created_at(*user.created_at())
            .updated_at(*user.updated_at())
            .build()
    }
}

// ============================================================================
// Auth DTOs
// ============================================================================

/// DTO for user login
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct LoginDto {
    #[builder(setter(into))]
    email: String,
    #[builder(setter(into))]
    password: String,
}

/// DTO for user registration
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct RegisterDto {
    #[builder(setter(into))]
    name: String,
    #[builder(setter(into))]
    email: String,
    #[builder(setter(into))]
    password: String,
}

/// Response DTO for authentication operations
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct AuthResponseDto {
    #[builder(setter(into))]
    user: UserResponseDto,
    #[builder(setter(into))]
    access_token: String,
    #[builder(setter(into))]
    refresh_token: String,
}

// ============================================================================
// Session DTOs
// ============================================================================

/// DTO for creating a new session
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct CreateSessionDto {
    #[builder(setter(into))]
    id: Id,
    #[builder(setter(into))]
    user_id: String,
    #[builder(setter(into))]
    token: String,
    #[builder(setter(into))]
    expires_at: DateTime<Utc>,
    #[builder(default, setter(into))]
    ip_address: Option<String>,
    #[builder(default, setter(into))]
    user_agent: Option<String>,
}

// ============================================================================
// Offer DTOs
// ============================================================================

/// DTO for creating a new offer
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct CreateOfferDto {
    #[builder(setter(into))]
    medication_name: String,
    #[builder(default, setter(into))]
    dosage: Option<String>,
    #[builder(setter(into))]
    quantity: i32,
    #[builder(default, setter(into))]
    price: Option<Decimal>,
    #[builder(setter(into))]
    group_name: String,
    #[builder(setter(into))]
    sender_phone: String,
    #[builder(default, setter(into))]
    raw_text: Option<String>,
    #[builder(default, setter(into))]
    whatsapp_message_id: Option<Id>,
    #[builder(default, setter(into))]
    whatsapp_group_id: Option<Id>,
}

/// Response DTO for offer operations
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct OfferResponseDto {
    #[builder(setter(into))]
    id: Id,
    #[builder(setter(into))]
    medication_name: String,
    #[builder(setter(into))]
    dosage: Option<String>,
    #[builder(setter(into))]
    quantity: i32,
    #[builder(setter(into))]
    price: Option<Decimal>,
    #[builder(setter(into))]
    group_name: String,
    #[builder(setter(into))]
    sender_phone: String,
    #[builder(setter(into))]
    status: String,
    #[builder(setter(into))]
    raw_text: Option<String>,
    #[builder(setter(into))]
    whatsapp_message_id: Option<Id>,
    #[builder(setter(into))]
    whatsapp_group_id: Option<Id>,
    #[builder(setter(into))]
    created_at: DateTime<Utc>,
    #[builder(setter(into))]
    updated_at: DateTime<Utc>,
}

impl From<offer::Model> for OfferResponseDto {
    /// Convert model to response DTO
    fn from(offer: offer::Model) -> Self {
        OfferResponseDto::builder()
            .id(offer.id())
            .medication_name(offer.medication_name())
            .dosage(offer.dosage().clone())
            .quantity(*offer.quantity())
            .price(*offer.price())
            .group_name(offer.group_name())
            .sender_phone(offer.sender_phone())
            .status(offer.status().to_string())
            .raw_text(offer.raw_text().clone())
            .whatsapp_message_id(*offer.whatsapp_message_id())
            .whatsapp_group_id(*offer.whatsapp_group_id())
            .created_at(*offer.created_at())
            .updated_at(*offer.updated_at())
            .build()
    }
}

// ============================================================================
// Request DTOs
// ============================================================================

/// DTO for creating a new request
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct CreateRequestDto {
    #[builder(setter(into))]
    medication_name: String,
    #[builder(default, setter(into))]
    dosage: Option<String>,
    #[builder(setter(into))]
    quantity: i32,
    #[builder(default, setter(into))]
    max_price: Option<Decimal>,
    #[builder(setter(into))]
    group_name: String,
    #[builder(setter(into))]
    sender_phone: String,
    #[builder(default, setter(into))]
    raw_text: Option<String>,
    #[builder(default, setter(into))]
    whatsapp_message_id: Option<Id>,
    #[builder(default, setter(into))]
    whatsapp_group_id: Option<Id>,
}

/// Response DTO for request operations
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct RequestResponseDto {
    #[builder(setter(into))]
    id: Id,
    #[builder(setter(into))]
    medication_name: String,
    #[builder(setter(into))]
    dosage: Option<String>,
    #[builder(setter(into))]
    quantity: i32,
    #[builder(setter(into))]
    max_price: Option<Decimal>,
    #[builder(setter(into))]
    group_name: String,
    #[builder(setter(into))]
    sender_phone: String,
    #[builder(setter(into))]
    status: String,
    #[builder(setter(into))]
    raw_text: Option<String>,
    #[builder(setter(into))]
    whatsapp_message_id: Option<Id>,
    #[builder(setter(into))]
    whatsapp_group_id: Option<Id>,
    #[builder(setter(into))]
    created_at: DateTime<Utc>,
    #[builder(setter(into))]
    updated_at: DateTime<Utc>,
}

impl From<request::Model> for RequestResponseDto {
    /// Convert model to response DTO
    fn from(request: request::Model) -> Self {
        Self::builder()
            .id(request.id())
            .medication_name(request.medication_name())
            .dosage(request.dosage().clone())
            .quantity(*request.quantity())
            .max_price(*request.max_price())
            .group_name(request.group_name())
            .sender_phone(request.sender_phone())
            .status(request.status().to_string())
            .raw_text(request.raw_text().clone())
            .whatsapp_message_id(*request.whatsapp_message_id())
            .whatsapp_group_id(*request.whatsapp_group_id())
            .created_at(*request.created_at())
            .updated_at(*request.updated_at())
            .build()
    }
}

// ============================================================================
// Match DTOs
// ============================================================================

/// DTO for creating a new match
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct CreateMatchDto {
    #[builder(setter(into))]
    offer_id: Id,
    #[builder(setter(into))]
    request_id: Id,
    #[builder(setter(into))]
    score: Decimal,
    #[builder(setter(into))]
    confidence_band: String,
    #[builder(setter(into))]
    medication_name: String,
    #[builder(setter(into))]
    offer_quantity: i32,
    #[builder(setter(into))]
    request_quantity: i32,
    #[builder(default, setter(into))]
    offer_price: Option<Decimal>,
    #[builder(default, setter(into))]
    max_price: Option<Decimal>,
}

/// Response DTO for match operations
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct MatchResponseDto {
    #[builder(setter(into))]
    id: Id,
    #[builder(setter(into))]
    offer_id: String,
    #[builder(setter(into))]
    request_id: Id,
    #[builder(setter(into))]
    score: Decimal,
    #[builder(setter(into))]
    confidence_band: String,
    #[builder(setter(into))]
    status: String,
    #[builder(setter(into))]
    operator_note: Option<String>,
    #[builder(setter(into))]
    medication_name: String,
    #[builder(setter(into))]
    offer_quantity: i32,
    #[builder(setter(into))]
    request_quantity: i32,
    #[builder(setter(into))]
    offer_price: Option<Decimal>,
    #[builder(setter(into))]
    max_price: Option<Decimal>,
    #[builder(setter(into))]
    created_at: DateTime<Utc>,
    #[builder(setter(into))]
    updated_at: DateTime<Utc>,
}

// ============================================================================
// Audit DTOs
// ============================================================================

/// DTO for creating an audit log entry
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct CreateAuditLogDto {
    #[builder(setter(into))]
    action: String,
    #[builder(setter(into))]
    entity_type: String,
    #[builder(setter(into))]
    entity_id: Id,
    #[builder(default, setter(into))]
    operator_id: Option<Id>,
    #[builder(default, setter(into))]
    details: Option<serde_json::Value>,
}

// ============================================================================
// JWT Claims
// ============================================================================

/// JWT claims structure
#[derive(Debug, Clone, Serialize, Deserialize, Getters, TypedBuilder)]
pub struct JwtClaims {
    #[builder(setter(into))]
    sub: Id, // Subject (user ID)
    #[builder(setter(into))]
    email: String, // User email
    #[builder(setter(into))]
    exp: usize, // Expiration time
    #[builder(setter(into))]
    iat: usize, // Issued at
    #[builder(setter(into))]
    token_type: String, // Token type ("access" or "refresh")
}

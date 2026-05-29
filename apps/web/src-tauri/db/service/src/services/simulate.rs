//! Simulate service for message simulation pipeline
//!
//! ⚠️ DECISION PENDING: AI extraction strategy
//! - Option A: Reimplement in Rust using reqwest + OpenAI API
//! - Option B: Keep as Node.js sidecar with Tauri sidecar API
//! - Option C: Move to Go service alongside WhatsApp integration
//!
//! Current implementation: Stub with placeholder for AI extraction

use crate::{
    entities::{matching_weights, offer, request},
    error::{ServiceError, ServiceResult},
    services::{OfferService, RequestService},
};
use rust_decimal::Decimal;
use sea_orm::{DatabaseConnection, entity::*, query::*};
use std::sync::Arc;
use tracing::{info, warn};
use utilities::Id;

/// Service for message simulation
pub struct SimulateService {
    db: Arc<DatabaseConnection>,
    offer_service: Arc<OfferService>,
    request_service: Arc<RequestService>,
}

impl SimulateService {
    /// Create a new simulate service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `offer_service` - Offer service
    /// * `request_service` - Request service
    pub fn new(
        db: Arc<DatabaseConnection>,
        offer_service: Arc<OfferService>,
        request_service: Arc<RequestService>,
    ) -> Self {
        Self {
            db,
            offer_service,
            request_service,
        }
    }

    /// Create an Arc-wrapped simulate service for dependency injection
    pub fn arc(
        db: Arc<DatabaseConnection>,
        offer_service: Arc<OfferService>,
        request_service: Arc<RequestService>,
    ) -> Arc<Self> {
        Arc::new(Self::new(db, offer_service, request_service))
    }

    /// Simulate message processing
    ///
    /// # Arguments
    ///
    /// * `raw_text` - Raw message text
    /// * `message_type` - Message type (offer/request/auto)
    /// * `group_name` - Group name
    /// * `sender_phone` - Sender phone number
    /// * `insert_into_system` - Whether to insert into database
    ///
    /// # Returns
    ///
    /// * `Ok(SimulateResponseDto)` - Simulation results
    /// * `Err(ServiceError)` - If simulation fails
    pub async fn simulate_message(
        &self,
        raw_text: String,
        message_type: Option<String>,
        group_name: Option<String>,
        sender_phone: Option<String>,
        insert_into_system: bool,
    ) -> ServiceResult<SimulateResponseDto> {
        let start_time = std::time::Instant::now();

        // Step 1: Input validation
        if raw_text.trim().is_empty() {
            return Err(ServiceError::validation("Raw text cannot be empty"));
        }

        if raw_text.len() > 1000 {
            return Err(ServiceError::validation(format!(
                "Raw text too long ({} chars, max 1000)",
                raw_text.len()
            )));
        }

        // Step 2: AI extraction (PLACEHOLDER - needs implementation)
        warn!("AI extraction not yet implemented - using placeholder");
        let extracted = self.extract_placeholder(&raw_text)?;

        // Step 3: Load weights
        let weights = matching_weights::Entity::find()
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("MatchingWeights", "default"))?;

        // Step 4: Score candidates
        let candidates = self
            .score_candidates(&extracted, &weights, &message_type)
            .await?;

        // Step 5: Insert if requested
        let inserted_id = if insert_into_system {
            Some(
                self.insert_extracted(
                    &extracted,
                    &message_type,
                    &group_name.unwrap_or_else(|| "Simulation".to_string()),
                    &sender_phone.unwrap_or_else(|| "+20000000000".to_string()),
                    &raw_text,
                )
                .await?,
            )
        } else {
            None
        };

        let duration_ms = start_time.elapsed().as_millis() as u64;

        info!(
            duration_ms = duration_ms,
            candidates = candidates.len(),
            inserted = inserted_id.is_some(),
            "Message simulation completed"
        );

        Ok(SimulateResponseDto {
            parsed_type: extracted.message_type,
            parsed_fields: extracted.fields,
            ai_reasoning: extracted.reasoning,
            candidates,
            inserted_id,
            duration_ms,
        })
    }

    /// Placeholder AI extraction (TODO: implement actual AI service call)
    fn extract_placeholder(&self, raw_text: &str) -> ServiceResult<ExtractedData> {
        // Simple regex-based extraction as fallback
        let medication_name = raw_text
            .split_whitespace()
            .find(|w| w.len() > 3 && w.chars().next().unwrap().is_uppercase())
            .unwrap_or("Unknown")
            .to_string();

        let quantity = raw_text
            .split_whitespace()
            .find_map(|w| w.parse::<i32>().ok())
            .unwrap_or(100);

        Ok(ExtractedData {
            message_type: "offer".to_string(),
            medication_name,
            dosage: None,
            quantity,
            price: None,
            reasoning: "Placeholder extraction - AI service not yet integrated".to_string(),
            fields: vec![
                ParsedField {
                    field: "medicationName".to_string(),
                    value: "Unknown".to_string(),
                    confidence: 0.5,
                },
                ParsedField {
                    field: "quantity".to_string(),
                    value: quantity.to_string(),
                    confidence: 0.5,
                },
            ],
        })
    }

    /// Score candidates against extracted data
    async fn score_candidates(
        &self,
        extracted: &ExtractedData,
        weights: &matching_weights::Model,
        message_type: &Option<String>,
    ) -> ServiceResult<Vec<CandidateDto>> {
        let mut candidates = Vec::new();

        // Determine if this is an offer or request
        let is_offer = message_type
            .as_ref()
            .map(|t| t == "offer")
            .unwrap_or(extracted.message_type == "offer");

        if is_offer {
            // Score against requests
            let requests = request::Entity::find()
                .filter(request::Column::Status.eq(request::RequestStatus::Active))
                .limit(50)
                .all(self.db.as_ref())
                .await?;

            for req in requests {
                let score = self.calculate_score(
                    &extracted.medication_name,
                    extracted.quantity,
                    extracted.dosage.as_deref(),
                    extracted.price,
                    req.medication_name(),
                    *req.quantity(),
                    req.dosage().as_deref(),
                    req.max_price()
                        .as_ref()
                        .map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)),
                    req.created_at(),
                    weights,
                );

                if score > 0.5 {
                    // Threshold
                    candidates.push(CandidateDto {
                        id: req.id().to_string(),
                        medication_name: req.medication_name().clone(),
                        dosage: req.dosage().clone(),
                        quantity: *req.quantity(),
                        price: req.max_price().as_ref().map(|d| d.to_string()),
                        group_name: req.group_name().clone(),
                        score,
                    });
                }
            }
        } else {
            // Score against offers
            let offers = offer::Entity::find()
                .filter(offer::Column::Status.eq(offer::OfferStatus::Active))
                .limit(50)
                .all(self.db.as_ref())
                .await?;

            for off in offers {
                let score = self.calculate_score(
                    &extracted.medication_name,
                    extracted.quantity,
                    extracted.dosage.as_deref(),
                    extracted.price,
                    off.medication_name(),
                    *off.quantity(),
                    off.dosage().as_deref(),
                    off.price()
                        .as_ref()
                        .map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)),
                    off.created_at(),
                    weights,
                );

                if score > 0.5 {
                    candidates.push(CandidateDto {
                        id: off.id().to_string(),
                        medication_name: off.medication_name().clone(),
                        dosage: off.dosage().clone(),
                        quantity: *off.quantity(),
                        price: off.price().as_ref().map(|d| d.to_string()),
                        group_name: off.group_name().clone(),
                        score,
                    });
                }
            }
        }

        // Sort by score descending
        candidates.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        candidates.truncate(5); // Top 5 candidates

        Ok(candidates)
    }

    /// Calculate match score (simplified version)
    fn calculate_score(
        &self,
        med1: &str,
        qty1: i32,
        dose1: Option<&str>,
        price1: Option<f64>,
        med2: &str,
        qty2: i32,
        dose2: Option<&str>,
        price2: Option<f64>,
        created_at: &chrono::DateTime<chrono::Utc>,
        weights: &matching_weights::Model,
    ) -> f64 {
        // Medication similarity (simple string comparison)
        let med_score = if med1.to_lowercase() == med2.to_lowercase() {
            1.0
        } else {
            0.0
        };

        // Quantity score
        let qty_score = 1.0 - ((qty1 - qty2).abs() as f64 / std::cmp::max(qty1, qty2) as f64);

        // Dosage score
        let dose_score = match (dose1, dose2) {
            (Some(d1), Some(d2)) if d1 == d2 => 1.0,
            (None, None) => 0.5,
            _ => 0.0,
        };

        // Price score
        let price_score = match (price1, price2) {
            (Some(p1), Some(p2)) => {
                let max_price = p1.max(p2);
                1.0 - ((p1 - p2).abs() / max_price)
            }
            _ => 0.5,
        };

        // Recency score (days old)
        let days_old = (chrono::Utc::now() - *created_at).num_days() as f64;
        let recency_score = (1.0 / (1.0 + days_old / 30.0)).max(0.0);

        // Weighted sum
        let w_med = weights
            .medication()
            .to_string()
            .parse::<f64>()
            .unwrap_or(0.4);
        let w_qty = weights.quantity().to_string().parse::<f64>().unwrap_or(0.2);
        let w_dose = weights.dosage().to_string().parse::<f64>().unwrap_or(0.15);
        let w_price = weights.price().to_string().parse::<f64>().unwrap_or(0.15);
        let w_recency = weights.recency().to_string().parse::<f64>().unwrap_or(0.1);

        med_score * w_med
            + qty_score * w_qty
            + dose_score * w_dose
            + price_score * w_price
            + recency_score * w_recency
    }

    /// Insert extracted data into database
    async fn insert_extracted(
        &self,
        extracted: &ExtractedData,
        message_type: &Option<String>,
        group_name: &str,
        sender_phone: &str,
        raw_text: &str,
    ) -> ServiceResult<Id> {
        let is_offer = message_type
            .as_ref()
            .map(|t| t == "offer")
            .unwrap_or(extracted.message_type == "offer");

        if is_offer {
            let offer = self
                .offer_service
                .create(
                    crate::types::CreateOfferDto::builder()
                        .medication_name(extracted.medication_name.clone())
                        .dosage(extracted.dosage.clone())
                        .quantity(extracted.quantity)
                        .price(extracted.price.map(Decimal::from_f64_retain).flatten())
                        .group_name(group_name.to_string())
                        .sender_phone(sender_phone.to_string())
                        .raw_text(Some(raw_text.to_string()))
                        .whatsapp_message_queue_id(None)
                        .whatsapp_group_id(None)
                        .build(),
                )
                .await?;
            Ok(*offer.id())
        } else {
            let request = self
                .request_service
                .create(
                    crate::types::CreateRequestDto::builder()
                        .medication_name(extracted.medication_name.clone())
                        .dosage(extracted.dosage.clone())
                        .quantity(extracted.quantity)
                        .max_price(extracted.price.map(Decimal::from_f64_retain).flatten())
                        .group_name(group_name.to_string())
                        .sender_phone(sender_phone.to_string())
                        .raw_text(Some(raw_text.to_string()))
                        .whatsapp_message_queue_id(None)
                        .whatsapp_group_id(None)
                        .build(),
                )
                .await?;
            Ok(*request.id())
        }
    }
}

/// Extracted data from AI
#[derive(Debug, Clone)]
struct ExtractedData {
    message_type: String,
    medication_name: String,
    dosage: Option<String>,
    quantity: i32,
    price: Option<f64>,
    reasoning: String,
    fields: Vec<ParsedField>,
}

/// Parsed field
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ParsedField {
    pub field: String,
    pub value: String,
    pub confidence: f64,
}

/// Candidate DTO
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CandidateDto {
    pub id: String,
    pub medication_name: String,
    pub dosage: Option<String>,
    pub quantity: i32,
    pub price: Option<String>,
    pub group_name: String,
    pub score: f64,
}

/// Simulation response DTO
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SimulateResponseDto {
    pub parsed_type: String,
    pub parsed_fields: Vec<ParsedField>,
    pub ai_reasoning: String,
    pub candidates: Vec<CandidateDto>,
    pub inserted_id: Option<Id>,
    pub duration_ms: u64,
}

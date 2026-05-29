//! Simulate service for message simulation pipeline
//!
//! Integrates AI client for pharmaceutical message extraction and matching

use crate::{
    entities::{matching_weights, offer, request},
    error::{ServiceError, ServiceResult},
    services::{OfferService, RequestService},
};
use ai_client::AiClient;
use chrono::Datelike;
use rust_decimal::Decimal;
use schemars::JsonSchema;
use sea_orm::{DatabaseConnection, entity::*, query::*};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tera::{Context, Tera};
use tracing::info;
use utilities::Id;

/// Service for message simulation
pub struct SimulateService {
    db: Arc<DatabaseConnection>,
    offer_service: Arc<OfferService>,
    request_service: Arc<RequestService>,
    ai_client: Arc<AiClient>,
}

impl SimulateService {
    /// Create a new simulate service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `offer_service` - Offer service
    /// * `request_service` - Request service
    /// * `ai_client` - AI client for message extraction
    pub fn new(
        db: Arc<DatabaseConnection>,
        offer_service: Arc<OfferService>,
        request_service: Arc<RequestService>,
        ai_client: Arc<AiClient>,
    ) -> Self {
        Self {
            db,
            offer_service,
            request_service,
            ai_client,
        }
    }

    /// Create an Arc-wrapped simulate service for dependency injection
    pub fn arc(
        db: Arc<DatabaseConnection>,
        offer_service: Arc<OfferService>,
        request_service: Arc<RequestService>,
        ai_client: Arc<AiClient>,
    ) -> Arc<Self> {
        Arc::new(Self::new(db, offer_service, request_service, ai_client))
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
        let mut pipeline_steps = Vec::new();

        // Step 1: Input validation
        let step_start = std::time::Instant::now();
        if raw_text.trim().is_empty() {
            return Err(ServiceError::validation("Raw text cannot be empty"));
        }

        if raw_text.len() > 1000 {
            return Err(ServiceError::validation(format!(
                "Raw text too long ({} chars, max 1000)",
                raw_text.len()
            )));
        }
        pipeline_steps.push(PipelineStepDto {
            step: "Input Validation".to_string(),
            status: "success".to_string(),
            detail: format!("Validated {} characters", raw_text.len()),
            duration_ms: step_start.elapsed().as_millis() as u64,
        });

        // Step 2: AI extraction
        let step_start = std::time::Instant::now();
        info!("Starting AI extraction for message");
        let extracted = self
            .extract_with_ai(
                &raw_text,
                group_name.as_deref(),
                sender_phone.as_deref(),
                message_type.as_deref(),
            )
            .await?;
        pipeline_steps.push(PipelineStepDto {
            step: "AI Extraction".to_string(),
            status: "success".to_string(),
            detail: format!(
                "Extracted {} as {}",
                extracted.medication_name, extracted.message_type
            ),
            duration_ms: step_start.elapsed().as_millis() as u64,
        });

        // Step 3: Load weights
        let step_start = std::time::Instant::now();
        let weights = matching_weights::Entity::find()
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::not_found("MatchingWeights", "default"))?;
        pipeline_steps.push(PipelineStepDto {
            step: "Load Weights".to_string(),
            status: "success".to_string(),
            detail: "Loaded matching algorithm weights".to_string(),
            duration_ms: step_start.elapsed().as_millis() as u64,
        });

        // Step 4: Score candidates
        let step_start = std::time::Instant::now();
        let candidates = self.score_candidates(&extracted, &weights).await?;
        pipeline_steps.push(PipelineStepDto {
            step: "Score Candidates".to_string(),
            status: "success".to_string(),
            detail: format!(
                "Found {} matching {}",
                candidates.len(),
                if extracted.message_type == "offer" {
                    "requests"
                } else {
                    "offers"
                }
            ),
            duration_ms: step_start.elapsed().as_millis() as u64,
        });

        // Step 5: Insert if requested
        let inserted_id = if insert_into_system {
            let step_start = std::time::Instant::now();
            let id = self
                .insert_extracted(
                    &extracted,
                    &group_name.unwrap_or_else(|| "Simulation".to_string()),
                    &sender_phone.unwrap_or_else(|| "+20000000000".to_string()),
                    &raw_text,
                )
                .await?;
            pipeline_steps.push(PipelineStepDto {
                step: "Database Insert".to_string(),
                status: "success".to_string(),
                detail: format!("Created {} #{}", extracted.message_type, id),
                duration_ms: step_start.elapsed().as_millis() as u64,
            });
            Some(id)
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
            urgency: extracted.urgency,
            ai_reasoning: extracted.reasoning,
            candidates,
            inserted_id,
            duration_ms,
            pipeline_steps,
        })
    }

    /// Extract medication data using AI
    async fn extract_with_ai(
        &self,
        raw_text: &str,
        group_name: Option<&str>,
        sender_phone: Option<&str>,
        message_type_hint: Option<&str>,
    ) -> ServiceResult<ExtractedData> {
        // Build prompts using Tera templates
        let system_prompt = Self::build_system_prompt()
            .map_err(|e| ServiceError::internal(format!("Failed to build system prompt: {}", e)))?;

        let user_prompt = Self::build_user_prompt(
            raw_text,
            sender_phone,
            group_name.unwrap_or("Simulation"),
            None,
            None,
        )
        .map_err(|e| ServiceError::internal(format!("Failed to build user prompt: {}", e)))?;

        // Clone the AI client and add system prompt
        let client_with_prompt = self
            .ai_client
            .as_ref()
            .clone()
            .with_system_prompt(system_prompt);

        // Call AI with structured output using the simple method
        let pharma_response = client_with_prompt
            .generate_structured_simple::<PharmaMessage>(
                &user_prompt,
                "pharma_message",
                Some("Pharmaceutical message parsing".to_string()),
            )
            .await
            .map_err(|e| ServiceError::internal(format!("AI extraction failed: {}", e)))?
            .ok_or_else(|| ServiceError::internal("AI returned no response"))?;

        // Convert PharmaMessage to ExtractedData
        Self::convert_pharma_to_extracted(pharma_response, message_type_hint)
    }

    /// Build system prompt using Tera template
    fn build_system_prompt() -> Result<String, tera::Error> {
        let mut tera = Tera::default();
        let system_template = include_str!("../prompts/pharma_system.txt");
        tera.add_raw_template("system", system_template)?;

        let now = chrono::Utc::now();
        let current_year = now.year();
        let current_year_short = current_year % 100;
        let max_year = current_year + 10;
        let max_year_short = max_year % 100;

        let mut context = Context::new();
        context.insert("current_year", &current_year);
        context.insert("current_year_short", &current_year_short);
        context.insert("max_year", &max_year);
        context.insert("max_year_short", &max_year_short);

        tera.render("system", &context)
    }

    /// Build user prompt using Tera template
    fn build_user_prompt(
        content: &str,
        sender_name: Option<&str>,
        group_name: &str,
        reply_to: Option<&str>,
        medication_mappings: Option<&[String]>,
    ) -> Result<String, tera::Error> {
        let mut tera = Tera::default();
        let user_template = include_str!("../prompts/pharma_user.txt");
        tera.add_raw_template("user", user_template)?;

        let now = chrono::Utc::now();
        let current_year = now.year();
        let current_year_short = current_year % 100;
        let max_year = current_year + 10;
        let max_year_short = max_year % 100;

        let mut context = Context::new();
        context.insert("current_year", &current_year);
        context.insert("current_year_short", &current_year_short);
        context.insert("max_year", &max_year);
        context.insert("max_year_short", &max_year_short);
        context.insert("content", content);
        context.insert("group_name", group_name);

        if let Some(sender) = sender_name {
            context.insert("sender_name", sender);
        }

        if let Some(reply) = reply_to {
            context.insert("reply_to", reply);
        }

        if let Some(mappings) = medication_mappings {
            context.insert("medication_mappings", mappings);
        }

        tera.render("user", &context)
    }

    /// Convert PharmaMessage to ExtractedData
    fn convert_pharma_to_extracted(
        pharma: PharmaMessage,
        message_type_hint: Option<&str>,
    ) -> ServiceResult<ExtractedData> {
        // Use the first medication as the primary one (or create a default)
        let first_med = pharma
            .medications
            .first()
            .ok_or_else(|| ServiceError::validation("AI extracted no medications from message"))?;

        // Determine message type - treat "auto" as absent to fall back to AI intent
        let message_type = message_type_hint
            .filter(|&s| s != "auto")
            .map(|s| s.to_string())
            .unwrap_or(pharma.intent.clone());

        // Use dedicated quantity field, fallback to 0 if not provided
        let quantity = first_med.quantity.unwrap_or(0);

        // Convert parsed fields with medication index to avoid ambiguity
        let fields = pharma
            .medications
            .iter()
            .enumerate()
            .flat_map(|(idx, med)| {
                let prefix = if pharma.medications.len() > 1 {
                    format!("medication[{}].", idx)
                } else {
                    String::new()
                };

                vec![
                    ParsedField {
                        field: format!("{}medicationName", prefix),
                        value: med.name.clone(),
                        confidence: med.confidence,
                    },
                    ParsedField {
                        field: format!("{}concentration", prefix),
                        value: med.concentration.clone().unwrap_or_default(),
                        confidence: med.confidence,
                    },
                    ParsedField {
                        field: format!("{}form", prefix),
                        value: med.form.clone().unwrap_or_default(),
                        confidence: med.confidence,
                    },
                    ParsedField {
                        field: format!("{}quantity", prefix),
                        value: med.quantity.map(|q| q.to_string()).unwrap_or_default(),
                        confidence: med.confidence,
                    },
                    ParsedField {
                        field: format!("{}expiry", prefix),
                        value: med.expiry.clone().unwrap_or_default(),
                        confidence: med.confidence,
                    },
                ]
            })
            .collect();

        Ok(ExtractedData {
            message_type,
            medication_name: first_med.name.clone(),
            dosage: first_med.concentration.clone(),
            quantity,
            price: None,
            urgency: pharma.urgency,
            reasoning: pharma.reason,
            fields,
        })
    }

    /// Score candidates against extracted data
    async fn score_candidates(
        &self,
        extracted: &ExtractedData,
        weights: &matching_weights::Model,
    ) -> ServiceResult<Vec<CandidateDto>> {
        let mut candidates = Vec::new();

        // Use the normalized message type from extracted data
        let is_offer = extracted.message_type == "offer";

        // Create match params for the extracted data
        let now = chrono::Utc::now();
        let extracted_params = MatchParams::from_extracted(extracted, &now);

        if is_offer {
            // Score against requests
            let requests = request::Entity::find()
                .filter(request::Column::Status.eq(request::RequestStatus::Active))
                .limit(50)
                .all(self.db.as_ref())
                .await?;

            for req in requests {
                let req_params = MatchParams::from_request(&req);
                let score = self.calculate_score(&extracted_params, &req_params, weights);

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
                let off_params = MatchParams::from_offer(&off);
                let score = self.calculate_score(&extracted_params, &off_params, weights);

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
        params1: &MatchParams,
        params2: &MatchParams,
        weights: &matching_weights::Model,
    ) -> f64 {
        // Medication similarity (simple string comparison)
        let med_score =
            if params1.medication_name.to_lowercase() == params2.medication_name.to_lowercase() {
                1.0
            } else {
                0.0
            };

        // Quantity score
        let qty_score = {
            let max_qty = std::cmp::max(params1.quantity, params2.quantity);
            if max_qty == 0 {
                1.0 // Both zero means perfect match
            } else {
                1.0 - ((params1.quantity - params2.quantity).abs() as f64 / max_qty as f64)
            }
        };

        // Dosage score
        let dose_score = match (params1.dosage, params2.dosage) {
            (Some(d1), Some(d2)) if d1 == d2 => 1.0,
            (None, None) => 0.5,
            _ => 0.0,
        };

        // Price score
        let price_score = match (params1.price, params2.price) {
            (Some(p1), Some(p2)) => {
                let max_price = p1.max(p2);
                if max_price == 0.0 {
                    1.0 // Both zero means perfect match
                } else {
                    1.0 - ((p1 - p2).abs() / max_price)
                }
            }
            _ => 0.5,
        };

        // Recency score (days old)
        let days_old = (chrono::Utc::now() - *params2.created_at).num_days() as f64;
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
        group_name: &str,
        sender_phone: &str,
        raw_text: &str,
    ) -> ServiceResult<Id> {
        // Use the normalized message type from extracted data
        let is_offer = extracted.message_type == "offer";

        if is_offer {
            let offer = self
                .offer_service
                .create(
                    crate::types::CreateOfferDto::builder()
                        .medication_name(extracted.medication_name.clone())
                        .dosage(extracted.dosage.clone())
                        .quantity(extracted.quantity)
                        .price(extracted.price.and_then(Decimal::from_f64_retain))
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
                        .max_price(extracted.price.and_then(Decimal::from_f64_retain))
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
    urgency: String,
    reasoning: String,
    fields: Vec<ParsedField>,
}

/// Match scoring parameters
#[derive(Debug, Clone)]
struct MatchParams<'a> {
    medication_name: &'a str,
    quantity: i32,
    dosage: Option<&'a str>,
    price: Option<f64>,
    created_at: &'a chrono::DateTime<chrono::Utc>,
}

impl<'a> MatchParams<'a> {
    fn from_offer(offer: &'a offer::Model) -> Self {
        Self {
            medication_name: offer.medication_name(),
            quantity: *offer.quantity(),
            dosage: offer.dosage().as_deref(),
            price: offer
                .price()
                .as_ref()
                .map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)),
            created_at: offer.created_at(),
        }
    }

    fn from_request(request: &'a request::Model) -> Self {
        Self {
            medication_name: request.medication_name(),
            quantity: *request.quantity(),
            dosage: request.dosage().as_deref(),
            price: request
                .max_price()
                .as_ref()
                .map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)),
            created_at: request.created_at(),
        }
    }

    fn from_extracted(
        extracted: &'a ExtractedData,
        created_at: &'a chrono::DateTime<chrono::Utc>,
    ) -> Self {
        Self {
            medication_name: &extracted.medication_name,
            quantity: extracted.quantity,
            dosage: extracted.dosage.as_deref(),
            price: extracted.price,
            created_at,
        }
    }
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
    pub urgency: String,
    pub ai_reasoning: String,
    pub candidates: Vec<CandidateDto>,
    pub inserted_id: Option<Id>,
    pub duration_ms: u64,
    pub pipeline_steps: Vec<PipelineStepDto>,
}

/// Pipeline step DTO
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PipelineStepDto {
    pub step: String,
    pub status: String,
    pub detail: String,
    pub duration_ms: u64,
}

// ============================================================================
// AI Extraction Types (from pharma_parsing example)
// ============================================================================

/// Medication extracted from message
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Medication {
    pub name: String,
    pub concentration: Option<String>,
    pub form: Option<String>,
    pub quantity: Option<i32>,
    pub expiry: Option<String>,
    pub confidence: f64,
    pub reason: String,
}

/// Parsed pharmaceutical message
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct PharmaMessage {
    pub intent: String,
    pub urgency: String,
    pub reason: String,
    pub medications: Vec<Medication>,
}

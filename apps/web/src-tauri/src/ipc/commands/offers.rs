use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use utilities::{GetParams, ListParams};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::types::OfferResponseDto;

// ============================================================================
// Filter Forms
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct OfferFilter {
    search: Option<String>,
}

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct OfferListResponse {
    offers: Vec<OfferResponseDto>,
    total: usize,
}

// ============================================================================
// Commands
// ============================================================================

/// List offers with optional filtering and pagination
#[tauri::command]
pub async fn list_offers(
    app: AppHandle,
    params: ListParams<OfferFilter>,
) -> IpcResponse<OfferListResponse> {
    async {
        let state = app.state::<AppState>();
        let offer_service = state.service_manager().offer_service();

        // Extract pagination parameters or use defaults
        let (page, page_size) = if let Some(pagination) = params.pagination() {
            (*pagination.page(), *pagination.page_size())
        } else {
            (0, 20) // Default: first page, 20 items
        };

        // Get offers based on filter
        let offers = if let Some(filter) = params.filter() {
            if let Some(search) = &filter.search {
                // Search by medication name
                offer_service.search_by_medication(search).await?
            } else {
                // No search term, list active offers
                offer_service.list_active(page, page_size).await?
            }
        } else {
            // No filter, list active offers
            offer_service.list_active(page, page_size).await?
        };

        let total = offers.len();

        Ok(OfferListResponse { offers, total })
    }
    .await
    .into()
}

/// Get a single offer by ID
#[tauri::command]
pub async fn get_offer(app: AppHandle, params: GetParams) -> IpcResponse<OfferResponseDto> {
    async {
        let state = app.state::<AppState>();
        let offer_service = state.service_manager().offer_service();

        let offer = offer_service.get_by_id(*params.id()).await?;

        Ok(offer)
    }
    .await
    .into()
}

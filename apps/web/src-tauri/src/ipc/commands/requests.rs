use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use utilities::{GetParams, ListParams};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::types::RequestResponseDto;

// ============================================================================
// Filter Forms
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct RequestFilter {
    search: Option<String>,
}

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct RequestListResponse {
    requests: Vec<RequestResponseDto>,
    total: usize,
}

// ============================================================================
// Commands
// ============================================================================

/// List requests with optional filtering and pagination
#[tauri::command]
pub async fn list_requests(
    app: AppHandle,
    params: ListParams<RequestFilter>,
) -> IpcResponse<RequestListResponse> {
    async {
        let state = app.state::<AppState>();
        let request_service = state.service_manager().request_service();

        // Extract pagination parameters or use defaults
        let (page, page_size) = if let Some(pagination) = params.pagination() {
            (*pagination.page(), *pagination.page_size())
        } else {
            (0, 20) // Default: first page, 20 items
        };

        // Get requests based on filter
        let requests = if let Some(filter) = params.filter() {
            if let Some(search) = &filter.search {
                // Search by medication name
                request_service.search_by_medication(search).await?
            } else {
                // No search term, list active requests
                request_service.list_active(page, page_size).await?
            }
        } else {
            // No filter, list active requests
            request_service.list_active(page, page_size).await?
        };

        let total = requests.len();

        Ok(RequestListResponse { requests, total })
    }
    .await
    .into()
}

/// Get a single request by ID
#[tauri::command]
pub async fn get_request(app: AppHandle, params: GetParams) -> IpcResponse<RequestResponseDto> {
    async {
        let state = app.state::<AppState>();
        let request_service = state.service_manager().request_service();

        let request = request_service.get_by_id(*params.id()).await?;

        Ok(request)
    }
    .await
    .into()
}

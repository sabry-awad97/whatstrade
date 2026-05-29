use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use utilities::{GetParams, ListParams};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::types::MatchResponseDto;

// ============================================================================
// Filter Forms
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct MatchFilter {
    status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MatchActionForm {
    note: Option<String>,
}

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct MatchListResponse {
    matches: Vec<MatchResponseDto>,
    total: usize,
}

#[derive(Debug, Serialize)]
pub struct MatchStatsResponse {
    pub total_matches: u64,
    pub pending_matches: u64,
    pub confirmed_matches: u64,
    pub rejected_matches: u64,
    pub auto_confirmed_matches: u64,
    pub avg_match_score: f64,
}

// ============================================================================
// Commands
// ============================================================================

/// Get match statistics
#[tauri::command]
pub async fn get_match_stats(app: AppHandle) -> IpcResponse<MatchStatsResponse> {
    async {
        let state = app.state::<AppState>();
        let stats_service = state.service_manager().stats_service();

        // Get dashboard stats which includes match statistics
        let dashboard_stats = stats_service.get_dashboard_stats().await?;

        // Calculate confirmed matches (total - pending - rejected - auto_confirmed)
        let confirmed_matches = dashboard_stats
            .total_matches
            .saturating_sub(dashboard_stats.pending_matches)
            .saturating_sub(dashboard_stats.auto_confirmed);

        Ok(MatchStatsResponse {
            total_matches: dashboard_stats.total_matches,
            pending_matches: dashboard_stats.pending_matches,
            confirmed_matches,
            rejected_matches: 0, // Not tracked separately in dashboard stats
            auto_confirmed_matches: dashboard_stats.auto_confirmed,
            avg_match_score: dashboard_stats.avg_match_score,
        })
    }
    .await
    .into()
}

/// List matches with optional filtering and pagination
#[tauri::command]
pub async fn list_matches(
    app: AppHandle,
    params: ListParams<MatchFilter>,
) -> IpcResponse<MatchListResponse> {
    async {
        let state = app.state::<AppState>();
        let matching_service = state.service_manager().matching_service();

        // Extract pagination parameters or use defaults
        let (page, page_size) = if let Some(pagination) = params.pagination() {
            (*pagination.page(), *pagination.page_size())
        } else {
            (0, 20) // Default: first page, 20 items
        };

        // Parse status filter if provided
        let status = if let Some(filter) = params.filter() {
            if let Some(status_str) = &filter.status {
                // Parse status string using FromStr trait
                let parsed_status = status_str
                    .parse::<db_service::entities::r#match::MatchStatus>()
                    .map_err(crate::error::AppError::ParseError)?;
                Some(parsed_status)
            } else {
                None
            }
        } else {
            None
        };

        // Use the matching service to list matches
        let matches = matching_service.list(status, page, page_size).await?;
        let total = matches.len();

        Ok(MatchListResponse { matches, total })
    }
    .await
    .into()
}

/// Get a single match by ID
#[tauri::command]
pub async fn get_match(app: AppHandle, params: GetParams) -> IpcResponse<MatchResponseDto> {
    async {
        let state = app.state::<AppState>();
        let matching_service = state.service_manager().matching_service();

        let match_result = matching_service.get_by_id(*params.id()).await?;

        Ok(match_result)
    }
    .await
    .into()
}

/// Confirm a match
#[tauri::command]
pub async fn confirm_match(
    app: AppHandle,
    params: utilities::UpdateParams<MatchActionForm>,
) -> IpcResponse<MatchResponseDto> {
    async {
        let state = app.state::<AppState>();
        let matching_service = state.service_manager().matching_service();

        use db_service::entities::r#match::MatchStatus;

        let form = params.data();
        let match_result = matching_service
            .update_status(*params.id(), MatchStatus::Confirmed, form.note.clone())
            .await?;

        Ok(match_result)
    }
    .await
    .into()
}

/// Reject a match
#[tauri::command]
pub async fn reject_match(
    app: AppHandle,
    params: utilities::UpdateParams<MatchActionForm>,
) -> IpcResponse<MatchResponseDto> {
    async {
        let state = app.state::<AppState>();
        let matching_service = state.service_manager().matching_service();

        use db_service::entities::r#match::MatchStatus;

        let form = params.data();
        let match_result = matching_service
            .update_status(*params.id(), MatchStatus::Rejected, form.note.clone())
            .await?;

        Ok(match_result)
    }
    .await
    .into()
}

use tauri::{AppHandle, Manager};
use utilities::GetParams;

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::{entities::review_item::dto::ReviewItemDto, services::review::ReviewStatsDto};

// ============================================================================
// Commands
// ============================================================================

/// Get pending review queue
#[tauri::command]
pub async fn get_review_queue(app: AppHandle) -> IpcResponse<Vec<ReviewItemDto>> {
    async {
        let state = app.state::<AppState>();
        let review_service = state.service_manager().review_service();

        let queue = review_service.get_queue().await?;

        Ok(queue)
    }
    .await
    .into()
}

/// Get review statistics
#[tauri::command]
pub async fn get_review_stats(app: AppHandle) -> IpcResponse<ReviewStatsDto> {
    async {
        let state = app.state::<AppState>();
        let review_service = state.service_manager().review_service();

        let stats = review_service.get_stats().await?;

        Ok(stats)
    }
    .await
    .into()
}

/// Approve a review item
#[tauri::command]
pub async fn approve_review_item(app: AppHandle, params: GetParams) -> IpcResponse<ReviewItemDto> {
    async {
        let state = app.state::<AppState>();
        let review_service = state.service_manager().review_service();

        let item = review_service.approve_item(*params.id()).await?;

        Ok(item)
    }
    .await
    .into()
}

/// Reject a review item
#[tauri::command]
pub async fn reject_review_item(app: AppHandle, params: GetParams) -> IpcResponse<ReviewItemDto> {
    async {
        let state = app.state::<AppState>();
        let review_service = state.service_manager().review_service();

        let item = review_service.reject_item(*params.id()).await?;

        Ok(item)
    }
    .await
    .into()
}

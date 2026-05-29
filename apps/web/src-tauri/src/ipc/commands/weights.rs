use tauri::{AppHandle, Manager};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::entities::matching_weights::dto::{MatchingWeightsDto, UpdateWeightsDto};

// ============================================================================
// Commands
// ============================================================================

/// Get current matching weights
#[tauri::command]
pub async fn get_weights(app: AppHandle) -> IpcResponse<MatchingWeightsDto> {
    async {
        let state = app.state::<AppState>();
        let weights_service = state.service_manager().weights_service();

        let weights = weights_service.get_weights().await?;

        Ok(weights)
    }
    .await
    .into()
}

/// Update matching weights
///
/// Validates that weights sum to 1.0 before updating
#[tauri::command]
pub async fn update_weights(
    app: AppHandle,
    params: utilities::CreateParams<UpdateWeightsDto>,
) -> IpcResponse<MatchingWeightsDto> {
    async {
        let state = app.state::<AppState>();
        let weights_service = state.service_manager().weights_service();

        let update_dto = params.data().clone();

        let weights = weights_service.update_weights(update_dto).await?;

        Ok(weights)
    }
    .await
    .into()
}

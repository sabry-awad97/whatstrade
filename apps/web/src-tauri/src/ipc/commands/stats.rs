use tauri::{AppHandle, Manager};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::services::stats::DashboardStatsDto;

// ============================================================================
// Commands
// ============================================================================

/// Get dashboard statistics
#[tauri::command]
pub async fn get_dashboard_stats(app: AppHandle) -> IpcResponse<DashboardStatsDto> {
    async {
        let state = app.state::<AppState>();
        let stats_service = state.service_manager().stats_service();

        let stats = stats_service.get_dashboard_stats().await?;

        Ok(stats)
    }
    .await
    .into()
}

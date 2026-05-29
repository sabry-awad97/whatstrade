use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::entities::group::dto::GroupDto;

// ============================================================================
// Request Forms
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GroupMonitoringForm {
    jid: String,
}

// ============================================================================
// Commands
// ============================================================================

/// List all WhatsApp groups
#[tauri::command]
pub async fn list_groups(app: AppHandle) -> IpcResponse<Vec<GroupDto>> {
    async {
        let state = app.state::<AppState>();
        let group_service = state.service_manager().group_service();

        let groups = group_service.list_all().await?;

        Ok(groups)
    }
    .await
    .into()
}

/// List monitored WhatsApp groups only
#[tauri::command]
pub async fn list_monitored_groups(app: AppHandle) -> IpcResponse<Vec<GroupDto>> {
    async {
        let state = app.state::<AppState>();
        let group_service = state.service_manager().group_service();

        let groups = group_service.list_monitored().await?;

        Ok(groups)
    }
    .await
    .into()
}

/// Enable monitoring for a WhatsApp group
#[tauri::command]
pub async fn enable_group_monitoring(
    app: AppHandle,
    params: utilities::CreateParams<GroupMonitoringForm>,
) -> IpcResponse<GroupDto> {
    async {
        let state = app.state::<AppState>();
        let group_service = state.service_manager().group_service();

        let form = params.data();
        let group = group_service.enable_monitoring(&form.jid).await?;

        Ok(group)
    }
    .await
    .into()
}

/// Disable monitoring for a WhatsApp group
#[tauri::command]
pub async fn disable_group_monitoring(
    app: AppHandle,
    params: utilities::CreateParams<GroupMonitoringForm>,
) -> IpcResponse<GroupDto> {
    async {
        let state = app.state::<AppState>();
        let group_service = state.service_manager().group_service();

        let form = params.data();
        let group = group_service.disable_monitoring(&form.jid).await?;

        Ok(group)
    }
    .await
    .into()
}

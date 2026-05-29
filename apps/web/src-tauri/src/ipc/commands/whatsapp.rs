use serde::Deserialize;
use tauri::{AppHandle, Manager};
use utilities::{GetParams, ListParams};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::entities::whatsapp_message_queue::dto::WhatsAppMessageQueueDto;
use db_service::services::whatsapp::{FailedMessagesDto, SyncGroupsResponseDto};

// ============================================================================
// Filter Forms
// ============================================================================

#[derive(Debug, Clone, Deserialize)]
pub struct FailedMessagesFilter {
    group_name: Option<String>,
}

// ============================================================================
// Commands
// ============================================================================

/// Sync WhatsApp groups from Go service
#[tauri::command]
pub async fn sync_groups(app: AppHandle) -> IpcResponse<SyncGroupsResponseDto> {
    async {
        let state = app.state::<AppState>();
        let whatsapp_service = state.service_manager().whatsapp_service();

        let result = whatsapp_service.sync_groups().await?;

        Ok(result)
    }
    .await
    .into()
}

/// Get failed messages with optional filtering and pagination
#[tauri::command]
pub async fn get_failed_messages(
    app: AppHandle,
    params: ListParams<FailedMessagesFilter>,
) -> IpcResponse<FailedMessagesDto> {
    async {
        let state = app.state::<AppState>();
        let whatsapp_service = state.service_manager().whatsapp_service();

        // Extract pagination parameters or use defaults
        let (page, limit) = if let Some(pagination) = params.pagination() {
            (*pagination.page(), *pagination.page_size())
        } else {
            (0, 20) // Default: first page, 20 items
        };

        // Extract group name filter if provided
        let group_name = params.filter().as_ref().and_then(|f| f.group_name.clone());

        let result = whatsapp_service
            .get_failed_messages(page, limit, group_name)
            .await?;

        Ok(result)
    }
    .await
    .into()
}

/// Retry a failed message
#[tauri::command]
pub async fn retry_message(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<WhatsAppMessageQueueDto> {
    async {
        let state = app.state::<AppState>();
        let whatsapp_service = state.service_manager().whatsapp_service();

        let message = whatsapp_service.retry_message(*params.id()).await?;

        Ok(message)
    }
    .await
    .into()
}

use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::services::simulate::SimulateResponseDto;

// ============================================================================
// Request Forms
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct SimulateMessageForm {
    raw_text: String,
    message_type: Option<String>,
    group_name: Option<String>,
    sender_phone: Option<String>,
    insert_into_system: Option<bool>,
}

// ============================================================================
// Commands
// ============================================================================

/// Simulate message processing
///
/// Runs the full AI extraction + matching pipeline without requiring WhatsApp
#[tauri::command]
pub async fn simulate_message(
    app: AppHandle,
    params: utilities::CreateParams<SimulateMessageForm>,
) -> IpcResponse<SimulateResponseDto> {
    async {
        let state = app.state::<AppState>();
        let simulate_service = state.service_manager().simulate_service();

        let form = params.data();

        let result = simulate_service
            .simulate_message(
                form.raw_text.clone(),
                form.message_type.clone(),
                form.group_name.clone(),
                form.sender_phone.clone(),
                form.insert_into_system.unwrap_or(false),
            )
            .await?;

        Ok(result)
    }
    .await
    .into()
}

use serde::Serialize;

use crate::ipc::response::IpcResponse;

/// Response for the health check endpoint
#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
}

/// Health check command
/// Returns the current health status of the application
#[tauri::command]
pub async fn health() -> IpcResponse<HealthResponse> {
    async {
        Ok(HealthResponse {
            status: "ok".to_string(),
        })
    }
    .await
    .into()
}

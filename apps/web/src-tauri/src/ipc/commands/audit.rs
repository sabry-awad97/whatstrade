use serde::Serialize;
use tauri::{AppHandle, Manager};
use utilities::ListParams;

use crate::ipc::response::IpcResponse;
use crate::state::AppState;

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct AuditLogResponse {
    id: String,
    action: String,
    entity_type: String,
    entity_id: String,
    operator_id: Option<String>,
    details: Option<serde_json::Value>,
    created_at: String,
}

#[derive(Debug, Serialize)]
pub struct AuditLogListResponse {
    logs: Vec<AuditLogResponse>,
    total: usize,
}

// ============================================================================
// Commands
// ============================================================================

/// List audit logs with pagination
#[tauri::command]
pub async fn list_audit_log(
    app: AppHandle,
    params: ListParams<()>,
) -> IpcResponse<AuditLogListResponse> {
    async {
        let state = app.state::<AppState>();
        let audit_service = state.service_manager().audit_service();

        // Extract pagination parameters or use defaults
        let (page, page_size) = if let Some(pagination) = params.pagination() {
            (*pagination.page(), *pagination.page_size())
        } else {
            (0, 20) // Default: first page, 20 items
        };

        // Query audit logs with pagination
        let logs = audit_service.list(page, page_size).await?;

        // Convert to response DTOs
        let log_dtos: Vec<AuditLogResponse> = logs
            .into_iter()
            .map(|log| AuditLogResponse {
                id: log.id().to_string(),
                action: log.action().clone(),
                entity_type: log.entity_type().clone(),
                entity_id: log.entity_id().to_string(),
                operator_id: log.operator_id().map(|id| id.to_string()),
                details: log.details().clone(),
                created_at: log.created_at().to_rfc3339(),
            })
            .collect();

        let total = log_dtos.len();

        Ok(AuditLogListResponse {
            logs: log_dtos,
            total,
        })
    }
    .await
    .into()
}

use serde::Deserialize;
use tauri::{AppHandle, Manager};
use utilities::CreateParams;

use crate::ipc::response::IpcResponse;
use crate::state::AppState;
use db_service::types::{AuthResponseDto, LoginDto, RegisterDto, UserResponseDto};

// ============================================================================
// Request Forms
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct RegisterForm {
    name: String,
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginForm {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenForm {
    refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct ValidateTokenForm {
    access_token: String,
}

// ============================================================================
// Commands
// ============================================================================

/// Register a new user
#[tauri::command]
pub async fn auth_register(
    app: AppHandle,
    params: CreateParams<RegisterForm>,
) -> IpcResponse<AuthResponseDto> {
    async {
        let state = app.state::<AppState>();
        let form = params.data();

        let dto = RegisterDto::builder()
            .name(form.name.clone())
            .email(form.email.clone())
            .password(form.password.clone())
            .build();

        let auth_service = state.service_manager().auth_service();
        let result = auth_service.register(dto).await?;

        Ok(result)
    }
    .await
    .into()
}

/// Login a user
#[tauri::command]
pub async fn auth_login(
    app: AppHandle,
    params: CreateParams<LoginForm>,
) -> IpcResponse<AuthResponseDto> {
    async {
        let state = app.state::<AppState>();
        let form = params.data();

        let dto = LoginDto::builder()
            .email(form.email.clone())
            .password(form.password.clone())
            .build();

        let auth_service = state.service_manager().auth_service();
        let result = auth_service.login(dto).await?;

        Ok(result)
    }
    .await
    .into()
}

/// Refresh access token using refresh token
#[tauri::command]
pub async fn auth_refresh(
    app: AppHandle,
    params: CreateParams<RefreshTokenForm>,
) -> IpcResponse<AuthResponseDto> {
    async {
        let state = app.state::<AppState>();
        let form = params.data();

        let auth_service = state.service_manager().auth_service();
        let result = auth_service.refresh_token(&form.refresh_token).await?;

        Ok(result)
    }
    .await
    .into()
}

/// Validate an access token and return user
#[tauri::command]
pub async fn auth_validate(
    app: AppHandle,
    params: CreateParams<ValidateTokenForm>,
) -> IpcResponse<UserResponseDto> {
    async {
        let state = app.state::<AppState>();
        let form = params.data();

        let auth_service = state.service_manager().auth_service();
        let result = auth_service.validate_token(&form.access_token).await?;

        Ok(result)
    }
    .await
    .into()
}

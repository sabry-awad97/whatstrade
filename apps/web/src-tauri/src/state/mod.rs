use derive_getters::Getters;
use typed_builder::TypedBuilder;

use crate::error::AppResult;

/// Application state container
#[derive(TypedBuilder, Getters)]
pub struct AppState {
    #[builder(setter(into))]
    service_manager: db_service::ServiceManager,
}

/// Initialize application state
///
/// # Arguments
/// * `app_handle` - Tauri application handle for path resolution
///
/// # Returns
/// * `AppResult<AppState>` - Initialized application state or error
#[tracing::instrument(skip(_app_handle))]
pub async fn try_init_state(_app_handle: &tauri::AppHandle) -> AppResult<AppState> {
    // Get database URL from environment or use default for local PostgreSQL
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        tracing::warn!("DATABASE_URL not set, using default PostgreSQL connection");
        "postgresql://postgres:postgres@localhost:5433/whatstrade".to_string()
    });

    // Get JWT secret from environment or use default (should be changed in production)
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| {
        tracing::warn!("JWT_SECRET not set, using default (NOT SECURE FOR PRODUCTION)");
        "change-this-secret-in-production".to_string()
    });

    // Load AI configuration from environment
    let ai_config = match ai_client::load_from_env() {
        Ok(cfg) => {
            tracing::info!("AI client configuration loaded from environment");
            Some(cfg)
        }
        Err(e) => {
            tracing::warn!("AI client configuration unavailable, using defaults: {e}");
            None
        }
    };
    tracing::info!(
        "Initializing service manager with database: {}",
        database_url
    );

    // Build configuration
    let config = db_service::ServiceManagerConfig::builder()
        .database_url(database_url)
        .jwt_secret(jwt_secret)
        .ai_config(ai_config)
        .build();

    // Initialize service manager with database connection
    let service_manager = db_service::ServiceManager::new(config).await.map_err(|e| {
        crate::error::AppError::ParseError(format!("Database connection failed: {}", e))
    })?;

    tracing::info!("Service manager initialized successfully");

    Ok(AppState::builder().service_manager(service_manager).build())
}

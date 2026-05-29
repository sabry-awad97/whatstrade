use tauri::Manager;

mod error;
mod ipc;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let builder = tauri::Builder::default().setup(|app| {
        // Initialize database and services
        let app_handle = app.handle().clone();

        // Spawn state initialization asynchronously
        tauri::async_runtime::spawn(async move {
            match state::try_init_state(&app_handle).await {
                Ok(state) => {
                    tracing::info!("Application state initialized successfully");
                    app_handle.manage(state);
                }
                Err(e) => {
                    tracing::error!("Failed to initialize application state: {:?}", e);
                    std::process::exit(1);
                }
            }
        });

        Ok(())
    });

    let builder = builder.invoke_handler(tauri::generate_handler![
        ipc::commands::health,
        ipc::commands::auth_register,
        ipc::commands::auth_login,
        ipc::commands::auth_refresh,
        ipc::commands::auth_validate,
        ipc::commands::list_offers,
        ipc::commands::get_offer,
        ipc::commands::list_requests,
        ipc::commands::get_request,
        ipc::commands::get_match_stats,
        ipc::commands::list_matches,
        ipc::commands::get_match,
        ipc::commands::confirm_match,
        ipc::commands::reject_match,
        ipc::commands::list_groups,
        ipc::commands::list_monitored_groups,
        ipc::commands::enable_group_monitoring,
        ipc::commands::disable_group_monitoring,
        ipc::commands::get_weights,
        ipc::commands::update_weights,
        ipc::commands::get_review_queue,
        ipc::commands::get_review_stats,
        ipc::commands::approve_review_item,
        ipc::commands::reject_review_item,
        ipc::commands::list_audit_log,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use tauri::Manager;

mod error;
mod ipc;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let builder = tauri::Builder::default().setup(|app| {
        // Initialize database and services synchronously in setup
        let app_handle = app.handle().clone();

        // Use a channel to wait for initialization
        let (tx, rx) = std::sync::mpsc::channel();

        tauri::async_runtime::spawn(async move {
            match state::try_init_state(&app_handle).await {
                Ok(state) => {
                    tracing::info!("Application state initialized successfully");
                    app_handle.manage(state);

                    // Start WhatsApp event listener
                    let app_clone = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) =
                            ipc::commands::start_whatsapp_event_listener(app_clone).await
                        {
                            tracing::error!("Failed to start WhatsApp event listener: {:?}", e);
                        }
                    });

                    let _ = tx.send(Ok(()));
                }
                Err(e) => {
                    tracing::error!("Failed to initialize application state: {:?}", e);
                    let _ = tx.send(Err(e));
                }
            }
        });

        // Wait for initialization to complete
        match rx.recv() {
            Ok(Ok(())) => {
                tracing::info!("State initialization completed, app ready");
                Ok(())
            }
            Ok(Err(e)) => {
                tracing::error!("State initialization failed: {:?}", e);
                std::process::exit(1);
            }
            Err(e) => {
                tracing::error!("State initialization channel error: {:?}", e);
                std::process::exit(1);
            }
        }
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
        ipc::commands::get_dashboard_stats,
        ipc::commands::simulate_message,
        // WhatsApp commands
        ipc::commands::whatsapp_status,
        ipc::commands::whatsapp_connect,
        ipc::commands::whatsapp_disconnect,
        ipc::commands::whatsapp_request_pair_code,
        ipc::commands::whatsapp_send_message,
        ipc::commands::whatsapp_logout,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

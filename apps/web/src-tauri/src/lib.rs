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

    let builder = builder.invoke_handler(tauri::generate_handler![]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod error;
mod ipc;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let builder = tauri::Builder::default().setup(|_app| Ok(()));

    let builder = builder.invoke_handler(tauri::generate_handler![]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

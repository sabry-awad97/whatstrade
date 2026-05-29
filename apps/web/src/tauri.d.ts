/**
 * Tauri Window Type Declarations
 *
 * Extends the Window interface with Tauri-specific properties
 * that are injected by the Tauri runtime.
 */

interface Window {
  /**
   * Flag indicating if the application is running in Tauri environment
   * Set to true by Tauri's initialization script
   * @see https://v2.tauri.app/reference/javascript/api/namespacecore/#istauri
   */
  isTauri?: boolean;
}

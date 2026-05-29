/**
 * Tauri API Utilities
 *
 * Centralized isomorphic wrapper for Tauri APIs.
 * Provides a single source of truth for all Tauri operations.
 * Works seamlessly in both browser and Tauri desktop environments.
 *
 * @module tauri-api
 */

import z from "zod";
import { createLogger } from "@/lib/logger";

const logger = createLogger("TauriAPI");

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Check if running in Tauri environment
 * @returns Boolean indicating if Tauri API is available
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Check if running in browser environment
 * @returns Boolean indicating if running in browser
 */
export function isBrowserEnvironment(): boolean {
  return !isTauriEnvironment();
}

// ============================================================================
// Window API
// ============================================================================

/**
 * Get the current Tauri window instance
 * Returns null if not in Tauri environment
 */
export async function getTauriWindow() {
  if (!isTauriEnvironment()) {
    return null;
  }

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return getCurrentWindow();
  } catch (error) {
    logger.warn("Failed to load Tauri window API:", error);
    return null;
  }
}

/**
 * Minimize the current window
 * In browser: logs to console
 * In Tauri: minimizes the window
 */
export async function minimizeWindow(): Promise<void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      await window.minimize();
    } else {
      logger.info("[Browser] Window minimize action triggered");
    }
  } catch (error) {
    logger.error("Failed to minimize window:", error);
  }
}

/**
 * Maximize or restore the current window
 * In browser: logs to console
 * In Tauri: toggles maximize state
 */
export async function toggleMaximizeWindow(): Promise<void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      await window.toggleMaximize();
    } else {
      logger.info("[Browser] Window maximize/restore action triggered");
    }
  } catch (error) {
    logger.error("Failed to toggle maximize window:", error);
  }
}

/**
 * Close the current window
 * In browser: logs to console
 * In Tauri: closes the window
 */
export async function closeWindow(): Promise<void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      await window.close();
    } else {
      logger.info("[Browser] Window close action triggered");
    }
  } catch (error) {
    logger.error("Failed to close window:", error);
  }
}

/**
 * Check if the window is currently maximized
 * In browser: returns false
 * In Tauri: returns actual maximized state
 */
export async function isWindowMaximized(): Promise<boolean> {
  try {
    const window = await getTauriWindow();
    if (window) {
      return await window.isMaximized();
    }
    return false;
  } catch (error) {
    logger.error("Failed to check window maximized state:", error);
    return false;
  }
}

/**
 * Listen to window resize events
 * In browser: returns a no-op unlisten function
 * In Tauri: sets up actual event listener
 *
 * @param callback Function to call when window is resized
 * @returns Unlisten function to remove the event listener
 */
export async function onWindowResized(
  callback: () => void,
): Promise<() => void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      return await window.onResized(callback);
    }
    // Return no-op unlisten function for browser
    return () => {};
  } catch (error) {
    logger.error("Failed to setup resize listener:", error);
    return () => {};
  }
}

/**
 * Set window title
 * In browser: updates document.title
 * In Tauri: sets window title
 */
export async function setWindowTitle(title: string): Promise<void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      await window.setTitle(title);
    } else {
      document.title = title;
    }
  } catch (error) {
    logger.error("Failed to set window title:", error);
  }
}

/**
 * Set window fullscreen state
 * In browser: logs to console
 * In Tauri: sets fullscreen state
 */
export async function setWindowFullscreen(fullscreen: boolean): Promise<void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      await window.setFullscreen(fullscreen);
    } else {
      logger.info(
        `[Browser] Window fullscreen ${fullscreen ? "enabled" : "disabled"}`,
      );
    }
  } catch (error) {
    logger.error("Failed to set window fullscreen:", error);
  }
}

/**
 * Set window always on top
 * In browser: logs to console
 * In Tauri: sets always on top state
 */
export async function setWindowAlwaysOnTop(
  alwaysOnTop: boolean,
): Promise<void> {
  try {
    const window = await getTauriWindow();
    if (window) {
      await window.setAlwaysOnTop(alwaysOnTop);
    } else {
      logger.info(
        `[Browser] Window always on top ${alwaysOnTop ? "enabled" : "disabled"}`,
      );
    }
  } catch (error) {
    logger.error("Failed to set window always on top:", error);
  }
}

// ============================================================================
// Command API (Invoke)
// ============================================================================

/**
 * Invoke a Tauri command
 * In browser: logs to console and returns null
 * In Tauri: invokes the actual backend command
 *
 * @param command - The command name to invoke
 * @param args - Optional arguments to pass to the command
 * @returns The result from the command or null in browser
 *
 * @example
 * ```typescript
 * // Invoke a simple command
 * const result = await invoke('get_user_data');
 *
 * // Invoke with arguments
 * const data = await invoke('save_settings', { theme: 'dark' });
 * ```
 */
async function invoke<T = unknown>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T | null> {
  try {
    if (isTauriEnvironment()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<T>(command, args);
    } else {
      logger.info(`[Browser] Command invoked: ${command}`, args);
      return null;
    }
  } catch (error) {
    logger.error(`Failed to invoke command "${command}":`, error);
    throw error;
  }
}

/**
 * Generic command invoker with automatic response parsing and error handling
 *
 * @param command - Tauri command name
 * @param schema - Zod schema for response data validation
 * @param args - Command arguments
 * @returns Parsed and validated response data
 * @throws Error if command fails or validation fails
 */
export async function invokeCommand<T>(
  command: string,
  schema: z.ZodType<T>,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    logger.info("[INVOKE] Calling command:", command);
    // Invoke Tauri command
    const response = await invoke<IpcResponse<T>>(command, args);
    logger.info("[INVOKE] Command completed:", command);
    logger.info("[INVOKE] Full response:", JSON.stringify(response, null, 2));

    // Validate response structure
    const parseResult = ipcResponseSchema(schema).safeParse(response);
    if (!parseResult.success) {
      logger.error("[INVOKE] Schema validation failed:", parseResult.error);
    }

    // Handle validation errors
    if (!parseResult.success) {
      throw new Error("Invalid response format from server");
    }

    const validatedResponse = parseResult.data;

    // Handle error response
    if (validatedResponse.error) {
      throw new Error(validatedResponse.error.message);
    }

    // Handle missing result
    if (!validatedResponse.result) {
      throw new Error("No result returned from server");
    }

    return validatedResponse.result.data as T;
  } catch (error) {
    logger.error(`[INVOKE] Command failed: ${command}`, error);
    throw error;
  }
}

/**
 * Schema for IPC response wrapper
 */
export const ipcResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    error: z
      .object({
        message: z.string(),
      })
      .nullable(),
    result: z
      .object({
        data: dataSchema,
      })
      .nullable(),
  });

/**
 * TypeScript type for IPC response
 */
export type IpcResponse<T> = {
  error: { message: string } | null;
  result: { data: T } | null;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

/**
 * Window Hooks
 * React hooks for Tauri window operations
 */
import { useCallback, useEffect, useState } from "react";
import {
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  isWindowMaximized,
  onWindowResized,
} from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WindowHooks");

// ============================================================================
// Window Control Hooks
// ============================================================================

/**
 * Hook to minimize the current window
 *
 * @example
 * ```tsx
 * const handleMinimize = useMinimizeWindow();
 *
 * return <button onClick={handleMinimize}>Minimize</button>;
 * ```
 */
export function useMinimizeWindow() {
  return useCallback(async () => {
    logger.info("Minimizing window");
    await minimizeWindow();
  }, []);
}

/**
 * Hook to toggle maximize/restore the current window
 *
 * @example
 * ```tsx
 * const handleMaximize = useToggleMaximizeWindow();
 *
 * return <button onClick={handleMaximize}>Maximize</button>;
 * ```
 */
export function useToggleMaximizeWindow() {
  return useCallback(async () => {
    logger.info("Toggling maximize window");
    await toggleMaximizeWindow();
  }, []);
}

/**
 * Hook to close the current window
 *
 * @example
 * ```tsx
 * const handleClose = useCloseWindow();
 *
 * return <button onClick={handleClose}>Close</button>;
 * ```
 */
export function useCloseWindow() {
  return useCallback(async () => {
    logger.info("Closing window");
    await closeWindow();
  }, []);
}

/**
 * Hook to track window maximized state
 *
 * @example
 * ```tsx
 * const isMaximized = useIsWindowMaximized();
 *
 * return (
 *   <div>
 *     Window is {isMaximized ? 'maximized' : 'normal'}
 *   </div>
 * );
 * ```
 */
export function useIsWindowMaximized() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial state
    isWindowMaximized().then(setIsMaximized);

    // Listen for resize events
    let unlisten: (() => void) | undefined;
    onWindowResized(async () => {
      const maximized = await isWindowMaximized();
      setIsMaximized(maximized);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  return isMaximized;
}

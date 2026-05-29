/**
 * Layout Store
 * Zustand store for layout state management with persistence
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createLogger } from "@/lib/logger";

const logger = createLogger("LayoutStore");

// ============================================================================
// Types
// ============================================================================

interface LayoutState {
  sidebarCollapsed: boolean;
}

interface LayoutActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export type LayoutStore = LayoutState & LayoutActions;

// ============================================================================
// Store
// ============================================================================

/**
 * Layout store with persistence
 * Manages sidebar collapse state and persists to localStorage
 */
export const useLayoutStore = create<LayoutStore>()(
  persist(
    immer((set) => ({
      // State
      sidebarCollapsed: false,

      // Actions
      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
          logger.info("Sidebar toggled", {
            collapsed: state.sidebarCollapsed,
          });
        });
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
          logger.info("Sidebar collapsed state set", { collapsed });
        });
      },
    })),
    {
      name: "layout-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);

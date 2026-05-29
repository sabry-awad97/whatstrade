/**
 * Menu Configuration
 * Defines menu structure and action handlers for the application menu bar
 */
import { THEME_VALUES, type ThemeValue } from "@/config/constants";
import { createLogger } from "@/lib/logger";
import {
  ChevronLeft,
  Download,
  HelpCircle,
  Monitor,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Upload,
  type LucideIcon,
} from "lucide-react";

const logger = createLogger("MenuConfig");

// ============================================================================
// Types
// ============================================================================

export type MenuItemSeparator = {
  type: "separator";
};

export type MenuItem = {
  type?: "item";
  label: string;
  icon: LucideIcon | null;
  action?: string;
  disabled?: boolean;
};

export type MenuSection = {
  label: string;
  items: (MenuItem | MenuItemSeparator)[];
};

export type MenuActionHandler = (
  action: string,
  context?: MenuActionContext,
) => void;

export interface MenuActionContext {
  setTheme?: (theme: ThemeValue) => void;
  toggleSidebar?: () => void;
}

// ============================================================================
// Menu Structure
// ============================================================================

export const menuSections: MenuSection[] = [
  {
    label: "File",
    items: [
      { label: "Export Data", icon: Download, action: "file:export" },
      { label: "Import Config", icon: Upload, action: "file:import" },
      { type: "separator" },
      { label: "Refresh All", icon: RefreshCw, action: "file:refresh" },
      { type: "separator" },
      { label: "Exit", icon: null, action: "file:exit" },
    ],
  },
  {
    label: "View",
    items: [
      {
        label: "Toggle Sidebar",
        icon: ChevronLeft,
        action: "view:toggle-sidebar",
      },
      { type: "separator" },
      { label: "Light Mode", icon: Sun, action: "view:theme-light" },
      { label: "Dark Mode", icon: Moon, action: "view:theme-dark" },
      { label: "System Theme", icon: Monitor, action: "view:theme-system" },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "Trigger Learning Job",
        icon: RefreshCw,
        action: "tools:learning-job",
      },
      { label: "Run Calibration", icon: Settings, action: "tools:calibration" },
      { type: "separator" },
      {
        label: "A/B Test Manager",
        icon: null,
        action: "tools:ab-test",
        disabled: true,
      },
      {
        label: "System Diagnostics",
        icon: null,
        action: "tools:diagnostics",
        disabled: true,
      },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "Documentation", icon: HelpCircle, action: "help:docs" },
      {
        label: "Keyboard Shortcuts",
        icon: null,
        action: "help:shortcuts",
        disabled: true,
      },
      { type: "separator" },
      { label: "About PharmaBroker", icon: null, action: "help:about" },
    ],
  },
];

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Default menu action handler
 * Handles all menu actions with appropriate context
 */
export function handleMenuAction(
  action: string,
  context?: MenuActionContext,
): void {
  logger.info("Menu action triggered", { action });

  switch (action) {
    // File actions
    case "file:export":
      logger.info("Export data action - not implemented");
      // TODO: Implement export functionality
      break;

    case "file:import":
      logger.info("Import config action - not implemented");
      // TODO: Implement import functionality
      break;

    case "file:refresh":
      logger.info("Refresh all action");
      window.location.reload();
      break;

    case "file:exit":
      logger.info("Exit action");
      window.close();
      break;

    // View actions
    case "view:toggle-sidebar":
      logger.info("Toggle sidebar action");
      context?.toggleSidebar?.();
      break;

    case "view:theme-light":
      logger.info("Set light theme");
      context?.setTheme?.(THEME_VALUES.LIGHT);
      break;

    case "view:theme-dark":
      logger.info("Set dark theme");
      context?.setTheme?.(THEME_VALUES.DARK);
      break;

    case "view:theme-system":
      logger.info("Set system theme");
      context?.setTheme?.(THEME_VALUES.SYSTEM);
      break;

    // Tools actions
    case "tools:learning-job":
      logger.info("Trigger learning job - not implemented");
      // TODO: Implement learning job trigger
      break;

    case "tools:calibration":
      logger.info("Run calibration - not implemented");
      // TODO: Implement calibration
      break;

    case "tools:ab-test":
      logger.info("A/B Test Manager - not implemented");
      // TODO: Implement A/B test manager
      break;

    case "tools:diagnostics":
      logger.info("System diagnostics - not implemented");
      // TODO: Implement system diagnostics
      break;

    // Help actions
    case "help:docs":
      logger.info("Opening documentation");
      window.open("https://docs.example.com", "_blank");
      break;

    case "help:shortcuts":
      logger.info("Keyboard shortcuts - not implemented");
      // TODO: Implement shortcuts modal
      break;

    case "help:about":
      logger.info("About dialog - not implemented");
      // TODO: Implement about dialog
      break;

    default:
      logger.warn("Unknown menu action", { action });
  }
}

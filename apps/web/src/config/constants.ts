/**
 * Application Constants
 * Centralized constants for the application
 */

// ============================================================================
// Application Metadata
// ============================================================================

export const APP_NAME = "WhatsTrade";
export const APP_VERSION = "1.0.0";
export const APP_LOGO_TEXT = "Rx";

// ============================================================================
// Theme Constants
// ============================================================================

export const THEME_VALUES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export type ThemeValue = (typeof THEME_VALUES)[keyof typeof THEME_VALUES];

// ============================================================================
// Layout Constants
// ============================================================================

export const LAYOUT_DIMENSIONS = {
  TITLEBAR_HEIGHT: 36, // 9 * 4px (h-9)
  MENUBAR_HEIGHT: 32, // 8 * 4px (h-8)
  STATUSBAR_HEIGHT: 24, // 6 * 4px (h-6)
  SIDEBAR_WIDTH_EXPANDED: 192, // 48 * 4px (w-48)
  SIDEBAR_WIDTH_COLLAPSED: 48, // 12 * 4px (w-12)
} as const;

// ============================================================================
// Timing Constants
// ============================================================================

export const TIMING = {
  TOOLTIP_DELAY: 300,
  SIDEBAR_TRANSITION: 200,
  STATS_REFETCH_INTERVAL: 30000, // 30 seconds
} as const;

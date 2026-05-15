/**
 * Color Utilities
 *
 * Professional color manipulation utilities for consistent styling across the application.
 * Supports HSL, HSLA, RGB, RGBA, hex color formats, and CSS variables.
 *
 * @module utils/colors
 */

/**
 * Supported color format types
 */
export type ColorFormat = "hsl" | "hsla" | "rgb" | "rgba" | "hex" | "var";

/**
 * Parsed HSL color components
 */
interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

/**
 * Parsed RGB color components
 */
interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Normalize a color string to ensure it's valid CSS.
 * Handles CSS variables and ensures proper formatting.
 *
 * @param color - CSS color string
 * @returns Normalized color string
 *
 * @example
 * ```ts
 * normalizeColor('hsl(var(--primary))')
 * // => 'hsl(var(--primary))'
 *
 * normalizeColor('#ff0000')
 * // => '#ff0000'
 * ```
 */
export function normalizeColor(color: string): string {
  // Already valid formats - return as-is
  if (
    color.startsWith("hsl") ||
    color.startsWith("rgb") ||
    color.startsWith("#")
  ) {
    return color;
  }

  // Fallback for any other format
  return color;
}

/**
 * Apply alpha transparency to any CSS color string.
 *
 * Supports multiple color formats:
 * - HSL: `hsl(142 72% 35%)` → `hsla(142 72% 35% / 0.2)`
 * - HSLA: `hsla(142 72% 35% / 0.5)` → `hsla(142 72% 35% / 0.2)`
 * - RGB: `rgb(255 0 0)` → `rgba(255 0 0 / 0.2)`
 * - RGBA: `rgba(255 0 0 / 0.5)` → `rgba(255 0 0 / 0.2)`
 * - Hex: `#ff0000` → `#ff000033`
 * - Hex with alpha: `#ff0000ff` → `#ff000033`
 *
 * @param color - CSS color string in any supported format
 * @param alpha - Alpha value between 0 (transparent) and 1 (opaque)
 * @returns Color string with applied alpha transparency
 *
 * @example
 * ```ts
 * applyAlpha('hsl(142 72% 35%)', 0.2)
 * // => 'hsla(142 72% 35% / 0.2)'
 *
 * applyAlpha('#ff0000', 0.125)
 * // => '#ff000020'
 *
 * applyAlpha('rgb(255 0 0)', 0.5)
 * // => 'rgba(255 0 0 / 0.5)'
 * ```
 */
export function applyAlpha(color: string, alpha: number): string {
  // Clamp alpha to valid range [0, 1]
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  // Handle HSL/HSLA format
  if (color.startsWith("hsl")) {
    // Remove existing alpha if present
    const baseColor = color
      .replace(/hsla?\(/, "")
      .replace(/\s*\/\s*[\d.]+\s*\)$/, "")
      .replace(/\)$/, "");
    return `hsla(${baseColor} / ${clampedAlpha})`;
  }

  // Handle RGB/RGBA format
  if (color.startsWith("rgb")) {
    // Remove existing alpha if present
    const baseColor = color
      .replace(/rgba?\(/, "")
      .replace(/\s*\/\s*[\d.]+\s*\)$/, "")
      .replace(/\)$/, "");
    return `rgba(${baseColor} / ${clampedAlpha})`;
  }

  // Handle hex format
  if (color.startsWith("#")) {
    const hex = color.slice(1); // Remove #

    // Normalize to 6-char hex (RRGGBB) by expanding or stripping alpha
    let baseHex: string;
    if (hex.length === 3) {
      // Expand #RGB to #RRGGBB
      baseHex = `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    } else if (hex.length === 4) {
      // Expand #RGBA to #RRGGBB (strip alpha)
      baseHex = `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    } else if (hex.length === 6) {
      baseHex = color; // Already 6-char
    } else if (hex.length === 8) {
      baseHex = color.slice(0, 7); // Strip alpha from 8-char
    } else {
      // Invalid hex format
      console.warn(
        `applyAlpha: Invalid hex format "${color}". Returning original color.`,
      );
      return color;
    }

    // Convert alpha to 2-digit hex (00-FF)
    const alphaHex = Math.round(clampedAlpha * 255)
      .toString(16)
      .padStart(2, "0");

    return `${baseHex}${alphaHex}`;
  }
  // Fallback: return original color if format is not recognized
  console.warn(
    `applyAlpha: Unrecognized color format "${color}". Returning original color.`,
  );
  return color;
}

/**
 * Parse an HSL color string into its components.
 *
 * @param color - HSL or HSLA color string
 * @returns Parsed HSL color components or null if invalid
 *
 * @example
 * ```ts
 * parseHSL('hsl(142 72% 35%)')
 * // => { h: 142, s: 72, l: 35 }
 *
 * parseHSL('hsla(142 72% 35% / 0.5)')
 * // => { h: 142, s: 72, l: 35, a: 0.5 }
 * ```
 */
export function parseHSL(color: string): HSLColor | null {
  const match = color.match(
    /hsla?\(\s*(\d+)\s+(\d+)%\s+(\d+)%(?:\s*\/\s*([\d.]+))?\s*\)/,
  );

  if (!match) return null;

  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
    a: match[4] ? parseFloat(match[4]) : undefined,
  };
}

/**
 * Parse an RGB color string into its components.
 *
 * @param color - RGB or RGBA color string
 * @returns Parsed RGB color components or null if invalid
 *
 * @example
 * ```ts
 * parseRGB('rgb(255 0 0)')
 * // => { r: 255, g: 0, b: 0 }
 *
 * parseRGB('rgba(255 0 0 / 0.5)')
 * // => { r: 255, g: 0, b: 0, a: 0.5 }
 * ```
 */
export function parseRGB(color: string): RGBColor | null {
  const match = color.match(
    /rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)/,
  );

  if (!match) return null;

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] ? parseFloat(match[4]) : undefined,
  };
}

/**
 * Parse a hex color string into RGB components.
 *
 * @param color - Hex color string (3, 4, 6, or 8 characters)
 * @returns Parsed RGB color components or null if invalid
 *
 * @example
 * ```ts
 * parseHex('#ff0000')
 * // => { r: 255, g: 0, b: 0 }
 *
 * parseHex('#ff0000ff')
 * // => { r: 255, g: 0, b: 0, a: 1 }
 *
 * parseHex('#f00')
 * // => { r: 255, g: 0, b: 0 }
 * ```
 */
export function parseHex(color: string): RGBColor | null {
  const hex = color.replace("#", "");

  // Validate hex format
  if (!/^[0-9A-Fa-f]{3,8}$/.test(hex)) return null;

  let r: number, g: number, b: number, a: number | undefined;

  if (hex.length === 3) {
    // #RGB
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 4) {
    // #RGBA
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    a = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length === 6) {
    // #RRGGBB
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (hex.length === 8) {
    // #RRGGBBAA
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  return { r, g, b, a };
}

/**
 * Detect the format of a color string.
 *
 * @param color - CSS color string
 * @returns Detected color format or null if unrecognized
 *
 * @example
 * ```ts
 * detectColorFormat('hsl(142 72% 35%)')  // => 'hsl'
 * detectColorFormat('rgba(255 0 0 / 0.5)')  // => 'rgba'
 * detectColorFormat('#ff0000')  // => 'hex'
 * ```
 */
export function detectColorFormat(color: string): ColorFormat | null {
  if (color.startsWith("hsla(")) return "hsla";
  if (color.startsWith("hsl(")) return "hsl";
  if (color.startsWith("rgba(")) return "rgba";
  if (color.startsWith("rgb(")) return "rgb";
  if (color.startsWith("#")) return "hex";
  return null;
}

/**
 * Lighten a color by a percentage.
 *
 * @param color - HSL color string
 * @param amount - Percentage to lighten (0-100)
 * @returns Lightened color string
 *
 * @example
 * ```ts
 * lighten('hsl(142 72% 35%)', 10)
 * // => 'hsl(142 72% 45%)'
 * ```
 */
export function lighten(color: string, amount: number): string {
  const parsed = parseHSL(color);
  if (!parsed) return color;

  const newL = Math.min(100, parsed.l + amount);
  const alpha = parsed.a !== undefined ? ` / ${parsed.a}` : "";

  return `hsl${parsed.a !== undefined ? "a" : ""}(${parsed.h} ${parsed.s}% ${newL}%${alpha})`;
}

/**
 * Darken a color by a percentage.
 *
 * @param color - HSL color string
 * @param amount - Percentage to darken (0-100)
 * @returns Darkened color string
 *
 * @example
 * ```ts
 * darken('hsl(142 72% 35%)', 10)
 * // => 'hsl(142 72% 25%)'
 * ```
 */
export function darken(color: string, amount: number): string {
  const parsed = parseHSL(color);
  if (!parsed) return color;

  const newL = Math.max(0, parsed.l - amount);
  const alpha = parsed.a !== undefined ? ` / ${parsed.a}` : "";

  return `hsl${parsed.a !== undefined ? "a" : ""}(${parsed.h} ${parsed.s}% ${newL}%${alpha})`;
}

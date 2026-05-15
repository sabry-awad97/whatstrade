/**
 * Color Utilities Test Suite
 *
 * Comprehensive tests for color manipulation functions.
 * Run with: vitest colors.test.ts
 */

import { describe, expect, test } from "vitest";
import {
  applyAlpha,
  parseHSL,
  parseRGB,
  parseHex,
  detectColorFormat,
  lighten,
  darken,
} from "./colors";

describe("applyAlpha", () => {
  test("applies alpha to HSL color", () => {
    expect(applyAlpha("hsl(142 72% 35%)", 0.2)).toBe("hsla(142 72% 35% / 0.2)");
  });

  test("replaces existing alpha in HSLA color", () => {
    expect(applyAlpha("hsla(142 72% 35% / 0.5)", 0.2)).toBe(
      "hsla(142 72% 35% / 0.2)",
    );
  });

  test("applies alpha to RGB color", () => {
    expect(applyAlpha("rgb(255 0 0)", 0.5)).toBe("rgba(255 0 0 / 0.5)");
  });

  test("replaces existing alpha in RGBA color", () => {
    expect(applyAlpha("rgba(255 0 0 / 0.8)", 0.3)).toBe("rgba(255 0 0 / 0.3)");
  });

  test("applies alpha to 6-char hex color", () => {
    expect(applyAlpha("#ff0000", 0.125)).toBe("#ff000020");
  });

  test("applies alpha to 3-char hex color", () => {
    expect(applyAlpha("#f00", 0.5)).toBe("#f0080");
  });

  test("replaces existing alpha in 8-char hex color", () => {
    expect(applyAlpha("#ff0000ff", 0.125)).toBe("#ff000020");
  });

  test("clamps alpha to valid range [0, 1]", () => {
    expect(applyAlpha("hsl(142 72% 35%)", -0.5)).toBe("hsla(142 72% 35% / 0)");
    expect(applyAlpha("hsl(142 72% 35%)", 1.5)).toBe("hsla(142 72% 35% / 1)");
  });

  test("returns original color for unrecognized format", () => {
    const color = "invalid-color";
    expect(applyAlpha(color, 0.5)).toBe(color);
  });
});

describe("parseHSL", () => {
  test("parses HSL color without alpha", () => {
    expect(parseHSL("hsl(142 72% 35%)")).toEqual({
      h: 142,
      s: 72,
      l: 35,
    });
  });

  test("parses HSLA color with alpha", () => {
    expect(parseHSL("hsla(142 72% 35% / 0.5)")).toEqual({
      h: 142,
      s: 72,
      l: 35,
      a: 0.5,
    });
  });

  test("returns null for invalid HSL", () => {
    expect(parseHSL("invalid")).toBeNull();
    expect(parseHSL("rgb(255 0 0)")).toBeNull();
  });
});

describe("parseRGB", () => {
  test("parses RGB color without alpha", () => {
    expect(parseRGB("rgb(255 0 0)")).toEqual({
      r: 255,
      g: 0,
      b: 0,
    });
  });

  test("parses RGBA color with alpha", () => {
    expect(parseRGB("rgba(255 0 0 / 0.5)")).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 0.5,
    });
  });

  test("returns null for invalid RGB", () => {
    expect(parseRGB("invalid")).toBeNull();
    expect(parseRGB("hsl(142 72% 35%)")).toBeNull();
  });
});

describe("parseHex", () => {
  test("parses 6-char hex color", () => {
    expect(parseHex("#ff0000")).toEqual({
      r: 255,
      g: 0,
      b: 0,
    });
  });

  test("parses 3-char hex color", () => {
    expect(parseHex("#f00")).toEqual({
      r: 255,
      g: 0,
      b: 0,
    });
  });

  test("parses 8-char hex color with alpha", () => {
    expect(parseHex("#ff0000ff")).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 1,
    });
  });

  test("parses 4-char hex color with alpha", () => {
    expect(parseHex("#f00f")).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 1,
    });
  });

  test("returns null for invalid hex", () => {
    expect(parseHex("invalid")).toBeNull();
    expect(parseHex("#gg0000")).toBeNull();
  });
});

describe("detectColorFormat", () => {
  test("detects HSL format", () => {
    expect(detectColorFormat("hsl(142 72% 35%)")).toBe("hsl");
  });

  test("detects HSLA format", () => {
    expect(detectColorFormat("hsla(142 72% 35% / 0.5)")).toBe("hsla");
  });

  test("detects RGB format", () => {
    expect(detectColorFormat("rgb(255 0 0)")).toBe("rgb");
  });

  test("detects RGBA format", () => {
    expect(detectColorFormat("rgba(255 0 0 / 0.5)")).toBe("rgba");
  });

  test("detects hex format", () => {
    expect(detectColorFormat("#ff0000")).toBe("hex");
  });

  test("returns null for unrecognized format", () => {
    expect(detectColorFormat("invalid")).toBeNull();
  });
});

describe("lighten", () => {
  test("lightens HSL color", () => {
    expect(lighten("hsl(142 72% 35%)", 10)).toBe("hsl(142 72% 45%)");
  });

  test("lightens HSLA color preserving alpha", () => {
    expect(lighten("hsla(142 72% 35% / 0.5)", 10)).toBe(
      "hsla(142 72% 45% / 0.5)",
    );
  });

  test("clamps lightness to maximum 100%", () => {
    expect(lighten("hsl(142 72% 95%)", 10)).toBe("hsl(142 72% 100%)");
  });

  test("returns original color for invalid format", () => {
    const color = "invalid";
    expect(lighten(color, 10)).toBe(color);
  });
});

describe("darken", () => {
  test("darkens HSL color", () => {
    expect(darken("hsl(142 72% 35%)", 10)).toBe("hsl(142 72% 25%)");
  });

  test("darkens HSLA color preserving alpha", () => {
    expect(darken("hsla(142 72% 35% / 0.5)", 10)).toBe(
      "hsla(142 72% 25% / 0.5)",
    );
  });

  test("clamps lightness to minimum 0%", () => {
    expect(darken("hsl(142 72% 5%)", 10)).toBe("hsl(142 72% 0%)");
  });

  test("returns original color for invalid format", () => {
    const color = "invalid";
    expect(darken(color, 10)).toBe(color);
  });
});

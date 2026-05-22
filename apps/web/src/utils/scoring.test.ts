/**
 * Scoring Utilities Tests
 *
 * Test suite for scoring calculation functions.
 */
import { describe, it, expect } from "vitest";
import {
  calculateRecencyScore,
  calculatePriceScore,
  calculateQuantityScore,
} from "./scoring";

describe("calculateRecencyScore", () => {
  it("should return 1.0 for brand new matches (0 hours old)", () => {
    const now = new Date();
    const score = calculateRecencyScore(now);
    expect(score).toBeCloseTo(1.0, 2);
  });

  it("should return 0.5 for matches created 36 hours ago", () => {
    const date = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const score = calculateRecencyScore(date);
    expect(score).toBeCloseTo(0.5, 2);
  });

  it("should return 0.0 for matches created 72 hours ago", () => {
    const date = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const score = calculateRecencyScore(date);
    expect(score).toBeCloseTo(0.0, 2);
  });

  it("should return 0.0 for matches older than 72 hours", () => {
    const date = new Date(Date.now() - 100 * 60 * 60 * 1000);
    const score = calculateRecencyScore(date);
    expect(score).toBe(0.0);
  });

  it("should return approximately 0.75 for matches created 18 hours ago", () => {
    const date = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const score = calculateRecencyScore(date);
    expect(score).toBeCloseTo(0.75, 2);
  });

  it("should return approximately 0.25 for matches created 54 hours ago", () => {
    const date = new Date(Date.now() - 54 * 60 * 60 * 1000);
    const score = calculateRecencyScore(date);
    expect(score).toBeCloseTo(0.25, 2);
  });

  it("should handle edge case of exactly 0 milliseconds old", () => {
    const now = new Date(Date.now());
    const score = calculateRecencyScore(now);
    expect(score).toBeGreaterThanOrEqual(0.99);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("should never return negative values", () => {
    const veryOldDate = new Date(Date.now() - 1000 * 60 * 60 * 1000); // 1000 hours ago
    const score = calculateRecencyScore(veryOldDate);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("calculatePriceScore", () => {
  describe("perfect matches (offer ≤ max)", () => {
    it("should return 1.0 when offer price equals max price", () => {
      const score = calculatePriceScore("100", "100");
      expect(score).toBe(1.0);
    });

    it("should return 1.0 when offer price is below max price", () => {
      const score = calculatePriceScore("50", "100");
      expect(score).toBe(1.0);
    });

    it("should return 1.0 when offer price is much lower than max", () => {
      const score = calculatePriceScore("10", "100");
      expect(score).toBe(1.0);
    });
  });

  describe("overshoot scenarios (offer > max)", () => {
    it("should return 0.5 when offer is 25% above max", () => {
      const score = calculatePriceScore("125", "100");
      expect(score).toBeCloseTo(0.5, 2);
    });

    it("should return 0.0 when offer is 50% above max", () => {
      const score = calculatePriceScore("150", "100");
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when offer is more than 50% above max", () => {
      const score = calculatePriceScore("200", "100");
      expect(score).toBe(0.0);
    });

    it("should return 0.8 when offer is 10% above max", () => {
      const score = calculatePriceScore("110", "100");
      expect(score).toBeCloseTo(0.8, 2);
    });
  });

  describe("invalid inputs", () => {
    it("should return 0.5 when offer price is null", () => {
      const score = calculatePriceScore(null, "100");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when max price is null", () => {
      const score = calculatePriceScore("100", null);
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when both prices are null", () => {
      const score = calculatePriceScore(null, null);
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when offer price is undefined", () => {
      const score = calculatePriceScore(undefined, "100");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when max price is undefined", () => {
      const score = calculatePriceScore("100", undefined);
      expect(score).toBe(0.5);
    });
  });

  describe("edge cases", () => {
    it("should return 0.5 when offer price is zero (invalid)", () => {
      const score = calculatePriceScore("0", "100");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when max price is zero (invalid)", () => {
      const score = calculatePriceScore("100", "0");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when offer price is negative", () => {
      const score = calculatePriceScore("-50", "100");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when max price is negative", () => {
      const score = calculatePriceScore("100", "-50");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when offer price is not a number", () => {
      const score = calculatePriceScore("abc", "100");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when max price is not a number", () => {
      const score = calculatePriceScore("100", "xyz");
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when offer price is Infinity", () => {
      const score = calculatePriceScore("Infinity", "100");
      expect(score).toBe(0.5);
    });

    it("should handle decimal prices correctly", () => {
      const score = calculatePriceScore("99.99", "100.00");
      expect(score).toBe(1.0);
    });

    it("should handle very small prices", () => {
      const score = calculatePriceScore("0.01", "0.02");
      expect(score).toBe(1.0);
    });
  });
});

describe("calculateQuantityScore", () => {
  describe("perfect matches", () => {
    it("should return 1.0 when quantities match exactly", () => {
      const score = calculateQuantityScore(100, 100);
      expect(score).toBe(1.0);
    });

    it("should return 1.0 for small matching quantities", () => {
      const score = calculateQuantityScore(1, 1);
      expect(score).toBe(1.0);
    });

    it("should return 1.0 for large matching quantities", () => {
      const score = calculateQuantityScore(10000, 10000);
      expect(score).toBe(1.0);
    });
  });

  describe("partial matches", () => {
    it("should return 0.5 when offer is half of request", () => {
      const score = calculateQuantityScore(50, 100);
      expect(score).toBe(0.5);
    });

    it("should return 0.5 when request is half of offer", () => {
      const score = calculateQuantityScore(100, 50);
      expect(score).toBe(0.5);
    });

    it("should return 0.8 when offer is 80% of request", () => {
      const score = calculateQuantityScore(80, 100);
      expect(score).toBe(0.8);
    });

    it("should return 0.25 when offer is 25% of request", () => {
      const score = calculateQuantityScore(25, 100);
      expect(score).toBe(0.25);
    });

    it("should return 0.1 when offer is 10% of request", () => {
      const score = calculateQuantityScore(10, 100);
      expect(score).toBe(0.1);
    });
  });

  describe("invalid inputs", () => {
    it("should return 0.0 when offer quantity is 0", () => {
      const score = calculateQuantityScore(0, 100);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when request quantity is 0", () => {
      const score = calculateQuantityScore(100, 0);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when both quantities are 0", () => {
      const score = calculateQuantityScore(0, 0);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when offer quantity is undefined", () => {
      const score = calculateQuantityScore(undefined, 100);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when request quantity is undefined", () => {
      const score = calculateQuantityScore(100, undefined);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when both quantities are undefined", () => {
      const score = calculateQuantityScore(undefined, undefined);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when offer quantity is negative", () => {
      const score = calculateQuantityScore(-50, 100);
      expect(score).toBe(0.0);
    });

    it("should return 0.0 when request quantity is negative", () => {
      const score = calculateQuantityScore(100, -50);
      expect(score).toBe(0.0);
    });
  });

  describe("edge cases", () => {
    it("should handle very small quantities", () => {
      const score = calculateQuantityScore(1, 2);
      expect(score).toBe(0.5);
    });

    it("should handle very large quantities", () => {
      const score = calculateQuantityScore(1000000, 2000000);
      expect(score).toBe(0.5);
    });

    it("should handle decimal quantities", () => {
      const score = calculateQuantityScore(50.5, 100.5);
      expect(score).toBeCloseTo(0.5025, 4);
    });
  });
});

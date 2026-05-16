/**
 * Scoring Utilities
 *
 * Shared scoring calculation functions for consistent match scoring across the application.
 * These utilities mirror the backend scoring logic to ensure UI displays accurate values.
 *
 * @module utils/scoring
 */

/**
 * Calculate recency score based on match creation time.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 for brand new matches (0 hours old)
 * - Linearly decreases to 0.0 over 72 hours (3 days)
 * - 0.0 for matches older than 72 hours
 *
 * This calculation mirrors the backend implementation in:
 * `packages/api/src/routers/simulate.ts` (lines 97-100)
 *
 * @param createdAt - Match creation date
 * @returns Recency score between 0 and 1
 *
 * @example
 * ```ts
 * // Brand new match (just created)
 * calculateRecencyScore(new Date())
 * // => 1.0
 *
 * // Match created 36 hours ago
 * const date = new Date(Date.now() - 36 * 60 * 60 * 1000);
 * calculateRecencyScore(date)
 * // => 0.5
 *
 * // Match created 72+ hours ago
 * const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000);
 * calculateRecencyScore(oldDate)
 * // => 0.0
 * ```
 */
export function calculateRecencyScore(createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return Math.max(0, 1 - ageHours / 72);
}

/**
 * Calculate price score based on offer price vs max price.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 when offer price ≤ max price (perfect match)
 * - Decreases linearly as offer price exceeds max price
 * - 0.5 when either price is missing or invalid (default)
 * - 0.0 when offer price is 50%+ above max price
 *
 * This calculation mirrors the backend implementation in:
 * `packages/api/src/routers/simulate.ts` (lines 87-96)
 *
 * @param offerPrice - Offer price as string (from API)
 * @param maxPrice - Maximum acceptable price as string (from API)
 * @returns Price score between 0 and 1
 *
 * @example
 * ```ts
 * // Perfect match: offer at or below max
 * calculatePriceScore("50", "100")
 * // => 1.0
 *
 * // Exact match
 * calculatePriceScore("100", "100")
 * // => 1.0
 *
 * // Overshoot by 25%
 * calculatePriceScore("125", "100")
 * // => 0.5
 *
 * // Overshoot by 50%+
 * calculatePriceScore("150", "100")
 * // => 0.0
 *
 * // Missing or invalid prices
 * calculatePriceScore(null, "100")
 * // => 0.5
 *
 * calculatePriceScore("0", "100")
 * // => 0.5 (invalid: offer price cannot be 0)
 * ```
 */
export function calculatePriceScore(
  offerPrice: string | null | undefined,
  maxPrice: string | null | undefined,
): number {
  const offer = offerPrice != null ? Number(offerPrice) : null;
  const max = maxPrice != null ? Number(maxPrice) : null;

  // Return default if either price is missing or invalid
  if (
    offer == null ||
    max == null ||
    !isFinite(offer) ||
    !isFinite(max) ||
    offer < 0 ||
    max <= 0
  ) {
    return 0.5;
  }

  // Perfect match: offer price is at or below max price
  if (offer <= max) return 1;

  // Overshoot: offer price exceeds max price
  const overshoot = (offer - max) / max;
  return Math.max(0, 1 - overshoot * 2);
}

/**
 * Calculate quantity match score based on offer quantity vs request quantity.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 when quantities match exactly
 * - Ratio of min/max when both quantities are valid
 * - 0.0 when either quantity is missing or invalid
 *
 * @param offerQuantity - Quantity offered
 * @param requestQuantity - Quantity requested
 * @returns Quantity score between 0 and 1
 *
 * @example
 * ```ts
 * // Perfect match
 * calculateQuantityScore(100, 100)
 * // => 1.0
 *
 * // 50% match
 * calculateQuantityScore(50, 100)
 * // => 0.5
 *
 * // 80% match
 * calculateQuantityScore(80, 100)
 * // => 0.8
 *
 * // Missing quantities
 * calculateQuantityScore(0, 100)
 * // => 0.0
 *
 * calculateQuantityScore(undefined, 100)
 * // => 0.0
 * ```
 */
export function calculateQuantityScore(
  offerQuantity: number | undefined,
  requestQuantity: number | undefined,
): number {
  const offer = offerQuantity ?? 0;
  const request = requestQuantity ?? 0;

  // Return 0 if either quantity is invalid
  if (offer <= 0 || request <= 0) {
    return 0;
  }

  // Calculate ratio of smaller to larger quantity
  return Math.min(offer, request) / Math.max(offer, request);
}

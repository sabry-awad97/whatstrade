/**
 * Shared Scoring Utilities
 *
 * Centralized scoring calculation functions used across the API.
 * These functions implement the matching engine's scoring algorithms.
 *
 * @module utils/scoring
 */

/**
 * Score breakdown for a match
 */
export interface ScoreBreakdown {
  medication: number;
  quantity: number;
  dosage: number;
  price: number;
  recency: number;
}

/**
 * Matching engine weights
 */
export interface MatchingWeights {
  medication: number;
  quantity: number;
  dosage: number;
  price: number;
  recency: number;
}

/**
 * Calculate medication name similarity score.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 for exact match
 * - 0.85 for substring match
 * - Decreasing score based on common prefix length
 * - 0.0 for empty strings or no similarity
 *
 * @param a - First medication name
 * @param b - Second medication name
 * @returns Similarity score between 0 and 1
 */
export function calculateMedicationSimilarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();

  // Guard against empty strings
  if (na.length === 0 || nb.length === 0) return 0;

  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  let common = 0;
  for (let i = 0; i < Math.min(na.length, nb.length); i++) {
    if (na[i] === nb[i]) common++;
    else break;
  }
  return Math.min(common / Math.max(na.length, nb.length), 0.8);
}

/**
 * Calculate dosage similarity score.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 for exact match
 * - 0.5 if either dosage is missing (default)
 * - 0.0 for mismatch
 *
 * @param a - First dosage
 * @param b - Second dosage
 * @returns Dosage similarity score between 0 and 1
 */
export function calculateDosageSimilarity(
  a: string | null,
  b: string | null,
): number {
  if (!a || !b) return 0.5;
  return a.toLowerCase().trim() === b.toLowerCase().trim() ? 1 : 0;
}

/**
 * Calculate quantity match score.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 when quantities match exactly or both are zero
 * - Ratio of min/max for partial matches
 *
 * @param offered - Quantity offered
 * @param requested - Quantity requested
 * @returns Quantity score between 0 and 1
 */
export function calculateQuantityScore(
  offered: number,
  requested: number,
): number {
  const max = Math.max(offered, requested);
  if (max === 0) return 1; // Both quantities are zero, treat as perfect match
  return Math.min(offered, requested) / max;
}

/**
 * Calculate price fit score.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 when offer price ≤ max price
 * - 0.5 if either price is missing (default)
 * - Decreases as offer price exceeds max price
 * - 0.0 when offer price is 50%+ above max price
 *
 * @param offerPrice - Offer price
 * @param maxPrice - Maximum acceptable price
 * @returns Price score between 0 and 1
 */
export function calculatePriceScore(
  offerPrice: number | null,
  maxPrice: number | null,
): number {
  if (offerPrice == null || maxPrice == null) return 0.5;
  if (maxPrice === 0) return offerPrice === 0 ? 1 : 0;
  if (offerPrice <= maxPrice) return 1;
  const overshoot = (offerPrice - maxPrice) / maxPrice;
  return Math.max(0, 1 - overshoot * 2);
}

/**
 * Calculate recency score based on creation time.
 *
 * Returns a normalized score between 0 and 1:
 * - 1.0 for brand new matches (0 hours old)
 * - Linearly decreases to 0.0 over 72 hours (3 days)
 * - 0.0 for matches older than 72 hours
 *
 * @param createdAt - Match creation date
 * @returns Recency score between 0 and 1
 */
export function calculateRecencyScore(createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return Math.max(0, 1 - ageHours / 72);
}

/**
 * Determine confidence band from overall score.
 *
 * @param score - Overall match score (0-1)
 * @returns Confidence band: "auto", "suggest", "review", or "none"
 */
export function calculateConfidenceBand(
  score: number,
): "auto" | "suggest" | "review" | "none" {
  if (score >= 0.85) return "auto";
  if (score >= 0.65) return "suggest";
  if (score >= 0.45) return "review";
  return "none";
}

/**
 * Calculate complete score breakdown for a match.
 *
 * This function computes individual component scores. Note that medication
 * similarity is always 1.0 since both offer and request share the same medication name.
 *
 * @param params - Match parameters
 * @param params.medicationName - Medication name (same for both offer and request)
 * @param params.offerDosage - Offer dosage
 * @param params.requestDosage - Request dosage
 * @param params.offerQuantity - Offer quantity
 * @param params.requestQuantity - Request quantity
 * @param params.offerPrice - Offer price
 * @param params.maxPrice - Maximum acceptable price
 * @param params.createdAt - Match creation date
 * @returns Score breakdown with individual component scores
 */
export function calculateScoreBreakdown(params: {
  medicationName: string;
  offerDosage: string | null;
  requestDosage: string | null;
  offerQuantity: number;
  requestQuantity: number;
  offerPrice: number | null;
  maxPrice: number | null;
  createdAt: Date;
}): ScoreBreakdown {
  return {
    // Medication is always 1.0 since matches are created with same medication name
    medication: 1.0,
    dosage: calculateDosageSimilarity(params.offerDosage, params.requestDosage),
    quantity: calculateQuantityScore(
      params.offerQuantity,
      params.requestQuantity,
    ),
    price: calculatePriceScore(params.offerPrice, params.maxPrice),
    recency: calculateRecencyScore(params.createdAt),
  };
}

/**
 * Calculate weighted total score from breakdown.
 *
 * @param breakdown - Score breakdown
 * @param weights - Matching engine weights
 * @returns Weighted total score between 0 and 1
 */
export function calculateTotalScore(
  breakdown: ScoreBreakdown,
  weights: MatchingWeights,
): number {
  return (
    breakdown.medication * weights.medication +
    breakdown.quantity * weights.quantity +
    breakdown.dosage * weights.dosage +
    breakdown.price * weights.price +
    breakdown.recency * weights.recency
  );
}

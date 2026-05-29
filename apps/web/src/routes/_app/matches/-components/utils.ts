/**
 * Match utilities
 *
 * Shared utility functions for match-related components
 */

export type ConfidenceBand = "auto" | "suggest" | "review" | "reject";

/**
 * Calculate confidence band from match score
 *
 * Thresholds:
 * - >= 0.85: "auto" (auto-confirm)
 * - >= 0.70: "suggest" (suggest to user)
 * - >= 0.50: "review" (needs review)
 * - < 0.50: "reject" (low confidence)
 *
 * @param score - Match score (0-1 range)
 * @returns Confidence band classification
 */
export function getConfidenceBand(score: number): ConfidenceBand {
  if (score >= 0.85) return "auto";
  if (score >= 0.7) return "suggest";
  if (score >= 0.5) return "review";
  return "reject";
}

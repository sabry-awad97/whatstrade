/**
 * Weights Constants
 *
 * Centralized configuration for weight keys, colors, labels, and defaults.
 */

export const WEIGHT_KEYS = [
  "medication",
  "quantity",
  "dosage",
  "price",
  "recency",
] as const;

export type WeightKey = (typeof WEIGHT_KEYS)[number];

export const WEIGHT_COLORS: Record<WeightKey, string> = {
  medication: "hsl(211 100% 42%)",
  quantity: "hsl(142 72% 35%)",
  dosage: "hsl(262 80% 55%)",
  price: "hsl(38 92% 50%)",
  recency: "hsl(21 85% 50%)",
};

export const WEIGHT_LABELS: Record<WeightKey, string> = {
  medication: "Medication Name",
  quantity: "Quantity Match",
  dosage: "Dosage Match",
  price: "Price Fit",
  recency: "Recency",
};

export const DEFAULT_WEIGHTS: Record<WeightKey, number> = {
  medication: 0.4,
  quantity: 0.2,
  dosage: 0.15,
  price: 0.15,
  recency: 0.1,
};

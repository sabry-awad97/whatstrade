import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WeightsApi");

// ============================================================================
// Schemas
// ============================================================================

export const weightsResponseSchema = z.object({
  id: z.string(),
  medication: z.string(), // Decimal as string
  quantity: z.string(), // Decimal as string
  dosage: z.string(), // Decimal as string
  price: z.string(), // Decimal as string
  recency: z.string(), // Decimal as string
  updated_at: z.string(),
});

export type WeightsResponse = z.infer<typeof weightsResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type UpdateWeightsParams = {
  data: {
    medication: number;
    quantity: number;
    dosage: number;
    price: number;
    recency: number;
  };
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get current matching weights
 */
export async function getWeights(): Promise<WeightsResponse> {
  logger.info("Getting matching weights");
  return invokeCommand("get_weights", weightsResponseSchema);
}

/**
 * Update matching weights
 * Validates that weights sum to 1.0
 */
export async function updateWeights(
  medication: number,
  quantity: number,
  dosage: number,
  price: number,
  recency: number,
): Promise<WeightsResponse> {
  logger.info("Updating matching weights", {
    medication,
    quantity,
    dosage,
    price,
    recency,
  });
  return invokeCommand("update_weights", weightsResponseSchema, {
    params: {
      data: {
        medication,
        quantity,
        dosage,
        price,
        recency,
      },
    },
  });
}

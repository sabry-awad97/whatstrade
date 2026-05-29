import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("HealthApi");

// ============================================================================
// Schemas
// ============================================================================

export const healthResponseSchema = z.object({
  status: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Health check endpoint
 * @returns Health status
 */
export async function health(): Promise<HealthResponse> {
  logger.info("Checking health status");
  return invokeCommand("health", healthResponseSchema);
}

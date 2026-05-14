/**
 * Health check schemas
 */
import { z } from "zod";

/**
 * @summary Health check response
 */
export const HealthCheckResponse = z.object({
  status: z.string(),
});

// Type exports
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;

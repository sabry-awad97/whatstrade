import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StatsApi");

// ============================================================================
// Schemas
// ============================================================================

export const dashboardStatsResponseSchema = z.object({
  total_offers: z.number(),
  total_requests: z.number(),
  total_matches: z.number(),
  pending_matches: z.number(),
  auto_confirmed: z.number(),
  rejected_matches: z.number(),
  avg_match_score: z.number(),
  active_groups: z.number(),
  today_messages: z.number(),
  match_rate: z.number(),
});

export type DashboardStatsResponse = z.infer<
  typeof dashboardStatsResponseSchema
>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  logger.info("Getting dashboard statistics");
  return invokeCommand("get_dashboard_stats", dashboardStatsResponseSchema);
}

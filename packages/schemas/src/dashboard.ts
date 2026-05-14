/**
 * Dashboard statistics schemas
 */
import { z } from "zod";

/**
 * @summary Dashboard statistics response
 * Provides overview metrics for the WhatsTrade system
 */
export const GetDashboardStatsResponse = z.object({
  totalOffers: z.number(),
  totalRequests: z.number(),
  totalMatches: z.number(),
  pendingMatches: z.number(),
  autoConfirmed: z.number(),
  avgMatchScore: z.number(),
  activeGroups: z.number(),
  todayMessages: z.number(),
  matchRate: z.number(),
});

// Type exports
export type GetDashboardStatsResponse = z.infer<
  typeof GetDashboardStatsResponse
>;

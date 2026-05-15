/**
 * Dashboard Hooks
 * React Query hooks for dashboard statistics using oRPC
 */
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetDashboardStatsResponse } from "@workspace/schemas";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch dashboard statistics
 *
 * Provides overview metrics including:
 * - Total offers, requests, and matches
 * - Pending and auto-confirmed matches
 * - Average match score and match rate
 * - Active monitored groups
 * - Today's message count
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading, error } = useGetDashboardStats();
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <p>Total Matches: {stats.totalMatches}</p>
 *     <p>Match Rate: {stats.matchRate.toFixed(1)}%</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with dashboard statistics
 */
export function useGetDashboardStats(): UseQueryResult<
  GetDashboardStatsResponse,
  Error
> {
  return useQuery(
    orpc.stats.getDashboardStats.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

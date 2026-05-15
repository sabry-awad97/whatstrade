/**
 * Dashboard Statistics Hook
 * Provides real-time dashboard metrics using oRPC + TanStack Query
 */
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetDashboardStatsResponse } from "@workspace/schemas";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch dashboard statistics
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading, error } = useGetDashboardStats();
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error message={error.message} />;
 *
 * return <div>Total Matches: {stats.totalMatches}</div>;
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

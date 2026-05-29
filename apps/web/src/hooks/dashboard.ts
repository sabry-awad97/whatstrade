/**
 * Stats Hooks
 * React Query hooks for dashboard statistics using Tauri IPC
 */
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/api/dashboard";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StatsHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const statsKeys = {
  all: ["stats"] as const,
  dashboard: () => [...statsKeys.all, "dashboard"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch dashboard statistics
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useGetDashboardStats();
 *
 * return (
 *   <div>
 *     <p>Total Offers: {stats?.total_offers}</p>
 *     <p>Total Requests: {stats?.total_requests}</p>
 *     <p>Total Matches: {stats?.total_matches}</p>
 *     <p>Match Rate: {stats?.match_rate.toFixed(1)}%</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with dashboard statistics
 */
export function useGetDashboardStats() {
  return useQuery({
    queryKey: statsKeys.dashboard(),
    queryFn: () => {
      logger.info("Query: fetching dashboard stats");
      return getDashboardStats();
    },
    // Refetch every 30 seconds to keep stats fresh
    refetchInterval: 30000,
  });
}

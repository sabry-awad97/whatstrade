/**
 * Matches Hooks
 * React Query hooks for medication matches using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMatchStats,
  listMatches,
  getMatch,
  confirmMatch,
  rejectMatch,
  type ListMatchesParams,
} from "@/api/matches";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MatchesHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const matchKeys = {
  all: ["matches"] as const,
  lists: () => [...matchKeys.all, "list"] as const,
  list: (params?: ListMatchesParams) => [...matchKeys.lists(), params] as const,
  details: () => [...matchKeys.all, "detail"] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
  stats: () => [...matchKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch match statistics including band breakdown
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useGetMatchStats();
 *
 * return (
 *   <div>
 *     <p>Total: {stats.total_matches}</p>
 *     <p>Pending: {stats.pending_matches}</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with match statistics
 */
export function useGetMatchStats() {
  return useQuery({
    queryKey: matchKeys.stats(),
    queryFn: () => {
      logger.info("Query: fetching match stats");
      return getMatchStats();
    },
  });
}

/**
 * Hook to fetch a paginated list of matches
 *
 * @example
 * ```tsx
 * const { data: matches, isLoading } = useListMatches({
 *   filter: { status: 'pending' },
 *   pagination: { page: 0, page_size: 20 }
 * });
 *
 * return matches?.matches.map(match => (
 *   <div key={match.id}>
 *     {match.medication_name} - Score: {(parseFloat(match.score) * 100).toFixed(0)}%
 *   </div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and filtering
 * @param params.filter - Filter options
 * @param params.filter.status - Filter by match status (pending, confirmed, rejected, auto_confirmed)
 * @param params.pagination - Pagination options
 * @param params.pagination.page - Page number (0-indexed, default: 0)
 * @param params.pagination.page_size - Items per page (default: 20)
 * @returns TanStack Query result with matches array
 */
export function useListMatches(params?: ListMatchesParams) {
  return useQuery({
    queryKey: matchKeys.list(params),
    queryFn: () => {
      logger.info("Query: listing matches", params);
      return listMatches(params);
    },
  });
}

/**
 * Hook to fetch a single match by ID
 *
 * @example
 * ```tsx
 * const { data: match, isLoading, error } = useGetMatch("match-id-123", {
 *   enabled: true
 * });
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error />;
 *
 * return <div>{match.medication_name} - {match.confidence_band}</div>;
 * ```
 *
 * @param id - The match ID
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with match details
 */
export function useGetMatch(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: () => {
      logger.info("Query: fetching match", { id });
      return getMatch(id);
    },
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to confirm a match
 *
 * @example
 * ```tsx
 * const confirmMatch = useConfirmMatch();
 *
 * const handleConfirm = () => {
 *   confirmMatch.mutate(
 *     { id: 'match-123', note: 'Looks good' },
 *     {
 *       onSuccess: () => toast.success('Match confirmed'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for confirming matches
 */
export function useConfirmMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => {
      logger.info("Mutation: confirming match", { id, note });
      return confirmMatch(id, note);
    },
    onSuccess: (data) => {
      logger.info("Match confirmed successfully", { id: data.id });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to confirm match", error);
    },
  });
}

/**
 * Hook to reject a match
 *
 * @example
 * ```tsx
 * const rejectMatch = useRejectMatch();
 *
 * const handleReject = () => {
 *   rejectMatch.mutate(
 *     { id: 'match-123', note: 'Not suitable' },
 *     {
 *       onSuccess: () => toast.success('Match rejected'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for rejecting matches
 */
export function useRejectMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => {
      logger.info("Mutation: rejecting match", { id, note });
      return rejectMatch(id, note);
    },
    onSuccess: (data) => {
      logger.info("Match rejected successfully", { id: data.id });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to reject match", error);
    },
  });
}

/**
 * Matches Hooks
 * React Query hooks for medication matches using oRPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetMatchStatsResponse } from "@workspace/schemas";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch match statistics including band breakdown
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useGetMatchStats();
 *
 * return (
 *   <div>
 *     <p>Total: {stats.total}</p>
 *     <p>Auto: {stats.bandBreakdown.auto}</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with match statistics
 */
export function useGetMatchStats(): UseQueryResult<
  GetMatchStatsResponse,
  Error
> {
  return useQuery(
    orpc.matches.getMatchStats.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

/**
 * Hook to fetch a paginated list of matches
 *
 * @example
 * ```tsx
 * const { data: matches, isLoading } = useListMatches({
 *   status: 'pending',
 *   page: 1,
 *   limit: 10
 * });
 *
 * return matches?.map(match => (
 *   <div key={match.id}>
 *     {match.medicationName} - Score: {(match.score * 100).toFixed(0)}%
 *   </div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and filtering
 * @param params.status - Filter by match status (pending, confirmed, rejected, auto_confirmed)
 * @param params.page - Page number (default: 1)
 * @param params.limit - Items per page (default: 20)
 * @returns TanStack Query result with matches array
 */
export function useListMatches(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery(
    orpc.matches.listMatches.queryOptions({
      input: params ?? {},
    }),
  );
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
 * return <div>{match.medicationName} - {match.confidenceBand}</div>;
 * ```
 *
 * @param id - The match ID
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with match details
 */
export function useGetMatch(id: string, options?: { enabled?: boolean }) {
  return useQuery(
    orpc.matches.getMatch.queryOptions({
      input: { id },
      enabled: options?.enabled ?? true,
    }),
  );
}

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
    mutationFn: async (params: { id: string; note?: string }) => {
      return orpc.matches.confirmMatch.call(params);
    },
    onSuccess: () => {
      // Invalidate all matches queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.matches.key(),
      });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
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
    mutationFn: async (params: { id: string; note?: string }) => {
      return orpc.matches.rejectMatch.call(params);
    },
    onSuccess: () => {
      // Invalidate all matches queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.matches.key(),
      });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
    },
  });
}

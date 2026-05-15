/**
 * Review Hooks
 * React Query hooks for review queue management using oRPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch the review queue (pending items)
 *
 * @example
 * ```tsx
 * const { data: queue, isLoading } = useGetReviewQueue();
 *
 * return queue?.map(item => (
 *   <div key={item.id}>
 *     {item.medicationName} - {item.type}
 *   </div>
 * ));
 * ```
 *
 * @returns TanStack Query result with review queue array
 */
export function useGetReviewQueue() {
  return useQuery(
    orpc.review.getReviewQueue.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

/**
 * Hook to fetch review queue statistics
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useGetReviewStats();
 *
 * return (
 *   <div>
 *     <p>Total: {stats.total}</p>
 *     <p>Pending: {stats.pending}</p>
 *     <p>Approved: {stats.approved}</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with review statistics
 */
export function useGetReviewStats() {
  return useQuery(
    orpc.review.getReviewStats.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

/**
 * Hook to approve a review item
 *
 * @example
 * ```tsx
 * const approveItem = useApproveReviewItem();
 *
 * const handleApprove = (id: string) => {
 *   approveItem.mutate(
 *     { id, note: 'Looks good' },
 *     {
 *       onSuccess: () => toast.success('Item approved'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for approving review items
 */
export function useApproveReviewItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      correctedData?: string;
      note?: string;
    }) => {
      return orpc.review.approveReviewItem.call(params);
    },
    onSuccess: () => {
      // Invalidate review queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.review.key(),
      });
      // Invalidate dashboard stats as review affects overall stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
    },
  });
}

/**
 * Hook to reject a review item
 *
 * @example
 * ```tsx
 * const rejectItem = useRejectReviewItem();
 *
 * const handleReject = (id: string) => {
 *   rejectItem.mutate(
 *     { id, note: 'Invalid data' },
 *     {
 *       onSuccess: () => toast.success('Item rejected'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for rejecting review items
 */
export function useRejectReviewItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      correctedData?: string;
      note?: string;
    }) => {
      return orpc.review.rejectReviewItem.call(params);
    },
    onSuccess: () => {
      // Invalidate review queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.review.key(),
      });
      // Invalidate dashboard stats as review affects overall stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
    },
  });
}

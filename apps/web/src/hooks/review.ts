/**
 * Review Hooks
 * React Query hooks for review queue management using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReviewQueue,
  getReviewStats,
  approveReviewItem,
  rejectReviewItem,
} from "@/api/review";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ReviewHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const reviewKeys = {
  all: ["review"] as const,
  queue: () => [...reviewKeys.all, "queue"] as const,
  stats: () => [...reviewKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch the pending review queue
 *
 * @example
 * ```tsx
 * const { data: queue, isLoading } = useGetReviewQueue();
 *
 * return queue?.map(item => (
 *   <div key={item.id}>
 *     {item.medication_name} - {item.status}
 *   </div>
 * ));
 * ```
 *
 * @returns TanStack Query result with review queue items
 */
export function useGetReviewQueue() {
  return useQuery({
    queryKey: reviewKeys.queue(),
    queryFn: () => {
      logger.info("Query: fetching review queue");
      return getReviewQueue();
    },
  });
}

/**
 * Hook to fetch review statistics
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
 *     <p>Rejected: {stats.rejected}</p>
 *     <p>Avg Processing Time: {stats.avg_processing_time.toFixed(2)}s</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with review statistics
 */
export function useGetReviewStats() {
  return useQuery({
    queryKey: reviewKeys.stats(),
    queryFn: () => {
      logger.info("Query: fetching review stats");
      return getReviewStats();
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to approve a review item
 *
 * @example
 * ```tsx
 * const approveItem = useApproveReviewItem();
 *
 * const handleApprove = (id: string) => {
 *   approveItem.mutate(
 *     { id },
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
    mutationFn: ({ id }: { id: string }) => {
      logger.info("Mutation: approving review item", { id });
      return approveReviewItem(id);
    },
    onSuccess: (data) => {
      logger.info("Review item approved successfully", { id: data.id });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to approve review item", error);
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
 *     { id },
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
    mutationFn: ({ id }: { id: string }) => {
      logger.info("Mutation: rejecting review item", { id });
      return rejectReviewItem(id);
    },
    onSuccess: (data) => {
      logger.info("Review item rejected successfully", { id: data.id });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to reject review item", error);
    },
  });
}

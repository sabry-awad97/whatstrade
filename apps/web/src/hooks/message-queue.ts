/**
 * Message Queue Hooks
 * React Query hooks for WhatsApp message queue operations using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  syncGroups,
  getFailedMessages,
  retryMessage,
  getQueueStats,
  type GetFailedMessagesParams,
} from "@/api/message-queue";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MessageQueueHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const messageQueueKeys = {
  all: ["message-queue"] as const,
  failedMessages: () => [...messageQueueKeys.all, "failed-messages"] as const,
  failedMessagesList: (params?: GetFailedMessagesParams) =>
    [...messageQueueKeys.failedMessages(), params] as const,
  stats: () => [...messageQueueKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch failed messages with optional filtering and pagination
 *
 * @example
 * ```tsx
 * const { data: failedMessages, isLoading } = useGetFailedMessages({
 *   filter: { group_name: 'Pharmacy Group' },
 *   pagination: { page: 0, page_size: 20 }
 * });
 *
 * return failedMessages?.messages.map(msg => (
 *   <div key={msg.id}>{msg.raw_text} - {msg.last_error}</div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and filtering
 * @param params.filter - Filter options
 * @param params.filter.group_name - Filter by group name
 * @param params.pagination - Pagination options
 * @param params.pagination.page - Page number (0-indexed, default: 0)
 * @param params.pagination.page_size - Items per page (default: 20)
 * @returns TanStack Query result with failed messages
 */
export function useGetFailedMessages(params?: GetFailedMessagesParams) {
  return useQuery({
    queryKey: messageQueueKeys.failedMessagesList(params),
    queryFn: () => {
      logger.info("Query: fetching failed messages", params);
      return getFailedMessages(params);
    },
  });
}

/**
 * Hook to fetch queue statistics
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useQueueStats();
 *
 * return (
 *   <div>
 *     <StatCard label="Pending" value={stats?.pending} />
 *     <StatCard label="Failed" value={stats?.failed} />
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with queue statistics
 */
export function useQueueStats() {
  return useQuery({
    queryKey: messageQueueKeys.stats(),
    queryFn: () => {
      logger.info("Query: fetching queue statistics");
      return getQueueStats();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to sync WhatsApp groups from WhatsApp service
 *
 * @example
 * ```tsx
 * const syncGroupsMutation = useSyncGroups();
 *
 * const handleSync = () => {
 *   syncGroupsMutation.mutate(undefined, {
 *     onSuccess: (data) => toast.success(`Synced ${data.count} groups`),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for syncing groups
 */
export function useSyncGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      logger.info("Mutation: syncing WhatsApp groups");
      return syncGroups();
    },
    onSuccess: (data) => {
      logger.info("WhatsApp groups synced successfully", { count: data.count });
      // Invalidate groups queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error) => {
      logger.error("Failed to sync WhatsApp groups", error);
    },
  });
}

/**
 * Hook to retry a failed message
 *
 * @example
 * ```tsx
 * const retryMessageMutation = useRetryMessage();
 *
 * const handleRetry = (messageId: string) => {
 *   retryMessageMutation.mutate(messageId, {
 *     onSuccess: () => toast.success('Message retry initiated'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for retrying messages
 */
export function useRetryMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      logger.info("Mutation: retrying message", { id });
      return retryMessage(id);
    },
    onSuccess: (data) => {
      logger.info("Message retry initiated successfully", { id: data.id });
      // Invalidate failed messages queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: messageQueueKeys.failedMessages(),
      });
      // Also invalidate stats
      queryClient.invalidateQueries({
        queryKey: messageQueueKeys.stats(),
      });
    },
    onError: (error) => {
      logger.error("Failed to retry message", error);
    },
  });
}

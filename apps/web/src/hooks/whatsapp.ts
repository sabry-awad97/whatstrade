/**
 * WhatsApp Hooks
 * React Query hooks for WhatsApp integration using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  syncGroups,
  getFailedMessages,
  retryMessage,
  type GetFailedMessagesParams,
} from "@/api/whatsapp";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WhatsAppHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  failedMessages: () => [...whatsappKeys.all, "failed-messages"] as const,
  failedMessagesList: (params?: GetFailedMessagesParams) =>
    [...whatsappKeys.failedMessages(), params] as const,
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
    queryKey: whatsappKeys.failedMessagesList(params),
    queryFn: () => {
      logger.info("Query: fetching failed messages", params);
      return getFailedMessages(params);
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to sync WhatsApp groups from Go service
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
        queryKey: whatsappKeys.failedMessages(),
      });
    },
    onError: (error) => {
      logger.error("Failed to retry message", error);
    },
  });
}

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

/**
 * Alias for useGetFailedMessages for backward compatibility
 * @deprecated Use useGetFailedMessages instead
 */
export const useFailedMessages = useGetFailedMessages;

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

// ============================================================================
// Live Status Hooks (TODO: Requires Tauri SSE implementation)
// ============================================================================

/**
 * Hook to subscribe to live WhatsApp connection status
 *
 * NOTE: This is a placeholder implementation. The backend needs to implement
 * SSE/WebSocket support for real-time status updates.
 *
 * @example
 * ```tsx
 * const status = useWhatsAppStatus();
 *
 * return (
 *   <div>
 *     <StatusBadge connected={status.connected} />
 *     {status.connected && <p>Logged in: {status.loggedIn}</p>}
 *   </div>
 * );
 * ```
 *
 * @returns Current WhatsApp connection status
 */
export function useWhatsAppStatus() {
  // TODO: Implement real-time status subscription via Tauri events
  // For now, return mock data to maintain compatibility
  logger.warn(
    "useWhatsAppStatus: Real-time status not yet implemented in Tauri backend",
  );

  return {
    connected: false,
    loggedIn: false,
    timestamp: new Date(),
    isConnecting: false,
  };
}

/**
 * Hook to subscribe to live QR code updates
 *
 * NOTE: This is a placeholder implementation. The backend needs to implement
 * SSE/WebSocket support for real-time QR code updates.
 *
 * @example
 * ```tsx
 * const { qr } = useQRCode({ enabled: !status.loggedIn });
 *
 * if (!qr) return null;
 *
 * return (
 *   <div>
 *     <QRCodeDisplay qr={qr.qrCode} expiresAt={qr.expiresAt} />
 *   </div>
 * );
 * ```
 *
 * @param options - Query options including enabled flag
 * @returns Current QR code data or null
 */
export function useQRCode(options?: { enabled?: boolean }) {
  // TODO: Implement real-time QR code subscription via Tauri events
  // For now, return null to maintain compatibility
  logger.warn(
    "useQRCode: Real-time QR code not yet implemented in Tauri backend",
  );

  return {
    qr: null,
    error: null,
  };
}

/**
 * Hook to subscribe to live queue statistics
 *
 * NOTE: This is a placeholder implementation. The backend needs to implement
 * SSE/WebSocket support for real-time queue stats.
 *
 * @example
 * ```tsx
 * const stats = useQueueStats();
 *
 * return (
 *   <div>
 *     <StatCard label="Pending" value={stats.pending} />
 *     <StatCard label="Failed" value={stats.failed} />
 *   </div>
 * );
 * ```
 *
 * @returns Current queue statistics
 */
export function useQueueStats() {
  // TODO: Implement real-time queue stats subscription via Tauri events
  // For now, return mock data to maintain compatibility
  logger.warn(
    "useQueueStats: Real-time queue stats not yet implemented in Tauri backend",
  );

  return {
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    deadLetter: 0,
    total: 0,
    timestamp: new Date(),
    isConnecting: false,
    error: null,
  };
}

/**
 * WhatsApp Hooks
 * React hooks for WhatsApp administrative operations using oRPC
 */
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { consumeEventIterator } from "@orpc/client";
import { toast } from "sonner";
import { client, orpc } from "@/utils/orpc";
import type {
  WhatsAppStatusEvent,
  QRCodeEvent,
  QueueStatsEvent,
} from "@workspace/schemas";

/**
 * Hook to subscribe to live WhatsApp connection status
 *
 * @example
 * ```tsx
 * const status = useWhatsAppStatus();
 *
 * return (
 *   <div>
 *     <StatusBadge connected={status.connected} />
 *     {status.connected && <p>Connected at {status.timestamp}</p>}
 *   </div>
 * );
 * ```
 *
 * @returns Current WhatsApp connection status
 */
export function useWhatsAppStatus() {
  const [status, setStatus] = useState<WhatsAppStatusEvent>({
    connected: false,
    loggedIn: false,
    timestamp: new Date(),
  });
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    let cancel: (() => Promise<void>) | null = null;

    const connect = async () => {
      try {
        const iterator = await client.whatsapp.liveStatus({});

        cancel = consumeEventIterator(iterator, {
          onEvent: (event) => {
            setStatus(event);
            setIsConnecting(false);
          },
          onError: (error) => {
            console.error("[WhatsApp Status] SSE error:", error);
            toast.error("Connection status stream error");
            setIsConnecting(false);
          },
          onFinish: () => {
            console.log("[WhatsApp Status] Stream finished");
            setIsConnecting(false);
          },
        });
      } catch (error) {
        console.error("[WhatsApp Status] Failed to connect:", error);
        toast.error("Failed to connect to status stream");
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      if (cancel) {
        cancel().catch(console.error);
      }
    };
  }, []);

  return { ...status, isConnecting };
}

/**
 * Hook to subscribe to live QR code updates
 *
 * @example
 * ```tsx
 * const qr = useQRCode({ enabled: !status.loggedIn });
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
  const [qr, setQR] = useState<QRCodeEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      setQR(null);
      return;
    }

    let cancel: (() => Promise<void>) | null = null;

    const connect = async () => {
      try {
        const iterator = await client.whatsapp.liveQRCode({});

        cancel = consumeEventIterator(iterator, {
          onEvent: (event) => {
            setQR(event);
            setError(null);
          },
          onError: (err) => {
            console.error("[QR Code] SSE error:", err);
            setError(err);
            toast.error("Failed to load QR code");
          },
          onFinish: () => {
            // Stream ended (device paired)
            setQR(null);
          },
        });
      } catch (err) {
        console.error("[QR Code] Failed to connect:", err);
        setError(err as Error);
        toast.error("Failed to connect to QR code stream");
      }
    };

    connect();

    return () => {
      if (cancel) {
        cancel().catch(console.error);
      }
    };
  }, [enabled]);

  return { qr, error };
}

/**
 * Hook to sync groups from WhatsApp
 *
 * @example
 * ```tsx
 * const syncGroups = useSyncGroups();
 *
 * const handleSync = () => {
 *   syncGroups.mutate();
 * };
 * ```
 *
 * @returns TanStack Mutation for syncing groups
 */
export function useSyncGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return orpc.whatsapp.syncGroups.call();
    },
    onSuccess: (data) => {
      // Invalidate groups query to refetch
      queryClient.invalidateQueries({
        queryKey: orpc.groups.key(),
      });
      toast.success(`Groups synced successfully (${data.count} total)`);
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

/**
 * Hook to subscribe to live queue statistics
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
  const [stats, setStats] = useState<QueueStatsEvent>({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    deadLetter: 0,
    total: 0,
    timestamp: new Date(),
  });
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancel: (() => Promise<void>) | null = null;

    const connect = async () => {
      try {
        const iterator = await client.whatsapp.liveQueueStats({});

        cancel = consumeEventIterator(iterator, {
          onEvent: (event) => {
            setStats(event);
            setIsConnecting(false);
            setError(null);
          },
          onError: (err) => {
            console.error("[Queue Stats] SSE error:", err);
            setError(err);
            setIsConnecting(false);
            toast.error("Queue stats stream error");
          },
          onFinish: () => {
            console.log("[Queue Stats] Stream finished");
            setIsConnecting(false);
          },
        });
      } catch (err) {
        console.error("[Queue Stats] Failed to connect:", err);
        setError(err as Error);
        setIsConnecting(false);
        toast.error("Failed to connect to queue stats stream");
      }
    };

    connect();

    return () => {
      if (cancel) {
        cancel().catch(console.error);
      }
    };
  }, []);

  return { ...stats, isConnecting, error };
}

/**
 * Hook to fetch failed messages with pagination
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFailedMessages({ page: 1, limit: 20 });
 *
 * return data?.messages.map(msg => (
 *   <div key={msg.id}>{msg.groupName} - {msg.lastError}</div>
 * ));
 * ```
 *
 * @param params - Pagination and filter parameters
 * @returns TanStack Query result with failed messages
 */
export function useFailedMessages(params?: {
  page?: number;
  limit?: number;
  groupName?: string;
}) {
  return useQuery(
    orpc.whatsapp.getFailedMessages.queryOptions({
      input: params ?? {},
    }),
  );
}

/**
 * Hook to retry a failed message
 *
 * @example
 * ```tsx
 * const retryMessage = useRetryMessage();
 *
 * const handleRetry = (id: string) => {
 *   retryMessage.mutate(
 *     { id },
 *     {
 *       onSuccess: () => toast.success('Message queued for retry'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for retrying messages
 */
export function useRetryMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) => {
      return orpc.whatsapp.retryMessage.call(params);
    },
    onSuccess: () => {
      // Invalidate failed messages query
      queryClient.invalidateQueries({
        queryKey: orpc.whatsapp.getFailedMessages.key(),
      });
      // Invalidate queue stats
      queryClient.invalidateQueries({
        queryKey: orpc.whatsapp.key(),
      });
      toast.success("Message queued for retry");
    },
    onError: (error) => {
      toast.error(`Retry failed: ${error.message}`);
    },
  });
}

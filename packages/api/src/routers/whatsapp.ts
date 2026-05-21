/**
 * WhatsApp Router
 * Administrative operations for WhatsApp integration
 *
 * NOTIFY Integration:
 * - Uses PostgreSQL NOTIFY/LISTEN for real-time updates
 * - Falls back to polling if NOTIFY not available
 * - Graceful degradation ensures reliability
 */
import { eventIterator, ORPCError } from "@orpc/server";
import { o } from "../index";
import {
  WhatsAppStatusEvent,
  QRCodeEvent,
  SyncGroupsResponse,
  QueueStatsEvent,
  ListFailedMessagesParams,
  ListFailedMessagesResponse,
  RetryMessageParams,
  RetryMessageResponse,
} from "@workspace/schemas";
import { env } from "@workspace/env/server";
import { prisma, Prisma } from "@workspace/db";
import { pgNotifier } from "@workspace/db/pg-notifier";

export const whatsappRouter = o.router({
  /**
   * Live connection status stream (NOTIFY-based with polling fallback)
   * Listens to PostgreSQL NOTIFY events for instant updates
   * Falls back to polling every 10 seconds if no NOTIFY received
   */
  liveStatus: o
    .output(eventIterator(WhatsAppStatusEvent))
    .handler(async function* ({ signal }) {
      const MAX_QUEUE = 100; // Prevent unbounded memory growth
      const queue: WhatsAppStatusEvent[] = [];
      let lastYield = Date.now();
      let droppedEvents = 0;

      // Event handler for NOTIFY
      const handler = (data: any) => {
        const event = {
          connected: data.connected ?? false,
          loggedIn: data.logged_in ?? false,
          timestamp: new Date(),
        };

        // Enforce max queue size to prevent memory buildup
        if (queue.length >= MAX_QUEUE) {
          queue.shift(); // Drop oldest event (FIFO)
          droppedEvents++;

          // Log warning on first drop and every 10 drops
          if (droppedEvents === 1 || droppedEvents % 10 === 0) {
            console.warn(
              `[WhatsApp Router] Status queue full: dropped ${droppedEvents} events (backpressure detected)`,
            );
          }
        }

        queue.push(event);
      };

      // Subscribe to NOTIFY channel
      pgNotifier.on("whatsapp_status", handler);

      try {
        // Yield initial status immediately
        const goServiceUrl = env.GO_WHATSAPP_SERVICE_URL;
        try {
          const response = await fetch(`${goServiceUrl}/api/whatsapp/status`, {
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            const data = (await response.json()) as {
              connected: boolean;
              logged_in: boolean;
            };
            yield {
              connected: data.connected,
              loggedIn: data.logged_in,
              timestamp: new Date(),
            };
            lastYield = Date.now();
          }
        } catch (error) {
          console.error(
            "[WhatsApp Router] Failed to fetch initial status:",
            error,
          );
          yield {
            connected: false,
            loggedIn: false,
            timestamp: new Date(),
          };
          lastYield = Date.now();
        }

        // Stream NOTIFY events with polling fallback
        while (signal && !signal.aborted) {
          if (queue.length > 0) {
            yield queue.shift()!;
            lastYield = Date.now();
          } else {
            // Fallback: poll every 10 seconds if no NOTIFY received
            if (Date.now() - lastYield > 10000) {
              try {
                const response = await fetch(
                  `${goServiceUrl}/api/whatsapp/status`,
                  {
                    signal: AbortSignal.timeout(5000),
                  },
                );
                if (response.ok) {
                  const data = (await response.json()) as {
                    connected: boolean;
                    logged_in: boolean;
                  };
                  yield {
                    connected: data.connected,
                    loggedIn: data.logged_in,
                    timestamp: new Date(),
                  };
                  lastYield = Date.now();
                }
              } catch (error) {
                console.error(
                  "[WhatsApp Router] Polling fallback failed:",
                  error,
                );
              }
            }
            // Wait 100ms before checking queue again
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      } finally {
        // Cleanup: remove event listener
        pgNotifier.off("whatsapp_status", handler);
      }
    }),

  /**
   * Live QR code stream for device pairing
   * Polls Go service every 50 seconds and yields QR code events
   */
  liveQRCode: o.output(eventIterator(QRCodeEvent)).handler(async function* ({
    signal,
  }) {
    const goServiceUrl = env.GO_WHATSAPP_SERVICE_URL;

    while (signal && !signal.aborted) {
      try {
        const response = await fetch(`${goServiceUrl}/api/whatsapp/qr`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (response.status === 400) {
          // Already logged in, stop streaming
          return;
        }

        if (!response.ok) {
          throw new Error(`Go service returned ${response.status}`);
        }

        const data = (await response.json()) as {
          qr_code: string;
        };

        yield {
          qrCode: data.qr_code,
          expiresAt: new Date(Date.now() + 60000), // 60s expiry
        };
      } catch (error) {
        console.error("[WhatsApp Router] Failed to fetch QR code:", error);
        throw error; // Propagate error to client
      }

      // Refresh every 50 seconds (before 60s expiry)
      await new Promise((resolve) => setTimeout(resolve, 50000));
    }
  }),

  /**
   * Trigger group sync from WhatsApp
   * Calls Go service to fetch latest group list
   */
  syncGroups: o.output(SyncGroupsResponse).handler(async () => {
    const goServiceUrl = env.GO_WHATSAPP_SERVICE_URL;

    try {
      const response = await fetch(`${goServiceUrl}/api/whatsapp/groups/sync`, {
        method: "POST",
        signal: AbortSignal.timeout(30000), // 30 second timeout for sync operation
      });

      if (!response.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Go service returned ${response.status}`,
        });
      }

      // Get updated group count
      const groups = await prisma.group.count();

      return {
        success: true,
        count: groups,
      };
    } catch (error) {
      console.error("[WhatsApp Router] Failed to sync groups:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to sync groups",
      });
    }
  }),

  /**
   * Live queue statistics stream (NOTIFY-based with polling fallback)
   * Listens to PostgreSQL NOTIFY events on queue changes
   * Falls back to polling every 10 seconds if no NOTIFY received
   */
  liveQueueStats: o
    .output(eventIterator(QueueStatsEvent))
    .handler(async function* ({ signal }) {
      const queue: QueueStatsEvent[] = [];
      let lastYield = Date.now();

      // Event handler for NOTIFY - queries fresh stats
      const handler = async () => {
        try {
          const [pending, processing, failed, completed, deadLetter] =
            await Promise.all([
              prisma.whatsAppMessageQueue.count({
                where: { status: "pending" },
              }),
              prisma.whatsAppMessageQueue.count({
                where: { status: "processing" },
              }),
              prisma.whatsAppMessageQueue.count({
                where: { status: "failed" },
              }),
              prisma.whatsAppMessageQueue.count({
                where: { status: "completed" },
              }),
              prisma.whatsAppMessageQueue.count({
                where: { status: "dead_letter" },
              }),
            ]);

          const total = pending + processing + failed + completed + deadLetter;

          queue.push({
            pending,
            processing,
            failed,
            completed,
            deadLetter,
            total,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(
            "[WhatsApp Router] Failed to fetch queue stats:",
            error,
          );
        }
      };

      // Subscribe to NOTIFY channel
      pgNotifier.on("queue_stats", handler);

      try {
        // Yield initial stats immediately
        await handler();
        if (queue.length > 0) {
          yield queue.shift()!;
          lastYield = Date.now();
        }

        // Stream NOTIFY events with polling fallback
        while (signal && !signal.aborted) {
          if (queue.length > 0) {
            yield queue.shift()!;
            lastYield = Date.now();
          } else {
            // Fallback: poll every 10 seconds if no NOTIFY received
            if (Date.now() - lastYield > 10000) {
              await handler();
              if (queue.length > 0) {
                yield queue.shift()!;
                lastYield = Date.now();
              }
            }
            // Wait 100ms before checking queue again
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      } finally {
        // Cleanup: remove event listener
        pgNotifier.off("queue_stats", handler);
      }
    }),

  /**
   * Get failed messages with pagination
   */
  getFailedMessages: o
    .input(ListFailedMessagesParams)
    .output(ListFailedMessagesResponse)
    .handler(async ({ input }) => {
      const { page = 1, limit = 20, groupName } = input;
      const offset = (page - 1) * limit;

      const where: Prisma.WhatsAppMessageQueueWhereInput = {
        status: "failed",
        ...(groupName && {
          groupName: {
            contains: groupName,
            mode: "insensitive",
          },
        }),
      };

      const [messages, total] = await Promise.all([
        prisma.whatsAppMessageQueue.findMany({
          where,
          orderBy: { lastErrorAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.whatsAppMessageQueue.count({ where }),
      ]);

      return {
        messages,
        total,
        page,
        limit,
      };
    }),

  /**
   * Retry a failed message
   * Resets status to pending and clears error
   */
  retryMessage: o
    .input(RetryMessageParams)
    .output(RetryMessageResponse)
    .handler(async ({ input }) => {
      try {
        const message = await prisma.whatsAppMessageQueue.update({
          where: { id: input.id },
          data: {
            status: "pending",
            nextRetryAt: null,
            lastError: null,
          },
        });

        return {
          success: true,
          message,
        };
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          throw new ORPCError("NOT_FOUND", {
            message: "Message not found",
          });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to retry message",
        });
      }
    }),
});

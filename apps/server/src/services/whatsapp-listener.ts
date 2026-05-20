/**
 * WhatsApp LISTEN Service
 *
 * Establishes a PostgreSQL LISTEN connection to receive real-time notifications
 * when new WhatsApp messages are inserted into the queue by the Go service.
 *
 * Architecture:
 * 1. Go service inserts message → whatsapp_message_queue
 * 2. PostgreSQL trigger fires → NOTIFY 'new_whatsapp_message'
 * 3. This service receives notification via LISTEN
 * 4. Delegates processing to message-processor
 */

import { Client } from "pg";
import {
  processMessage,
  processRetries,
} from "../processors/message-processor";

let listenClient: Client | null = null;
let isShuttingDown = false;
let retryInterval: NodeJS.Timeout | null = null;

/**
 * Start the WhatsApp LISTEN service
 *
 * @param processExistingOnStartup - If true, processes all pending messages in queue on startup
 */
export async function startWhatsAppListener(
  processExistingOnStartup = true,
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create dedicated connection for LISTEN (cannot be pooled)
  listenClient = new Client({
    connectionString: databaseUrl,
  });

  try {
    await listenClient.connect();
    console.log("[WhatsApp Listener] Connected to PostgreSQL");

    // Set up LISTEN on the notification channel
    await listenClient.query("LISTEN new_whatsapp_message");
    console.log(
      "[WhatsApp Listener] Listening on 'new_whatsapp_message' channel",
    );

    // Handle incoming notifications
    listenClient.on("notification", async (msg) => {
      if (msg.channel === "new_whatsapp_message") {
        const messageId = msg.payload;

        if (!messageId) {
          console.error(
            "[WhatsApp Listener] Received notification without message ID",
          );
          return;
        }

        console.log(
          `[WhatsApp Listener] Received notification for message: ${messageId}`,
        );

        // Process message asynchronously (don't block LISTEN connection)
        processMessage(messageId).catch((error) => {
          console.error(
            `[WhatsApp Listener] Failed to process message ${messageId}:`,
            error.message,
          );
        });
      }
    });

    // Handle connection errors
    listenClient.on("error", (err) => {
      console.error("[WhatsApp Listener] Connection error:", err);

      if (!isShuttingDown) {
        // Attempt to reconnect after delay
        console.log(
          "[WhatsApp Listener] Attempting to reconnect in 5 seconds...",
        );
        setTimeout(() => {
          startWhatsAppListener(false).catch((error) => {
            console.error("[WhatsApp Listener] Reconnection failed:", error);
          });
        }, 5000);
      }
    });

    // Process existing pending messages on startup (if enabled)
    if (processExistingOnStartup) {
      await processExistingPendingMessages();
    }

    // Start periodic retry processor (every 10 seconds)
    retryInterval = setInterval(() => {
      processRetries().catch((error) => {
        console.error("[WhatsApp Listener] Retry processor error:", error);
      });
    }, 10000); // 10 seconds

    console.log(
      "[WhatsApp Listener] Service started successfully with retry processor",
    );
  } catch (error) {
    console.error("[WhatsApp Listener] Failed to start:", error);
    throw error;
  }
}

/**
 * Process all existing pending messages in the queue
 * Called on startup to handle any messages that arrived while server was down
 * Also processes failed messages that are ready for retry
 */
async function processExistingPendingMessages(): Promise<void> {
  try {
    // Use a separate query connection (not the LISTEN connection)
    const { prisma } = await import("@workspace/db");

    // Find both pending messages and failed messages ready for retry
    const [pendingMessages, failedMessages] = await Promise.all([
      prisma.whatsAppMessageQueue.findMany({
        where: {
          status: "pending",
        },
        orderBy: {
          createdAt: "asc", // Process oldest first
        },
      }),
      prisma.whatsAppMessageQueue.findMany({
        where: {
          status: "failed",
          nextRetryAt: {
            lte: new Date(), // Retry time has passed
          },
        },
        orderBy: {
          nextRetryAt: "asc", // Process oldest retries first
        },
      }),
    ]);

    const totalMessages = pendingMessages.length + failedMessages.length;

    if (totalMessages === 0) {
      console.log(
        "[WhatsApp Listener] No pending or failed messages to process",
      );
      return;
    }

    console.log(
      `[WhatsApp Listener] Processing ${pendingMessages.length} pending and ${failedMessages.length} failed messages on startup`,
    );

    // Reset failed messages to pending so they can be claimed
    if (failedMessages.length > 0) {
      await prisma.whatsAppMessageQueue.updateMany({
        where: {
          id: { in: failedMessages.map((m) => m.id) },
        },
        data: {
          status: "pending",
          nextRetryAt: null,
        },
      });
    }

    // Process all messages (pending + reset failed)
    const allMessages = [...pendingMessages, ...failedMessages];
    for (const message of allMessages) {
      try {
        await processMessage(message.id);
      } catch (error) {
        console.error(
          `[WhatsApp Listener] Failed to process existing message ${message.id}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
        // Continue processing other messages even if one fails
      }
    }

    console.log("[WhatsApp Listener] Finished processing existing messages");
  } catch (error) {
    console.error(
      "[WhatsApp Listener] Error processing existing messages:",
      error,
    );
    // Don't throw - this is a best-effort operation on startup
  }
}

/**
 * Stop the WhatsApp LISTEN service gracefully
 */
export async function stopWhatsAppListener(): Promise<void> {
  isShuttingDown = true;

  // Stop retry interval
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
    console.log("[WhatsApp Listener] Stopped retry processor");
  }

  if (!listenClient) {
    return;
  }

  try {
    console.log("[WhatsApp Listener] Shutting down...");

    // Unlisten from channel
    await listenClient.query("UNLISTEN new_whatsapp_message");

    // Close connection
    await listenClient.end();

    listenClient = null;

    console.log("[WhatsApp Listener] Shutdown complete");
  } catch (error) {
    console.error("[WhatsApp Listener] Error during shutdown:", error);
    throw error;
  }
}

/**
 * Check if the listener is currently running
 */
export function isListenerRunning(): boolean {
  return listenClient !== null && !isShuttingDown;
}

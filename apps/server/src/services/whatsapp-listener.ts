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
import { processMessage } from "../processors/message-processor";

let listenClient: Client | null = null;
let isShuttingDown = false;

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

    console.log("[WhatsApp Listener] Service started successfully");
  } catch (error) {
    console.error("[WhatsApp Listener] Failed to start:", error);
    throw error;
  }
}

/**
 * Process all existing pending messages in the queue
 * Called on startup to handle any messages that arrived while server was down
 */
async function processExistingPendingMessages(): Promise<void> {
  try {
    // Use a separate query connection (not the LISTEN connection)
    const { prisma } = await import("@workspace/db");

    const pendingMessages = await prisma.whatsAppMessageQueue.findMany({
      where: {
        status: "pending",
      },
      orderBy: {
        createdAt: "asc", // Process oldest first
      },
    });

    if (pendingMessages.length === 0) {
      console.log("[WhatsApp Listener] No pending messages to process");
      return;
    }

    console.log(
      `[WhatsApp Listener] Processing ${pendingMessages.length} existing pending messages`,
    );

    // Process messages sequentially to avoid overwhelming the system
    for (const message of pendingMessages) {
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

    console.log(
      "[WhatsApp Listener] Finished processing existing pending messages",
    );
  } catch (error) {
    console.error(
      "[WhatsApp Listener] Error processing existing pending messages:",
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

/**
 * WhatsApp Message Processor
 *
 * Handles the business logic for processing WhatsApp messages from the queue:
 * 1. Fetch message from queue by ID
 * 2. Extract pharmaceutical data using AI
 * 3. Create Offer or Request based on messageType
 * 4. Update queue status to 'completed'
 * 5. Handle retries and dead letter queue
 */

import { prisma } from "@workspace/db";
import { extractPharmaceuticalMessage } from "@workspace/ai";
import type { MessageQueueStatus } from "@workspace/db";

/**
 * Process a single WhatsApp message from the queue
 *
 * @param messageId - The ID of the message in whatsapp_message_queue
 */
export async function processMessage(messageId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Atomically claim the message by updating status from 'pending' to 'processing'
    // This prevents race conditions - only one process will successfully update
    const updateResult = await prisma.whatsAppMessageQueue.updateMany({
      where: {
        id: messageId,
        status: "pending", // Only update if still pending
      },
      data: {
        status: "processing",
        processedAt: new Date(),
      },
    });

    // If no rows were updated, the message was already claimed or doesn't exist
    if (updateResult.count === 0) {
      // Fetch to determine why (for logging purposes)
      const messageData = await prisma.whatsAppMessageQueue.findUnique({
        where: { id: messageId },
      });

      if (!messageData) {
        console.error(`[Message Processor] Message not found: ${messageId}`);
        return;
      }

      // Message exists but wasn't pending - already processed or being processed
      console.log(
        `[Message Processor] Message ${messageId} already claimed or processed (status: ${messageData.status})`,
      );
      return;
    }

    // Successfully claimed the message - now fetch full data for processing
    const messageData = await prisma.whatsAppMessageQueue.findUnique({
      where: { id: messageId },
    });

    if (!messageData) {
      // This should never happen since we just updated it
      console.error(
        `[Message Processor] Message disappeared after claim: ${messageId}`,
      );
      return;
    }

    console.log(`[Message Processor] Processing message: ${messageId}`);
    console.log(`[Message Processor] Group: ${messageData.groupName}`);
    console.log(
      `[Message Processor] Sender: ${messageData.senderName} (${messageData.senderPhone})`,
    );
    console.log(
      `[Message Processor] Text preview: ${messageData.rawText.substring(0, 100)}...`,
    );

    // Extract pharmaceutical data using AI
    const extracted = await extractPharmaceuticalMessage(messageData.rawText);

    console.log(`[Message Processor] Extracted data:`, {
      messageType: extracted.messageType,
      medicationName: extracted.medicationName,
      dosage: extracted.dosage,
      quantity: extracted.quantity,
      price: extracted.price,
    });

    // Create Offer or Request based on messageType
    let createdOfferId: string | null = null;
    let createdRequestId: string | null = null;

    if (extracted.messageType === "offer") {
      const offer = await prisma.offer.create({
        data: {
          medicationName: extracted.medicationName,
          dosage: extracted.dosage,
          quantity: extracted.quantity,
          price: extracted.price?.toString() ?? null,
          groupName: messageData.groupName,
          senderPhone: messageData.senderPhone,
          status: "active",
          rawText: messageData.rawText,
          whatsappMessageId: messageData.whatsappMessageId,
        },
      });

      createdOfferId = offer.id;
      console.log(`[Message Processor] Created offer: ${offer.id}`);
    } else if (extracted.messageType === "request") {
      const request = await prisma.request.create({
        data: {
          medicationName: extracted.medicationName,
          dosage: extracted.dosage,
          quantity: extracted.quantity,
          maxPrice: extracted.price?.toString() ?? null,
          groupName: messageData.groupName,
          senderPhone: messageData.senderPhone,
          status: "active",
          rawText: messageData.rawText,
          whatsappMessageId: messageData.whatsappMessageId,
        },
      });

      createdRequestId = request.id;
      console.log(`[Message Processor] Created request: ${request.id}`);
    } else {
      throw new Error(`Unknown message type: ${extracted.messageType}`);
    }

    // Update queue status to 'completed'
    const processingTime = Date.now() - startTime;
    await prisma.whatsAppMessageQueue.update({
      where: { id: messageId },
      data: {
        status: "completed",
        extractedData: extracted as any, // Store extracted data for audit
        createdOfferId,
        createdRequestId,
        completedAt: new Date(),
        lastError: null,
        lastErrorAt: null,
      },
    });

    console.log(
      `[Message Processor] Successfully processed message ${messageId} in ${processingTime}ms`,
    );

    // Note: Matching is done manually by operators through the review interface
    // The simulate endpoint can be used to preview potential matches
    if (createdOfferId) {
      console.log(
        `[Message Processor] Offer ${createdOfferId} ready for matching`,
      );
    } else if (createdRequestId) {
      console.log(
        `[Message Processor] Request ${createdRequestId} ready for matching`,
      );
    }
  } catch (error) {
    await handleProcessingError(messageId, error);
  }
}

/**
 * Handle processing errors with retry logic and dead letter queue
 */
async function handleProcessingError(
  messageId: string,
  error: unknown,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  console.error(
    `[Message Processor] Error processing message ${messageId}:`,
    errorMessage,
  );

  try {
    // Fetch current message state
    const messageData = await prisma.whatsAppMessageQueue.findUnique({
      where: { id: messageId },
    });

    if (!messageData) {
      console.error(
        `[Message Processor] Message not found during error handling: ${messageId}`,
      );
      return;
    }

    const newRetryCount = messageData.retryCount + 1;
    const shouldRetry = newRetryCount < messageData.maxRetries;

    let newStatus: MessageQueueStatus;
    let nextRetryAt: Date | null = null;

    if (shouldRetry) {
      newStatus = "failed"; // Will be retried
      // Calculate next retry time with exponential backoff
      const retryDelayMs = Math.min(1000 * Math.pow(2, newRetryCount), 60000); // Max 60s
      nextRetryAt = new Date(Date.now() + retryDelayMs);

      console.log(
        `[Message Processor] Message ${messageId} will be retried (attempt ${newRetryCount}/${messageData.maxRetries}) at ${nextRetryAt.toISOString()}`,
      );
    } else {
      newStatus = "dead_letter"; // Max retries reached
      console.error(
        `[Message Processor] Message ${messageId} moved to dead letter queue after ${newRetryCount} attempts`,
      );
    }

    // Update message with error details and retry schedule
    await prisma.whatsAppMessageQueue.update({
      where: { id: messageId },
      data: {
        status: newStatus,
        retryCount: newRetryCount,
        nextRetryAt,
        lastError: errorMessage.substring(0, 500), // Limit error message length
        lastErrorAt: new Date(),
      },
    });

    // Note: Retry will be picked up by the periodic retry processor
    // No need for setTimeout - retries are durable and survive restarts
  } catch (updateError) {
    console.error(
      `[Message Processor] Failed to update error state for message ${messageId}:`,
      updateError,
    );
  }
}

/**
 * Manually retry a failed message
 * Useful for admin operations or debugging
 */
export async function retryFailedMessage(messageId: string): Promise<void> {
  const messageData = await prisma.whatsAppMessageQueue.findUnique({
    where: { id: messageId },
  });

  if (!messageData) {
    throw new Error(`Message not found: ${messageId}`);
  }

  if (messageData.status !== "failed" && messageData.status !== "dead_letter") {
    throw new Error(
      `Message ${messageId} is not in failed or dead_letter status (current: ${messageData.status})`,
    );
  }

  // Reset status to pending and clear error
  await prisma.whatsAppMessageQueue.update({
    where: { id: messageId },
    data: {
      status: "pending",
      lastError: null,
      lastErrorAt: null,
    },
  });

  console.log(`[Message Processor] Manually retrying message: ${messageId}`);

  // Process immediately
  await processMessage(messageId);
}

/**
 * Process messages that are ready for retry
 * Should be called periodically (e.g., every 10 seconds)
 */
export async function processRetries(): Promise<void> {
  try {
    // Find failed messages that are ready for retry
    // Note: maxRetries enforcement is handled by handleProcessingError
    const messagesToRetry = await prisma.whatsAppMessageQueue.findMany({
      where: {
        status: "failed",
        nextRetryAt: {
          lte: new Date(), // Retry time has passed
        },
      },
      orderBy: {
        nextRetryAt: "asc", // Process oldest retries first
      },
      take: 10, // Process in batches to avoid overwhelming the system
    });

    if (messagesToRetry.length > 0) {
      console.log(
        `[Message Processor] Processing ${messagesToRetry.length} retry messages`,
      );

      // Reset status to pending so they can be claimed
      const messageIds = messagesToRetry.map((m) => m.id);
      await prisma.whatsAppMessageQueue.updateMany({
        where: {
          id: { in: messageIds },
        },
        data: {
          status: "pending",
          nextRetryAt: null,
        },
      });

      // Process each message
      for (const message of messagesToRetry) {
        processMessage(message.id).catch((error) => {
          console.error(
            `[Message Processor] Retry processing failed for message ${message.id}:`,
            error,
          );
        });
      }
    }
  } catch (error) {
    console.error("[Message Processor] Error processing retries:", error);
  }
}

/**
 * Get statistics about the message queue
 */
export async function getQueueStats() {
  const stats = await prisma.whatsAppMessageQueue.groupBy({
    by: ["status"],
    _count: true,
  });

  const statsByStatus = Object.fromEntries(
    stats.map((s) => [s.status, s._count]),
  );

  const totalMessages = await prisma.whatsAppMessageQueue.count();
  const oldestPending = await prisma.whatsAppMessageQueue.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  return {
    total: totalMessages,
    byStatus: statsByStatus,
    oldestPendingAge: oldestPending
      ? Date.now() - oldestPending.createdAt.getTime()
      : null,
  };
}

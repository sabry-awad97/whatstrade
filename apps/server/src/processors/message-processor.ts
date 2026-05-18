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
    // Fetch message from queue with row-level locking to prevent concurrent processing
    const message = await prisma.whatsAppMessageQueue.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      console.error(`[Message Processor] Message not found: ${messageId}`);
      return;
    }

    // Skip if already processed or currently processing
    if (message.status === "completed") {
      console.log(
        `[Message Processor] Message already completed: ${messageId}`,
      );
      return;
    }

    if (message.status === "processing") {
      console.log(
        `[Message Processor] Message already being processed: ${messageId}`,
      );
      return;
    }

    if (message.status === "dead_letter") {
      console.log(
        `[Message Processor] Message in dead letter queue: ${messageId}`,
      );
      return;
    }

    // Update status to 'processing' to prevent concurrent processing
    await prisma.whatsAppMessageQueue.update({
      where: { id: messageId },
      data: { status: "processing" },
    });

    console.log(`[Message Processor] Processing message: ${messageId}`);
    console.log(`[Message Processor] Group: ${message.groupName}`);
    console.log(
      `[Message Processor] Sender: ${message.senderName} (${message.senderPhone})`,
    );
    console.log(
      `[Message Processor] Text preview: ${message.rawText.substring(0, 100)}...`,
    );

    // Extract pharmaceutical data using AI
    const extracted = await extractPharmaceuticalMessage(message.rawText);

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
          groupName: message.groupName,
          senderPhone: message.senderPhone,
          status: "active",
          rawText: message.rawText,
          whatsappMessageId: message.whatsappMessageId,
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
          groupName: message.groupName,
          senderPhone: message.senderPhone,
          status: "active",
          rawText: message.rawText,
          whatsappMessageId: message.whatsappMessageId,
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
        processedAt: new Date(),
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
    const message = await prisma.whatsAppMessageQueue.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      console.error(
        `[Message Processor] Message not found during error handling: ${messageId}`,
      );
      return;
    }

    const newRetryCount = message.retryCount + 1;
    const shouldRetry = newRetryCount < message.maxRetries;

    let newStatus: MessageQueueStatus;
    if (shouldRetry) {
      newStatus = "failed"; // Will be retried
      console.log(
        `[Message Processor] Message ${messageId} will be retried (attempt ${newRetryCount}/${message.maxRetries})`,
      );
    } else {
      newStatus = "dead_letter"; // Max retries reached
      console.error(
        `[Message Processor] Message ${messageId} moved to dead letter queue after ${newRetryCount} attempts`,
      );
    }

    // Update message with error details
    await prisma.whatsAppMessageQueue.update({
      where: { id: messageId },
      data: {
        status: newStatus,
        retryCount: newRetryCount,
        lastError: errorMessage.substring(0, 500), // Limit error message length
        lastErrorAt: new Date(),
      },
    });

    // If should retry, schedule retry with exponential backoff
    if (shouldRetry) {
      const retryDelayMs = Math.min(1000 * Math.pow(2, newRetryCount), 60000); // Max 60s
      console.log(`[Message Processor] Scheduling retry in ${retryDelayMs}ms`);

      setTimeout(() => {
        processMessage(messageId).catch((retryError) => {
          console.error(
            `[Message Processor] Retry failed for message ${messageId}:`,
            retryError,
          );
        });
      }, retryDelayMs);
    }
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
  const message = await prisma.whatsAppMessageQueue.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error(`Message not found: ${messageId}`);
  }

  if (message.status !== "failed" && message.status !== "dead_letter") {
    throw new Error(
      `Message ${messageId} is not in failed or dead_letter status (current: ${message.status})`,
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

import { z } from "zod";
import { invokeCommand, PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WhatsAppApi");

// ============================================================================
// Schemas
// ============================================================================

export const messageQueueStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "dead_letter",
]);

export const whatsappMessageQueueSchema = z.object({
  id: z.string(),
  whatsapp_message_id: z.string().nullable(),
  whatsapp_group_id: z.string().nullable(),
  group_name: z.string(),
  sender_phone: z.string(),
  sender_name: z.string(),
  raw_text: z.string(),
  received_at: z.coerce.date(),
  status: messageQueueStatusSchema,
  retry_count: z.number(),
  max_retries: z.number(),
  next_retry_at: z.coerce.date().nullable(),
  last_error: z.string().nullable(),
  last_error_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  processed_at: z.coerce.date().nullable(),
  completed_at: z.coerce.date().nullable(),
  extracted_data: z.string().nullable(),
  created_offer_id: z.string().nullable(),
  created_request_id: z.string().nullable(),
});

export const syncGroupsResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
});

export const failedMessagesResponseSchema = z.object({
  messages: z.array(whatsappMessageQueueSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type MessageQueueStatus = z.infer<typeof messageQueueStatusSchema>;
export type WhatsAppMessageQueue = z.infer<typeof whatsappMessageQueueSchema>;
export type SyncGroupsResponse = z.infer<typeof syncGroupsResponseSchema>;
export type FailedMessagesResponse = z.infer<
  typeof failedMessagesResponseSchema
>;

// ============================================================================
// Request Types
// ============================================================================

export type GetFailedMessagesParams = {
  filter?: {
    group_name?: string;
  };
  pagination?: PaginationParams;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Sync WhatsApp groups from Go service
 */
export async function syncGroups(): Promise<SyncGroupsResponse> {
  logger.info("Syncing WhatsApp groups");
  return invokeCommand("sync_groups", syncGroupsResponseSchema);
}

/**
 * Get failed messages with optional filtering and pagination
 */
export async function getFailedMessages(
  params?: GetFailedMessagesParams,
): Promise<FailedMessagesResponse> {
  logger.info("Getting failed messages", params);
  return invokeCommand("get_failed_messages", failedMessagesResponseSchema, {
    params,
  });
}

/**
 * Retry a failed message
 */
export async function retryMessage(id: string): Promise<WhatsAppMessageQueue> {
  logger.info("Retrying message", { id });
  return invokeCommand("retry_message", whatsappMessageQueueSchema, {
    params: { id },
  });
}

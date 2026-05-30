import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MessageQueueApi");

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
  whatsapp_message_id: z.string(),
  whatsapp_group_id: z.string(),
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
  extracted_data: z.record(z.string(), z.unknown()).nullable(),
  created_offer_id: z.string().nullable(),
  created_request_id: z.string().nullable(),
});

export const failedMessagesResponseSchema = z.object({
  messages: z.array(whatsappMessageQueueSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const syncGroupsResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
});

export const queueStatsSchema = z.object({
  pending: z.number(),
  processing: z.number(),
  completed: z.number(),
  failed: z.number(),
  dead_letter: z.number(),
  total: z.number(),
});

export type MessageQueueStatus = z.infer<typeof messageQueueStatusSchema>;
export type WhatsAppMessageQueue = z.infer<typeof whatsappMessageQueueSchema>;
export type FailedMessagesResponse = z.infer<
  typeof failedMessagesResponseSchema
>;
export type SyncGroupsResponse = z.infer<typeof syncGroupsResponseSchema>;
export type QueueStats = z.infer<typeof queueStatsSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type GetFailedMessagesParams = {
  filter?: {
    group_name?: string;
  };
  pagination?: {
    page: number;
    page_size: number;
  };
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get failed messages with optional filtering and pagination
 *
 * NOTE: This is a placeholder implementation. The Tauri commands need to be created.
 */
export async function getFailedMessages(
  params?: GetFailedMessagesParams,
): Promise<FailedMessagesResponse> {
  logger.info("Getting failed messages", params);

  // TODO: Implement when Tauri command is created
  // return invokeCommand("get_failed_messages", failedMessagesResponseSchema, {
  //   params: {
  //     data: {
  //       page: params?.pagination?.page ?? 0,
  //       limit: params?.pagination?.page_size ?? 20,
  //       group_name: params?.filter?.group_name,
  //     },
  //   },
  // });

  logger.warn("getFailedMessages: Tauri command not yet implemented");
  return Promise.resolve({
    messages: [],
    total: 0,
    page: params?.pagination?.page ?? 0,
    limit: params?.pagination?.page_size ?? 20,
  });
}

/**
 * Retry a failed message
 *
 * NOTE: This is a placeholder implementation. The Tauri commands need to be created.
 */
export async function retryMessage(id: string): Promise<WhatsAppMessageQueue> {
  logger.info("Retrying message", { id });

  // TODO: Implement when Tauri command is created
  // return invokeCommand("retry_message", whatsappMessageQueueSchema, {
  //   params: { data: { id } },
  // });

  logger.warn("retryMessage: Tauri command not yet implemented");
  throw new Error("retryMessage command not yet implemented");
}

/**
 * Sync WhatsApp groups
 *
 * NOTE: This is a placeholder implementation. The Tauri commands need to be created.
 */
export async function syncGroups(): Promise<SyncGroupsResponse> {
  logger.info("Syncing WhatsApp groups");

  // TODO: Implement when Tauri command is created
  // return invokeCommand("sync_groups", syncGroupsResponseSchema);

  logger.warn("syncGroups: Tauri command not yet implemented");
  return Promise.resolve({
    success: false,
    count: 0,
  });
}

/**
 * Get queue statistics
 *
 * NOTE: This is a placeholder implementation. The Tauri commands need to be created.
 */
export async function getQueueStats(): Promise<QueueStats> {
  logger.info("Getting queue statistics");

  // TODO: Implement when Tauri command is created
  // return invokeCommand("get_queue_stats", queueStatsSchema);

  logger.warn("getQueueStats: Tauri command not yet implemented");
  return Promise.resolve({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead_letter: 0,
    total: 0,
  });
}

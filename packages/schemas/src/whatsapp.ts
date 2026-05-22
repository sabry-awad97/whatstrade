/**
 * WhatsApp administrative operations schemas
 */
import { z } from "zod";

/**
 * @summary WhatsApp connection status event
 * Streamed via SSE for real-time updates
 */
export const WhatsAppStatusEvent = z.object({
  connected: z.boolean(),
  loggedIn: z.boolean(),
  timestamp: z.coerce.date(),
});

export type WhatsAppStatusEvent = z.infer<typeof WhatsAppStatusEvent>;

/**
 * @summary QR code event for device pairing
 * Streamed via SSE with auto-refresh
 */
export const QRCodeEvent = z.object({
  qrCode: z.string(), // Base64 or data URL
  expiresAt: z.coerce.date(),
});

export type QRCodeEvent = z.infer<typeof QRCodeEvent>;

/**
 * @summary Sync groups response
 */
export const SyncGroupsResponse = z.object({
  success: z.boolean(),
  count: z.number().optional(),
});

export type SyncGroupsResponse = z.infer<typeof SyncGroupsResponse>;

/**
 * @summary Queue statistics event
 * Streamed via SSE for real-time monitoring
 */
export const QueueStatsEvent = z.object({
  pending: z.number(),
  processing: z.number(),
  failed: z.number(),
  completed: z.number(),
  deadLetter: z.number(),
  total: z.number(),
  timestamp: z.coerce.date(),
});

export type QueueStatsEvent = z.infer<typeof QueueStatsEvent>;

/**
 * @summary Failed message item
 */
export const FailedMessageItem = z.object({
  id: z.string().uuid(),
  whatsappMessageId: z.string(),
  whatsappGroupId: z.string(),
  groupName: z.string(),
  senderPhone: z.string(),
  senderName: z.string().nullish(),
  rawText: z.string(),
  retryCount: z.number(),
  maxRetries: z.number(),
  lastError: z.string().nullish(),
  lastErrorAt: z.coerce.date().nullish(),
  createdAt: z.coerce.date(),
});

export type FailedMessageItem = z.infer<typeof FailedMessageItem>;

/**
 * @summary List failed messages query params
 */
export const ListFailedMessagesParams = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  groupName: z.string().optional(),
});

export type ListFailedMessagesParams = z.infer<typeof ListFailedMessagesParams>;

/**
 * @summary List failed messages response
 */
export const ListFailedMessagesResponse = z.object({
  messages: z.array(FailedMessageItem),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type ListFailedMessagesResponse = z.infer<
  typeof ListFailedMessagesResponse
>;

/**
 * @summary Retry message params
 */
export const RetryMessageParams = z.object({
  id: z.string().uuid(),
});

export type RetryMessageParams = z.infer<typeof RetryMessageParams>;

/**
 * @summary Retry message response
 */
export const RetryMessageResponse = z.object({
  success: z.boolean(),
  message: FailedMessageItem,
});

export type RetryMessageResponse = z.infer<typeof RetryMessageResponse>;

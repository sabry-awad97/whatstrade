import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WhatsAppApi");

// ============================================================================
// Schemas
// ============================================================================

export const whatsappStatusResponseSchema = z.object({
  connected: z.boolean(),
  logged_in: z.boolean(),
  phone_number: z.string().nullable(),
  timestamp: z.coerce.date(),
});

export const pairCodeResponseSchema = z.object({
  code: z.string(),
});

export const sendMessageResponseSchema = z.object({
  message_id: z.string(),
  timestamp: z.coerce.date(),
});

export const pairCodeRequestSchema = z.object({
  phone_number: z.string().min(1),
});

export const sendMessageRequestSchema = z.object({
  recipient_jid: z.string().min(1),
  text: z.string().min(1),
});

// Event schemas
export const connectionStateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("connected") }),
  z.object({ type: z.literal("disconnected") }),
  z.object({
    type: z.literal("logged_out"),
    reason: z.string().nullable(),
  }),
  z.object({ type: z.literal("stream_replaced") }),
  z.object({
    type: z.literal("connect_failure"),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("temporary_ban"),
    reason: z.string(),
    expires_in_secs: z.number(),
  }),
]);

export const stateChangeEventSchema = z.object({
  state: connectionStateSchema,
  timestamp: z.coerce.date(),
});

export const qrCodeEventSchema = z.object({
  code: z.string(),
  timeout_secs: z.number(),
  timestamp: z.coerce.date(),
});

export const pairCodeEventSchema = z.object({
  code: z.string(),
  timeout_secs: z.number(),
  timestamp: z.coerce.date(),
});

export const pairSuccessEventSchema = z.object({
  jid: z.string(),
  lid: z.string().nullable(),
  push_name: z.string(),
  platform: z.string(),
  timestamp: z.coerce.date(),
});

export const pairErrorEventSchema = z.object({
  reason: z.string(),
  timestamp: z.coerce.date(),
});

export const messageKindSchema = z.enum([
  "text",
  "image",
  "video",
  "audio",
  "document",
  "sticker",
  "location",
  "contact",
  "reaction",
  "other",
]);

export const messageEventSchema = z.object({
  id: z.string(),
  chat: z.string(),
  sender: z.string(),
  from_me: z.boolean(),
  timestamp: z.coerce.date(),
  kind: messageKindSchema,
  text: z.string().nullable(),
  caption: z.string().nullable(),
  is_group: z.boolean(),
  push_name: z.string().nullable(),
});

export const receiptEventSchema = z.object({
  chat: z.string(),
  from: z.string(),
  message_ids: z.array(z.string()),
  kind: z.string(),
  timestamp: z.coerce.date(),
});

export const presenceEventSchema = z.object({
  from: z.string(),
  online: z.boolean(),
  last_seen: z.coerce.date().nullable(),
  timestamp: z.coerce.date(),
});

export const chatStateEventSchema = z.object({
  chat: z.string(),
  from: z.string(),
  state: z.string(),
  timestamp: z.coerce.date(),
});

export const groupInfoSchema = z.object({
  jid: z.string(),
  name: z.string(),
  owner: z.string().nullable(),
  subject: z.string().nullable(),
  subject_time: z.number().nullable(),
  creation_time: z.number().nullable(),
  participant_count: z.number(),
});

export const groupsSyncedEventSchema = z.object({
  groups: z.array(groupInfoSchema),
  count: z.number(),
  timestamp: z.coerce.date(),
});

export const errorEventSchema = z.object({
  message: z.string(),
  timestamp: z.coerce.date(),
});

export const whatsappEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("state_changed"),
    ...stateChangeEventSchema.shape,
  }),
  z.object({ type: z.literal("qr_code"), ...qrCodeEventSchema.shape }),
  z.object({ type: z.literal("pair_code"), ...pairCodeEventSchema.shape }),
  z.object({
    type: z.literal("pair_success"),
    ...pairSuccessEventSchema.shape,
  }),
  z.object({ type: z.literal("pair_error"), ...pairErrorEventSchema.shape }),
  z.object({ type: z.literal("message"), ...messageEventSchema.shape }),
  z.object({ type: z.literal("receipt"), ...receiptEventSchema.shape }),
  z.object({ type: z.literal("presence"), ...presenceEventSchema.shape }),
  z.object({ type: z.literal("chat_state"), ...chatStateEventSchema.shape }),
  z.object({
    type: z.literal("groups_synced"),
    ...groupsSyncedEventSchema.shape,
  }),
  z.object({ type: z.literal("error"), ...errorEventSchema.shape }),
]);

export type WhatsAppStatusResponse = z.infer<
  typeof whatsappStatusResponseSchema
>;
export type PairCodeResponse = z.infer<typeof pairCodeResponseSchema>;
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;
export type PairCodeRequest = z.infer<typeof pairCodeRequestSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

// Event types
export type ConnectionState = z.infer<typeof connectionStateSchema>;
export type StateChangeEvent = z.infer<typeof stateChangeEventSchema>;
export type QrCodeEvent = z.infer<typeof qrCodeEventSchema>;
export type PairCodeEvent = z.infer<typeof pairCodeEventSchema>;
export type PairSuccessEvent = z.infer<typeof pairSuccessEventSchema>;
export type PairErrorEvent = z.infer<typeof pairErrorEventSchema>;
export type MessageKind = z.infer<typeof messageKindSchema>;
export type MessageEvent = z.infer<typeof messageEventSchema>;
export type ReceiptEvent = z.infer<typeof receiptEventSchema>;
export type PresenceEvent = z.infer<typeof presenceEventSchema>;
export type ChatStateEvent = z.infer<typeof chatStateEventSchema>;
export type GroupInfo = z.infer<typeof groupInfoSchema>;
export type GroupsSyncedEvent = z.infer<typeof groupsSyncedEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type WhatsAppEvent = z.infer<typeof whatsappEventSchema>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get WhatsApp connection status
 */
export async function getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  logger.info("Getting WhatsApp status");
  return invokeCommand("whatsapp_status", whatsappStatusResponseSchema);
}

/**
 * Connect to WhatsApp (initialize provider if needed)
 */
export async function connectWhatsApp(): Promise<void> {
  logger.info("Connecting to WhatsApp");
  return invokeCommand("whatsapp_connect", z.null());
}

/**
 * Disconnect from WhatsApp
 */
export async function disconnectWhatsApp(): Promise<void> {
  logger.info("Disconnecting from WhatsApp");
  return invokeCommand("whatsapp_disconnect", z.null());
}

/**
 * Request a pairing code for phone number authentication
 */
export async function requestPairCode(
  data: PairCodeRequest,
): Promise<PairCodeResponse> {
  logger.info("Requesting pair code", { phoneNumber: data.phone_number });
  return invokeCommand("whatsapp_request_pair_code", pairCodeResponseSchema, {
    params: { data },
  });
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(
  data: SendMessageRequest,
): Promise<SendMessageResponse> {
  logger.info("Sending WhatsApp message", { recipientJid: data.recipient_jid });
  return invokeCommand("whatsapp_send_message", sendMessageResponseSchema, {
    params: { data },
  });
}

/**
 * Logout from WhatsApp
 */
export async function logoutWhatsApp(): Promise<void> {
  logger.info("Logging out from WhatsApp");
  return invokeCommand("whatsapp_logout", z.null());
}

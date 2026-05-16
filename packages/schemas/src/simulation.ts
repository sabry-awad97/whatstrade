/**
 * Message simulation schemas for testing AI parsing and matching
 */
import { z } from "zod";
import { UuidSchema } from "./common";

/**
 * Message type constants for type-safe comparisons
 * @example
 * ```ts
 * if (parsedType === MessageType.OFFER) { ... }
 * ```
 */
export const MessageType = {
  OFFER: "offer",
  REQUEST: "request",
  AUTO: "auto",
} as const;

/**
 * Zod enum for message type validation
 */
export const MessageTypeEnum = z.enum([
  MessageType.OFFER,
  MessageType.REQUEST,
  MessageType.AUTO,
]);

/**
 * @summary Simulate message request body
 * AI-parse an Arabic WhatsApp message and score it against existing offers/requests
 */
export const SimulateMessageBody = z.object({
  rawText: z.string(),
  messageType: MessageTypeEnum,
  groupName: z.string().optional(),
  senderPhone: z.string().optional(),
  insertIntoSystem: z.boolean().optional(),
});

/**
 * @summary Score breakdown for a match candidate
 */
const ScoreBreakdown = z.object({
  medication: z.number().min(0).max(1),
  quantity: z.number().min(0).max(1),
  dosage: z.number().min(0).max(1),
  price: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
});

/**
 * @summary Match candidate in simulation response
 */
const SimulationCandidate = z.object({
  id: UuidSchema,
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number(),
  price: z.string().nullish(),
  groupName: z.string().optional(),
  senderPhone: z.string().optional(),
  score: z.number().min(0).max(1),
  confidenceBand: z.string(),
  scoreBreakdown: ScoreBreakdown,
});

/**
 * @summary Parsed field with confidence score
 */
const ParsedField = z.object({
  field: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * @summary Pipeline step execution details
 */
const PipelineStep = z.object({
  step: z.string(),
  status: z.string(),
  detail: z.string(),
  durationMs: z.number(),
});

/**
 * @summary Simulate message response
 * Comprehensive result of AI parsing and matching simulation
 */
export const SimulateMessageResponse = z.object({
  parsedType: z.string(),
  parsedFields: z.array(ParsedField),
  aiReasoning: z.string(),
  candidates: z.array(SimulationCandidate),
  insertedId: UuidSchema.nullable(),
  pipelineSteps: z.array(PipelineStep),
});

// Type exports
export type MessageType = z.infer<typeof MessageTypeEnum>;
export type SimulateMessageBody = z.infer<typeof SimulateMessageBody>;
export type SimulateMessageResponse = z.infer<typeof SimulateMessageResponse>;

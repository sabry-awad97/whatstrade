/**
 * Message simulation schemas for testing AI parsing and matching
 */
import { z } from "zod";

/**
 * @summary Simulate message request body
 * AI-parse an Arabic WhatsApp message and score it against existing offers/requests
 */
export const SimulateMessageBody = z.object({
  rawText: z.string(),
  messageType: z.enum(["offer", "request", "auto"]),
  groupName: z.string().optional(),
  senderPhone: z.string().optional(),
  insertIntoSystem: z.boolean().optional(),
});

/**
 * @summary Score breakdown for a match candidate
 */
const ScoreBreakdown = z.object({
  medication: z.number(),
  quantity: z.number(),
  dosage: z.number(),
  price: z.number(),
  recency: z.number(),
});

/**
 * @summary Match candidate in simulation response
 */
const SimulationCandidate = z.object({
  id: z.number(),
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number(),
  price: z.number().nullish(),
  groupName: z.string().optional(),
  senderPhone: z.string().optional(),
  score: z.number(),
  confidenceBand: z.string(),
  scoreBreakdown: ScoreBreakdown,
});

/**
 * @summary Parsed field with confidence score
 */
const ParsedField = z.object({
  field: z.string(),
  value: z.string(),
  confidence: z.number(),
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
  insertedId: z.number().nullable(),
  pipelineSteps: z.array(PipelineStep),
});

// Type exports
export type SimulateMessageBody = z.infer<typeof SimulateMessageBody>;
export type SimulateMessageResponse = z.infer<typeof SimulateMessageResponse>;

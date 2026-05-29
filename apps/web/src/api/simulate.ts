import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SimulateApi");

// ============================================================================
// Schemas
// ============================================================================

export const pipelineStepSchema = z.object({
  step: z.string(),
  status: z.enum(["success", "error", "pending"]),
  detail: z.string(),
  duration_ms: z.number(),
});

export const parsedFieldSchema = z.object({
  field: z.string(),
  value: z.string(),
  confidence: z.number(),
});

export const candidateSchema = z.object({
  id: z.string(),
  medication_name: z.string(),
  dosage: z.string().nullable(),
  quantity: z.number(),
  price: z.string().nullable(),
  group_name: z.string(),
  score: z.number(),
});

export const simulateResponseSchema = z.object({
  parsed_type: z.string(),
  parsed_fields: z.array(parsedFieldSchema),
  ai_reasoning: z.string(),
  candidates: z.array(candidateSchema),
  inserted_id: z.string().nullable(),
  duration_ms: z.number(),
  pipeline_steps: z.array(pipelineStepSchema),
});

export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type ParsedField = z.infer<typeof parsedFieldSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type SimulateResponse = z.infer<typeof simulateResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type SimulateMessageParams = {
  data: {
    raw_text: string;
    message_type?: string;
    group_name?: string;
    sender_phone?: string;
    insert_into_system?: boolean;
  };
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Simulate message processing
 * Runs the full AI extraction + matching pipeline
 */
export async function simulateMessage(
  rawText: string,
  messageType?: string,
  groupName?: string,
  senderPhone?: string,
  insertIntoSystem?: boolean,
): Promise<SimulateResponse> {
  logger.info("Simulating message", {
    rawText,
    messageType,
    groupName,
    senderPhone,
    insertIntoSystem,
  });
  return invokeCommand("simulate_message", simulateResponseSchema, {
    params: {
      data: {
        raw_text: rawText,
        message_type: messageType,
        group_name: groupName,
        sender_phone: senderPhone,
        insert_into_system: insertIntoSystem,
      },
    },
  });
}

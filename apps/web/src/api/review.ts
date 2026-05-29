import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ReviewApi");

// ============================================================================
// Schemas
// ============================================================================

export const reviewStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const reviewTypeSchema = z.enum(["offer", "request", "match"]);

export const reviewItemResponseSchema = z.object({
  id: z.string(),
  type: reviewTypeSchema,
  medication_name: z.string(),
  dosage: z.string().nullable(),
  quantity: z.number().nullable(),
  raw_text: z.string(),
  group_name: z.string(),
  sender_phone: z.string(),
  status: reviewStatusSchema,
  parsed_data: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const reviewStatsResponseSchema = z.object({
  total: z.number(),
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
  avg_processing_time: z.number(),
});

export type ReviewItemResponse = z.infer<typeof reviewItemResponseSchema>;
export type ReviewStatsResponse = z.infer<typeof reviewStatsResponseSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewType = z.infer<typeof reviewTypeSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type ReviewActionParams = {
  id: string;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get pending review queue
 */
export async function getReviewQueue(): Promise<ReviewItemResponse[]> {
  logger.info("Getting review queue");
  return invokeCommand("get_review_queue", z.array(reviewItemResponseSchema));
}

/**
 * Get review statistics
 */
export async function getReviewStats(): Promise<ReviewStatsResponse> {
  logger.info("Getting review statistics");
  return invokeCommand("get_review_stats", reviewStatsResponseSchema);
}

/**
 * Approve a review item
 */
export async function approveReviewItem(
  id: string,
): Promise<ReviewItemResponse> {
  logger.info("Approving review item", { id });
  return invokeCommand("approve_review_item", reviewItemResponseSchema, {
    params: { id },
  });
}

/**
 * Reject a review item
 */
export async function rejectReviewItem(
  id: string,
): Promise<ReviewItemResponse> {
  logger.info("Rejecting review item", { id });
  return invokeCommand("reject_review_item", reviewItemResponseSchema, {
    params: { id },
  });
}

import { z } from "zod";
import { invokeCommand, PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MatchesApi");

// ============================================================================
// Schemas
// ============================================================================

export const matchResponseSchema = z.object({
  id: z.string(),
  offer_id: z.string(),
  request_id: z.string(),
  score: z.string(), // Decimal as string
  confidence_band: z.string(),
  status: z.string(),
  operator_note: z.string().nullable(),
  medication_name: z.string(),
  offer_quantity: z.number(),
  request_quantity: z.number(),
  offer_price: z.string().nullable(), // Decimal as string
  max_price: z.string().nullable(), // Decimal as string
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const matchListResponseSchema = z.object({
  matches: z.array(matchResponseSchema),
  total: z.number(),
});

export const matchStatsResponseSchema = z.object({
  total_matches: z.number(),
  pending_matches: z.number(),
  confirmed_matches: z.number(),
  rejected_matches: z.number(),
  auto_confirmed_matches: z.number(),
  avg_match_score: z.number(),
});

export type MatchResponse = z.infer<typeof matchResponseSchema>;
export type MatchListResponse = z.infer<typeof matchListResponseSchema>;
export type MatchStatsResponse = z.infer<typeof matchStatsResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type ListMatchesParams = {
  filter?: {
    status?: string;
  };
  pagination?: PaginationParams;
};

export type GetMatchParams = {
  id: string;
};

export type MatchActionParams = {
  id: string;
  data: {
    note?: string;
  };
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get match statistics
 */
export async function getMatchStats(): Promise<MatchStatsResponse> {
  logger.info("Getting match statistics");
  return invokeCommand("get_match_stats", matchStatsResponseSchema);
}

/**
 * List matches with optional filtering and pagination
 */
export async function listMatches(
  params?: ListMatchesParams,
): Promise<MatchListResponse> {
  logger.info("Listing matches", params);
  return invokeCommand("list_matches", matchListResponseSchema, { params });
}

/**
 * Get a single match by ID
 */
export async function getMatch(id: string): Promise<MatchResponse> {
  logger.info("Getting match", { id });
  return invokeCommand("get_match", matchResponseSchema, {
    params: { id },
  });
}

/**
 * Confirm a match
 */
export async function confirmMatch(
  id: string,
  note?: string,
): Promise<MatchResponse> {
  logger.info("Confirming match", { id, note });
  return invokeCommand("confirm_match", matchResponseSchema, {
    params: {
      id,
      data: { note },
    },
  });
}

/**
 * Reject a match
 */
export async function rejectMatch(
  id: string,
  note?: string,
): Promise<MatchResponse> {
  logger.info("Rejecting match", { id, note });
  return invokeCommand("reject_match", matchResponseSchema, {
    params: {
      id,
      data: { note },
    },
  });
}

import { z } from "zod";
import { invokeCommand, PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("RequestsApi");

// ============================================================================
// Schemas
// ============================================================================

export const requestResponseSchema = z.object({
  id: z.string(),
  medication_name: z.string(),
  dosage: z.string().nullable(),
  quantity: z.number(),
  max_price: z.string().nullable(), // Decimal as string
  group_name: z.string(),
  sender_phone: z.string(),
  status: z.string(),
  raw_text: z.string().nullable(),
  whatsapp_message_queue_id: z.string().nullable(),
  whatsapp_group_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const requestListResponseSchema = z.object({
  requests: z.array(requestResponseSchema),
  total: z.number(),
});

export type RequestResponse = z.infer<typeof requestResponseSchema>;
export type RequestListResponse = z.infer<typeof requestListResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type ListRequestsParams = {
  filter?: {
    search?: string;
  };
  pagination?: PaginationParams;
};

export type GetRequestParams = {
  id: string;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * List requests with optional filtering and pagination
 */
export async function listRequests(
  params?: ListRequestsParams,
): Promise<RequestListResponse> {
  logger.info("Listing requests", params);
  return invokeCommand("list_requests", requestListResponseSchema, { params });
}

/**
 * Get a single request by ID
 */
export async function getRequest(id: string): Promise<RequestResponse> {
  logger.info("Getting request", { id });
  return invokeCommand("get_request", requestResponseSchema, {
    params: { id },
  });
}

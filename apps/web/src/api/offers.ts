import { z } from "zod";
import { invokeCommand, PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("OffersApi");

// ============================================================================
// Schemas
// ============================================================================

export const offerResponseSchema = z.object({
  id: z.string(),
  medication_name: z.string(),
  dosage: z.string().nullable(),
  quantity: z.number(),
  price: z.string().nullable(), // Decimal as string
  group_name: z.string(),
  sender_phone: z.string(),
  status: z.string(),
  raw_text: z.string().nullable(),
  whatsapp_message_queue_id: z.string().nullable(),
  whatsapp_group_id: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const offerListResponseSchema = z.object({
  offers: z.array(offerResponseSchema),
  total: z.number(),
});

export type OfferResponse = z.infer<typeof offerResponseSchema>;
export type OfferListResponse = z.infer<typeof offerListResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type ListOffersParams = {
  filter?: {
    search?: string;
  };
  pagination?: PaginationParams;
};

export type GetOfferParams = {
  id: string;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * List offers with optional filtering and pagination
 */
export async function listOffers(
  params?: ListOffersParams,
): Promise<OfferListResponse> {
  logger.info("Listing offers", params);
  return invokeCommand("list_offers", offerListResponseSchema, { params });
}

/**
 * Get a single offer by ID
 */
export async function getOffer(id: string): Promise<OfferResponse> {
  logger.info("Getting offer", { id });
  return invokeCommand("get_offer", offerResponseSchema, {
    params: { id },
  });
}

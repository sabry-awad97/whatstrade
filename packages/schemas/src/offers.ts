/**
 * Medication offer schemas
 */
import { z } from "zod";
import { IdParams, SearchablePaginationQueryParams } from "./common";

// Query parameters
export const listOffersQueryPageDefault = 1;
export const listOffersQueryLimitDefault = 20;

/**
 * @summary Query parameters for listing offers
 */
export const ListOffersQueryParams = SearchablePaginationQueryParams.extend({
  page: z.coerce.number().default(listOffersQueryPageDefault),
  limit: z.coerce.number().default(listOffersQueryLimitDefault),
});

// Response schemas
/**
 * @summary Single offer item in list response
 */
export const ListOffersResponseItem = z.object({
  id: z.number(),
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number(),
  price: z.number().nullable(),
  groupName: z.string(),
  senderPhone: z.string(),
  status: z.string(),
  rawText: z.string().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary List of active medication offers
 */
export const ListOffersResponse = z.array(ListOffersResponseItem);

/**
 * @summary Get offer by ID parameters
 */
export const GetOfferParams = IdParams;

/**
 * @summary Single offer detail response
 */
export const GetOfferResponse = z.object({
  id: z.number(),
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number(),
  price: z.number().nullable(),
  groupName: z.string(),
  senderPhone: z.string(),
  status: z.string(),
  rawText: z.string().nullish(),
  createdAt: z.coerce.date(),
});

// Type exports
export type ListOffersQueryParams = z.infer<typeof ListOffersQueryParams>;
export type ListOffersResponseItem = z.infer<typeof ListOffersResponseItem>;
export type ListOffersResponse = z.infer<typeof ListOffersResponse>;
export type GetOfferParams = z.infer<typeof GetOfferParams>;
export type GetOfferResponse = z.infer<typeof GetOfferResponse>;

/**
 * Medication request schemas
 */
import { z } from "zod";
import {
  IdParams,
  SearchablePaginationQueryParams,
  UuidSchema,
} from "./common";

// Query parameters
export const listRequestsQueryPageDefault = 1;
export const listRequestsQueryLimitDefault = 20;

/**
 * @summary Query parameters for listing requests
 */
export const ListRequestsQueryParams = SearchablePaginationQueryParams.extend({
  page: z.coerce.number().default(listRequestsQueryPageDefault),
  limit: z.coerce.number().default(listRequestsQueryLimitDefault),
});

// Response schemas
/**
 * @summary Single request item in list response
 */
export const ListRequestsResponseItem = z.object({
  id: UuidSchema,
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number(),
  maxPrice: z.string().nullish(),
  groupName: z.string(),
  senderPhone: z.string(),
  status: z.string(),
  rawText: z.string().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary List of active medication requests
 */
export const ListRequestsResponse = z.array(ListRequestsResponseItem);

/**
 * @summary Get request by ID parameters
 */
export const GetRequestParams = IdParams;

/**
 * @summary Single request detail response
 */
export const GetRequestResponse = z.object({
  id: UuidSchema,
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number(),
  maxPrice: z.string().nullish(),
  groupName: z.string(),
  senderPhone: z.string(),
  status: z.string(),
  rawText: z.string().nullish(),
  createdAt: z.coerce.date(),
});

// Type exports
export type ListRequestsQueryParams = z.infer<typeof ListRequestsQueryParams>;
export type ListRequestsResponseItem = z.infer<typeof ListRequestsResponseItem>;
export type ListRequestsResponse = z.infer<typeof ListRequestsResponse>;
export type GetRequestParams = z.infer<typeof GetRequestParams>;
export type GetRequestResponse = z.infer<typeof GetRequestResponse>;

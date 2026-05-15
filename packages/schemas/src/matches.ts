/**
 * Match-related schemas for offer-request matching
 */
import { z } from "zod";
import {
  IdParams,
  OptionalNoteBody,
  PaginationQueryParams,
  UuidSchema,
} from "./common";

// Query parameters
export const listMatchesQueryPageDefault = 1;
export const listMatchesQueryLimitDefault = 20;

/**
 * @summary Query parameters for listing matches
 * Supports filtering by status and pagination
 */
export const ListMatchesQueryParams = PaginationQueryParams.extend({
  status: z.coerce.string().optional(),
  page: z.coerce.number().default(listMatchesQueryPageDefault),
  limit: z.coerce.number().default(listMatchesQueryLimitDefault),
});

// Response schemas
/**
 * @summary Single match item in list response
 */
export const ListMatchesResponseItem = z.object({
  id: UuidSchema,
  offerId: UuidSchema,
  requestId: UuidSchema,
  score: z.number(),
  confidenceBand: z.string(),
  status: z.string(),
  operatorNote: z.string().nullish(),
  medicationName: z.string().optional(),
  offerQuantity: z.number().optional(),
  requestQuantity: z.number().optional(),
  offerPrice: z.string().nullish(),
  maxPrice: z.string().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary List of pending matches
 */
export const ListMatchesResponse = z.array(ListMatchesResponseItem);

/**
 * @summary Match statistics breakdown
 */
export const GetMatchStatsResponse = z.object({
  total: z.number(),
  pending: z.number(),
  confirmed: z.number(),
  rejected: z.number(),
  autoConfirmed: z.number(),
  avgScore: z.number(),
  bandBreakdown: z.object({
    auto: z.number(),
    suggest: z.number(),
    review: z.number(),
    none: z.number(),
  }),
});

/**
 * @summary Get match details parameters
 */
export const GetMatchParams = IdParams;

/**
 * @summary Detailed match response
 */
export const GetMatchResponse = z.object({
  id: UuidSchema,
  offerId: UuidSchema,
  requestId: UuidSchema,
  score: z.number(),
  confidenceBand: z.string(),
  status: z.string(),
  operatorNote: z.string().nullish(),
  medicationName: z.string().optional(),
  offerQuantity: z.number().optional(),
  requestQuantity: z.number().optional(),
  offerPrice: z.string().nullish(),
  maxPrice: z.string().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary Confirm match parameters
 */
export const ConfirmMatchParams = IdParams;

/**
 * @summary Confirm match request body
 */
export const ConfirmMatchBody = OptionalNoteBody;

/**
 * @summary Confirm match response
 */
export const ConfirmMatchResponse = GetMatchResponse;

/**
 * @summary Reject match parameters
 */
export const RejectMatchParams = IdParams;

/**
 * @summary Reject match request body
 */
export const RejectMatchBody = OptionalNoteBody;

/**
 * @summary Reject match response
 */
export const RejectMatchResponse = GetMatchResponse;

// Type exports
export type ListMatchesQueryParams = z.infer<typeof ListMatchesQueryParams>;
export type ListMatchesResponseItem = z.infer<typeof ListMatchesResponseItem>;
export type ListMatchesResponse = z.infer<typeof ListMatchesResponse>;
export type GetMatchStatsResponse = z.infer<typeof GetMatchStatsResponse>;
export type GetMatchParams = z.infer<typeof GetMatchParams>;
export type GetMatchResponse = z.infer<typeof GetMatchResponse>;
export type ConfirmMatchParams = z.infer<typeof ConfirmMatchParams>;
export type ConfirmMatchBody = z.infer<typeof ConfirmMatchBody>;
export type ConfirmMatchResponse = z.infer<typeof ConfirmMatchResponse>;
export type RejectMatchParams = z.infer<typeof RejectMatchParams>;
export type RejectMatchBody = z.infer<typeof RejectMatchBody>;
export type RejectMatchResponse = z.infer<typeof RejectMatchResponse>;

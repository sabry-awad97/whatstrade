/**
 * Review queue schemas for manual review of parsed messages
 */
import { z } from "zod";
import { IdParams, UuidSchema } from "./common";

/**
 * @summary Single review item in queue
 */
export const GetReviewQueueResponseItem = z.object({
  id: UuidSchema,
  type: z.string(),
  medicationName: z.string(),
  dosage: z.string().nullish(),
  quantity: z.number().nullish(),
  rawText: z.string(),
  groupName: z.string(),
  senderPhone: z.string(),
  status: z.string(),
  parsedData: z.string().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary List of pending review items
 */
export const GetReviewQueueResponse = z.array(GetReviewQueueResponseItem);

/**
 * @summary Review queue statistics
 */
export const GetReviewStatsResponse = z.object({
  total: z.number(),
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
  avgProcessingTime: z.number(),
});

/**
 * @summary Approve review item parameters
 */
export const ApproveReviewItemParams = IdParams;

/**
 * @summary Approve review item request body
 * Allows operator to provide corrected data and notes
 */
export const ApproveReviewItemBody = z.object({
  correctedData: z.string().optional(),
  note: z.string().optional(),
});

/**
 * @summary Approve review item response
 */
export const ApproveReviewItemResponse = GetReviewQueueResponseItem;

/**
 * @summary Reject review item parameters
 */
export const RejectReviewItemParams = IdParams;

/**
 * @summary Reject review item request body
 */
export const RejectReviewItemBody = z.object({
  correctedData: z.string().optional(),
  note: z.string().optional(),
});

/**
 * @summary Reject review item response
 */
export const RejectReviewItemResponse = GetReviewQueueResponseItem;

// Type exports
export type GetReviewQueueResponseItem = z.infer<
  typeof GetReviewQueueResponseItem
>;
export type GetReviewQueueResponse = z.infer<typeof GetReviewQueueResponse>;
export type GetReviewStatsResponse = z.infer<typeof GetReviewStatsResponse>;
export type ApproveReviewItemParams = z.infer<typeof ApproveReviewItemParams>;
export type ApproveReviewItemBody = z.infer<typeof ApproveReviewItemBody>;
export type ApproveReviewItemResponse = z.infer<
  typeof ApproveReviewItemResponse
>;
export type RejectReviewItemParams = z.infer<typeof RejectReviewItemParams>;
export type RejectReviewItemBody = z.infer<typeof RejectReviewItemBody>;
export type RejectReviewItemResponse = z.infer<typeof RejectReviewItemResponse>;

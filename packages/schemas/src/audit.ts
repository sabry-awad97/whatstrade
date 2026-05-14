/**
 * Audit log schemas for tracking operator actions
 */
import { z } from "zod";
import { PaginationQueryParams, UuidSchema } from "./common";

// Query parameters
export const listAuditLogQueryPageDefault = 1;
export const listAuditLogQueryLimitDefault = 50;

/**
 * @summary Query parameters for listing audit log entries
 */
export const ListAuditLogQueryParams = PaginationQueryParams.extend({
  page: z.coerce.number().default(listAuditLogQueryPageDefault),
  limit: z.coerce.number().default(listAuditLogQueryLimitDefault),
});

/**
 * @summary Single audit log entry
 */
export const ListAuditLogResponseItem = z.object({
  id: UuidSchema,
  action: z.string(),
  entityType: z.string(),
  entityId: UuidSchema,
  operator: z.string(),
  details: z.string().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary List of audit log entries
 */
export const ListAuditLogResponse = z.array(ListAuditLogResponseItem);

// Type exports
export type ListAuditLogQueryParams = z.infer<typeof ListAuditLogQueryParams>;
export type ListAuditLogResponseItem = z.infer<typeof ListAuditLogResponseItem>;
export type ListAuditLogResponse = z.infer<typeof ListAuditLogResponse>;

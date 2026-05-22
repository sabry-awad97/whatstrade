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
  operatorId: UuidSchema.nullable(),
  operator: z
    .object({
      id: UuidSchema,
      name: z.string(),
      email: z.string(),
    })
    .nullable(),
  details: z
    .union([
      z.record(z.string(), z.unknown()), // JSON object
      z.array(z.unknown()), // JSON array
      z.string(), // JSON string
      z.number(), // JSON number
      z.boolean(), // JSON boolean
      z.null(), // JSON null
    ])
    .nullish(),
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

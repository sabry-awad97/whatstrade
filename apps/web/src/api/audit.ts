import { z } from "zod";
import { invokeCommand, PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuditApi");

// ============================================================================
// Schemas
// ============================================================================

export const auditLogResponseSchema = z.object({
  id: z.string(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string(),
  operator_id: z.string().nullable(),
  details: z.any().nullable(),
  created_at: z.string(),
});

export const auditLogListResponseSchema = z.object({
  logs: z.array(auditLogResponseSchema),
  total: z.number(),
});

export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type ListAuditLogParams = {
  pagination?: PaginationParams;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * List audit logs with optional pagination
 */
export async function listAuditLog(
  params?: ListAuditLogParams,
): Promise<AuditLogListResponse> {
  logger.info("Listing audit logs", params);
  return invokeCommand("list_audit_log", auditLogListResponseSchema, {
    params,
  });
}

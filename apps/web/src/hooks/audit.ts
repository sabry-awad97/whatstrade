/**
 * Audit Hooks
 * React Query hooks for audit log management using Tauri IPC
 */
import { useQuery } from "@tanstack/react-query";
import { listAuditLog, type ListAuditLogParams } from "@/api/audit";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuditHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (params?: ListAuditLogParams) =>
    [...auditKeys.lists(), params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of audit logs
 *
 * @example
 * ```tsx
 * const { data: auditLogs, isLoading } = useListAuditLog({
 *   pagination: { page: 0, page_size: 20 }
 * });
 *
 * return (
 *   <div>
 *     <p>Total: {auditLogs?.total}</p>
 *     {auditLogs?.logs.map(log => (
 *       <div key={log.id}>
 *         {log.action} on {log.entity_type} - {log.entity_id}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @param params - Query parameters for pagination
 * @param params.pagination - Pagination options
 * @param params.pagination.page - Page number (0-indexed, default: 0)
 * @param params.pagination.page_size - Items per page (default: 20)
 * @returns TanStack Query result with audit logs array and total count
 */
export function useListAuditLog(params?: ListAuditLogParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => {
      logger.info("Query: listing audit logs", params);
      return listAuditLog(params);
    },
  });
}

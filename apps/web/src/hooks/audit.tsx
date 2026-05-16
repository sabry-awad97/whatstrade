/**
 * Audit Hooks
 * React Query hooks for audit log using oRPC
 */
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch a paginated list of audit log entries
 *
 * @example
 * ```tsx
 * const { data: auditLog, isLoading } = useListAuditLog({ page: 1, limit: 50 });
 *
 * return auditLog?.map(entry => (
 *   <div key={entry.id}>
 *     {entry.operator?.name ?? 'System'} - {entry.action} - {entry.entityType}
 *   </div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination
 * @param params.page - Page number (default: 1)
 * @param params.limit - Items per page (default: 50)
 * @returns TanStack Query result with audit log entries array
 */
export function useListAuditLog(params?: { page?: number; limit?: number }) {
  return useQuery(
    orpc.audit.listAuditLog.queryOptions({
      input: params ?? {},
    }),
  );
}

/**
 * Requests Hooks
 * React Query hooks for medication requests using Tauri IPC
 */
import { useQuery } from "@tanstack/react-query";
import {
  listRequests,
  getRequest,
  type ListRequestsParams,
} from "@/api/requests";
import { createLogger } from "@/lib/logger";

const logger = createLogger("RequestsHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (params?: ListRequestsParams) =>
    [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of requests
 *
 * @example
 * ```tsx
 * const { data: requests, isLoading } = useListRequests({
 *   filter: { search: 'aspirin' },
 *   pagination: { page: 0, page_size: 20 }
 * });
 *
 * return requests?.requests.map(request => (
 *   <div key={request.id}>{request.medication_name} - {request.quantity} units</div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and search
 * @param params.filter - Filter options
 * @param params.filter.search - Search term for medication name
 * @param params.pagination - Pagination options
 * @param params.pagination.page - Page number (0-indexed, default: 0)
 * @param params.pagination.page_size - Items per page (default: 20)
 * @returns TanStack Query result with requests array
 */
export function useListRequests(params?: ListRequestsParams) {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: () => {
      logger.info("Query: listing requests", params);
      return listRequests(params);
    },
  });
}

/**
 * Hook to fetch a single request by ID
 *
 * @example
 * ```tsx
 * const { data: request, isLoading, error } = useGetRequest("request-id-123", {
 *   enabled: true
 * });
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error />;
 *
 * return <div>{request.medication_name}</div>;
 * ```
 *
 * @param id - The request ID
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with request details
 */
export function useGetRequest(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => {
      logger.info("Query: fetching request", { id });
      return getRequest(id);
    },
    enabled: options?.enabled ?? true,
  });
}

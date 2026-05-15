/**
 * Requests Hooks
 * React Query hooks for medication requests using oRPC
 */
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch a paginated list of requests
 *
 * @example
 * ```tsx
 * const { data: requests, isLoading } = useListRequests({ page: 1, limit: 20 });
 *
 * return requests?.map(request => (
 *   <div key={request.id}>{request.medicationName} - {request.quantity} units</div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and search
 * @param params.page - Page number (default: 1)
 * @param params.limit - Items per page (default: 20)
 * @param params.search - Search term for medication name
 * @returns TanStack Query result with requests array
 */
export function useListRequests(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery(
    orpc.requests.listRequests.queryOptions({
      input: params ?? {},
    }),
  );
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
 * return <div>{request.medicationName}</div>;
 * ```
 *
 * @param id - The request ID
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with request details
 */
export function useGetRequest(id: string, options?: { enabled?: boolean }) {
  return useQuery(
    orpc.requests.getRequest.queryOptions({
      input: { id },
      enabled: options?.enabled ?? true,
    }),
  );
}

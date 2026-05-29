/**
 * Offers Hooks
 * React Query hooks for medication offers using Tauri IPC
 */
import { useQuery } from "@tanstack/react-query";
import { listOffers, getOffer, type ListOffersParams } from "@/api/offers";
import { createLogger } from "@/lib/logger";

const logger = createLogger("OffersHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const offerKeys = {
  all: ["offers"] as const,
  lists: () => [...offerKeys.all, "list"] as const,
  list: (params?: ListOffersParams) => [...offerKeys.lists(), params] as const,
  details: () => [...offerKeys.all, "detail"] as const,
  detail: (id: string) => [...offerKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of offers
 *
 * @example
 * ```tsx
 * const { data: offers, isLoading } = useListOffers({
 *   filter: { search: 'aspirin' },
 *   pagination: { page: 0, page_size: 20 }
 * });
 *
 * return offers?.offers.map(offer => (
 *   <div key={offer.id}>{offer.medication_name} - {offer.quantity} units</div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and search
 * @param params.filter - Filter options
 * @param params.filter.search - Search term for medication name
 * @param params.pagination - Pagination options
 * @param params.pagination.page - Page number (0-indexed, default: 0)
 * @param params.pagination.page_size - Items per page (default: 20)
 * @returns TanStack Query result with offers array
 */
export function useListOffers(params?: ListOffersParams) {
  return useQuery({
    queryKey: offerKeys.list(params),
    queryFn: () => {
      logger.info("Query: listing offers", params);
      return listOffers(params);
    },
  });
}

/**
 * Hook to fetch a single offer by ID
 *
 * @example
 * ```tsx
 * const { data: offer, isLoading, error } = useGetOffer("offer-id-123", {
 *   enabled: true
 * });
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error />;
 *
 * return <div>{offer.medication_name}</div>;
 * ```
 *
 * @param id - The offer ID
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with offer details
 */
export function useGetOffer(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: offerKeys.detail(id),
    queryFn: () => {
      logger.info("Query: fetching offer", { id });
      return getOffer(id);
    },
    enabled: options?.enabled ?? true,
  });
}

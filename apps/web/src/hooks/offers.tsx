/**
 * Offers Hooks
 * React Query hooks for medication offers using oRPC
 */
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch a paginated list of offers
 *
 * @example
 * ```tsx
 * const { data: offers, isLoading } = useListOffers({ page: 1, limit: 20 });
 *
 * return offers?.map(offer => (
 *   <div key={offer.id}>{offer.medicationName} - {offer.quantity} units</div>
 * ));
 * ```
 *
 * @param params - Query parameters for pagination and search
 * @param params.page - Page number (default: 1)
 * @param params.limit - Items per page (default: 20)
 * @param params.search - Search term for medication name
 * @returns TanStack Query result with offers array
 */
export function useListOffers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery(
    orpc.offers.listOffers.queryOptions({
      input: params ?? {},
    }),
  );
}

/**
 * Hook to fetch a single offer by ID
 *
 * @example
 * ```tsx
 * const { data: offer, isLoading, error } = useGetOffer("offer-id-123");
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error />;
 *
 * return <div>{offer.medicationName}</div>;
 * ```
 *
 * @param id - The offer ID
 * @returns TanStack Query result with offer details
 */
export function useGetOffer(id: string) {
  return useQuery(
    orpc.offers.getOffer.queryOptions({
      input: { id },
    }),
  );
}

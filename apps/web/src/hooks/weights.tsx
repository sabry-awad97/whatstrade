/**
 * Weights Hooks
 * React Query hooks for matching weights configuration using oRPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";
import type { UpdateWeightsBody } from "@workspace/schemas";

/**
 * Hook to fetch current matching weights configuration
 *
 * @example
 * ```tsx
 * const { data: weights, isLoading } = useGetWeights();
 *
 * return (
 *   <div>
 *     <p>Medication: {weights.medication}</p>
 *     <p>Quantity: {weights.quantity}</p>
 *     <p>Dosage: {weights.dosage}</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with weights configuration
 */
export function useGetWeights() {
  return useQuery(
    orpc.weights.getWeights.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

/**
 * Hook to update matching weights configuration
 *
 * @example
 * ```tsx
 * const updateWeights = useUpdateWeights();
 *
 * const handleUpdate = (newWeights: UpdateWeightsBody) => {
 *   updateWeights.mutate(
 *     newWeights,
 *     {
 *       onSuccess: () => toast.success('Weights updated successfully'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for updating weights
 */
export function useUpdateWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateWeightsBody) => {
      return orpc.weights.updateWeights.call(params);
    },
    onSuccess: () => {
      // Invalidate weights queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.weights.key(),
      });
      // Invalidate matches queries as weights affect matching
      queryClient.invalidateQueries({
        queryKey: orpc.matches.key(),
      });
      // Invalidate dashboard stats as weights affect match scores
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
    },
  });
}

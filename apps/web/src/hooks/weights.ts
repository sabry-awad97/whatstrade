/**
 * Weights Hooks
 * React Query hooks for matching algorithm weights using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWeights, updateWeights } from "@/api/weights";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WeightsHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const weightKeys = {
  all: ["weights"] as const,
  current: () => [...weightKeys.all, "current"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch current matching weights
 *
 * @example
 * ```tsx
 * const { data: weights, isLoading } = useGetWeights();
 *
 * return (
 *   <div>
 *     <p>Medication: {weights?.medication}</p>
 *     <p>Quantity: {weights?.quantity}</p>
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with weights
 */
export function useGetWeights() {
  return useQuery({
    queryKey: weightKeys.current(),
    queryFn: () => {
      logger.info("Query: fetching matching weights");
      return getWeights();
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to update matching weights
 *
 * @example
 * ```tsx
 * const updateWeightsMutation = useUpdateWeights();
 *
 * const handleUpdate = () => {
 *   updateWeightsMutation.mutate(
 *     {
 *       medication: 0.4,
 *       quantity: 0.2,
 *       dosage: 0.15,
 *       price: 0.15,
 *       recency: 0.1,
 *     },
 *     {
 *       onSuccess: () => toast.success('Weights updated'),
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
    mutationFn: ({
      medication,
      quantity,
      dosage,
      price,
      recency,
    }: {
      medication: number;
      quantity: number;
      dosage: number;
      price: number;
      recency: number;
    }) => {
      logger.info("Mutation: updating matching weights", {
        medication,
        quantity,
        dosage,
        price,
        recency,
      });
      return updateWeights(medication, quantity, dosage, price, recency);
    },
    onSuccess: (data) => {
      logger.info("Matching weights updated successfully", { id: data.id });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: weightKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to update matching weights", error);
    },
  });
}

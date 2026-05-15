/**
 * Simulate Hooks
 * React Query hooks for message simulation using oRPC
 */
import { useMutation } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

/**
 * Hook to simulate a WhatsApp message
 *
 * @example
 * ```tsx
 * const simulateMutation = useSimulateMessage();
 *
 * const handleSimulate = () => {
 *   simulateMutation.mutate(
 *     {
 *       rawText: "عندي باندول...",
 *       messageType: "auto",
 *       insertIntoSystem: false
 *     },
 *     {
 *       onSuccess: (result) => {
 *         console.log('Parsed:', result.parsedType);
 *         console.log('Matches:', result.candidates.length);
 *       },
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for simulating messages
 */
export function useSimulateMessage() {
  return useMutation({
    mutationFn: async (params: {
      rawText: string;
      messageType: "offer" | "request" | "auto";
      groupName?: string;
      senderPhone?: string;
      insertIntoSystem?: boolean;
    }) => {
      return orpc.simulate.simulate.call(params);
    },
  });
}

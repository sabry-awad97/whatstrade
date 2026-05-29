/**
 * Simulate Hooks
 * React Query hooks for message simulation using Tauri IPC
 */
import { useMutation } from "@tanstack/react-query";
import { simulateMessage } from "@/api/simulate";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SimulateHooks");

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to simulate message processing
 *
 * @example
 * ```tsx
 * const simulateMutation = useSimulateMessage();
 *
 * const handleSimulate = () => {
 *   simulateMutation.mutate(
 *     {
 *       rawText: "Need Aspirin 100mg x 500 units",
 *       messageType: "request",
 *       insertIntoSystem: false,
 *     },
 *     {
 *       onSuccess: (result) => {
 *         console.log('Parsed type:', result.parsed_type);
 *         console.log('Candidates:', result.candidates);
 *         console.log('Duration:', result.duration_ms, 'ms');
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
    mutationFn: ({
      rawText,
      messageType,
      groupName,
      senderPhone,
      insertIntoSystem,
    }: {
      rawText: string;
      messageType?: string;
      groupName?: string;
      senderPhone?: string;
      insertIntoSystem?: boolean;
    }) => {
      logger.info("Mutation: simulating message", {
        rawText,
        messageType,
        groupName,
        senderPhone,
        insertIntoSystem,
      });
      return simulateMessage(
        rawText,
        messageType,
        groupName,
        senderPhone,
        insertIntoSystem,
      );
    },
    onSuccess: (data) => {
      logger.info("Message simulation completed", {
        parsedType: data.parsed_type,
        candidatesCount: data.candidates.length,
        durationMs: data.duration_ms,
        insertedId: data.inserted_id,
      });
    },
    onError: (error) => {
      logger.error("Failed to simulate message", error);
    },
  });
}

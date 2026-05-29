import { useQuery } from "@tanstack/react-query";
import { health } from "@/api/health";
import { createLogger } from "@/lib/logger";

const logger = createLogger("HealthHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const healthKeys = {
  all: ["health"] as const,
  check: () => [...healthKeys.all, "check"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to check application health status
 */
export function useHealth() {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: () => {
      logger.info("Fetching health status");
      return health();
    },
  });
}

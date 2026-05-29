/**
 * Groups Hooks
 * React Query hooks for WhatsApp groups using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGroups,
  listMonitoredGroups,
  enableGroupMonitoring,
  disableGroupMonitoring,
} from "@/api/groups";
import { createLogger } from "@/lib/logger";

const logger = createLogger("GroupsHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: () => [...groupKeys.lists(), "all"] as const,
  monitored: () => [...groupKeys.lists(), "monitored"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch all WhatsApp groups
 *
 * @example
 * ```tsx
 * const { data: groups, isLoading } = useListGroups();
 *
 * return groups?.map(group => (
 *   <div key={group.id}>{group.name} - {group.member_count} members</div>
 * ));
 * ```
 *
 * @returns TanStack Query result with groups array
 */
export function useListGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: () => {
      logger.info("Query: listing all groups");
      return listGroups();
    },
  });
}

/**
 * Hook to fetch monitored WhatsApp groups only
 *
 * @example
 * ```tsx
 * const { data: monitoredGroups, isLoading } = useListMonitoredGroups();
 *
 * return monitoredGroups?.map(group => (
 *   <div key={group.id}>{group.name}</div>
 * ));
 * ```
 *
 * @returns TanStack Query result with monitored groups array
 */
export function useListMonitoredGroups() {
  return useQuery({
    queryKey: groupKeys.monitored(),
    queryFn: () => {
      logger.info("Query: listing monitored groups");
      return listMonitoredGroups();
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to enable monitoring for a WhatsApp group
 *
 * @example
 * ```tsx
 * const enableMonitoring = useEnableGroupMonitoring();
 *
 * const handleEnable = (jid: string) => {
 *   enableMonitoring.mutate(jid, {
 *     onSuccess: () => toast.success('Monitoring enabled'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for enabling group monitoring
 */
export function useEnableGroupMonitoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jid: string) => {
      logger.info("Mutation: enabling group monitoring", { jid });
      return enableGroupMonitoring(jid);
    },
    onSuccess: (data) => {
      logger.info("Group monitoring enabled successfully", { jid: data.jid });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to enable group monitoring", error);
    },
  });
}

/**
 * Hook to disable monitoring for a WhatsApp group
 *
 * @example
 * ```tsx
 * const disableMonitoring = useDisableGroupMonitoring();
 *
 * const handleDisable = (jid: string) => {
 *   disableMonitoring.mutate(jid, {
 *     onSuccess: () => toast.success('Monitoring disabled'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for disabling group monitoring
 */
export function useDisableGroupMonitoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jid: string) => {
      logger.info("Mutation: disabling group monitoring", { jid });
      return disableGroupMonitoring(jid);
    },
    onSuccess: (data) => {
      logger.info("Group monitoring disabled successfully", { jid: data.jid });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    onError: (error) => {
      logger.error("Failed to disable group monitoring", error);
    },
  });
}

/**
 * Hook to toggle group monitoring with optimistic updates
 *
 * @example
 * ```tsx
 * const toggleMonitoring = useToggleGroupMonitoring();
 *
 * const handleToggle = (jid: string, enabled: boolean) => {
 *   toggleMonitoring.mutate({ jid, enabled });
 * };
 * ```
 *
 * @returns TanStack Mutation for toggling group monitoring
 */
export function useToggleGroupMonitoring() {
  const queryClient = useQueryClient();
  const enableMonitoring = useEnableGroupMonitoring();
  const disableMonitoring = useDisableGroupMonitoring();

  return useMutation({
    mutationFn: async (params: { jid: string; enabled: boolean }) => {
      if (params.enabled) {
        return enableMonitoring.mutateAsync(params.jid);
      } else {
        return disableMonitoring.mutateAsync(params.jid);
      }
    },
    onSuccess: (data, params) => {
      logger.info(
        `Group monitoring ${params.enabled ? "enabled" : "disabled"}`,
        {
          jid: data.jid,
        },
      );
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    onError: (error, params) => {
      logger.error(
        `Failed to ${params.enabled ? "enable" : "disable"} group monitoring`,
        error,
      );
    },
  });
}

/**
 * Hook to bulk toggle monitoring for multiple groups
 *
 * @example
 * ```tsx
 * const bulkToggle = useBulkToggleGroupMonitoring();
 *
 * const handleMonitorAll = () => {
 *   bulkToggle.mutate({ jids: allJids, enabled: true });
 * };
 * ```
 *
 * @returns TanStack Mutation for bulk toggling
 */
export function useBulkToggleGroupMonitoring() {
  const queryClient = useQueryClient();
  const enableMonitoring = useEnableGroupMonitoring();
  const disableMonitoring = useDisableGroupMonitoring();

  return useMutation({
    mutationFn: async (params: { jids: string[]; enabled: boolean }) => {
      // Execute mutations sequentially to avoid overwhelming the backend
      const results = [];
      for (const jid of params.jids) {
        try {
          const result = params.enabled
            ? await enableMonitoring.mutateAsync(jid)
            : await disableMonitoring.mutateAsync(jid);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to toggle monitoring for ${jid}`, error);
          // Continue with other groups even if one fails
        }
      }
      return results;
    },
    onSuccess: (data, params) => {
      logger.info(
        `Bulk monitoring ${params.enabled ? "enabled" : "disabled"} for ${params.jids.length} groups`,
      );
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    onError: (error) => {
      logger.error("Bulk toggle operation failed", error);
    },
  });
}

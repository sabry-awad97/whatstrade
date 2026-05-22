/**
 * Groups Hooks
 * React Query hooks for WhatsApp group management using oRPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

/**
 * Hook to fetch a list of all WhatsApp groups
 *
 * @example
 * ```tsx
 * const { data: groups, isLoading } = useListGroups();
 *
 * return groups?.map(group => (
 *   <div key={group.id}>
 *     {group.name} - {group.isMonitored ? 'Monitored' : 'Not Monitored'}
 *   </div>
 * ));
 * ```
 *
 * @returns TanStack Query result with groups array
 */
export function useListGroups() {
  return useQuery(
    orpc.groups.listGroups.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

/**
 * Hook to fetch a list of monitored WhatsApp groups
 *
 * @example
 * ```tsx
 * const { data: monitoredGroups, isLoading } = useListMonitoredGroups();
 *
 * return monitoredGroups?.map(group => (
 *   <div key={group.id}>{group.name} - {group.memberCount} members</div>
 * ));
 * ```
 *
 * @returns TanStack Query result with monitored groups array
 */
export function useListMonitoredGroups() {
  return useQuery(
    orpc.groups.listMonitoredGroups.queryOptions({
      // No input needed for this endpoint
    }),
  );
}

/**
 * Hook to enable monitoring for a WhatsApp group
 *
 * @example
 * ```tsx
 * const enableMonitoring = useEnableGroupMonitoring();
 *
 * const handleEnable = (jid: string) => {
 *   enableMonitoring.mutate(
 *     { jid },
 *     {
 *       onSuccess: (group) => toast.success(`Monitoring enabled for ${group.name}`),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for enabling group monitoring
 */
export function useEnableGroupMonitoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { jid: string }) => {
      return orpc.groups.enableGroupMonitoring.call(params);
    },
    onSuccess: () => {
      // Invalidate all groups queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.groups.key(),
      });
      // Invalidate dashboard stats as monitored groups affect stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
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
 *   disableMonitoring.mutate(
 *     { jid },
 *     {
 *       onSuccess: (group) => toast.success(`Monitoring disabled for ${group.name}`),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 *
 * @returns TanStack Mutation for disabling group monitoring
 */
export function useDisableGroupMonitoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { jid: string }) => {
      return orpc.groups.disableGroupMonitoring.call(params);
    },
    onSuccess: () => {
      // Invalidate all groups queries using oRPC key
      queryClient.invalidateQueries({
        queryKey: orpc.groups.key(),
      });
      // Invalidate dashboard stats as monitored groups affect stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
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

  return useMutation({
    mutationFn: async (params: { jid: string; enabled: boolean }) => {
      if (params.enabled) {
        return orpc.groups.enableGroupMonitoring.call({ jid: params.jid });
      } else {
        return orpc.groups.disableGroupMonitoring.call({ jid: params.jid });
      }
    },
    onMutate: async (params) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: orpc.groups.listGroups.key(),
      });

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(
        orpc.groups.listGroups.key(),
      );

      // Optimistically update to the new value
      queryClient.setQueryData(orpc.groups.listGroups.key(), (old: any[]) => {
        if (!old) return old;
        return old.map((group: any) =>
          group.jid === params.jid
            ? { ...group, isMonitored: params.enabled }
            : group,
        );
      });

      // Return context with snapshot
      return { previousGroups };
    },
    onError: (error, params, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(
          orpc.groups.listGroups.key(),
          context.previousGroups,
        );
      }
      toast.error(
        `Failed to ${params.enabled ? "enable" : "disable"} monitoring: ${error.message}`,
      );
    },
    onSuccess: (data, params) => {
      toast.success(
        `Monitoring ${params.enabled ? "enabled" : "disabled"} for ${data.name}`,
      );
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: orpc.groups.key(),
      });
      // Invalidate dashboard stats as monitored groups affect stats
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
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

  return useMutation({
    mutationFn: async (params: { jids: string[]; enabled: boolean }) => {
      // Use p-limit to cap concurrency at 10 requests
      const pLimit = (await import("p-limit")).default;
      const limit = pLimit(10);

      // Execute mutations with concurrency control
      const limitedTasks = params.jids.map((jid) =>
        limit(() =>
          params.enabled
            ? orpc.groups.enableGroupMonitoring.call({ jid })
            : orpc.groups.disableGroupMonitoring.call({ jid }),
        ),
      );
      return Promise.all(limitedTasks);
    },
    onSuccess: (data, params) => {
      queryClient.invalidateQueries({
        queryKey: orpc.groups.key(),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.stats.key(),
      });
      toast.success(
        `Monitoring ${params.enabled ? "enabled" : "disabled"} for ${params.jids.length} groups`,
      );
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    },
  });
}

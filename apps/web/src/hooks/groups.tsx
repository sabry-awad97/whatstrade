/**
 * Groups Hooks
 * React Query hooks for WhatsApp group management using oRPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

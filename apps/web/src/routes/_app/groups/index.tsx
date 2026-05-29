import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  useListGroups,
  useEnableGroupMonitoring,
  useDisableGroupMonitoring,
} from "@/hooks/groups";
import { GroupsHeader, GroupsList } from "./-components";

export const Route = createFileRoute("/_app/groups/")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  // Fetch groups list
  const { data: groups, isLoading } = useListGroups();

  // Mutations for enabling/disabling monitoring
  const enableMutation = useEnableGroupMonitoring();
  const disableMutation = useDisableGroupMonitoring();

  // Handle monitoring toggle
  const handleToggle = (jid: string, isMonitored: boolean, name: string) => {
    const mutation = isMonitored ? disableMutation : enableMutation;

    mutation.mutate(jid, {
      onSuccess: () => {
        toast.success(
          isMonitored ? "Monitoring disabled" : "Monitoring enabled",
          {
            description: `${name} is now ${isMonitored ? "unmonitored" : "monitored"}.`,
          },
        );
      },
      onError: (error) => {
        toast.error("Failed to update monitoring", {
          description: error.message,
        });
      },
    });
  };

  // Calculate monitored count
  const monitoredCount = groups?.filter((g) => g.is_monitored).length ?? 0;

  return (
    <div className="flex flex-col h-full">
      <GroupsHeader
        totalCount={groups?.length}
        monitoredCount={monitoredCount}
      />

      <div className="flex-1 overflow-auto p-4">
        <GroupsList
          groups={groups}
          isLoading={isLoading}
          onToggle={handleToggle}
          isPending={enableMutation.isPending || disableMutation.isPending}
        />
      </div>
    </div>
  );
}

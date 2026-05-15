import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { useListAuditLog } from "@/hooks/audit";
import { AuditHeader, AuditTable } from "./-components";

export const Route = createFileRoute("/_app/audit/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
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
  // Fetch audit log entries
  const { data: entries, isLoading } = useListAuditLog({ page: 1, limit: 100 });

  return (
    <div className="flex flex-col h-full">
      <AuditHeader totalCount={entries?.length} />
      <AuditTable entries={entries} isLoading={isLoading} />
    </div>
  );
}

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
  const { data: response, isLoading } = useListAuditLog({
    pagination: { page: 0, page_size: 100 },
  });

  return (
    <div className="flex flex-col h-full">
      <AuditHeader showingCount={response?.total ?? 0} />
      <AuditTable entries={response?.logs} isLoading={isLoading} />
    </div>
  );
}

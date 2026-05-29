import { createFileRoute } from "@tanstack/react-router";

import { useListAuditLog } from "@/hooks/audit";
import { AuditHeader, AuditTable } from "./-components";

export const Route = createFileRoute("/_app/audit/")({
  component: RouteComponent,
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

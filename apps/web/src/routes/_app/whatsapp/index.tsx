import { createFileRoute, redirect } from "@tanstack/react-router";

import { useWhatsAppStatus, useQRCode, useQueueStats } from "@/hooks/whatsapp";
import {
  ConnectionStatusBadge,
  QRCodeDisplay,
  GroupListTable,
  QueueStatsCards,
  FailedMessagesTable,
} from "./-components";

export const Route = createFileRoute("/_app/whatsapp/")({
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
  const status = useWhatsAppStatus();
  const { qr } = useQRCode({ enabled: status.connected && !status.loggedIn });
  const stats = useQueueStats();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">WhatsApp Integration</h1>
          </div>
          <ConnectionStatusBadge
            status={status}
            isConnecting={status.isConnecting}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* QR Code Pairing - Show when connected but not logged in */}
          {status.connected && !status.loggedIn && qr && (
            <QRCodeDisplay qr={qr} />
          )}

          {/* Connection Status Card */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
              <dl className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Connected:
                  </dt>
                  <dd className="text-sm font-semibold">
                    {status.connected ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Logged In:
                  </dt>
                  <dd className="text-sm font-semibold">
                    {status.loggedIn ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Last Update:
                  </dt>
                  <dd className="text-sm font-mono">
                    {status.timestamp.toLocaleTimeString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Groups Section - Show when logged in */}
          {status.loggedIn && (
            <>
              {/* Queue Stats */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Message Queue</h2>
                <QueueStatsCards />
              </div>

              {/* Failed Messages - Show when there are failed messages */}
              {stats.failed > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Failed Messages</h2>
                  <FailedMessagesTable />
                </div>
              )}

              {/* Groups */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">WhatsApp Groups</h2>
                <GroupListTable />
              </div>
            </>
          )}

          {/* Info Card */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Connection status updates automatically
              every 2 seconds via Server-Sent Events (SSE). No manual refresh
              required.
              {status.connected && !status.loggedIn && (
                <span>
                  {" "}
                  QR code refreshes automatically every 50 seconds before
                  expiry.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

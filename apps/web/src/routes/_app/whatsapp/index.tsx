import { createFileRoute } from "@tanstack/react-router";

import { useWhatsAppStatus, useWhatsAppQrCode } from "@/hooks/whatsapp";
import {
  ConnectionStatusBadge,
  QRCodeDisplay,
  GroupListTable,
  QueueStatsCards,
  FailedMessagesTable,
} from "./-components";
import { useQueueStats } from "@/hooks/message-queue";

export const Route = createFileRoute("/_app/whatsapp/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: status, isLoading: statusLoading } = useWhatsAppStatus();
  const qrCodeEvent = useWhatsAppQrCode();
  const { data: stats, isLoading: statsLoading } = useQueueStats();

  // Default values for status
  const connected = status?.connected ?? false;
  const loggedIn = status?.logged_in ?? false;
  const timestamp = status?.timestamp ?? new Date();

  // Transform QR code event to match component expectations
  const qrCode = qrCodeEvent
    ? {
        qrCode: qrCodeEvent.code,
        expiresAt: new Date(
          qrCodeEvent.timestamp.getTime() + qrCodeEvent.timeout_secs * 1000,
        ),
      }
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">WhatsApp Integration</h1>
          </div>
          <ConnectionStatusBadge
            status={{
              connected,
              loggedIn,
              timestamp,
            }}
            isConnecting={statusLoading}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* QR Code Pairing - Show when connected but not logged in */}
          {connected && !loggedIn && qrCode && <QRCodeDisplay qr={qrCode} />}

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
                    {connected ? (
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
                    {loggedIn ? (
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
                    {timestamp.toLocaleTimeString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Groups Section - Show when logged in */}
          {loggedIn && (
            <>
              {/* Queue Stats */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Message Queue</h2>
                <QueueStatsCards />
              </div>

              {/* Failed Messages - Show when there are failed messages */}
              {(stats?.failed ?? 0) > 0 && (
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
              every 5 seconds. No manual refresh required.
              {connected && !loggedIn && (
                <span>
                  {" "}
                  QR code will appear automatically when you connect to
                  WhatsApp.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Loader2,
  Power,
  PowerOff,
  Smartphone,
  LogOut,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  QrCode,
} from "lucide-react";

import {
  useWhatsAppStatus,
  useWhatsAppQrCode,
  useConnectWhatsApp,
  useDisconnectWhatsApp,
  useRequestPairCode,
  useLogoutWhatsApp,
  WHATSAPP_STATUS_REFETCH_INTERVAL,
} from "@/hooks/whatsapp";
import {
  ConnectionStatusBadge,
  QRCodeDisplay,
  GroupListTable,
  QueueStatsCards,
  FailedMessagesTable,
} from "./-components";
import { useQueueStats } from "@/hooks/message-queue";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { cn } from "@workspace/ui/lib/utils";

export const Route = createFileRoute("/_app/whatsapp/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [userClosedDialog, setUserClosedDialog] = useState(false);

  const { data: status, isLoading: statusLoading } = useWhatsAppStatus();
  const qrCodeEvent = useWhatsAppQrCode();
  const { data: stats } = useQueueStats();

  // Mutations
  const connectMutation = useConnectWhatsApp();
  const disconnectMutation = useDisconnectWhatsApp();
  const requestPairCodeMutation = useRequestPairCode();
  const logoutMutation = useLogoutWhatsApp();

  // Default values for status
  const connected = status?.connected ?? false;
  const loggedIn = status?.logged_in ?? false;
  const timestamp = status?.timestamp ?? new Date();

  // Derive live status
  const liveStatus = statusLoading
    ? "loading"
    : connected && loggedIn
      ? "live"
      : "idle";

  // Transform QR code event to match component expectations
  const qrCode = qrCodeEvent
    ? {
        qrCode: qrCodeEvent.code,
        expiresAt: new Date(
          qrCodeEvent.timestamp.getTime() + qrCodeEvent.timeout_secs * 1000,
        ),
      }
    : null;

  // Auto-open dialog when QR code is available (only if user hasn't manually closed it)
  useEffect(() => {
    if (qrCode && connected && !loggedIn && !userClosedDialog) {
      setIsQrDialogOpen(true);
    }
  }, [qrCode, connected, loggedIn, userClosedDialog]);

  // Reset userClosedDialog when logged in or disconnected
  useEffect(() => {
    if (loggedIn || !connected) {
      setUserClosedDialog(false);
      setIsQrDialogOpen(false);
    }
  }, [loggedIn, connected]);

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setIsQrDialogOpen(open);
    if (!open) {
      setUserClosedDialog(true);
    }
  };

  // Handlers
  const handleConnect = () => {
    connectMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Connected", {
          description: "Successfully connected to WhatsApp",
        });
      },
      onError: (error) => {
        toast.error("Connection Failed", {
          description: error.message,
        });
      },
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Disconnected", {
          description: "Successfully disconnected from WhatsApp",
        });
      },
      onError: (error) => {
        toast.error("Disconnect Failed", {
          description: error.message,
        });
      },
    });
  };

  const handleRequestPairCode = () => {
    if (!phoneNumber.trim()) {
      toast.error("Phone Number Required", {
        description: "Please enter a phone number",
      });
      return;
    }

    requestPairCodeMutation.mutate(
      { phone_number: phoneNumber },
      {
        onSuccess: (data) => {
          toast.success("Pairing Code", {
            description: `Your pairing code is: ${data.code}`,
          });
        },
        onError: (error) => {
          toast.error("Request Failed", {
            description: error.message,
          });
        },
      },
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Logged Out", {
          description: "Successfully logged out from WhatsApp",
        });
      },
      onError: (error) => {
        toast.error("Logout Failed", {
          description: error.message,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Header */}
      <div className="border-b bg-linear-to-r from-background to-muted/20">
        <div className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                WhatsApp Integration
              </h1>
              {/* Live Status Badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  liveStatus === "live" &&
                    "bg-green-600/10 text-green-600 dark:text-green-400",
                  liveStatus === "loading" &&
                    "bg-blue-600/10 text-blue-600 dark:text-blue-400",
                  liveStatus === "idle" &&
                    "bg-gray-600/10 text-gray-600 dark:text-gray-400",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    liveStatus === "live" && "bg-green-600 dark:bg-green-400",
                    liveStatus === "loading" &&
                      "bg-blue-600 dark:bg-blue-400 animate-pulse",
                    liveStatus === "idle" && "bg-gray-600 dark:bg-gray-400",
                  )}
                />
                {liveStatus === "live" && "Live"}
                {liveStatus === "loading" && "Syncing..."}
                {liveStatus === "idle" && "Idle"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage WhatsApp connection, groups, and message queue
            </p>
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

      {/* Stats Overview */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Connection"
            value={connected ? "Active" : "Inactive"}
            icon={Activity}
            color={connected ? "text-green-600" : "text-gray-600"}
          />
          <StatCard
            label="Status"
            value={loggedIn ? "Logged In" : "Logged Out"}
            icon={loggedIn ? CheckCircle2 : XCircle}
            color={loggedIn ? "text-green-600" : "text-red-600"}
          />
          <StatCard
            label="Pending"
            value={stats?.pending ?? 0}
            icon={Clock}
            color="text-blue-600"
          />
          <StatCard
            label="Processing"
            value={stats?.processing ?? 0}
            icon={Loader2}
            color="text-purple-600"
          />
          <StatCard
            label="Completed"
            value={stats?.completed ?? 0}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            label="Failed"
            value={stats?.failed ?? 0}
            icon={XCircle}
            color="text-red-600"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Connection Controls Card */}
          <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Power className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Connection Controls</h2>
              </div>

              <div className="space-y-4">
                {!connected ? (
                  <Button
                    onClick={handleConnect}
                    disabled={connectMutation.isPending || statusLoading}
                    className="w-full"
                    size="lg"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Connect to WhatsApp
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                      size="lg"
                    >
                      {disconnectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Disconnect
                        </>
                      )}
                    </Button>
                    {loggedIn && (
                      <Button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        {logoutMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Pairing Code Request - Show when connected but not logged in */}
                {connected && !loggedIn && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Alternative: Request Pairing Code
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="phone-number">Phone Number</Label>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={requestPairCodeMutation.isPending}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Include country code (e.g., +1 for US)
                        </p>
                      </div>
                      <Button
                        onClick={handleRequestPairCode}
                        disabled={requestPairCodeMutation.isPending}
                        variant="secondary"
                        className="w-full"
                      >
                        {requestPairCodeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <Smartphone className="mr-2 h-4 w-4" />
                            Request Pairing Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Pairing - Show when connected but not logged in */}
          {connected && !loggedIn && qrCode && (
            <Card className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">QR Code Ready</h2>
                  </div>
                  <Button
                    onClick={() => {
                      setUserClosedDialog(false);
                      setIsQrDialogOpen(true);
                    }}
                    variant="default"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Show QR Code
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with your WhatsApp mobile app to log in.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Connection Status Card */}
          <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Connection Status</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div
                    className={cn(
                      "p-2 rounded-md",
                      connected ? "bg-green-600/10" : "bg-red-600/10",
                    )}
                  >
                    {connected ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Connected
                    </p>
                    <p className="text-sm font-bold">
                      {connected ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div
                    className={cn(
                      "p-2 rounded-md",
                      loggedIn ? "bg-green-600/10" : "bg-red-600/10",
                    )}
                  >
                    {loggedIn ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Logged In
                    </p>
                    <p className="text-sm font-bold">
                      {loggedIn ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-md bg-blue-600/10">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Last Update
                    </p>
                    <p className="text-sm font-bold font-mono">
                      {timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groups Section - Show when logged in */}
          {loggedIn && (
            <>
              {/* Queue Stats */}
              <Card className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Message Queue</h2>
                  </div>
                  <QueueStatsCards />
                </CardContent>
              </Card>

              {/* Failed Messages - Show when there are failed messages */}
              {(stats?.failed ?? 0) > 0 && (
                <Card className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <h2 className="text-lg font-semibold">Failed Messages</h2>
                    </div>
                    <FailedMessagesTable />
                  </CardContent>
                </Card>
              )}

              {/* Groups */}
              <Card className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">WhatsApp Groups</h2>
                  </div>
                  <GroupListTable />
                </CardContent>
              </Card>
            </>
          )}

          {/* Info Card */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Connection status updates automatically
                every {Math.floor(WHATSAPP_STATUS_REFETCH_INTERVAL / 1000)}{" "}
                seconds. No manual refresh required.
                {connected && !loggedIn && (
                  <span>
                    {" "}
                    QR code will appear automatically when you connect to
                    WhatsApp.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Open WhatsApp on your phone, go to Settings → Linked Devices →
              Link a Device, and scan this QR code.
            </DialogDescription>
          </DialogHeader>
          {qrCode && <QRCodeDisplay qr={qrCode} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof Activity;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover-elevate transition-all">
      <div className="p-2 rounded-md bg-muted">
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

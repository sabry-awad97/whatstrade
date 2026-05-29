import { Badge } from "@workspace/ui/components/badge";

interface WhatsAppStatusEvent {
  connected: boolean;
  loggedIn: boolean;
  timestamp: Date;
}

interface ConnectionStatusBadgeProps {
  status: WhatsAppStatusEvent;
  isConnecting: boolean;
}

export function ConnectionStatusBadge({
  status,
  isConnecting,
}: ConnectionStatusBadgeProps) {
  if (isConnecting) {
    return (
      <Badge variant="outline" className="animate-pulse">
        Connecting...
      </Badge>
    );
  }

  if (!status.connected) {
    return <Badge variant="destructive">Disconnected</Badge>;
  }

  if (!status.loggedIn) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-500 text-white border-yellow-600"
      >
        Pairing
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-green-500 text-white border-green-600"
    >
      Connected
    </Badge>
  );
}

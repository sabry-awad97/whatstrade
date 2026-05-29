import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeEvent {
  qrCode: string;
  expiresAt: Date;
}

interface QRCodeDisplayProps {
  qr: QRCodeEvent;
}

export function QRCodeDisplay({ qr }: QRCodeDisplayProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    Math.max(0, Math.floor((qr.expiresAt.getTime() - Date.now()) / 1000)),
  );
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((qr.expiresAt.getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [qr.expiresAt]);

  const progress = (secondsRemaining / 60) * 100;
  const isExpiringSoon = secondsRemaining < 15;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm max-w-md mx-auto">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-xl font-semibold mb-2">Pair WhatsApp Device</h2>
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your WhatsApp mobile app
        </p>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        {/* QR Code */}
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG value={qr.qrCode} size={256} level="M" includeMargin />
        </div>

        {/* Countdown Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Expires in:</span>
            <span
              className={
                isExpiringSoon ? "text-yellow-600 font-semibold" : "font-medium"
              }
            >
              {secondsRemaining}s
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                isExpiringSoon ? "bg-yellow-500" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">How to pair:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Open WhatsApp on your phone</li>
            <li>
              Tap <strong className="text-foreground">Settings</strong> →{" "}
              <strong className="text-foreground">Linked Devices</strong>
            </li>
            <li>
              Tap <strong className="text-foreground">Link a Device</strong>
            </li>
            <li>Point your phone at this screen to scan the QR code</li>
          </ol>
        </div>

        {/* Status */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Waiting for scan...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

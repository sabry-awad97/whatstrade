import { Badge } from "@workspace/ui/components/badge";
import { X } from "lucide-react";
import type { GetRequestResponse } from "@workspace/schemas";
import { STATUS_COLORS } from "./constants";

interface RequestDetailPanelProps {
  request: GetRequestResponse | undefined;
  onClose: () => void;
}

/**
 * Request Detail Panel Component
 *
 * Displays detailed information about a selected request in a side panel.
 * Shows all request fields including raw message text.
 */
export function RequestDetailPanel({
  request,
  onClose,
}: RequestDetailPanelProps) {
  if (!request) {
    return null;
  }

  return (
    <div className="w-72 shrink-0 border-l border-border/60 bg-card flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
        <span className="text-xs font-semibold">Request Details</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent"
          aria-label="Close details"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-3 overflow-auto flex-1">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Medication
          </p>
          <p className="text-sm font-semibold mt-0.5">
            {request.medicationName}
          </p>
        </div>
        {request.dosage && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Dosage
            </p>
            <p className="text-sm">{request.dosage}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Quantity
            </p>
            <p className="text-sm font-medium">{request.quantity}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Max Price
            </p>
            <p className="text-sm font-medium">
              {request.maxPrice != null ? `EGP ${request.maxPrice}` : "—"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Group
          </p>
          <p className="text-sm">{request.groupName}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Sender
          </p>
          <p className="text-sm font-mono">{request.senderPhone}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Status
          </p>
          <Badge
            variant="outline"
            className={`text-[10px] mt-0.5 ${STATUS_COLORS[request.status] ?? ""}`}
          >
            {request.status}
          </Badge>
        </div>
        {request.rawText && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Original Message
            </p>
            <p className="text-xs mt-1 p-2 bg-muted rounded text-right dir-rtl font-arabic">
              {request.rawText}
            </p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Created
          </p>
          <p className="text-xs">
            {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

import { Badge } from "@workspace/ui/components/badge";
import { X } from "lucide-react";
import type { OfferResponse } from "@/api/offers";
import { STATUS_COLORS } from "./constants";

interface OfferDetailPanelProps {
  offer: OfferResponse | undefined;
  onClose: () => void;
}

/**
 * Offer Detail Panel Component
 *
 * Displays detailed information about a selected offer in a side panel.
 * Shows all offer fields including raw message text.
 */
export function OfferDetailPanel({ offer, onClose }: OfferDetailPanelProps) {
  if (!offer) {
    return null;
  }

  return (
    <div className="w-72 shrink-0 border-l border-border/60 bg-card flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
        <span className="text-xs font-semibold">Offer Details</span>
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
            {offer.medication_name}
          </p>
        </div>
        {offer.dosage && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Dosage
            </p>
            <p className="text-sm">{offer.dosage}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Quantity
            </p>
            <p className="text-sm font-medium">{offer.quantity}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Price
            </p>
            <p className="text-sm font-medium">
              {offer.price != null ? `EGP ${offer.price}` : "—"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Group
          </p>
          <p className="text-sm">{offer.group_name}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Sender
          </p>
          <p className="text-sm font-mono">{offer.sender_phone}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Status
          </p>
          <Badge
            variant="outline"
            className={`text-[10px] mt-0.5 ${STATUS_COLORS[offer.status] ?? ""}`}
          >
            {offer.status}
          </Badge>
        </div>
        {offer.raw_text && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Original Message
            </p>
            <p className="text-xs mt-1 p-2 bg-muted rounded text-right dir-rtl font-arabic">
              {offer.raw_text}
            </p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Created
          </p>
          <p className="text-xs">{offer.created_at.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

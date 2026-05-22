import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { GetReviewQueueResponseItem } from "@workspace/schemas";

interface ReviewItemCardProps {
  item: GetReviewQueueResponseItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}

/**
 * Review Item Card Component
 *
 * Displays a single review item with approve/reject actions.
 * Shows medication details, raw text, and metadata.
 */
export function ReviewItemCard({
  item,
  onApprove,
  onReject,
  isPending,
}: ReviewItemCardProps) {
  return (
    <div
      className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/10 space-y-3"
      data-testid={`review-item-${item.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{item.medicationName}</p>
            <p className="text-[10px] text-muted-foreground">
              {item.type.toUpperCase()} — {item.groupName} — {item.senderPhone}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] h-4 px-1.5 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950/30 shrink-0"
        >
          {item.status}
        </Badge>
      </div>

      {item.rawText && (
        <div className="p-2 bg-background/80 rounded border border-border/60">
          <p className="text-[10px] text-muted-foreground mb-1">
            Original Arabic message:
          </p>
          <p className="text-xs text-right font-mono dir-rtl font-arabic">
            {item.rawText}
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        {item.dosage && (
          <span>
            Dosage: <strong>{item.dosage}</strong>
          </span>
        )}
        {item.quantity && (
          <span>
            Qty: <strong>{item.quantity}</strong>
          </span>
        )}
        <span>
          {(() => {
            const date = new Date(item.createdAt);
            return isNaN(date.getTime())
              ? "Unknown date"
              : date.toLocaleString();
          })()}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
          onClick={() => onApprove(item.id)}
          disabled={isPending}
          data-testid={`btn-approve-${item.id}`}
        >
          <CheckCircle className="w-3.5 h-3.5" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
          onClick={() => onReject(item.id)}
          disabled={isPending}
          data-testid={`btn-reject-review-${item.id}`}
        >
          <XCircle className="w-3.5 h-3.5" /> Reject
        </Button>
      </div>
    </div>
  );
}

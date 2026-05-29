import { Badge } from "@workspace/ui/components/badge";
import { ClipboardList } from "lucide-react";
import type { ReviewStatsResponse } from "@/api/review";

interface ReviewHeaderProps {
  queueCount: number | undefined;
  stats: ReviewStatsResponse | undefined;
}

/**
 * Review Header Component
 *
 * Displays the review page title, pending count badge, and statistics.
 */
export function ReviewHeader({ queueCount, stats }: ReviewHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold">Review Queue</h1>
        {queueCount !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {queueCount} pending
          </Badge>
        )}
      </div>
      {stats && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{stats.total} total</span>
          <span className="text-green-600">{stats.approved} approved</span>
          <span className="text-destructive">{stats.rejected} rejected</span>
          <span>avg {stats.avg_processing_time.toFixed(1)}s processing</span>
        </div>
      )}
    </div>
  );
}

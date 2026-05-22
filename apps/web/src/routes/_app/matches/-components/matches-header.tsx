import { Badge } from "@workspace/ui/components/badge";
import { GitMerge, ChevronLeft } from "lucide-react";
import type { GetMatchStatsResponse } from "@workspace/schemas";

interface MatchesHeaderProps {
  view: "list" | "detail";
  matchCount: number | undefined;
  stats: GetMatchStatsResponse | undefined;
  onBackClick: () => void;
}

/**
 * Matches Header Component
 *
 * Displays the matches page title, count badge, stats summary, and back button for detail view.
 */
export function MatchesHeader({
  view,
  matchCount,
  stats,
  onBackClick,
}: MatchesHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        {view === "detail" && (
          <button
            onClick={onBackClick}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent mr-1"
            aria-label="Back to list"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <GitMerge className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold">Matches</h1>
        {matchCount !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {matchCount}
          </Badge>
        )}
      </div>
      {stats && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {stats.bandBreakdown.auto} auto
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {stats.pending} pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            avg {(stats.avgScore * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

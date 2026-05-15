import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { GitMerge } from "lucide-react";
import { applyAlpha } from "@/utils/colors";

interface Match {
  id: string;
  medicationName: string;
  score: number;
  confidenceBand: string;
}

interface RecentMatchesListProps {
  matches: Match[] | undefined;
  isLoading: boolean;
  bandColors: Record<string, string>;
}

/**
 * Recent Matches List Component
 *
 * Displays a list of the most recent medication matches with their
 * confidence scores and color-coded confidence bands.
 */
export function RecentMatchesList({
  matches,
  isLoading,
  bandColors,
}: RecentMatchesListProps) {
  return (
    <Card className="p-4 border border-border/80 flex flex-col">
      <h3 className="text-xs font-semibold mb-3 text-foreground">
        Recent Matches
      </h3>
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="space-y-1.5">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex items-center gap-2 text-[11px] py-1 border-b border-border/40 last:border-0"
            >
              <GitMerge className="w-3 h-3 text-primary shrink-0" />
              <span className="font-medium truncate flex-1">
                {match.medicationName}
              </span>
              <span className="text-muted-foreground">
                {(match.score * 100).toFixed(0)}%
              </span>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 h-4"
                style={{
                  backgroundColor: applyAlpha(
                    bandColors[match.confidenceBand] ?? "hsl(var(--muted))",
                    0.125,
                  ),
                  borderColor:
                    bandColors[match.confidenceBand] ?? "hsl(var(--muted))",
                  color:
                    bandColors[match.confidenceBand] ??
                    "hsl(var(--muted-foreground))",
                }}
              >
                {match.confidenceBand.toUpperCase()}
              </Badge>{" "}
            </div>
          ))}
        </div>
      ) : (
        <Empty className="flex-1 min-h-[120px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GitMerge className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No matches yet</EmptyTitle>
            <EmptyDescription>
              Matches will appear here once offers and requests are paired.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Card>
  );
}

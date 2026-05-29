import { Skeleton } from "@workspace/ui/components/skeleton";
import type { MatchResponse } from "@/api/matches";
import { MatchCard } from "./match-card";
import { MatchesTable } from "./matches-table";

interface MatchesListProps {
  matches: MatchResponse[] | undefined;
  isLoading: boolean;
  statusFilter: string;
  onSelectMatch: (match: MatchResponse) => void;
}

/**
 * Matches List Component
 *
 * Displays matches in either card grid (for pending) or TanStack Table format (for other statuses).
 * Shows loading skeletons while data is being fetched.
 */
export function MatchesList({
  matches,
  isLoading,
  statusFilter,
  onSelectMatch,
}: MatchesListProps) {
  // Card grid for pending matches
  if (statusFilter === "pending") {
    if (isLoading) {
      return (
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      );
    }

    if (!matches || matches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm font-medium">No pending matches</p>
        </div>
      );
    }

    return (
      <div className="p-4 grid grid-cols-2 gap-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onSelect={() => onSelectMatch(match)}
          />
        ))}
      </div>
    );
  }

  // TanStack Table view for other statuses
  return (
    <MatchesTable
      matches={matches}
      isLoading={isLoading}
      statusFilter={statusFilter}
      onSelectMatch={onSelectMatch}
    />
  );
}

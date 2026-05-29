import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { Users } from "lucide-react";
import type { GroupResponse } from "@/api/groups";
import { GroupRow } from "./group-row";

interface GroupsListProps {
  groups: GroupResponse[] | undefined;
  isLoading: boolean;
  onToggle: (jid: string, isMonitored: boolean, name: string) => void;
  isPending: boolean;
}

/**
 * Groups List Component
 *
 * Displays groups organized into monitored and available sections.
 * Shows loading skeletons while data is being fetched.
 */
export function GroupsList({
  groups,
  isLoading,
  onToggle,
  isPending,
}: GroupsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No groups found</EmptyTitle>
            <EmptyDescription>
              WhatsApp groups will appear here when available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const monitored = groups.filter((g) => g.is_monitored);
  const unmonitored = groups.filter((g) => !g.is_monitored);

  return (
    <div className="space-y-4">
      {/* Monitored Groups */}
      {monitored.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Monitored ({monitored.length})
          </p>
          <div className="space-y-1.5">
            {monitored.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onToggle={onToggle}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Groups */}
      {unmonitored.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Available Groups ({unmonitored.length})
          </p>
          <div className="space-y-1.5">
            {unmonitored.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onToggle={onToggle}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { Badge } from "@workspace/ui/components/badge";
import { Users, Radio } from "lucide-react";

interface GroupsHeaderProps {
  totalCount: number | undefined;
  monitoredCount: number;
}

/**
 * Groups Header Component
 *
 * Displays the groups page title, total count badge, and monitored count indicator.
 */
export function GroupsHeader({
  totalCount,
  monitoredCount,
}: GroupsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold">WhatsApp Groups</h1>
        {totalCount !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {totalCount} total
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Radio className="w-3 h-3 text-green-500" />
        <span>{monitoredCount} monitored</span>
      </div>
    </div>
  );
}

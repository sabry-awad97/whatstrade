import { Switch } from "@workspace/ui/components/switch";
import type { ListGroupsResponseItem } from "@workspace/schemas";

interface GroupRowProps {
  group: ListGroupsResponseItem;
  onToggle: (jid: string, isMonitored: boolean, name: string) => void;
  isPending: boolean;
}

/**
 * Group Row Component
 *
 * Displays a single group with monitoring toggle switch.
 * Shows group avatar, name, JID, member count, and last message time.
 */
export function GroupRow({ group, onToggle, isPending }: GroupRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-150
        ${group.isMonitored ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card hover:bg-accent/20"}`}
      data-testid={`group-${group.id}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0
        ${group.isMonitored ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {group.name.trim().slice(0, 2).toUpperCase() || "??"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{group.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {group.jid}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium">{group.memberCount}</p>
        <p className="text-[10px] text-muted-foreground">members</p>
      </div>
      {group.lastMessageAt && (
        <div className="text-right shrink-0 hidden md:block">
          <p className="text-[10px] text-muted-foreground">
            {new Date(group.lastMessageAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(group.lastMessageAt).toLocaleDateString()}
          </p>
        </div>
      )}
      <Switch
        checked={group.isMonitored}
        onCheckedChange={() =>
          onToggle(group.jid, group.isMonitored, group.name)
        }
        disabled={isPending}
        data-testid={`switch-monitor-${group.id}`}
      />
    </div>
  );
}

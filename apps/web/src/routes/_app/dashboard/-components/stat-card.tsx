import { Card } from "@workspace/ui/components/card";
import type { LucideIcon } from "lucide-react";
import { applyAlpha } from "@/utils/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  color?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color,
}: StatCardProps) {
  return (
    <Card
      className="p-4 border border-border/80 bg-card hover:shadow-md transition-shadow duration-200"
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-2xl font-semibold mt-0.5 text-foreground">
            {value}
          </p>
          {sub && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: applyAlpha(color ?? "hsl(var(--primary))", 0.094),
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: color ?? "hsl(var(--primary))" }}
          />
        </div>
      </div>
    </Card>
  );
}

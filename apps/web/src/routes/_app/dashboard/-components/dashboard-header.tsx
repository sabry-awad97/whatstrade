import { Badge } from "@workspace/ui/components/badge";

/**
 * Dashboard Header Component
 *
 * Displays the dashboard title, description, and live status indicator.
 */
export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-card/50 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
        <p className="text-[11px] text-muted-foreground">
          Real-time overview of WhatsTrade operations
        </p>
      </div>
      <Badge
        variant="outline"
        className="text-[10px] gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </Badge>
    </div>
  );
}

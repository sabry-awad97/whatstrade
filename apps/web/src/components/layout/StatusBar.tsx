/**
 * StatusBar Component
 * Application status bar with connection status and statistics
 */
import { useGetDashboardStats } from "@/hooks/dashboard";
import { APP_NAME, APP_VERSION } from "@/config/constants";
import { Separator } from "@workspace/ui/components/separator";

export function StatusBar() {
  const { data: stats } = useGetDashboardStats();

  return (
    <div
      className="flex items-center h-6 px-3 bg-primary text-primary-foreground shrink-0 gap-3 text-[10px]"
      data-testid="statusbar"
    >
      {/* Connection Status */}
      <span className="flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"
          aria-hidden="true"
        />
        <span>Connected</span>
      </span>

      <Separator
        orientation="vertical"
        className="h-3 bg-primary-foreground/30"
      />

      {/* Statistics */}
      <span>{stats?.total_matches ?? 0} total matches</span>

      <Separator
        orientation="vertical"
        className="h-3 bg-primary-foreground/30"
      />

      <span>{stats?.active_groups ?? 0} monitored groups</span>

      <Separator
        orientation="vertical"
        className="h-3 bg-primary-foreground/30"
      />

      <span>{stats?.today_messages ?? 0} messages today</span>

      <div className="flex-1" />

      {/* App Version */}
      <span className="text-primary-foreground/70">
        {APP_NAME} v{APP_VERSION}
      </span>
    </div>
  );
}

import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  GitMerge,
  Users,
  Zap,
  CheckCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { GetDashboardStatsResponse } from "@workspace/schemas";
import { StatCard } from "./stat-card";

interface StatsGridProps {
  stats: GetDashboardStatsResponse | undefined;
  isLoading: boolean;
}

interface StatConfig {
  label: string;
  getValue: (stats: GetDashboardStatsResponse) => string | number;
  icon: LucideIcon;
  color: string;
  sub?: string;
}

/**
 * Stats Grid Component
 *
 * Displays a grid of 8 key performance indicators (KPIs) for the dashboard.
 * Shows loading skeletons while data is being fetched.
 * Uses an array-based configuration for maintainability.
 */
export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const statConfigs: StatConfig[] = [
    {
      label: "Total Offers",
      getValue: (s) => s.totalOffers ?? 0,
      icon: Package,
      color: "hsl(211 100% 42%)",
    },
    {
      label: "Total Requests",
      getValue: (s) => s.totalRequests ?? 0,
      icon: ShoppingCart,
      color: "hsl(142 72% 35%)",
    },
    {
      label: "Total Matches",
      getValue: (s) => s.totalMatches ?? 0,
      icon: GitMerge,
      color: "hsl(262 80% 55%)",
    },
    {
      label: "Pending Matches",
      getValue: (s) => s.pendingMatches ?? 0,
      icon: Clock,
      color: "hsl(38 92% 50%)",
      sub: "awaiting review",
    },
    {
      label: "Auto Confirmed",
      getValue: (s) => s.autoConfirmed ?? 0,
      icon: Zap,
      color: "hsl(142 72% 35%)",
      sub: "score ≥ 0.90",
    },
    {
      label: "Avg Match Score",
      getValue: (s) => `${((s.avgMatchScore ?? 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "hsl(262 80% 55%)",
    },
    {
      label: "Active Groups",
      getValue: (s) => s.activeGroups ?? 0,
      icon: Users,
      color: "hsl(211 100% 42%)",
      sub: "monitored",
    },
    {
      label: "Match Rate",
      getValue: (s) => `${(s.matchRate ?? 0).toFixed(1)}%`,
      icon: CheckCircle,
      color: "hsl(142 72% 35%)",
      sub: "of all offers",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {statConfigs.map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {statConfigs.map((config) => (
        <StatCard
          key={config.label}
          label={config.label}
          value={stats ? config.getValue(stats) : 0}
          icon={config.icon}
          color={config.color}
          sub={config.sub}
        />
      ))}
    </div>
  );
}

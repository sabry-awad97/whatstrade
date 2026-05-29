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
import type { DashboardStatsResponse } from "@/api/dashboard";
import { StatCard } from "./stat-card";

interface StatsGridProps {
  stats: DashboardStatsResponse | undefined;
  isLoading: boolean;
}

interface StatConfig {
  label: string;
  getValue: (stats: DashboardStatsResponse) => string | number;
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
      getValue: (s) => s.total_offers ?? 0,
      icon: Package,
      color: "hsl(211 100% 42%)",
    },
    {
      label: "Total Requests",
      getValue: (s) => s.total_requests ?? 0,
      icon: ShoppingCart,
      color: "hsl(142 72% 35%)",
    },
    {
      label: "Total Matches",
      getValue: (s) => s.total_matches ?? 0,
      icon: GitMerge,
      color: "hsl(262 80% 55%)",
    },
    {
      label: "Pending Matches",
      getValue: (s) => s.pending_matches ?? 0,
      icon: Clock,
      color: "hsl(38 92% 50%)",
      sub: "awaiting review",
    },
    {
      label: "Auto Confirmed",
      getValue: (s) => s.auto_confirmed ?? 0,
      icon: Zap,
      color: "hsl(142 72% 35%)",
      sub: "score ≥ 0.90",
    },
    {
      label: "Avg Match Score",
      getValue: (s) => `${((s.avg_match_score ?? 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "hsl(262 80% 55%)",
    },
    {
      label: "Active Groups",
      getValue: (s) => s.active_groups ?? 0,
      icon: Users,
      color: "hsl(211 100% 42%)",
      sub: "monitored",
    },
    {
      label: "Match Rate",
      getValue: (s) => `${(s.match_rate ?? 0).toFixed(1)}%`,
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

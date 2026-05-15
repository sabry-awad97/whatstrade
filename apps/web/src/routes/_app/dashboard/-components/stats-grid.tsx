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
} from "lucide-react";
import type { GetDashboardStatsResponse } from "@workspace/schemas";
import { StatCard } from "./stat-card";

interface StatsGridProps {
  stats: GetDashboardStatsResponse | undefined;
  isLoading: boolean;
}

/**
 * Stats Grid Component
 *
 * Displays a grid of 8 key performance indicators (KPIs) for the dashboard.
 * Shows loading skeletons while data is being fetched.
 */
export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard
        label="Total Offers"
        value={stats?.totalOffers ?? 0}
        icon={Package}
        color="hsl(211 100% 42%)"
      />
      <StatCard
        label="Total Requests"
        value={stats?.totalRequests ?? 0}
        icon={ShoppingCart}
        color="hsl(142 72% 35%)"
      />
      <StatCard
        label="Total Matches"
        value={stats?.totalMatches ?? 0}
        icon={GitMerge}
        color="hsl(262 80% 55%)"
      />
      <StatCard
        label="Pending Matches"
        value={stats?.pendingMatches ?? 0}
        icon={Clock}
        color="hsl(38 92% 50%)"
        sub="awaiting review"
      />
      <StatCard
        label="Auto Confirmed"
        value={stats?.autoConfirmed ?? 0}
        icon={Zap}
        color="hsl(142 72% 35%)"
        sub="score ≥ 0.90"
      />
      <StatCard
        label="Avg Match Score"
        value={`${((stats?.avgMatchScore ?? 0) * 100).toFixed(1)}%`}
        icon={TrendingUp}
        color="hsl(262 80% 55%)"
      />
      <StatCard
        label="Active Groups"
        value={stats?.activeGroups ?? 0}
        icon={Users}
        color="hsl(211 100% 42%)"
        sub="monitored"
      />
      <StatCard
        label="Match Rate"
        value={`${(stats?.matchRate ?? 0).toFixed(1)}%`}
        icon={CheckCircle}
        color="hsl(142 72% 35%)"
        sub="of all offers"
      />
    </div>
  );
}

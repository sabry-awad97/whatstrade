import { createFileRoute, redirect } from "@tanstack/react-router";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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

import { authClient } from "@/lib/auth-client";
import { useGetDashboardStats } from "@/hooks/dashboard";
import { StatCard } from "./-components/stat-card";

const BAND_COLORS: Record<string, string> = {
  auto: "hsl(142 72% 35%)",
  suggest: "hsl(38 92% 50%)",
  review: "hsl(21 85% 50%)",
  none: "hsl(0 72% 48%)",
};

export const Route = createFileRoute("/_app/dashboard/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();

  // Mock data for charts and lists until we implement the full API
  const bandData = [
    { name: "Auto", value: 45, color: BAND_COLORS.auto },
    { name: "Suggest", value: 30, color: BAND_COLORS.suggest },
    { name: "Review", value: 20, color: BAND_COLORS.review },
    { name: "None", value: 5, color: BAND_COLORS.none },
  ];

  const scoreDistData = [
    { name: "#1", score: 95 },
    { name: "#2", score: 88 },
    { name: "#3", score: 92 },
    { name: "#4", score: 78 },
    { name: "#5", score: 85 },
    { name: "#6", score: 90 },
    { name: "#7", score: 82 },
    { name: "#8", score: 87 },
  ];

  const recentOffers = [
    {
      id: "1",
      medicationName: "Aspirin 100mg",
      quantity: 500,
      status: "active",
    },
    {
      id: "2",
      medicationName: "Paracetamol 500mg",
      quantity: 1000,
      status: "active",
    },
    {
      id: "3",
      medicationName: "Ibuprofen 400mg",
      quantity: 750,
      status: "active",
    },
    {
      id: "4",
      medicationName: "Amoxicillin 250mg",
      quantity: 300,
      status: "active",
    },
    {
      id: "5",
      medicationName: "Metformin 500mg",
      quantity: 600,
      status: "active",
    },
  ];

  const recentMatches = [
    {
      id: "1",
      medicationName: "Aspirin 100mg",
      score: 0.95,
      confidenceBand: "auto",
    },
    {
      id: "2",
      medicationName: "Paracetamol 500mg",
      score: 0.88,
      confidenceBand: "suggest",
    },
    {
      id: "3",
      medicationName: "Ibuprofen 400mg",
      score: 0.92,
      confidenceBand: "auto",
    },
    {
      id: "4",
      medicationName: "Amoxicillin 250mg",
      score: 0.78,
      confidenceBand: "suggest",
    },
    {
      id: "5",
      medicationName: "Metformin 500mg",
      score: 0.65,
      confidenceBand: "review",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-card/50 shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
          <p className="text-[11px] text-muted-foreground">
            Real-time overview of PharmaBroker operations
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

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
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
        )}

        <div className="grid grid-cols-3 gap-3">
          {/* Confidence Band Donut */}
          <Card className="p-4 border border-border/80">
            <h3 className="text-xs font-semibold mb-3 text-foreground">
              Confidence Bands
            </h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={bandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    stroke="none"
                  >
                    {bandData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value ?? 0, name ?? ""]}
                    contentStyle={{
                      fontSize: 11,
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {bandData.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-foreground font-medium">
                      {b.name}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {b.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Match Score Bar Chart */}
          <Card className="p-4 border border-border/80 col-span-2">
            <h3 className="text-xs font-semibold mb-3 text-foreground">
              Recent Match Scores
            </h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={scoreDistData}
                margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(v) => [`${v ?? 0}%`, "Score"]}
                  contentStyle={{
                    fontSize: 11,
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Bar
                  dataKey="score"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border border-border/80">
            <h3 className="text-xs font-semibold mb-3 text-foreground">
              Recent Offers
            </h3>
            <div className="space-y-1.5">
              {recentOffers.slice(0, 5).map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center gap-2 text-[11px] py-1 border-b border-border/40 last:border-0"
                >
                  <Package className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-medium truncate flex-1">
                    {offer.medicationName}
                  </span>
                  <span className="text-muted-foreground">
                    {offer.quantity} units
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 h-4">
                    {offer.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 border border-border/80">
            <h3 className="text-xs font-semibold mb-3 text-foreground">
              Recent Matches
            </h3>
            <div className="space-y-1.5">
              {recentMatches.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-2 text-[11px] py-1 border-b border-border/40 last:border-0"
                >
                  <GitMerge className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-medium truncate flex-1">
                    {match.medicationName}
                  </span>
                  <span className="text-muted-foreground">
                    {(match.score * 100).toFixed(0)}%
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 h-4"
                    style={{
                      backgroundColor: `${BAND_COLORS[match.confidenceBand]}20`,
                      borderColor: BAND_COLORS[match.confidenceBand],
                      color: BAND_COLORS[match.confidenceBand],
                    }}
                  >
                    {match.confidenceBand.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

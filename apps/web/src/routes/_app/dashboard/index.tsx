import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { useGetDashboardStats } from "@/hooks/dashboard";
import { useGetMatchStats, useListMatches } from "@/hooks/matches";
import { useListOffers } from "@/hooks/offers";
import {
  DashboardHeader,
  StatsGrid,
  ConfidenceBandChart,
  MatchScoresChart,
  RecentOffersList,
  RecentMatchesList,
  BAND_COLORS,
} from "./-components";

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
  const { data: matchStats, isLoading: matchStatsLoading } = useGetMatchStats();
  const { data: offersResponse, isLoading: offersLoading } = useListOffers({
    pagination: { page: 0, page_size: 5 },
  });
  const { data: matchesResponse, isLoading: matchesLoading } = useListMatches({
    pagination: { page: 0, page_size: 5 },
  });

  // Note: bandBreakdown is not currently returned by the backend
  // Using placeholder data until backend is updated
  const bandData = [
    {
      name: "Auto",
      value: matchStats?.auto_confirmed_matches ?? 0,
      color: BAND_COLORS.auto,
    },
    {
      name: "Suggest",
      value: 0, // Not available in current API
      color: BAND_COLORS.suggest,
    },
    {
      name: "Review",
      value: matchStats?.pending_matches ?? 0,
      color: BAND_COLORS.review,
    },
    {
      name: "None",
      value: matchStats?.rejected_matches ?? 0,
      color: BAND_COLORS.none,
    },
  ];

  // Prepare score distribution from recent matches
  const scoreDistData =
    matchesResponse?.matches.slice(0, 8).map((match, idx) => ({
      name: `#${idx + 1}`,
      score: Math.round(parseFloat(match.score) * 100),
    })) ?? [];

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Stats Grid */}
        <StatsGrid stats={stats} isLoading={statsLoading} />

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-3">
          <ConfidenceBandChart data={bandData} isLoading={matchStatsLoading} />
          <MatchScoresChart data={scoreDistData} isLoading={matchesLoading} />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-2 gap-3">
          <RecentOffersList
            offers={offersResponse?.offers}
            isLoading={offersLoading}
          />
          <RecentMatchesList
            matches={matchesResponse?.matches}
            isLoading={matchesLoading}
            bandColors={BAND_COLORS}
          />
        </div>
      </div>
    </div>
  );
}

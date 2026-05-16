import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ListMatchesResponseItem } from "@workspace/schemas";

import { authClient } from "@/lib/auth-client";
import {
  useGetMatchStats,
  useListMatches,
  useConfirmMatch,
  useRejectMatch,
} from "@/hooks/matches";
import {
  MatchesHeader,
  StatusFilterTabs,
  MatchesList,
  MatchDetailView,
} from "./-components";

export const Route = createFileRoute("/_app/matches/")({
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
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedMatch, setSelectedMatch] =
    useState<ListMatchesResponseItem | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");

  // Fetch matches and stats
  const { data: matches, isLoading } = useListMatches({
    status: statusFilter,
    page: 1,
    limit: 50,
  });
  const { data: stats } = useGetMatchStats();

  // Mutations
  const confirmMutation = useConfirmMatch();
  const rejectMutation = useRejectMatch();

  // Handlers
  const handleSelectMatch = (match: ListMatchesResponseItem) => {
    setSelectedMatch(match);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setView("list");
    setSelectedMatch(null);
  };

  const handleViewChange = (newView: "list" | "detail") => {
    setView(newView);
  };

  const handleConfirm = () => {
    if (!selectedMatch) return;

    confirmMutation.mutate(
      { id: selectedMatch.id },
      {
        onSuccess: () => {
          toast.success("Match confirmed", {
            description: `Match #${selectedMatch.id} has been confirmed.`,
          });
          setView("list");
        },
        onError: (error) => {
          toast.error("Failed to confirm match", {
            description: error.message,
          });
        },
      },
    );
  };

  const handleReject = () => {
    if (!selectedMatch) return;

    rejectMutation.mutate(
      { id: selectedMatch.id },
      {
        onSuccess: () => {
          toast.error("Match rejected", {
            description: `Match #${selectedMatch.id} has been rejected.`,
          });
          setView("list");
        },
        onError: (error) => {
          toast.error("Failed to reject match", {
            description: error.message,
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <MatchesHeader
        view={view}
        matchCount={matches?.length}
        stats={stats}
        onBackClick={handleBackToList}
      />

      <StatusFilterTabs
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        view={view}
        onViewChange={handleViewChange}
        hasSelectedMatch={selectedMatch !== null}
      />

      {view === "list" ? (
        <div className="flex-1 overflow-auto">
          <MatchesList
            matches={matches as ListMatchesResponseItem[] | undefined}
            isLoading={isLoading}
            statusFilter={statusFilter}
            onSelectMatch={handleSelectMatch}
          />
        </div>
      ) : (
        selectedMatch && (
          <MatchDetailView
            match={selectedMatch}
            onConfirm={handleConfirm}
            onReject={handleReject}
            isConfirming={confirmMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        )
      )}
    </div>
  );
}

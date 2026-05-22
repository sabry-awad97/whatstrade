import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ListMatchesResponseItem } from "@workspace/schemas";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch matches and stats
  const { data: matches, isLoading } = useListMatches({
    status: statusFilter,
    page,
    limit,
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
    setPage(1); // Reset to first page when filter changes
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
          toast.success("Match rejected", {
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
        <>
          <div className="flex-1 overflow-auto">
            <MatchesList
              matches={matches}
              isLoading={isLoading}
              statusFilter={statusFilter}
              onSelectMatch={handleSelectMatch}
            />
          </div>
          {/* Pagination Controls */}
          {matches && matches.length > 0 && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} • Showing {matches.length} matches
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoading || (matches && matches.length < limit)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
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

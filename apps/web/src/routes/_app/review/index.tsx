import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  useGetReviewQueue,
  useGetReviewStats,
  useApproveReviewItem,
  useRejectReviewItem,
} from "@/hooks/review";
import { ReviewHeader, ReviewQueueList } from "./-components";

export const Route = createFileRoute("/_app/review/")({
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
  // Fetch review queue and stats
  const { data: queue, isLoading } = useGetReviewQueue();
  const { data: stats } = useGetReviewStats();

  // Mutations for approve/reject
  const approveMutation = useApproveReviewItem();
  const rejectMutation = useRejectReviewItem();

  // Handle approve
  const handleApprove = (id: string) => {
    approveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Item approved", {
            description: `Review item approved successfully.`,
          });
        },
        onError: (error) => {
          toast.error("Failed to approve item", {
            description: error.message,
          });
        },
      },
    );
  };

  // Handle reject
  const handleReject = (id: string) => {
    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.error("Item rejected", {
            description: `Review item rejected.`,
          });
        },
        onError: (error) => {
          toast.error("Failed to reject item", {
            description: error.message,
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ReviewHeader queueCount={queue?.length} stats={stats} />

      <div className="flex-1 overflow-auto p-4">
        <ReviewQueueList
          queue={queue}
          isLoading={isLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          isPending={approveMutation.isPending || rejectMutation.isPending}
        />
      </div>
    </div>
  );
}

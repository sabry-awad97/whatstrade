import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { CheckCircle } from "lucide-react";
import type { ReviewItemResponse } from "@/api/review";
import { ReviewItemCard } from "./review-item-card";

interface ReviewQueueListProps {
  queue: ReviewItemResponse[] | undefined;
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}

/**
 * Review Queue List Component
 *
 * Displays the list of pending review items.
 * Shows loading skeletons while data is being fetched.
 */
export function ReviewQueueList({
  queue,
  isLoading,
  onApprove,
  onReject,
  isPending,
}: ReviewQueueListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>Review queue is empty</EmptyTitle>
            <EmptyDescription>All items have been processed</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {queue.map((item) => (
        <ReviewItemCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          onReject={onReject}
          isPending={isPending}
        />
      ))}
    </div>
  );
}

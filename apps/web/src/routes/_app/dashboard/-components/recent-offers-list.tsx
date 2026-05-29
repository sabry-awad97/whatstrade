import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { Package } from "lucide-react";
import type { OfferResponse } from "@/api/offers";

interface RecentOffersListProps {
  offers: OfferResponse[] | undefined;
  isLoading: boolean;
}

/**
 * Recent Offers List Component
 *
 * Displays a list of the most recent medication offers.
 * Shows loading skeletons while data is being fetched and proper empty states.
 */
export function RecentOffersList({ offers, isLoading }: RecentOffersListProps) {
  return (
    <Card className="p-4 border border-border/80 flex flex-col">
      <h3 className="text-xs font-semibold mb-3 text-foreground">
        Recent Offers
      </h3>
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      ) : offers && offers.length > 0 ? (
        <div className="space-y-1.5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center gap-2 text-[11px] py-1 border-b border-border/40 last:border-0"
            >
              <Package className="w-3 h-3 text-primary shrink-0" />
              <span className="font-medium truncate flex-1">
                {offer.medication_name}
              </span>
              <span className="text-muted-foreground">
                {offer.quantity} units
              </span>
              <Badge variant="outline" className="text-[9px] px-1.5 h-4">
                active
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <Empty className="flex-1 min-h-[120px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No offers yet</EmptyTitle>
            <EmptyDescription>
              Offers will appear here once they are created.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Card>
  );
}

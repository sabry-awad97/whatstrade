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
import type { ListOffersResponseItem } from "@workspace/schemas";
import { STATUS_COLORS } from "./constants";

interface OffersTableProps {
  offers: ListOffersResponseItem[] | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelectOffer: (id: string) => void;
}

/**
 * Offers Table Component
 *
 * Displays a table of medication offers with sortable columns.
 * Supports row selection, loading states, and proper empty state handling.
 */
export function OffersTable({
  offers,
  isLoading,
  selectedId,
  onSelectOffer,
}: OffersTableProps) {
  const renderTableHeader = () => (
    <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
      <tr className="border-b border-border/60">
        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground w-20">
          ID
        </th>
        <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Medication
        </th>
        <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Dosage
        </th>
        <th className="text-right px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Qty
        </th>
        <th className="text-right px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Price
        </th>
        <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Group
        </th>
        <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Status
        </th>
        <th className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Date
        </th>
      </tr>
    </thead>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          {renderTableHeader()}
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={8} className="px-4 py-1.5">
                  <Skeleton className="h-5 w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state - no data at all
  if (!offers || offers.length === 0) {
    return (
      <div className="flex-1 overflow-auto flex flex-col">
        <table className="w-full text-xs border-collapse">
          {renderTableHeader()}
        </table>
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No offers found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter criteria to find offers.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Data state - render table with offers
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs border-collapse">
        {renderTableHeader()}
        <tbody>
          {offers.map((offer) => (
            <tr
              key={offer.id}
              onClick={() => onSelectOffer(offer.id)}
              className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-accent/40 ${
                selectedId === offer.id
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : ""
              }`}
              data-testid={`row-offer-${offer.id}`}
            >
              <td className="px-4 py-2 text-muted-foreground font-mono text-[10px] truncate max-w-[80px]">
                {offer.id.slice(0, 8)}...
              </td>
              <td className="px-3 py-2 font-medium text-foreground">
                {offer.medicationName}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {offer.dosage ?? "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {offer.quantity}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {offer.price != null ? `EGP ${offer.price}` : "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground truncate max-w-[140px]">
                {offer.groupName}
              </td>
              <td className="px-3 py-2">
                <Badge
                  variant="outline"
                  className={`text-[9px] h-4 px-1.5 ${STATUS_COLORS[offer.status] ?? ""}`}
                >
                  {offer.status}
                </Badge>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(offer.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

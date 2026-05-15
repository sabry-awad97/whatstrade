import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Search, Package } from "lucide-react";

interface OffersHeaderProps {
  totalCount: number | undefined;
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * Offers Header Component
 *
 * Displays the offers page title, count badge, and search input.
 */
export function OffersHeader({
  totalCount,
  search,
  onSearchChange,
}: OffersHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold">Offers</h1>
        {totalCount !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {totalCount}
          </Badge>
        )}
      </div>
      <div className="relative w-56">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search medication..."
          className="pl-7 h-7 text-xs"
          data-testid="input-search-offers"
        />
      </div>
    </div>
  );
}

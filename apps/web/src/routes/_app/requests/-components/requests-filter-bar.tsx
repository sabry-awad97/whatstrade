import { FILTER_OPTIONS, type FilterOption } from "./constants";

interface RequestsFilterBarProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

/**
 * Requests Filter Bar Component
 *
 * Displays filter buttons for request status filtering.
 */
export function RequestsFilterBar({
  activeFilter,
  onFilterChange,
}: RequestsFilterBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/40 bg-background/50 shrink-0">
      <span className="text-[10px] text-muted-foreground">Filter:</span>
      {FILTER_OPTIONS.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`text-[10px] px-2 h-5 rounded border transition-colors capitalize ${
            activeFilter === filter
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/60 hover:bg-accent"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

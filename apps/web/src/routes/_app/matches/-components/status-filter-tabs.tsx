interface StatusFilterTabsProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  view: "list" | "detail";
  onViewChange: (view: "list" | "detail") => void;
  hasSelectedMatch: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "auto_confirmed", label: "Auto Confirmed" },
] as const;

/**
 * Status Filter Tabs Component
 *
 * Displays status filter tabs and view toggle buttons.
 */
export function StatusFilterTabs({
  statusFilter,
  onStatusChange,
  view,
  onViewChange,
  hasSelectedMatch,
}: StatusFilterTabsProps) {
  return (
    <div className="flex items-center gap-0 px-4 py-1.5 border-b border-border/40 bg-background/50 shrink-0">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onStatusChange(option.value)}
          className={`text-[10px] px-3 h-6 rounded-sm transition-colors capitalize border-b-2 ${
            statusFilter === option.value
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
      <div className="flex-1" />
      <div className="flex gap-1">
        <button
          onClick={() => onViewChange("list")}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] border ${
            view === "list"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/60 hover:bg-accent"
          }`}
          aria-label="List view"
        >
          ☰
        </button>
        <button
          onClick={() => hasSelectedMatch && onViewChange("detail")}
          disabled={!hasSelectedMatch}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] border ${
            view === "detail"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/60 hover:bg-accent disabled:opacity-30"
          }`}
          aria-label="Detail view"
        >
          ⊡
        </button>
      </div>
    </div>
  );
}

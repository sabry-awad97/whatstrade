import { Button } from "@workspace/ui/components/button";
import { SlidersHorizontal, Save, RotateCcw } from "lucide-react";

interface WeightsHeaderProps {
  dirty: boolean;
  isPending: boolean;
  onSave: () => void;
  onReset: () => void;
}

/**
 * Weights Header Component
 *
 * Displays the weights page title, unsaved changes indicator, and action buttons.
 */
export function WeightsHeader({
  dirty,
  isPending,
  onSave,
  onReset,
}: WeightsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold">Matching Engine Weights</h1>
      </div>
      <div className="flex items-center gap-2">
        {dirty && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={onSave}
          disabled={isPending || !dirty}
          data-testid="btn-save-weights"
        >
          <Save className="w-3 h-3" /> Save Weights
        </Button>
      </div>
    </div>
  );
}

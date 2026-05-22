import { Slider } from "@workspace/ui/components/slider";
import type { WeightKey } from "./constants";
import { WEIGHT_COLORS, WEIGHT_LABELS } from "./constants";

interface WeightSliderProps {
  weightKey: WeightKey;
  value: number;
  onChange: (value: number[]) => void;
}

/**
 * Weight Slider Component
 *
 * Displays a single weight slider with label, color indicator, and percentage value.
 */
export function WeightSlider({
  weightKey,
  value,
  onChange,
}: WeightSliderProps) {
  return (
    <div data-testid={`slider-${weightKey}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: WEIGHT_COLORS[weightKey] }}
          />
          <span className="text-sm font-medium">
            {WEIGHT_LABELS[weightKey]}
          </span>
        </div>
        <span
          className="text-sm font-mono font-semibold tabular-nums"
          style={{ color: WEIGHT_COLORS[weightKey] }}
        >
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={onChange}
        className="w-full"
      />
    </div>
  );
}

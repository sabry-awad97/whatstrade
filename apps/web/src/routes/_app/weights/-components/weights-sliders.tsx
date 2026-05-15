import { WeightSlider } from "./weight-slider";
import { WEIGHT_KEYS, type WeightKey } from "./constants";

interface WeightsSlidersProps {
  values: Record<WeightKey, number>;
  onChange: (key: WeightKey, value: number[]) => void;
}

/**
 * Weights Sliders Component
 *
 * Displays all weight sliders and the total sum indicator.
 */
export function WeightsSliders({ values, onChange }: WeightsSlidersProps) {
  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(total - 1) < 0.001;

  return (
    <div className="flex-1 space-y-5">
      {WEIGHT_KEYS.map((key) => (
        <WeightSlider
          key={key}
          weightKey={key}
          value={values[key]}
          onChange={(val) => onChange(key, val)}
        />
      ))}

      {/* Total Sum Indicator */}
      <div
        className={`mt-4 p-3 rounded-lg border text-xs flex items-center justify-between ${
          isValid
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
        }`}
      >
        <span>Total weight sum:</span>
        <span className="font-mono font-semibold">
          {(total * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

import { BAND_COLORS } from "./constants";

interface ConfidenceRingProps {
  score: number;
  band: string;
  size?: number;
  compact?: boolean;
}

/**
 * Confidence Ring Component
 *
 * Displays a circular progress ring with match score and confidence band.
 *
 * @param compact - When true, hides the "Match Score" label and band badge for compact layouts
 */
export function ConfidenceRing({
  score,
  band,
  size = 160,
  compact = false,
}: ConfidenceRingProps) {
  const clampedScore = Math.max(0, Math.min(1, score));
  const r = size * 0.375;
  const circ = 2 * Math.PI * r;
  const color = BAND_COLORS[band] ?? BAND_COLORS.none;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={size * 0.07}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeDasharray={`${clampedScore * circ} ${(1 - clampedScore) * circ}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 ${size * 0.05}px ${color}80)`,
          }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span
          className={
            compact
              ? "text-xs font-bold tabular-nums"
              : "text-3xl font-bold tabular-nums"
          }
          style={
            compact ? { color } : { color, textShadow: `0 0 20px ${color}40` }
          }
        >
          {(clampedScore * 100).toFixed(0)}%
        </span>
        {!compact && (
          <>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              Match Score
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded mt-1.5 font-bold uppercase`}
              style={{ backgroundColor: `${color}20`, color }}
            >
              {band}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

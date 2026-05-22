import { BAND_COLORS, BAND_COLORS_ALPHA, BAND_BG } from "./constants";

interface ConfidenceRingProps {
  score: number;
  band: string;
}

/**
 * Confidence Ring Component
 *
 * Displays a circular progress ring with the match score and confidence band.
 */
export function ConfidenceRing({ score, band }: ConfidenceRingProps) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = score * circ;
  const color = BAND_COLORS[band] ?? BAND_COLORS.none;
  const colorAlpha = BAND_COLORS_ALPHA[band] ?? BAND_COLORS_ALPHA.none;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        width="144"
        height="144"
        viewBox="0 0 144 144"
      >
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
        />
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${pct} ${circ - pct}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 6px ${colorAlpha.glow})`,
          }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {(score * 100).toFixed(0)}%
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          Match Score
        </span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded mt-1 font-bold ${BAND_BG[band] ?? ""}`}
        >
          {band.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

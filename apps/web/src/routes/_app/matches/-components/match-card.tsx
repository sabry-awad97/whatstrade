import { GitMerge, ChevronRight } from "lucide-react";
import type { MatchResponse } from "@/api/matches";
import { BAND_COLORS, BAND_COLORS_ALPHA } from "./constants";
import { ConfidenceRing } from "./confidence-ring";
import { getConfidenceBand } from "./utils";

interface MatchCardProps {
  match: MatchResponse;
  onSelect: () => void;
}

/**
 * Match Card Component
 *
 * Displays a match in card format with key details and confidence ring.
 */
export function MatchCard({ match, onSelect }: MatchCardProps) {
  const score = parseFloat(match.score);
  const confidenceBand = getConfidenceBand(score);
  const color = BAND_COLORS[confidenceBand] ?? BAND_COLORS.none;
  const colorAlpha =
    BAND_COLORS_ALPHA[confidenceBand] ?? BAND_COLORS_ALPHA.none;

  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-xl border-2 p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 ${
        confidenceBand === "auto"
          ? "border-green-400/50 hover:border-green-400"
          : confidenceBand === "suggest"
            ? "border-amber-400/50 hover:border-amber-400"
            : "border-border/60 hover:border-primary/30"
      }`}
      data-testid={`match-card-${match.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitMerge className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">
            #{match.id} — {match.medication_name ?? "Unknown"}
          </span>
        </div>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase`}
          style={{ backgroundColor: colorAlpha.subtle, color }}
        >
          {confidenceBand}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Offer qty</span>
            <span>{match.offer_quantity ?? 0}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Request qty</span>
            <span>{match.request_quantity ?? 0}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Price</span>
            <span>
              {match.offer_price != null ? `EGP ${match.offer_price}` : "—"}
            </span>
          </div>
        </div>
        <ConfidenceRing score={score} band={confidenceBand} size={56} compact />
      </div>
      <div className="mt-3 flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-muted-foreground">
          Click to review
        </span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </div>
    </button>
  );
}

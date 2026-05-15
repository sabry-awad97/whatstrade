import { Package, ShoppingCart } from "lucide-react";
import { BAND_COLORS } from "./constants";

interface ScoreBreakdown {
  medication: number;
  quantity: number;
  dosage: number;
  price: number;
  recency: number;
}

interface Candidate {
  id: string;
  medicationName: string;
  dosage?: string | null;
  quantity: number;
  price?: string | null;
  groupName?: string;
  senderPhone?: string;
  score: number;
  confidenceBand: string;
  scoreBreakdown: ScoreBreakdown;
}

interface MatchCardProps {
  candidate: Candidate;
  parsedType: string;
}

/**
 * Match Card Component
 *
 * Displays a candidate match with score breakdown.
 */
export function MatchCard({ candidate, parsedType }: MatchCardProps) {
  const isOffer = parsedType === "request";

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-200 ${
        candidate.confidenceBand === "auto"
          ? "border-green-400/60 bg-green-50/50 dark:bg-green-950/10 shadow-md shadow-green-500/10"
          : "border-border/60 bg-card"
      }`}
      data-testid={`match-card-${candidate.id}`}
    >
      <div className="flex items-center gap-2 mb-3">
        {isOffer ? (
          <Package className="w-4 h-4 text-primary" />
        ) : (
          <ShoppingCart className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-xs font-semibold">
          {isOffer ? "Medication Offer" : "Medication Request"}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          #{candidate.id}
        </span>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Medication</span>
          <span className="font-semibold">{candidate.medicationName}</span>
        </div>
        {candidate.dosage && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Dosage</span>
            <span>{candidate.dosage}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-medium">{candidate.quantity} units</span>
        </div>
        {candidate.price != null && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Price</span>
            <span>EGP {candidate.price}</span>
          </div>
        )}
        {candidate.groupName && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Group</span>
            <span className="truncate max-w-[120px] text-right">
              {candidate.groupName}
            </span>
          </div>
        )}
      </div>
      {/* Score breakdown mini-bars */}
      <div className="space-y-1 border-t border-border/40 pt-2">
        {(Object.entries(candidate.scoreBreakdown) as [string, number][]).map(
          ([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-[10px]">
              <span className="w-16 text-muted-foreground capitalize">{k}</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${v * 100}%`,
                    backgroundColor:
                      BAND_COLORS[candidate.confidenceBand] ?? BAND_COLORS.none,
                  }}
                />
              </div>
              <span className="w-6 text-right tabular-nums text-muted-foreground">
                {(v * 100).toFixed(0)}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

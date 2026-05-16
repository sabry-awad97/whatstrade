import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  GitMerge,
  CheckCircle,
  XCircle,
  Package,
  ShoppingCart,
  Brain,
} from "lucide-react";
import type { ListMatchesResponseItem } from "@workspace/schemas";
import { ConfidenceRing } from "./confidence-ring";
import { BAND_COLORS, STATUS_COLORS } from "./constants";
import {
  calculateRecencyScore,
  calculatePriceScore,
  calculateQuantityScore,
} from "@/utils/scoring";

interface MatchDetailViewProps {
  match: ListMatchesResponseItem;
  onConfirm: () => void;
  onReject: () => void;
  isConfirming: boolean;
  isRejecting: boolean;
}

/**
 * Match Detail View Component
 *
 * Displays detailed match information with offer/request cards, confidence ring,
 * AI reasoning, score breakdown, and action buttons.
 */
export function MatchDetailView({
  match,
  onConfirm,
  onReject,
  isConfirming,
  isRejecting,
}: MatchDetailViewProps) {
  const color = BAND_COLORS[match.confidenceBand] ?? BAND_COLORS.none;

  // Calculate AI reasoning checks
  const availabilityOk = match.score >= 0.6;
  const quantityScore = calculateQuantityScore(
    match.offerQuantity,
    match.requestQuantity,
  );
  const priceFitOk =
    match.offerPrice != null &&
    match.maxPrice != null &&
    Number(match.offerPrice) <= Number(match.maxPrice);
  const qtyMatchOk = quantityScore > 0.5;

  // Calculate score breakdown values (estimated - not from backend)
  const priceScore = calculatePriceScore(match.offerPrice, match.maxPrice);
  const recencyScore = calculateRecencyScore(match.createdAt);

  // Estimate medication score as remainder to make total = 100%
  // Weights: medication 40%, quantity 20%, dosage 15%, price 15%, recency 10%
  // Since we don't have dosage info, we estimate medication + dosage together
  const estimatedMedicationScore =
    Number.isFinite(quantityScore) &&
    Number.isFinite(priceScore) &&
    Number.isFinite(recencyScore)
      ? (match.score -
          (quantityScore * 0.2 + priceScore * 0.15 + recencyScore * 0.1)) /
        0.55
      : 0;

  return (
    <div className="flex flex-col h-full overflow-auto p-5 gap-4 animate-fade-up">
      {/* Match ID + meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Match #{match.id}</span>
          <Badge
            variant="outline"
            className={`text-[9px] h-4 px-1.5 ${STATUS_COLORS[match.status] ?? ""}`}
          >
            {match.status.replace("_", " ")}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {new Date(match.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Three-column layout: offer | ring | request */}
      <div className="flex items-stretch gap-4">
        {/* Offer card */}
        <div className="flex-1 rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Medication Offer</p>
              <p className="text-[10px] text-muted-foreground">
                Pharmacy / Supplier
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Medication</p>
              <p className="text-base font-bold">
                {match.medicationName ?? "Unknown"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Quantity</p>
                <p className="text-sm font-semibold">
                  {(match.offerQuantity ?? 0).toLocaleString()} units
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Price / unit
                </p>
                <p className="text-sm font-semibold">
                  {match.offerPrice != null ? `EGP ${match.offerPrice}` : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence ring */}
        <div className="flex flex-col items-center justify-center gap-3 shrink-0">
          <ConfidenceRing
            score={match.score}
            band={match.confidenceBand}
            size={160}
          />

          {/* AI reasoning lines */}
          <div className="text-center space-y-0.5 max-w-[160px]">
            {[
              { label: "Availability", ok: availabilityOk },
              { label: "Price Fit", ok: priceFitOk },
              { label: "Qty Match", ok: qtyMatchOk },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <span
                  className={`w-3 h-3 rounded-full flex items-center justify-center ${
                    item.ok ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  {item.ok && <CheckCircle className="w-2 h-2 text-white" />}
                </span>
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Brain className="w-3 h-3 text-primary" />
            <span>AI Analysis</span>
          </div>
        </div>

        {/* Request card */}
        <div className="flex-1 rounded-xl border-2 border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold">Medication Request</p>
              <p className="text-[10px] text-muted-foreground">
                Clinic / Hospital
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Medication</p>
              <p className="text-base font-bold">
                {match.medicationName ?? "Unknown"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Needed</p>
                <p className="text-sm font-semibold">
                  {(match.requestQuantity ?? 0).toLocaleString()} units
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Max Price</p>
                <p className="text-sm font-semibold">
                  {match.maxPrice != null ? `EGP ${match.maxPrice}` : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown bars */}
      <div className="border border-border/60 rounded-xl p-4 bg-card">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Estimated Score Breakdown
        </p>
        <div className="space-y-2.5">
          {[
            {
              label: "Medication + Dosage",
              value: estimatedMedicationScore,
              weight: "55%",
            },
            { label: "Quantity Match", value: quantityScore, weight: "20%" },
            { label: "Price Fit", value: priceScore, weight: "15%" },
            { label: "Recency", value: recencyScore, weight: "10%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-32 shrink-0">
                {item.label}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(0, Math.min(1, item.value)) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">
                {(Math.max(0, Math.min(1, item.value)) * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-muted-foreground/60 w-8">
                {item.weight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      {match.status === "pending" && (
        <div className="flex gap-3">
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={onConfirm}
            disabled={isConfirming}
            data-testid={`btn-detail-confirm-${match.id}`}
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Match
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onReject}
            disabled={isRejecting}
            data-testid={`btn-detail-reject-${match.id}`}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
        </div>
      )}

      {match.status !== "pending" && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            match.status === "auto_confirmed" || match.status === "confirmed"
              ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          {match.status === "confirmed" || match.status === "auto_confirmed" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span className="font-medium capitalize">
            {match.status.replace("_", " ")} — no further action needed
          </span>
        </div>
      )}
    </div>
  );
}

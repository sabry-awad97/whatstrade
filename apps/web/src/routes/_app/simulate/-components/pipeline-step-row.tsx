import { CheckCircle, XCircle, Info, Loader2 } from "lucide-react";

export interface PipelineStep {
  step: string;
  status: string;
  detail: string;
  durationMs: number;
}

interface PipelineStepRowProps {
  step: PipelineStep;
  index: number;
  active: boolean;
}

/**
 * Pipeline Step Row Component
 *
 * Displays a single pipeline execution step with status icon.
 */
export function PipelineStepRow({ step, index, active }: PipelineStepRowProps) {
  const Icon =
    step.status === "success"
      ? CheckCircle
      : step.status === "error"
        ? XCircle
        : step.status === "skipped"
          ? Info
          : Loader2;

  const color =
    step.status === "success"
      ? "text-green-500"
      : step.status === "error"
        ? "text-destructive"
        : step.status === "skipped"
          ? "text-muted-foreground"
          : "text-primary";

  return (
    <div
      className={`flex items-start gap-3 py-2 transition-all duration-300 ${
        active ? "opacity-100" : "opacity-60"
      }`}
    >
      <div className="flex flex-col items-center">
        <Icon
          className={`w-4 h-4 shrink-0 mt-0.5 ${color} ${
            step.status === "pending" ? "animate-spin" : ""
          }`}
        />
        {index < 10 && <div className="w-px flex-1 bg-border/40 mt-1 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">{step.step}</span>
          {step.durationMs > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {step.durationMs}ms
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {step.detail}
        </p>
      </div>
    </div>
  );
}

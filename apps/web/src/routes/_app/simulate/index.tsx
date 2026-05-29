import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Brain,
  Database,
  FlaskConical,
  GitMerge,
  Grid3x3,
  List,
  Loader2,
  Package,
  Play,
  RotateCcw,
  ShoppingCart,
  Table,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type {
  SimulateResponse,
  PipelineStep as ApiPipelineStep,
} from "@/api/simulate";
import { useSimulateMessage } from "@/hooks/simulate";
import {
  ConfidenceRing,
  MatchCard,
  PipelineStepRow,
  SAMPLE_MESSAGES,
  type PipelineStep,
} from "./-components";

export const Route = createFileRoute("/_app/simulate/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [rawText, setRawText] = useState("");
  const [messageType, setMessageType] = useState<string>("auto");
  const [insertIntoSystem, setInsertIntoSystem] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);
  const [streamingSteps, setStreamingSteps] = useState<PipelineStep[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table" | "list">("table");
  const resultRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const simulateMutation = useSimulateMessage();

  const topCandidate = result?.candidates[selectedCandidateIdx] ?? null;

  // Track mount status for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRun = async () => {
    if (!rawText.trim()) {
      toast.error("Enter a message", {
        description: "Paste an Arabic WhatsApp message to simulate.",
      });
      return;
    }

    setResult(null);
    setStreamingSteps([
      {
        step: "Sending to AI…",
        status: "pending",
        detail: "Parsing Arabic message",
        durationMs: 0,
      },
    ]);

    simulateMutation.mutate(
      {
        rawText,
        messageType,
        insertIntoSystem,
      },
      {
        onSuccess: async (data) => {
          // Use real pipeline steps from backend
          const backendSteps: PipelineStep[] = data.pipeline_steps.map(
            (step) => ({
              step: step.step,
              status: step.status,
              detail: step.detail,
              durationMs: step.duration_ms,
            }),
          );

          // Animate steps appearing with mount check
          setStreamingSteps([]);
          for (let i = 0; i < backendSteps.length; i++) {
            if (!isMountedRef.current) return;
            await new Promise((r) => setTimeout(r, 180));
            if (!isMountedRef.current) return;
            setStreamingSteps((prev) => [...prev, backendSteps[i]]);
          }

          if (!isMountedRef.current) return;

          setResult(data);
          setSelectedCandidateIdx(0);

          if (data.inserted_id) {
            toast.success("Inserted into system", {
              description: `${data.parsed_type} #${data.inserted_id} created with ${data.candidates.length} matches.`,
            });
          }
        },
        onError: (error) => {
          toast.error("Simulation failed", {
            description: error.message,
          });
          setStreamingSteps([]);
        },
      },
    );
  };

  const handleSample = () => {
    const s =
      SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
    setRawText(s);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold">Message Simulator</h1>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5 gap-1 text-primary border-primary/30 bg-primary/5"
          >
            <Brain className="w-2.5 h-2.5" /> AI-Powered
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Paste an Arabic WhatsApp message to parse, score, and optionally
          ingest
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT: Input panel */}
        <div className="w-80 shrink-0 border-r border-border/60 flex flex-col bg-card/30 p-4 gap-3 overflow-auto">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Arabic WhatsApp Message
            </label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="الصق رسالة واتساب هنا…"
              className="text-sm text-right min-h-[100px] max-h-[300px] font-arabic leading-relaxed resize-none overflow-y-auto"
              dir="rtl"
              data-testid="textarea-simulate-input"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7 gap-1.5"
              onClick={handleSample}
            >
              <RotateCcw className="w-3 h-3" /> Sample
            </Button>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Message Type
            </label>
            <Select
              value={messageType}
              onValueChange={(value) => setMessageType(value)}
            >
              <SelectTrigger
                className="h-8 text-xs"
                data-testid="select-message-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  Auto-detect
                </SelectItem>
                <SelectItem value="offer" className="text-xs">
                  Offer (I have…)
                </SelectItem>
                <SelectItem value="request" className="text-xs">
                  Request (I need…)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/50">
            <div>
              <p className="text-xs font-medium">Insert into System</p>
              <p className="text-[10px] text-muted-foreground">
                Save & create matches after parsing
              </p>
            </div>
            <Switch
              checked={insertIntoSystem}
              onCheckedChange={setInsertIntoSystem}
              data-testid="switch-insert"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={simulateMutation.isPending || !rawText.trim()}
            className="w-full h-8 text-xs gap-2"
            data-testid="btn-run-simulate"
          >
            {simulateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {simulateMutation.isPending ? "Analyzing…" : "Run Simulation"}
          </Button>

          {/* Pipeline steps */}
          {streamingSteps.length > 0 && (
            <div className="border border-border/60 rounded-lg p-3 bg-background/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Pipeline
              </p>
              <div className="space-y-0">
                {streamingSteps.map((step, i) => (
                  <PipelineStepRow
                    key={i}
                    step={step}
                    index={i}
                    active={
                      !simulateMutation.isPending ||
                      i === streamingSteps.length - 1
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Results */}
        <div className="flex-1 overflow-auto p-4" ref={resultRef}>
          {!result && !simulateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FlaskConical className="w-14 h-14 mb-4 opacity-10" />
              <p className="text-sm font-medium">No simulation run yet</p>
              <p className="text-xs mt-1 opacity-60">
                Paste a message on the left and click Run
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 max-w-sm w-full">
                {SAMPLE_MESSAGES.slice(0, 3).map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setRawText(m)}
                    className="text-right text-xs p-2 rounded-lg border border-border/60 hover:bg-accent/50 transition-colors text-foreground/70 leading-relaxed"
                    dir="rtl"
                  >
                    {[...m].slice(0, 60).join("")}…
                  </button>
                ))}{" "}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-up max-w-4xl">
              {/* Parsed fields */}
              <div className="border border-border/60 rounded-xl p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">AI Extraction</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] h-4 px-1.5 ml-2 ${
                        result.parsed_type === "offer"
                          ? "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
                          : "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                      }`}
                    >
                      {result.parsed_type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setViewMode("table")}
                    >
                      <Table className="w-3 h-3" />
                    </Button>

                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="w-3 h-3" />
                    </Button>

                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto pr-4">
                  {/* Group fields by medication */}
                  {(() => {
                    // Group fields by medication index
                    const medicationGroups: Record<
                      string,
                      typeof result.parsed_fields
                    > = {};
                    result.parsed_fields.forEach((field) => {
                      const match = field.field.match(/^medication\[(\d+)\]\./);
                      const groupKey = match ? `med_${match[1]}` : "med_0";
                      if (!medicationGroups[groupKey]) {
                        medicationGroups[groupKey] = [];
                      }
                      medicationGroups[groupKey].push(field);
                    });

                    // Grid View
                    if (viewMode === "grid") {
                      return Object.entries(medicationGroups).map(
                        ([groupKey, fields]) => (
                          <div key={groupKey} className="mb-4 last:mb-0">
                            {Object.keys(medicationGroups).length > 1 && (
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Medication{" "}
                                {parseInt(groupKey.replace("med_", "")) + 1}
                              </p>
                            )}
                            <div className="grid grid-cols-5 gap-3">
                              {fields.map((field) => (
                                <div
                                  key={field.field}
                                  className="p-2.5 rounded-lg bg-background border border-border/50"
                                >
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                    {field.field
                                      .replace(/^medication\[\d+\]\./, "")
                                      .replace(/([A-Z])/g, " $1")}
                                  </p>
                                  <p className="text-sm font-semibold mt-0.5">
                                    {field.value || "—"}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-primary"
                                        style={{
                                          width: `${field.confidence * 100}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-[9px] tabular-nums text-muted-foreground">
                                      {(field.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      );
                    }

                    // Table View
                    if (viewMode === "table") {
                      return (
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 font-semibold">
                                  #
                                </th>
                                <th className="text-left p-2 font-semibold">
                                  Name
                                </th>
                                <th className="text-left p-2 font-semibold">
                                  Concentration
                                </th>
                                <th className="text-left p-2 font-semibold">
                                  Form
                                </th>
                                <th className="text-left p-2 font-semibold">
                                  Quantity
                                </th>
                                <th className="text-left p-2 font-semibold">
                                  Expiry
                                </th>
                                <th className="text-left p-2 font-semibold">
                                  Confidence
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(medicationGroups).map(
                                ([groupKey, fields]) => {
                                  const medNum =
                                    parseInt(groupKey.replace("med_", "")) + 1;
                                  const fieldMap = Object.fromEntries(
                                    fields.map((f) => [
                                      f.field.replace(
                                        /^medication\[\d+\]\./,
                                        "",
                                      ),
                                      f,
                                    ]),
                                  );
                                  return (
                                    <tr
                                      key={groupKey}
                                      className="border-t border-border/50 hover:bg-muted/30"
                                    >
                                      <td className="p-2 font-medium">
                                        {medNum}
                                      </td>
                                      <td className="p-2">
                                        {fieldMap.medicationName?.value || "—"}
                                      </td>
                                      <td className="p-2">
                                        {fieldMap.concentration?.value || "—"}
                                      </td>
                                      <td className="p-2">
                                        {fieldMap.form?.value || "—"}
                                      </td>
                                      <td className="p-2">
                                        {fieldMap.quantity?.value || "—"}
                                      </td>
                                      <td className="p-2">
                                        {fieldMap.expiry?.value || "—"}
                                      </td>
                                      <td className="p-2">
                                        <span className="text-[10px] tabular-nums">
                                          {(
                                            (fieldMap.medicationName
                                              ?.confidence || 0) * 100
                                          ).toFixed(0)}
                                          %
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    // List View
                    return Object.entries(medicationGroups).map(
                      ([groupKey, fields]) => {
                        const medNum =
                          parseInt(groupKey.replace("med_", "")) + 1;
                        return (
                          <div
                            key={groupKey}
                            className="mb-3 last:mb-0 p-3 rounded-lg border border-border/50 bg-background"
                          >
                            {Object.keys(medicationGroups).length > 1 && (
                              <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">
                                Medication {medNum}
                              </p>
                            )}
                            <div className="space-y-1.5">
                              {fields.map((field) => (
                                <div
                                  key={field.field}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-muted-foreground capitalize">
                                    {field.field
                                      .replace(/^medication\[\d+\]\./, "")
                                      .replace(/([A-Z])/g, " $1")}
                                    :
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {field.value || "—"}
                                    </span>
                                    <span className="text-[10px] tabular-nums text-muted-foreground">
                                      ({(field.confidence * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      },
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2 mt-3">
                  {result.ai_reasoning}
                </p>
              </div>

              {/* Match candidates */}
              {result.candidates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GitMerge className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Top Matches</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5"
                    >
                      {result.candidates.length} found
                    </Badge>
                    <div className="flex gap-1 ml-2">
                      {result.candidates.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedCandidateIdx(i)}
                          className={`w-5 h-5 rounded text-[9px] font-bold border transition-colors ${
                            selectedCandidateIdx === i
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border/60 hover:bg-accent"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Top match visualization */}
                  {topCandidate && (
                    <div className="border border-border/60 rounded-xl p-5 bg-card mb-3">
                      <div className="flex items-center gap-6">
                        {/* Parsed message card */}
                        <div className="flex-1 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
                          <div className="flex items-center gap-2 mb-3">
                            {result.parsed_type === "offer" ? (
                              <Package className="w-4 h-4 text-primary" />
                            ) : (
                              <ShoppingCart className="w-4 h-4 text-amber-500" />
                            )}
                            <span className="text-xs font-semibold">
                              Your Message (
                              {result.parsed_type === "offer"
                                ? "Offer"
                                : "Request"}
                              )
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {result.parsed_fields.map((f) => (
                              <div
                                key={f.field}
                                className="flex justify-between text-xs"
                              >
                                <span className="text-muted-foreground capitalize">
                                  {f.field.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span className="font-medium">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Confidence Ring */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                          <ConfidenceRing
                            score={topCandidate.score}
                            band={
                              topCandidate.score >= 0.85
                                ? "auto"
                                : topCandidate.score >= 0.7
                                  ? "suggest"
                                  : topCandidate.score >= 0.5
                                    ? "review"
                                    : "reject"
                            }
                          />
                          <p className="text-[10px] text-muted-foreground text-center">
                            {topCandidate.score >= 0.85
                              ? "Auto-confirm eligible"
                              : topCandidate.score >= 0.7
                                ? "Suggested — review"
                                : topCandidate.score >= 0.5
                                  ? "Low confidence"
                                  : "Poor match"}
                          </p>
                        </div>

                        {/* Matching candidate card */}
                        <div className="flex-1">
                          <MatchCard
                            candidate={topCandidate}
                            parsedType={result.parsed_type}
                          />
                        </div>
                      </div>

                      {/* AI reasoning about match */}
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-[11px] text-muted-foreground italic">
                          AI Analysis:
                          {topCandidate.score >= 0.85
                            ? "Optimal match — medication name, dosage, and quantity align well. Price within range."
                            : topCandidate.score >= 0.7
                              ? "Good candidate — medication matches but minor discrepancies in quantity or price."
                              : "Partial match — review recommended before confirming."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Other candidates */}
                  {result.candidates.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      {result.candidates.slice(1).map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCandidateIdx(i + 1)}
                          className="text-left"
                        >
                          <MatchCard
                            candidate={c}
                            parsedType={result.parsed_type}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result.candidates.length === 0 && (
                <div className="border border-border/60 rounded-xl p-8 bg-card flex flex-col items-center text-muted-foreground">
                  <GitMerge className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">
                    No matching candidates found
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    Score threshold is 50% — no existing
                    {result.parsed_type === "offer"
                      ? " requests"
                      : " offers"}{" "}
                    are close enough
                  </p>
                </div>
              )}

              {result.inserted_id && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-green-300/60 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/60 text-sm">
                  <Database className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-green-700 dark:text-green-400">
                    Successfully inserted into system — {result.parsed_type} #
                    {result.inserted_id}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simulate Components
 *
 * Barrel export for all simulate-related components.
 */

export { ConfidenceRing } from "./confidence-ring";
export { MatchCard } from "./match-card";
export { PipelineStepRow } from "./pipeline-step-row";
export { SAMPLE_MESSAGES, BAND_COLORS, BAND_BG } from "./constants";

// Re-export PipelineStep type from API layer (single source of truth)
export type { PipelineStep } from "@/api/simulate";

// Re-export view strategies
export {
  viewStrategies,
  groupMedicationsByIndex,
  type ViewMode,
  type MedicationGroup,
} from "./view-strategies";

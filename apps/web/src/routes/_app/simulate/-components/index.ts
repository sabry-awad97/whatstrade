/**
 * Simulate Components
 *
 * Public components for the simulate route.
 * Only exports components and utilities used by index.tsx.
 * Internal-only items are not exported.
 */

// UI Components
export { ConfidenceRing } from "./confidence-ring";
export { MatchCard } from "./match-card";
export { PipelineStepRow } from "./pipeline-step-row";

// Constants
export { SAMPLE_MESSAGES } from "./constants";
// BAND_COLORS and BAND_BG are internal to ConfidenceRing - not exported

// View Strategies (used by main component)
export { viewStrategies, type ViewMode } from "./view-strategies";
// groupMedicationsByIndex and MedicationGroup are internal - not exported

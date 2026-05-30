/**
 * Pipeline Observer Pattern
 *
 * Event-driven pipeline step tracking using the Observer pattern.
 * Decouples pipeline step updates from UI rendering.
 */

import type { PipelineStep } from "@/api/simulate";

/**
 * Listener function type for pipeline step updates
 */
type PipelineListener = (steps: PipelineStep[]) => void;

/**
 * Observer for pipeline execution steps
 *
 * Implements the Observer pattern to notify subscribers when pipeline steps change.
 * This decouples the pipeline execution logic from the UI rendering.
 *
 * @example
 * ```typescript
 * const observer = new PipelineObserver();
 *
 * // Subscribe to updates
 * observer.subscribe((steps) => {
 *   console.log('Pipeline updated:', steps);
 *   setStreamingSteps(steps);
 * });
 *
 * // Add steps as they complete
 * observer.addStep({
 *   step: "AI Extraction",
 *   status: "success",
 *   detail: "Extracted medication data",
 *   duration_ms: 1200
 * });
 *
 * // Clear when done
 * observer.clear();
 * ```
 */
export class PipelineObserver {
  private steps: PipelineStep[] = [];
  private listeners: PipelineListener[] = [];

  /**
   * Add a new pipeline step and notify all listeners
   */
  addStep(step: PipelineStep): void {
    this.steps.push(step);
    this.notify();
  }

  /**
   * Update an existing step by index
   */
  updateStep(index: number, step: Partial<PipelineStep>): void {
    if (index >= 0 && index < this.steps.length) {
      this.steps[index] = { ...this.steps[index], ...step };
      this.notify();
    }
  }

  /**
   * Replace all steps at once
   */
  setSteps(steps: PipelineStep[]): void {
    this.steps = [...steps];
    this.notify();
  }

  /**
   * Get current steps (read-only copy)
   */
  getSteps(): readonly PipelineStep[] {
    return [...this.steps];
  }

  /**
   * Clear all steps
   */
  clear(): void {
    this.steps = [];
    this.notify();
  }

  /**
   * Subscribe to pipeline step updates
   *
   * @param listener - Function to call when steps change
   * @returns Unsubscribe function
   */
  subscribe(listener: PipelineListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(listener);
    };
  }

  /**
   * Unsubscribe a listener
   */
  unsubscribe(listener: PipelineListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of step changes
   */
  private notify(): void {
    // Create a copy to prevent mutation during iteration
    const currentSteps = [...this.steps];
    this.listeners.forEach((listener) => listener(currentSteps));
  }

  /**
   * Get the number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Remove all listeners
   */
  clearListeners(): void {
    this.listeners = [];
  }
}

/**
 * React hook for using PipelineObserver
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const [steps, setSteps] = useState<PipelineStep[]>([]);
 *   const observerRef = usePipelineObserver(setSteps);
 *
 *   const handleSimulate = () => {
 *     observerRef.current.clear();
 *     observerRef.current.addStep({
 *       step: "Starting...",
 *       status: "pending",
 *       detail: "Initializing",
 *       duration_ms: 0
 *     });
 *   };
 *
 *   return <div>{steps.map(s => <div key={s.step}>{s.step}</div>)}</div>;
 * }
 * ```
 */
export function usePipelineObserver(
  onUpdate: (steps: PipelineStep[]) => void,
): React.RefObject<PipelineObserver> {
  const observerRef = React.useRef<PipelineObserver>(new PipelineObserver());

  React.useEffect(() => {
    const observer = observerRef.current;
    const unsubscribe = observer.subscribe(onUpdate);

    return () => {
      unsubscribe();
    };
  }, [onUpdate]);

  return observerRef;
}

// Re-export React for the hook
import * as React from "react";

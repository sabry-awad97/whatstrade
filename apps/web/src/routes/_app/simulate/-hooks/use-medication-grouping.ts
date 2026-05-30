/**
 * useMedicationGrouping Hook
 *
 * Memoized hook for grouping parsed medication fields by index.
 * Prevents unnecessary recalculations when view mode changes or
 * other unrelated state updates occur.
 */

import { useMemo } from "react";
import type { ParsedField } from "@/api/simulate";
import {
  groupMedicationsByIndex,
  type MedicationGroup,
} from "../-components/view-strategies";

/**
 * Hook to group medication fields with memoization
 *
 * @param fields - Array of parsed fields from AI extraction
 * @returns Grouped medications by index
 *
 * @example
 * ```typescript
 * const medicationGroups = useMedicationGrouping(result?.parsed_fields ?? []);
 *
 * return (
 *   <div>
 *     {viewStrategies.get(viewMode)?.render(medicationGroups)}
 *   </div>
 * );
 * ```
 */
export function useMedicationGrouping(
  fields: ParsedField[],
): MedicationGroup[] {
  return useMemo(() => {
    if (!fields || fields.length === 0) {
      return [];
    }
    return groupMedicationsByIndex(fields);
  }, [fields]);
}

/**
 * Extended hook with additional filtering and sorting options
 *
 * @param fields - Array of parsed fields
 * @param options - Grouping options
 * @returns Grouped and filtered medications
 *
 * @example
 * ```typescript
 * const medicationGroups = useMedicationGroupingWithOptions(
 *   result?.parsed_fields ?? [],
 *   {
 *     minConfidence: 0.7,
 *     sortBy: 'confidence',
 *     sortOrder: 'desc'
 *   }
 * );
 * ```
 */
export function useMedicationGroupingWithOptions(
  fields: ParsedField[],
  options?: {
    minConfidence?: number;
    sortBy?: "index" | "confidence";
    sortOrder?: "asc" | "desc";
  },
): MedicationGroup[] {
  return useMemo(() => {
    if (!fields || fields.length === 0) {
      return [];
    }

    let groups = groupMedicationsByIndex(fields);

    // Filter by minimum confidence if specified
    if (options?.minConfidence !== undefined) {
      groups = groups.filter((group) => {
        const avgConfidence =
          Array.from(group.fields.values()).reduce(
            (sum, field) => sum + field.confidence,
            0,
          ) / group.fields.size;
        return avgConfidence >= options.minConfidence!;
      });
    }

    // Sort groups if specified
    if (options?.sortBy === "confidence") {
      groups.sort((a, b) => {
        const avgA =
          Array.from(a.fields.values()).reduce(
            (sum, field) => sum + field.confidence,
            0,
          ) / a.fields.size;
        const avgB =
          Array.from(b.fields.values()).reduce(
            (sum, field) => sum + field.confidence,
            0,
          ) / b.fields.size;

        return options.sortOrder === "desc" ? avgB - avgA : avgA - avgB;
      });
    }

    return groups;
  }, [fields, options?.minConfidence, options?.sortBy, options?.sortOrder]);
}

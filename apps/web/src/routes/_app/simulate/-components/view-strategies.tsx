/**
 * View Strategy Pattern for Medication Fields Display
 *
 * Implements different rendering strategies for medication data:
 * - Grid: Card-based layout with visual emphasis
 * - Table: Compact tabular format
 * - List: Vertical list with grouped fields
 */

import type { ParsedField } from "@/api/simulate";
import { JSX } from "react";

// ============================================================================
// Types
// ============================================================================

export type ViewMode = "grid" | "table" | "list";

export interface MedicationGroup {
  index: number;
  fields: Map<string, ParsedField>;
}

export interface ViewStrategy {
  render(groups: MedicationGroup[]): JSX.Element;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Group parsed fields by medication index
 */
export function groupMedicationsByIndex(
  parsedFields: ParsedField[],
): MedicationGroup[] {
  const medicationMap = new Map<number, Map<string, ParsedField>>();

  parsedFields.forEach((field) => {
    const match = field.field.match(/^medication\[(\d+)\]\./);
    const index = match ? parseInt(match[1]) : 0;
    const fieldName = field.field.replace(/^medication\[\d+\]\./, "");

    if (!medicationMap.has(index)) {
      medicationMap.set(index, new Map());
    }
    medicationMap.get(index)!.set(fieldName, field);
  });

  return Array.from(medicationMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([index, fields]) => ({ index, fields }));
}

// ============================================================================
// Grid View Strategy
// ============================================================================

export class GridViewStrategy implements ViewStrategy {
  render(groups: MedicationGroup[]): JSX.Element {
    return (
      <>
        {groups.map((group) => (
          <div key={group.index} className="mb-4 last:mb-0">
            {groups.length > 1 && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Medication {group.index + 1}
              </p>
            )}
            <div className="grid grid-cols-5 gap-3">
              {Array.from(group.fields.entries()).map(([fieldName, field]) => (
                <div
                  key={field.field}
                  className="p-2.5 rounded-lg bg-background border border-border/50"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {fieldName.replace(/([A-Z])/g, " $1").trim()}
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
        ))}
      </>
    );
  }
}

// ============================================================================
// Table View Strategy
// ============================================================================

export class TableViewStrategy implements ViewStrategy {
  render(groups: MedicationGroup[]): JSX.Element {
    return (
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-semibold">#</th>
              <th className="text-left p-2 font-semibold">Name</th>
              <th className="text-left p-2 font-semibold">Concentration</th>
              <th className="text-left p-2 font-semibold">Form</th>
              <th className="text-left p-2 font-semibold">Quantity</th>
              <th className="text-left p-2 font-semibold">Expiry</th>
              <th className="text-left p-2 font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const medNum = group.index + 1;
              return (
                <tr
                  key={group.index}
                  className="border-t border-border/50 hover:bg-muted/30"
                >
                  <td className="p-2 font-medium">{medNum}</td>
                  <td className="p-2">
                    {group.fields.get("medicationName")?.value || "—"}
                  </td>
                  <td className="p-2">
                    {group.fields.get("concentration")?.value || "—"}
                  </td>
                  <td className="p-2">
                    {group.fields.get("form")?.value || "—"}
                  </td>
                  <td className="p-2">
                    {group.fields.get("quantity")?.value || "—"}
                  </td>
                  <td className="p-2">
                    {group.fields.get("expiry")?.value || "—"}
                  </td>
                  <td className="p-2">
                    <span className="text-[10px] tabular-nums">
                      {(
                        (group.fields.get("medicationName")?.confidence || 0) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

// ============================================================================
// List View Strategy
// ============================================================================

export class ListViewStrategy implements ViewStrategy {
  render(groups: MedicationGroup[]): JSX.Element {
    return (
      <>
        {groups.map((group) => {
          const medNum = group.index + 1;
          return (
            <div
              key={group.index}
              className="mb-3 last:mb-0 p-3 rounded-lg border border-border/50 bg-background"
            >
              {groups.length > 1 && (
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">
                  Medication {medNum}
                </p>
              )}
              <div className="space-y-1.5">
                {Array.from(group.fields.entries()).map(
                  ([fieldName, field]) => (
                    <div
                      key={field.field}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground capitalize">
                        {fieldName.replace(/([A-Z])/g, " $1").trim()}:
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
                  ),
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  }
}

// ============================================================================
// Strategy Factory
// ============================================================================

/**
 * Factory for creating view strategies
 */
export const viewStrategies = new Map<ViewMode, ViewStrategy>([
  ["grid", new GridViewStrategy()],
  ["table", new TableViewStrategy()],
  ["list", new ListViewStrategy()],
]);

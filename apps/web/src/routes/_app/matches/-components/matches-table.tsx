import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@workspace/ui/components/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { GitMerge, ArrowUpDown } from "lucide-react";
import type { ListMatchesResponseItem } from "@workspace/schemas";
import { STATUS_COLORS, BAND_COLORS, BAND_COLORS_ALPHA } from "./constants";

// Extend TanStack Table meta type
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
  }
}

interface MatchesTableProps {
  matches: ListMatchesResponseItem[] | undefined;
  isLoading: boolean;
  statusFilter: string;
  onSelectMatch: (match: ListMatchesResponseItem) => void;
}

/**
 * Matches Table Component
 *
 * Professional table implementation using TanStack Table.
 * Features: sorting, filtering, row selection, loading states, and empty state handling.
 */
export function MatchesTable({
  matches,
  isLoading,
  statusFilter,
  onSelectMatch,
}: MatchesTableProps) {
  // Define table columns
  const columns = useMemo<ColumnDef<ListMatchesResponseItem>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ getValue }) => {
          const id = getValue<string>();
          return (
            <span className="text-muted-foreground font-mono text-[10px] truncate max-w-[80px] block">
              {id.slice(0, 8)}...
            </span>
          );
        },
        size: 80,
      },
      {
        accessorKey: "medicationName",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Medication
              <ArrowUpDown className="w-3 h-3" />
            </button>
          );
        },
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue<string | undefined>() ?? "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "score",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Score
              <ArrowUpDown className="w-3 h-3" />
            </button>
          );
        },
        cell: ({ getValue }) => {
          const score = getValue<number>();
          return (
            <div className="flex items-center gap-2 justify-end">
              <Progress value={score * 100} className="h-1.5 w-16" />
              <span className="tabular-nums">{(score * 100).toFixed(0)}%</span>
            </div>
          );
        },
        meta: {
          align: "right",
        },
      },
      {
        accessorKey: "confidenceBand",
        header: "Band",
        cell: ({ getValue }) => {
          const band = getValue<string>();
          const color = BAND_COLORS[band] ?? BAND_COLORS.none;
          const colorAlpha = BAND_COLORS_ALPHA[band] ?? BAND_COLORS_ALPHA.none;
          return (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase`}
              style={{ backgroundColor: colorAlpha.subtle, color }}
            >
              {band}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge
              variant="outline"
              className={`text-[9px] h-4 px-1.5 ${STATUS_COLORS[status] ?? ""}`}
            >
              {status.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date
              <ArrowUpDown className="w-3 h-3" />
            </button>
          );
        },
        cell: ({ getValue }) => {
          const date = getValue<string | Date>();
          return (
            <span className="text-muted-foreground">
              {new Date(date).toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    [],
  );

  // Initialize table instance
  const table = useReactTable({
    data: matches ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <TableRow className="border-b border-border/60">
              {columns.map((column, i) => (
                <TableHead
                  key={i}
                  className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground first:px-4"
                >
                  {typeof column.header === "string" ? column.header : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={columns.length} className="px-4 py-1.5">
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (!matches || matches.length === 0) {
    return (
      <div className="flex-1 overflow-auto flex flex-col">
        <Table>
          <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <TableRow className="border-b border-border/60">
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-left px-3 py-2 text-[11px] font-medium text-muted-foreground first:px-4"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GitMerge className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No {statusFilter.replace("_", " ")} matches</EmptyTitle>
            <EmptyDescription>
              Matches will appear here when available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Data state - render table with TanStack Table
  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-border/60"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`px-3 py-2 text-[11px] font-medium text-muted-foreground first:px-4 ${
                    header.column.columnDef.meta?.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onSelectMatch(row.original)}
              className="border-b border-border/30 cursor-pointer transition-colors hover:bg-accent/30"
              data-testid={`row-match-${row.original.id}`}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={`px-3 py-2 first:px-4 ${
                    cell.column.columnDef.meta?.align === "right"
                      ? "text-right"
                      : ""
                  }`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

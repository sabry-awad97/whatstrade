import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
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
import { FileText, ArrowUpDown } from "lucide-react";
import type { ListAuditLogResponseItem } from "@workspace/schemas";
import { ACTION_COLORS } from "./constants";

interface AuditTableProps {
  entries: ListAuditLogResponseItem[] | undefined;
  isLoading: boolean;
}

/**
 * Audit Table Component
 *
 * Professional table implementation using TanStack Table.
 * Features: sorting, loading states, and empty state handling.
 */
export function AuditTable({ entries, isLoading }: AuditTableProps) {
  // Define table columns
  const columns = useMemo<ColumnDef<ListAuditLogResponseItem>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
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
        accessorKey: "action",
        header: "Action",
        cell: ({ getValue }) => {
          const action = getValue<string>();
          return (
            <Badge
              variant="outline"
              className={`text-[9px] h-4 px-1.5 ${ACTION_COLORS[action] ?? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400"}`}
            >
              {action.replace(/_/g, " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "entityType",
        header: "Entity",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground capitalize">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "entityId",
        header: "Entity ID",
        cell: ({ getValue }) => {
          const id = getValue<string>();
          return (
            <span className="font-mono text-muted-foreground text-[10px] truncate max-w-[100px] block">
              {id.slice(0, 8)}...
            </span>
          );
        },
        meta: {
          align: "right",
        },
      },
      {
        accessorKey: "operator",
        header: "Operator",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-[11px]">
              {row.original.operator.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {row.original.operator.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "details",
        header: "Details",
        cell: ({ getValue }) => {
          const details = getValue<unknown>();
          if (!details) return <span className="text-muted-foreground">—</span>;

          const detailsStr =
            typeof details === "string" ? details : JSON.stringify(details);

          return (
            <span className="text-muted-foreground truncate max-w-[200px] block text-[11px]">
              {detailsStr}
            </span>
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
              Timestamp
              <ArrowUpDown className="w-3 h-3" />
            </button>
          );
        },
        cell: ({ getValue }) => {
          const date = getValue<Date>();
          return (
            <span className="text-muted-foreground whitespace-nowrap text-[11px]">
              {new Date(date).toLocaleString()}
            </span>
          );
        },
      },
    ],
    [],
  );

  // Initialize table instance
  const table = useReactTable({
    data: entries ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
  if (!entries || entries.length === 0) {
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
              <FileText className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No audit log entries</EmptyTitle>
            <EmptyDescription>
              Audit log entries will appear here as actions are performed.
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
                      ? "text-right flex items-center justify-end"
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
              className="border-b border-border/30 hover:bg-accent/30 transition-colors"
              data-testid={`audit-${row.original.id}`}
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

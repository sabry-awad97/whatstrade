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
import { Package, ArrowUpDown } from "lucide-react";
import type { OfferResponse } from "@/api/offers";
import { STATUS_COLORS } from "./constants";

// Extend TanStack Table meta type
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
  }
}

interface OffersTableProps {
  offers: OfferResponse[] | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelectOffer: (id: string) => void;
}

/**
 * Offers Table Component
 *
 * Professional table implementation using TanStack Table.
 * Features: sorting, filtering, row selection, loading states, and empty state handling.
 */
export function OffersTable({
  offers,
  isLoading,
  selectedId,
  onSelectOffer,
}: OffersTableProps) {
  // Define table columns
  const columns = useMemo<ColumnDef<OfferResponse>[]>(
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
        accessorKey: "medication_name",
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
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "dosage",
        header: "Dosage",
        cell: ({ getValue }) => {
          const dosage = getValue<string | null>();
          return <span className="text-muted-foreground">{dosage ?? "—"}</span>;
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Qty
              <ArrowUpDown className="w-3 h-3" />
            </button>
          );
        },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
        meta: {
          align: "right",
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Price
              <ArrowUpDown className="w-3 h-3" />
            </button>
          );
        },
        cell: ({ getValue }) => {
          const price = getValue<string | null>();
          return (
            <span className="tabular-nums">
              {price != null ? `EGP ${price}` : "—"}
            </span>
          );
        },
        meta: {
          align: "right",
        },
      },
      {
        accessorKey: "group_name",
        header: "Group",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground truncate max-w-[140px] block">
            {getValue<string>()}
          </span>
        ),
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
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
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
          const date = getValue<Date>();
          return (
            <span className="text-muted-foreground">
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    [],
  );

  // Initialize table instance
  const table = useReactTable({
    data: offers ?? [],
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
  if (!offers || offers.length === 0) {
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
              <Package className="w-4 h-4 opacity-40" />
            </EmptyMedia>
            <EmptyTitle>No offers found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter criteria to find offers.
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
                  } ${header.column.columnDef.meta?.align === "right" ? "flex items-center justify-end" : ""}`}
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
              onClick={() => onSelectOffer(row.original.id)}
              className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-accent/40 ${
                selectedId === row.original.id
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : ""
              }`}
              data-testid={`row-offer-${row.original.id}`}
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

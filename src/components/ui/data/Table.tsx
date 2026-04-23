import * as React from "react";
import { EmptyState } from "@/components/ui/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/ui/feedback/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";

export type DataTableColumn = {
  align?: "start" | "center" | "end";
  cell?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  header: string;
  key: string;
  sortable?: boolean;
};

const alignmentClassMap: Record<
  NonNullable<DataTableColumn["align"]>,
  string
> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      ref={ref}
      {...props}
    />
  </div>
));

Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead className={cn("[&_tr]:border-b", className)} ref={ref} {...props} />
));

TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    className={cn("[&_tr:last-child]:border-0", className)}
    ref={ref}
    {...props}
  />
));

TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    className={cn(
      "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
      className,
    )}
    ref={ref}
    {...props}
  />
));

TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    className={cn(
      "text-muted-foreground h-12 px-4 text-start font-medium",
      className,
    )}
    ref={ref}
    {...props}
  />
));

TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td className={cn("p-4 align-middle", className)} ref={ref} {...props} />
));

TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    className={cn("text-muted-foreground mt-4 text-sm", className)}
    ref={ref}
    {...props}
  />
));

TableCaption.displayName = "TableCaption";

type DataTableProps = {
  columns: DataTableColumn[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
  loading?: boolean;
};

function resolveAlignmentClass(align?: DataTableColumn["align"]) {
  return align ? alignmentClassMap[align] : "text-start";
}

export function DataTable({
  columns,
  data,
  emptyMessage,
  loading = false,
}: DataTableProps) {
  if (loading) {
    return <LoadingSkeleton variant="table" />;
  }

  if (data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              className={resolveAlignmentClass(column.align)}
              key={column.key}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={`${rowIndex}-${String(row.id ?? rowIndex)}`}>
            {columns.map((column) => {
              const value = row[column.key];
              return (
                <TableCell
                  className={resolveAlignmentClass(column.align)}
                  key={column.key}
                >
                  {column.cell ? column.cell(value, row) : String(value ?? "")}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};

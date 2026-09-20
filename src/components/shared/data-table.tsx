import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ColumnDef<T> {
  id?: string;
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationProps;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  pagination,
  emptyMessage = 'No records found',
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/70">
            <TableRow className="hover:bg-transparent">
              {columns.map((col, idx) => (
                <TableHead
                  key={col.id || idx}
                  className={cn(
                    'h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs font-medium">Loading ledger data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground py-6">
                    <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center mb-1">
                      <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80">{emptyMessage}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Try adjusting your filters or search criteria.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors border-b border-border/50',
                    rowIdx % 2 === 1 ? 'bg-muted/15' : 'bg-card',
                    onRowClick && 'cursor-pointer hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08]'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <TableCell key={col.id || colIdx} className={cn('py-2.5 text-xs', col.className)}>
                      {col.cell
                        ? col.cell(row, rowIdx)
                        : col.accessorKey
                        ? (row as any)[col.accessorKey]
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Showing</span>
            <span className="font-mono font-semibold text-foreground">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-mono font-semibold text-foreground">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            <span>of</span>
            <span className="font-mono font-semibold text-foreground">{pagination.total}</span>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(1)}
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2.5 py-1 text-xs font-mono font-semibold text-foreground bg-muted/40 rounded-md border border-border/60">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

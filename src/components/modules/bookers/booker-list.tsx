import React, { useState } from 'react';
import { useBookers } from '@/lib/queries/use-bookers';
import { OrderBooker } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { BookerForm } from './booker-form';
import { PerformanceMatrix } from './performance-matrix';
import { ReconciliationForm } from './reconciliation-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, TrendingUp, Banknote, Edit, Users } from 'lucide-react';

export const BookerList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooker, setSelectedBooker] = useState<OrderBooker | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [perfBookerId, setPerfBookerId] = useState<number | null>(null);
  const [isPerfOpen, setIsPerfOpen] = useState(false);
  const [reconcileBookerId, setReconcileBookerId] = useState<number | null>(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  const { data: response, isLoading, refetch } = useBookers({
    page,
    limit: 15,
    search: searchTerm || undefined,
  });

  const bookers = response?.data || [];
  const pagination = response?.pagination;

  const handleOpenPerf = (bookerId: number) => {
    setPerfBookerId(bookerId);
    setIsPerfOpen(true);
  };

  const handleOpenReconcile = (bookerId: number) => {
    setReconcileBookerId(bookerId);
    setIsReconcileOpen(true);
  };

  const handleEdit = (booker: OrderBooker) => {
    setSelectedBooker(booker);
    setIsFormOpen(true);
  };

  const columns: ColumnDef<OrderBooker>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      className: 'font-semibold text-foreground text-xs',
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      className: 'font-mono text-xs text-muted-foreground',
    },
    {
      header: 'Territory / Route',
      cell: (b) => (
        <span className="text-xs text-muted-foreground">{b.territory || 'Unassigned'}</span>
      ),
    },
    {
      header: 'Commission',
      cell: (b) => (
        <span className="font-mono font-semibold text-xs text-primary">
          {b.commission_rate}%
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (b) => (
        <Badge variant={b.is_active ? 'success' : 'secondary'} className="text-[10px]">
          {b.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-center w-36',
      cell: (b) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPerf(b.id);
            }}
            title="Performance Scorecard"
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReconcile(b.id);
            }}
            title="Daily Cash Settlement"
          >
            <Banknote className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(b);
            }}
            title="Edit Booker"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Order Bookers & Field Sales [F5]
          </h1>
          <p className="text-xs text-muted-foreground">
            Commission agents, route assignments, performance tracking, and cash reconciliation
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedBooker(null);
            setIsFormOpen(true);
          }}
          className="gap-2 font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Register Booker</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search booker by name, phone, territory..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bookers}
        isLoading={isLoading}
        onRowClick={(b) => handleOpenPerf(b.id)}
        pagination={
          pagination
            ? {
                page: pagination.page,
                pageSize: pagination.limit,
                total: pagination.totalRecords,
                totalPages: pagination.totalPages,
                onPageChange: (p) => setPage(p),
              }
            : undefined
        }
      />

      <BookerForm
        booker={selectedBooker}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => refetch()}
      />

      <PerformanceMatrix
        bookerId={perfBookerId}
        open={isPerfOpen}
        onOpenChange={setIsPerfOpen}
      />

      <ReconciliationForm
        bookerId={reconcileBookerId}
        open={isReconcileOpen}
        onOpenChange={setIsReconcileOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

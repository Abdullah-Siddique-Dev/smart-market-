import React, { useState } from 'react';
import { useDispatchSlips } from '@/lib/queries/use-dispatch';
import { DispatchSlip } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { SlipPreview } from './slip-preview';
import { SlipGenerator } from './slip-generator';
import { SlipReturnForm } from './slip-return-form';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils/date';
import { Plus, Eye, RotateCcw, Truck } from 'lucide-react';

export const SlipList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const { data: response, isLoading, refetch } = useDispatchSlips({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });

  const slips = response?.data || [];
  const pagination = response?.pagination;

  const handleOpenPreview = (slipId: number) => {
    setSelectedSlipId(slipId);
    setIsPreviewOpen(true);
  };

  const handleOpenReturn = (slipId: number) => {
    setSelectedSlipId(slipId);
    setIsReturnOpen(true);
  };

  const columns: ColumnDef<DispatchSlip>[] = [
    {
      header: 'Gate Pass #',
      accessorKey: 'slip_number',
      className: 'font-mono font-bold text-xs text-primary',
    },
    {
      header: 'Assigned Booker',
      accessorKey: 'booker_name',
      className: 'font-semibold text-foreground text-xs',
    },
    {
      header: 'Dispatch Date',
      cell: (slip) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDateTime(slip.dispatch_date)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (slip) => <StatusBadge status={slip.status} />,
    },
    {
      header: 'Actions',
      className: 'text-center w-28',
      cell: (slip) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPreview(slip.id);
            }}
            title="View Gate Pass"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {slip.status === 'DISPATCHED' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReturn(slip.id);
              }}
              title="Reconcile Returned Goods"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const totalLoadedSlips = slips.length;
  const activeDispatchesCount = slips.filter((s) => s.status === 'DISPATCHED').length;
  const reconciledCount = slips.filter((s) => s.status === 'RECONCILED').length;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Warehouse Dispatch Slips
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gate passes for goods released to order bookers and returned unsold stock reconciliation
          </p>
        </div>

        <Button onClick={() => setIsGeneratorOpen(true)} className="gap-2 font-semibold shadow-xs">
          <Truck className="h-4 w-4" />
          <span>New Dispatch Gate Pass</span>
        </Button>
      </div>

      {/* Dispatch Gate Pass Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Gate Passes
          </div>
          <div className="text-xl font-black font-mono text-foreground mt-1">
            {pagination?.totalRecords || totalLoadedSlips}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Issued warehouse releases</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active in Field / Dispatched
          </div>
          <div className="text-xl font-black font-mono text-amber-600 mt-1">
            {activeDispatchesCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Inventory out with bookers</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Reconciled & Restocked
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 mt-1">
            {reconciledCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Accounts settled & closed</div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        <div className="w-56">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs"
          >
            <option value="">All Slips ({slips.length})</option>
            <option value="DISPATCHED">Dispatched (Active)</option>
            <option value="RECONCILED">Reconciled / Settled</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={slips}
        isLoading={isLoading}
        onRowClick={(slip) => handleOpenPreview(slip.id)}
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

      <SlipPreview
        slipId={selectedSlipId}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />

      <SlipGenerator
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        onSlipCreated={(newId) => handleOpenPreview(newId)}
      />

      <SlipReturnForm
        slipId={selectedSlipId}
        open={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        onReconciled={() => refetch()}
      />
    </div>
  );
};

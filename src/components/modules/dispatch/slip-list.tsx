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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Warehouse Dispatch Slips [F3]
          </h1>
          <p className="text-xs text-muted-foreground">
            Gate passes for goods released to order bookers and returned unsold stock reconciliation
          </p>
        </div>

        <Button onClick={() => setIsGeneratorOpen(true)} className="gap-2 font-semibold shadow-sm">
          <Truck className="h-4 w-4" />
          <span>New Dispatch Gate Pass</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-sm">
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs"
          >
            <option value="">All Slips</option>
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

import React, { useState } from 'react';
import { useAuditLedger, useStockReconciliation } from '@/lib/queries/use-audit';
import { InventoryLedgerEntry } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { AdjustmentForm } from './adjustment-form';
import { ExportButton } from './export-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils/date';
import { ShieldCheck, Plus, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const LedgerViewer: React.FC = () => {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);

  const { data: response, isLoading, refetch } = useAuditLedger({
    page,
    limit: 20,
    transaction_type: typeFilter || undefined,
  });

  const { data: reconData, isLoading: isReconLoading } = useStockReconciliation();

  const entries = response?.data || [];
  const pagination = response?.pagination;

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE_IMPORT':
        return <Badge variant="success" className="text-[10px]">Stock Import</Badge>;
      case 'SALE_BILL':
        return <Badge variant="default" className="text-[10px]">Sale Invoice</Badge>;
      case 'DISPATCH_OUT':
        return <Badge variant="secondary" className="text-[10px]">Gate Dispatch</Badge>;
      case 'DISPATCH_RETURN':
        return <Badge variant="warning" className="text-[10px]">Return Restocked</Badge>;
      case 'ADJUSTMENT_DAMAGE':
      case 'ADJUSTMENT_SHRINKAGE':
        return <Badge variant="destructive" className="text-[10px]">Damaged / Lost</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  const columns: ColumnDef<InventoryLedgerEntry>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      className: 'font-mono text-xs text-muted-foreground w-16 text-center',
    },
    {
      header: 'Timestamp',
      cell: (e) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDateTime(e.created_at)}
        </span>
      ),
    },
    {
      header: 'Product / SKU',
      cell: (e) => (
        <div>
          <div className="font-semibold text-foreground text-xs">{e.product_name}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{e.sku}</div>
        </div>
      ),
    },
    {
      header: 'Transaction Type',
      cell: (e) => getTransactionBadge(e.transaction_type),
    },
    {
      header: 'Quantity Delta',
      className: 'text-center w-28',
      cell: (e) => (
        <span
          className={cn(
            'font-mono font-bold text-xs',
            e.change_qty > 0 ? 'text-emerald-600' : 'text-rose-600'
          )}
        >
          {e.change_qty > 0 ? `+${e.change_qty}` : e.change_qty}
        </span>
      ),
    },
    {
      header: 'Balance After',
      accessorKey: 'balance_after',
      className: 'font-mono font-bold text-xs text-right w-28',
    },
    {
      header: 'Operator',
      accessorKey: 'performer_name',
      className: 'text-xs text-muted-foreground',
    },
    {
      header: 'Notes / Ref',
      cell: (e) => (
        <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block" title={e.notes || ''}>
          {e.notes || `${e.reference_type} #${e.reference_id}`}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>Immutable Inventory Audit Ledger [F8]</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Cryptographically tracked append-only physical stock transactions and variance audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReconciliation(!showReconciliation)}
            className="text-xs font-semibold h-8"
          >
            {showReconciliation ? 'Hide Variance Report' : 'Stock Reconciliation Audit'}
          </Button>
          <Button
            onClick={() => setIsAdjustOpen(true)}
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8 bg-destructive hover:bg-destructive/90 text-white"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Stock Adjustment</span>
          </Button>
        </div>
      </div>

      {/* Stock Reconciliation Panel */}
      {showReconciliation && reconData && (
        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-sm text-foreground">Database Physical Integrity Audit</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-600">
                {reconData.summary.balanced_count} / {reconData.summary.total_products} Balanced
              </span>
              {reconData.summary.discrepancy_count > 0 && (
                <span className="text-destructive font-bold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {reconData.summary.discrepancy_count} Discrepancies
                </span>
              )}
            </div>
          </div>

          {reconData.summary.discrepancy_count === 0 ? (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
              Perfect integrity verified: 100% of physical warehouse stock matches the cumulative audit ledger sum exactly.
            </div>
          ) : (
            <div className="divide-y divide-border/60 border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {reconData.rows
                .filter((r) => r.status === 'DISCREPANCY')
                .map((row) => (
                  <div key={row.product_id} className="p-2.5 flex items-center justify-between text-xs bg-destructive/5">
                    <div>
                      <span className="font-bold text-foreground">{row.product_name}</span>
                      <span className="font-mono text-muted-foreground ml-2">({row.sku})</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span>Catalog Stock: {row.system_stock}</span>
                      <span>Audit Sum: {row.ledger_calculated_stock}</span>
                      <span className="font-bold text-destructive">Variance: {row.variance}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-xs">
        <div className="w-56">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs"
          >
            <option value="">All Transactions</option>
            <option value="PURCHASE_IMPORT">Product Imports</option>
            <option value="SALE_BILL">Sale Bills / Invoices</option>
            <option value="DISPATCH_OUT">Gate Pass Dispatches</option>
            <option value="DISPATCH_RETURN">Returned Goods</option>
            <option value="ADJUSTMENT_DAMAGE">Damage & Breakage</option>
            <option value="ADJUSTMENT_SHRINKAGE">Shrinkage & Loss</option>
          </Select>
        </div>
      </div>

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
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

      {/* Adjustment Form Modal */}
      <AdjustmentForm
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

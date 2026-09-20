import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { auditApi } from '@/lib/api/audit.api';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

export const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await auditApi.getLedger({ limit: 5000 });
      const entries = res?.data || [];

      if (entries.length === 0) {
        alert('No ledger entries available to export.');
        return;
      }

      // Format as CSV
      const headers = [
        'ID',
        'Date Time',
        'SKU',
        'Product Name',
        'Transaction Type',
        'Change Qty',
        'Balance After',
        'Reference Type',
        'Reference ID',
        'Logged By',
        'Notes',
      ];

      const csvRows = [
        headers.join(','),
        ...entries.map((e) =>
          [
            e.id,
            `"${e.created_at}"`,
            `"${e.sku}"`,
            `"${e.product_name.replace(/"/g, '""')}"`,
            `"${e.transaction_type}"`,
            e.change_qty,
            e.balance_after,
            `"${e.reference_type}"`,
            e.reference_id,
            `"${e.performer_name}"`,
            `"${(e.notes || '').replace(/"/g, '""')}"`,
          ].join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory-audit-ledger-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Failed to generate export file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportCsv}
      disabled={isExporting}
      className="gap-2 text-xs font-semibold h-8"
    >
      {isExporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
      )}
      <span>Export Audit Log (CSV)</span>
    </Button>
  );
};

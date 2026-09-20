import React, { useState, useEffect } from 'react';
import { useProductMutations } from '@/lib/queries/use-products';
import { Product } from '@/types/entities';
import { ProductSearch } from '@/components/shared/product-search';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/currency';
import { Download, AlertCircle, Loader2, PackageCheck } from 'lucide-react';

interface ImportFormProps {
  initialProduct?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ImportForm: React.FC<ImportFormProps> = ({
  initialProduct,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierInfo, setSupplierInfo] = useState('');
  const [updateMasterCost, setUpdateMasterCost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { recordImport } = useProductMutations();

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setUnitCost(
        initialProduct.purchase_price !== undefined ? String(initialProduct.purchase_price) : ''
      );
    }
  }, [initialProduct, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const cost = parseFloat(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid unit import cost');
      return;
    }

    try {
      setError(null);
      await recordImport.mutateAsync({
        product_id: selectedProduct.id,
        quantity: qty,
        unit_cost: cost,
        supplier_info: supplierInfo.trim() || undefined,
        update_master_cost: updateMasterCost,
      });

      setQuantity('');
      setSupplierInfo('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record stock import');
    }
  };

  const totalBatchCost = (parseInt(quantity, 10) || 0) * (parseFloat(unitCost) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            <span>Record Inward Stock Import</span>
          </DialogTitle>
          <DialogDescription>
            Receive physical shipments into warehouse and record supplier cost
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Select Product *</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/30">
                <div>
                  <div className="font-bold text-foreground text-xs">{selectedProduct.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-primary">{selectedProduct.sku}</span>
                    <span>• Stock: {selectedProduct.current_stock}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(null)}
                  className="h-6 text-[10px] text-muted-foreground"
                >
                  Change
                </Button>
              </div>
            ) : (
              <ProductSearch
                onSelect={(p) => {
                  setSelectedProduct(p);
                  if (p.purchase_price) setUnitCost(String(p.purchase_price));
                }}
                placeholder="Search product to receive..."
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Quantity Received *</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Unit Cost Price (Rs.) *</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Supplier / Origin / Notes</label>
            <Input
              type="text"
              placeholder="e.g. Container Yiwu #14 / Faisalabad Mill"
              value={supplierInfo}
              onChange={(e) => setSupplierInfo(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="updateMasterCost"
              checked={updateMasterCost}
              onChange={(e) => setUpdateMasterCost(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="updateMasterCost" className="text-[11px] text-foreground font-medium cursor-pointer">
              Update catalog standard purchase cost with this batch price
            </label>
          </div>

          {/* Batch total summary */}
          {totalBatchCost > 0 && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Total Batch Investment:
              </span>
              <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-200">
                {formatCurrency(totalBatchCost)}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={recordImport.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={recordImport.isPending || !selectedProduct}
              className="font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recordImport.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  <span>Receive Stock Batch</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { useAuditMutations } from '@/lib/queries/use-audit';
import { ProductSearch } from '@/components/shared/product-search';
import { Product } from '@/types/entities';
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
import { Select } from '@/components/ui/select';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

interface AdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AdjustmentForm: React.FC<AdjustmentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'DAMAGE' | 'THEFT' | 'FOUND' | 'COUNT_AUDIT'>('DAMAGE');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { recordAdjustment } = useAuditMutations();

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

    if (!notes.trim()) {
      setError('Audit justification / explanation is required');
      return;
    }

    // Negative for damage/theft, positive for found
    const effectiveQty = adjustmentType === 'FOUND' ? qty : -qty;

    if (effectiveQty < 0 && Math.abs(effectiveQty) > selectedProduct.current_stock) {
      setError(`Cannot deduct more than current physical stock (${selectedProduct.current_stock})`);
      return;
    }

    try {
      setError(null);
      await recordAdjustment.mutateAsync({
        product_id: selectedProduct.id,
        adjustment_qty: effectiveQty,
        reason: `[${adjustmentType}] ${notes.trim()}`,
      });

      setSelectedProduct(null);
      setQuantity('');
      setNotes('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record adjustment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span>Manual Stock Adjustment & Damage Entry</span>
          </DialogTitle>
          <DialogDescription>
            Record inventory shrinkage, physical breakage, or physical count variance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Picker */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Select Product *</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/30">
                <div>
                  <div className="font-bold text-foreground text-xs">{selectedProduct.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-primary">{selectedProduct.sku}</span>
                    <span>• Current Stock: {selectedProduct.current_stock}</span>
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
              <ProductSearch onSelect={(p) => setSelectedProduct(p)} placeholder="Search product..." autoFocus />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Adjustment Type</label>
              <Select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="text-xs"
              >
                <option value="DAMAGE">Broken / Damaged (-)</option>
                <option value="THEFT">Shrinkage / Loss (-)</option>
                <option value="COUNT_AUDIT">Count Audit Shortage (-)</option>
                <option value="FOUND">Unrecorded Found Stock (+)</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Units *</label>
              <Input
                type="number"
                min="1"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">
              Audit Reason & Justification *
            </label>
            <Input
              type="text"
              placeholder="e.g. Water damage during transport / Physical count discrepancy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] text-destructive">
            This adjustment will be permanently logged in the immutable audit ledger with your staff ID and timestamp.
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={recordAdjustment.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={recordAdjustment.isPending || !selectedProduct}
              className="gap-2 font-semibold bg-destructive hover:bg-destructive/90 text-white"
            >
              {recordAdjustment.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Post Adjustment</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

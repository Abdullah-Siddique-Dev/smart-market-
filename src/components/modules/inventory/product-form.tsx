import React, { useState, useEffect } from 'react';
import { useProductMutations } from '@/lib/queries/use-products';
import { useAuthStore } from '@/stores/auth.store';
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
import { Package, AlertCircle, Loader2 } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'OWNER';

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('BOX');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [error, setError] = useState<string | null>(null);

  const { createProduct, updateProduct } = useProductMutations();
  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setName(product.name);
      setUnit(product.unit || 'BOX');
      setSellingPrice(String(product.selling_price));
      setPurchasePrice(product.purchase_price !== undefined ? String(product.purchase_price) : '0');
      setMinStockAlert(String(product.min_stock_alert || 10));
      setError(null);
    } else {
      setSku('');
      setName('');
      setUnit('BOX');
      setSellingPrice('');
      setPurchasePrice('');
      setMinStockAlert('10');
      setError(null);
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError('Product SKU and name are required');
      return;
    }

    const sp = parseFloat(sellingPrice);
    if (isNaN(sp) || sp < 0) {
      setError('Please enter a valid selling price');
      return;
    }

    const pp = parseFloat(purchasePrice);
    if (isOwner && !isEditing && (isNaN(pp) || pp < 0)) {
      setError('Please enter a valid initial purchase price');
      return;
    }

    try {
      setError(null);
      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: {
            sku: sku.trim(),
            name: name.trim(),
            unit: unit.trim(),
            selling_price: sp,
            ...(isOwner && !isNaN(pp) ? { purchase_price: pp } : {}),
            min_stock_alert: parseInt(minStockAlert, 10) || 10,
          },
        });
      } else {
        await createProduct.mutateAsync({
          sku: sku.trim(),
          name: name.trim(),
          unit: unit.trim(),
          selling_price: sp,
          purchase_price: isNaN(pp) ? 0 : pp,
          current_stock: 0,
          min_stock_alert: parseInt(minStockAlert, 10) || 10,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span>{isEditing ? 'Edit Product Item' : 'Create New Product Master'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update product pricing and threshold details'
              : 'Add new product item to the central catalog'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2 space-y-1">
              <label className="font-semibold text-muted-foreground">Product SKU / Code *</label>
              <Input
                type="text"
                placeholder="e.g. TOY-001"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase"
                disabled={isEditing}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Unit *</label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="text-xs">
                <option value="BOX">BOX</option>
                <option value="CTN">CTN</option>
                <option value="PCS">PCS</option>
                <option value="DOZ">DOZ</option>
                <option value="KG">KG</option>
                <option value="PACK">PACK</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Product Description / Name *</label>
            <Input
              type="text"
              placeholder="e.g. RC Racing Car Model 301"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Wholesale Selling Price (Rs.) *
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            {/* Purchase Price: restricted to OWNER role */}
            {isOwner ? (
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Purchase / Cost Price (Rs.) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="font-mono text-xs"
                  required={!isEditing}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Purchase Cost</label>
                <div className="h-9 px-3 flex items-center bg-muted/50 rounded-md border border-input text-xs text-muted-foreground italic">
                  Protected (Owner only)
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">
              Low Stock Alert Threshold
            </label>
            <Input
              type="number"
              min="0"
              placeholder="10"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Trigger alert banner when physical stock falls below this quantity.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="font-semibold gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

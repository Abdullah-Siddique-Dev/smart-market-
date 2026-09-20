import React, { useState, useEffect } from 'react';
import { useShopMutations } from '@/lib/queries/use-shops';
import { RetailShop } from '@/types/entities';
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
import { Store, AlertCircle, Loader2 } from 'lucide-react';

interface ShopFormProps {
  shop?: RetailShop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ShopForm: React.FC<ShopFormProps> = ({
  shop,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('50000');
  const [error, setError] = useState<string | null>(null);

  const { createShop, updateShop } = useShopMutations();
  const isEditing = !!shop;

  useEffect(() => {
    if (shop) {
      setShopName(shop.shop_name);
      setOwnerName(shop.owner_name || '');
      setPhone(shop.phone || '');
      setAddress(shop.address || '');
      setCreditLimit(String(shop.credit_limit || 0));
      setError(null);
    } else {
      setShopName('');
      setOwnerName('');
      setPhone('');
      setAddress('');
      setCreditLimit('50000');
      setError(null);
    }
  }, [shop, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setError('Shop name is required');
      return;
    }

    const limit = parseFloat(creditLimit);
    if (isNaN(limit) || limit < 0) {
      setError('Please enter a valid credit limit');
      return;
    }

    try {
      setError(null);
      if (isEditing && shop) {
        await updateShop.mutateAsync({
          id: shop.id,
          data: {
            shop_name: shopName.trim(),
            owner_name: ownerName.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            credit_limit: limit,
          },
        });
      } else {
        await createShop.mutateAsync({
          shop_name: shopName.trim(),
          owner_name: ownerName.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          credit_limit: limit,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save shop');
    }
  };

  const isPending = createShop.isPending || updateShop.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span>{isEditing ? 'Edit Customer Shop' : 'Register Retail Customer'}</span>
          </DialogTitle>
          <DialogDescription>
            Retail shop account for wholesale distribution & Khata credit tracking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Shop / Enterprise Name *</label>
            <Input
              type="text"
              placeholder="e.g. Madina General Store"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="text-xs"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Owner / Contact Name</label>
              <Input
                type="text"
                placeholder="e.g. Haji Rashid"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Phone Number</label>
              <Input
                type="tel"
                placeholder="e.g. 0321-7654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Market Address / Location</label>
            <Input
              type="text"
              placeholder="e.g. Shop 42, Gunj Mandi, Rawalpindi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">
              Authorized Credit Limit (Rs.)
            </label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="50000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              A warning is shown when Khata balance exceeds this ceiling.
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
                <span>{isEditing ? 'Save Changes' : 'Register Shop'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

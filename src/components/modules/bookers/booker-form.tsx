import React, { useState, useEffect } from 'react';
import { useBookerMutations } from '@/lib/queries/use-bookers';
import { OrderBooker } from '@/types/entities';
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
import { UserCheck, AlertCircle, Loader2 } from 'lucide-react';

interface BookerFormProps {
  booker?: OrderBooker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const BookerForm: React.FC<BookerFormProps> = ({
  booker,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [territory, setTerritory] = useState('');
  const [commissionRate, setCommissionRate] = useState('2.5');
  const [error, setError] = useState<string | null>(null);

  const { createBooker, updateBooker } = useBookerMutations();
  const isEditing = !!booker;

  useEffect(() => {
    if (booker) {
      setName(booker.name);
      setPhone(booker.phone);
      setTerritory(booker.territory || '');
      setCommissionRate(String(booker.commission_rate || 0));
      setError(null);
    } else {
      setName('');
      setPhone('');
      setTerritory('');
      setCommissionRate('2.5');
      setError(null);
    }
  }, [booker, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number are required');
      return;
    }

    const comm = parseFloat(commissionRate);
    if (isNaN(comm) || comm < 0) {
      setError('Please enter a valid commission rate');
      return;
    }

    try {
      setError(null);
      if (isEditing && booker) {
        await updateBooker.mutateAsync({
          id: booker.id,
          data: {
            name: name.trim(),
            phone: phone.trim(),
            territory: territory.trim() || undefined,
            commission_rate: comm,
          },
        });
      } else {
        await createBooker.mutateAsync({
          name: name.trim(),
          phone: phone.trim(),
          territory: territory.trim() || undefined,
          commission_rate: comm,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save booker profile');
    }
  };

  const isPending = createBooker.isPending || updateBooker.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span>{isEditing ? 'Edit Booker Profile' : 'Register New Order Booker'}</span>
          </DialogTitle>
          <DialogDescription>
            Field sales representative for taking shop orders & recovering payments
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
            <label className="font-semibold text-muted-foreground">Full Name *</label>
            <Input
              type="text"
              placeholder="e.g. Muhammad Aslam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Phone Number *</label>
            <Input
              type="tel"
              placeholder="e.g. 0300-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Assigned Territory / Route</label>
            <Input
              type="text"
              placeholder="e.g. Shah Alam Market / Sector B"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Commission Rate (%) *</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="2.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="font-mono text-xs"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Calculated on net billed order value recovered.
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
                <span>{isEditing ? 'Save Changes' : 'Register Booker'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

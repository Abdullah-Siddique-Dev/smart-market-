import React, { useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { ProductSearch } from '@/components/shared/product-search';
import { InvoiceCart } from './invoice-cart';
import { InvoiceSummary } from './invoice-summary';
import { PaymentModal } from './payment-modal';
import { BillPrintPreview } from './bill-print-preview';
import { Product } from '@/types/entities';
import { useHotkeys } from 'react-hotkeys-hook';
import { Card } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';

export const PosTerminal: React.FC = () => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);

  // Keyboard shortcut F1: Open Checkout / Payment
  useHotkeys('f1', (e) => {
    e.preventDefault();
    if (items.length > 0) {
      setIsPaymentOpen(true);
    }
  });

  const handleProductSelect = (product: Product) => {
    addItem(product, 1);
  };

  const handleBillCreated = (billId: number) => {
    setCreatedBillId(billId);
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-3.5 p-4 bg-background">
      {/* Top Controls: Fast Product Search Bar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex-1 relative">
          <ProductSearch
            onSelect={handleProductSelect}
            autoFocus={true}
            placeholder="Search product catalog by SKU or name (F2)..."
          />
        </div>
      </div>

      {/* Main Terminal Workspace: Left = Cart Items Table, Right = Summary & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* Left: Invoice Cart Table (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0">
          <InvoiceCart />
        </div>

        {/* Right: Summary & Action Panel (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          <InvoiceSummary onCheckout={() => setIsPaymentOpen(true)} />

          {/* POS Terminal Keybindings Card */}
          <Card className="p-4 rounded-2xl border-border bg-card shadow-xs text-xs space-y-2.5">
            <div className="font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                <span>POS Quick Shortcuts</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono font-medium">Hands-on-keyboard</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Pay Bill</span>
                <kbd>F1</kbd>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Search Item</span>
                <kbd>F2</kbd>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Dismiss Dialog</span>
                <kbd>Esc</kbd>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Select Item</span>
                <kbd>Enter</kbd>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Settlement Modal */}
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        onBillCreated={handleBillCreated}
      />

      {/* Digital On-Screen Bill Preview Modal */}
      <BillPrintPreview
        billId={createdBillId}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
};

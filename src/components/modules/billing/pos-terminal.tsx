import React, { useState, useCallback } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { ProductSearch } from '@/components/shared/product-search';
import { InvoiceCart } from './invoice-cart';
import { InvoiceSummary } from './invoice-summary';
import { PaymentModal } from './payment-modal';
import { BillPrintPreview } from './bill-print-preview';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { inventoryApi } from '@/lib/api/inventory.api';
import { Product } from '@/types/entities';
import { useHotkeys } from 'react-hotkeys-hook';
import { ShoppingBag, ScanBarcode, Sparkles } from 'lucide-react';

export const PosTerminal: React.FC = () => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);

  // Keyboard shortcut F1: Open Checkout / Payment
  useHotkeys('f1', (e) => {
    e.preventDefault();
    if (items.length > 0) {
      setIsPaymentOpen(true);
    }
  });

  // Handle hardware barcode scan
  const handleBarcodeScan = useCallback(
    async (code: string) => {
      try {
        setScanNotice(`Scanning barcode: ${code}...`);
        const searchResults = await inventoryApi.searchProducts(code);
        if (searchResults && searchResults.length > 0) {
          const matched = searchResults[0];
          addItem(matched, 1);
          setScanNotice(`Added: ${matched.name}`);
        } else {
          setScanNotice(`No product found for SKU/Barcode: ${code}`);
        }
      } catch {
        setScanNotice(`Error looking up product: ${code}`);
      } finally {
        setTimeout(() => setScanNotice(null), 3000);
      }
    },
    [addItem]
  );

  useBarcodeScanner(handleBarcodeScan);

  const handleProductSelect = (product: Product) => {
    addItem(product, 1);
  };

  const handleBillCreated = (billId: number) => {
    setCreatedBillId(billId);
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] gap-3 p-3">
      {/* Top Controls: Fast Product Search Bar & Scan Barcode Indicator */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-sm">
        <div className="flex-1">
          <ProductSearch onSelect={handleProductSelect} autoFocus={true} />
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/60 text-xs text-muted-foreground shrink-0">
          <ScanBarcode className="h-4 w-4 text-primary" />
          <span>Scanner Ready</span>
        </div>

        {scanNotice && (
          <div className="text-xs font-semibold text-primary animate-in fade-in flex items-center gap-1.5 bg-primary/10 px-3 py-2 rounded-lg">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{scanNotice}</span>
          </div>
        )}
      </div>

      {/* Main Terminal Workspace: Left = Cart Items Table, Right = Summary & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Invoice Cart Table */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0">
          <InvoiceCart />
        </div>

        {/* Right: Summary & Action Panel */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <InvoiceSummary onCheckout={() => setIsPaymentOpen(true)} />

          {/* POS Quick Reference Guide */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-2 text-muted-foreground">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span>POS Terminal Quick Keys</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-1 rounded bg-background/60">
                <span className="font-bold text-foreground">F1</span>
                <span>Pay Bill</span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-background/60">
                <span className="font-bold text-foreground">F2</span>
                <span>Search Item</span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-background/60">
                <span className="font-bold text-foreground">Esc</span>
                <span>Close Popup</span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-background/60">
                <span className="font-bold text-foreground">Barcode</span>
                <span>Instant Add</span>
              </div>
            </div>
          </div>
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

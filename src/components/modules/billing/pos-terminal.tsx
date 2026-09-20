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
import { Card } from '@/components/ui/card';
import { ScanBarcode, Sparkles, Command, Keyboard } from 'lucide-react';

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
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-3.5 p-4 bg-background">
      {/* Top Controls: Fast Product Search Bar & Hardware Scanner Indicator */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex-1 relative">
          <ProductSearch
            onSelect={handleProductSelect}
            autoFocus={true}
            placeholder="Search product catalog by SKU, name, or scan barcode (F2)..."
          />
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground shrink-0 font-medium">
          <ScanBarcode className="h-4 w-4 text-primary animate-pulse" />
          <span>Scanner Ready</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 ml-1" />
        </div>

        {scanNotice && (
          <div className="text-xs font-semibold text-primary animate-in fade-in flex items-center gap-1.5 bg-primary/10 px-3 py-2 rounded-xl border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{scanNotice}</span>
          </div>
        )}
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
                <span className="text-muted-foreground text-[11px]">Barcode Scan</span>
                <kbd>Auto</kbd>
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

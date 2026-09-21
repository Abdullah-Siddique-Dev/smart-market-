import React, { useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { ProductSearch } from '@/components/shared/product-search';
import { InvoiceCart } from './invoice-cart';
import { InvoiceSummary } from './invoice-summary';
import { PaymentModal } from './payment-modal';
import { BillPrintPreview } from './bill-print-preview';
import { Product } from '@/types/entities';

export const PosTerminal: React.FC = () => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);

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
            placeholder="Search product catalog by SKU or name..."
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

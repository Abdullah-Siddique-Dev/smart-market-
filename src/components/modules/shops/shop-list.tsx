import React, { useState } from 'react';
import { useShops } from '@/lib/queries/use-shops';
import { RetailShop } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { ShopForm } from './shop-form';
import { ShopLedger } from './shop-ledger';
import { PaymentEntryForm } from './payment-entry-form';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, BookOpen, Banknote, Edit, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const ShopList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<RetailShop | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ledgerShopId, setLedgerShopId] = useState<number | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [paymentShopId, setPaymentShopId] = useState<number | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const { data: response, isLoading, refetch } = useShops({
    page,
    limit: 15,
    search: searchTerm || undefined,
  });

  const shops = response?.data || [];
  const pagination = response?.pagination;

  const handleOpenLedger = (shopId: number) => {
    setLedgerShopId(shopId);
    setIsLedgerOpen(true);
  };

  const handleOpenPayment = (shopId: number) => {
    setPaymentShopId(shopId);
    setIsPaymentOpen(true);
  };

  const handleEdit = (shop: RetailShop) => {
    setSelectedShop(shop);
    setIsFormOpen(true);
  };

  const columns: ColumnDef<RetailShop>[] = [
    {
      header: 'Retail Shop',
      accessorKey: 'shop_name',
      className: 'font-semibold text-foreground text-xs',
    },
    {
      header: 'Owner / Contact',
      accessorKey: 'owner_name',
      className: 'text-xs text-muted-foreground',
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      className: 'font-mono text-xs text-muted-foreground',
    },
    {
      header: 'Credit Limit',
      className: 'text-right w-32',
      cell: (shop) => (
        <AmountDisplay amount={shop.credit_limit} size="sm" className="text-muted-foreground font-mono" />
      ),
    },
    {
      header: 'Khata Balance',
      className: 'text-right w-36',
      cell: (shop) => {
        const isOver = shop.credit_limit > 0 && shop.outstanding_balance >= shop.credit_limit;
        return (
          <div className="flex flex-col items-end">
            <AmountDisplay
              amount={shop.outstanding_balance}
              size="sm"
              className={cn(
                'font-bold font-mono',
                shop.outstanding_balance > 0 ? 'text-amber-600' : 'text-emerald-600'
              )}
            />
            {isOver && (
              <span className="text-[10px] text-destructive flex items-center gap-0.5 font-semibold">
                <AlertTriangle className="h-3 w-3" /> Over Limit
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-center w-36',
      cell: (shop) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenLedger(shop.id);
            }}
            title="View Khata Ledger"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPayment(shop.id);
            }}
            title="Receive Payment"
          >
            <Banknote className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(shop);
            }}
            title="Edit Shop"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const totalLoadedShops = shops.length;
  const totalReceivables = shops.reduce((sum, s) => sum + (s.outstanding_balance || 0), 0);
  const overLimitCount = shops.filter(
    (s) => s.credit_limit > 0 && s.outstanding_balance >= s.credit_limit
  ).length;
  const clearKhataCount = shops.filter((s) => (s.outstanding_balance || 0) <= 0).length;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Retail Customers & Khata Ledger
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customer directory, credit limits, outstanding balances, and cash recovery history
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedShop(null);
            setIsFormOpen(true);
          }}
          className="gap-2 font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Register Retail Shop</span>
        </Button>
      </div>

      {/* Khata Receivables Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Accounts
          </div>
          <div className="text-xl font-black font-mono text-foreground mt-1">
            {pagination?.totalRecords || totalLoadedShops}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Registered retail clients</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Receivables
          </div>
          <div className="text-xl font-black font-mono text-amber-600 mt-1">
            <AmountDisplay amount={totalReceivables} size="md" className="font-bold" />
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Current outstanding market debt</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Over Credit Limit
          </div>
          <div className="text-xl font-black font-mono text-destructive mt-1">
            {overLimitCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Hold dispatch until paid</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Zero Balance / Clear
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 mt-1">
            {clearKhataCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Fully settled accounts</div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search shop name, proprietor, phone, market..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={shops}
        isLoading={isLoading}
        onRowClick={(s) => handleOpenLedger(s.id)}
        pagination={
          pagination
            ? {
                page: pagination.page,
                pageSize: pagination.limit,
                total: pagination.totalRecords,
                totalPages: pagination.totalPages,
                onPageChange: (p) => setPage(p),
              }
            : undefined
        }
      />

      <ShopForm
        shop={selectedShop}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => refetch()}
      />

      <ShopLedger
        shopId={ledgerShopId}
        open={isLedgerOpen}
        onOpenChange={setIsLedgerOpen}
        onRecordPayment={(id) => handleOpenPayment(id)}
      />

      <PaymentEntryForm
        shopId={paymentShopId}
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useProducts } from '@/lib/queries/use-products';
import { useAuthStore } from '@/stores/auth.store';
import { Product } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { StockBadge } from './stock-badge';
import { StockAlerts } from './stock-alerts';
import { ProductForm } from './product-form';
import { ImportForm } from './import-form';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Edit, Search, Package } from 'lucide-react';

export const ProductList: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'OWNER';

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isImportFormOpen, setIsImportFormOpen] = useState(false);
  const [importProduct, setImportProduct] = useState<Product | null>(null);

  const { data: response, isLoading, refetch } = useProducts({
    page,
    limit: 15,
    search: searchTerm || undefined,
  });

  const products = response?.data || [];
  const pagination = response?.pagination;

  const handleEditProduct = (p: Product) => {
    setSelectedProduct(p);
    setIsProductFormOpen(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsProductFormOpen(true);
  };

  const handleQuickImport = (p: Product) => {
    setImportProduct(p);
    setIsImportFormOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: 'SKU',
      accessorKey: 'sku',
      className: 'font-mono font-bold text-xs text-primary w-28',
    },
    {
      header: 'Description',
      accessorKey: 'name',
      className: 'font-semibold text-foreground text-xs',
    },
    {
      header: 'Unit',
      accessorKey: 'unit',
      className: 'font-mono text-xs text-muted-foreground w-16',
    },
    {
      header: 'Selling Rate',
      className: 'text-right w-28',
      cell: (p) => (
        <AmountDisplay amount={p.selling_price} size="sm" className="font-semibold font-mono" />
      ),
    },
    ...(isOwner
      ? [
          {
            header: 'Cost Rate',
            className: 'text-right w-28',
            cell: (p: Product) => (
              <AmountDisplay
                amount={p.purchase_price}
                size="sm"
                className="text-muted-foreground font-mono"
              />
            ),
          },
        ]
      : []),
    {
      header: 'Stock Status',
      className: 'text-center w-36',
      cell: (p) => (
        <StockBadge currentStock={p.current_stock} minStockAlert={p.min_stock_alert} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-center w-24',
      cell: (p) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleEditProduct(p);
            }}
            title="Edit Item"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickImport(p);
            }}
            title="Inward Stock Receiving"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const totalLoaded = products.length;
  const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;
  const lowStockCount = products.filter(
    (p) => p.current_stock > 0 && p.current_stock <= p.min_stock_alert
  ).length;
  const healthyCount = products.filter((p) => p.current_stock > p.min_stock_alert).length;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Inventory Catalog & Receiving
            </h1>
            <kbd className="kbd text-[10px]">F4</kbd>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Central wholesale master catalog, stock levels, and inward container receiving
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setImportProduct(null);
              setIsImportFormOpen(true);
            }}
            className="gap-2 font-semibold shadow-xs"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Inward Import</span>
          </Button>

          <Button onClick={handleCreateProduct} className="gap-2 font-semibold shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Stock Alerts Notice */}
      <StockAlerts onQuickImport={handleQuickImport} />

      {/* Metric Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Catalog SKUs
          </div>
          <div className="text-xl font-black font-mono text-foreground mt-1">
            {pagination?.totalRecords || totalLoaded}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Active catalog entries</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Healthy Stock
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 mt-1">
            {healthyCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Above minimum threshold</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Low Stock Warnings
          </div>
          <div className="text-xl font-black font-mono text-amber-600 mt-1">
            {lowStockCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Near exhaustion buffer</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Critical Out of Stock
          </div>
          <div className="text-xl font-black font-mono text-destructive mt-1">
            {outOfStockCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Requires immediate import</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by SKU, barcode, or product name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onRowClick={(p) => handleEditProduct(p)}
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

      {/* Create / Edit Form */}
      <ProductForm
        product={selectedProduct}
        open={isProductFormOpen}
        onOpenChange={setIsProductFormOpen}
        onSuccess={() => refetch()}
      />

      {/* Inward Stock Import Form */}
      <ImportForm
        initialProduct={importProduct}
        open={isImportFormOpen}
        onOpenChange={setIsImportFormOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

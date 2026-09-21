import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import { useProducts } from '@/lib/queries/use-products';
import { Product } from '@/types/entities';
import { Calculator, Sparkles, TrendingUp, DollarSign, Package, Percent } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const ProfitCalculator: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [costPrice, setCostPrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(140);

  const { data: productsData } = useProducts({ limit: 50, is_active: 1 });
  const products = productsData?.data || [];

  const handleSelectProduct = (productIdStr: string) => {
    const id = parseInt(productIdStr, 10);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setSelectedProduct(prod);
      setCustomName(prod.name);
      setCostPrice(prod.purchase_price ?? 0);
      setSellingPrice(prod.selling_price ?? 0);
    } else {
      setSelectedProduct(null);
    }
  };

  const totalCost = (quantity || 0) * (costPrice || 0);
  const totalRevenue = (quantity || 0) * (sellingPrice || 0);
  const grossProfit = totalRevenue - totalCost;
  const unitProfit = (sellingPrice || 0) - (costPrice || 0);
  const profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const markupPercent = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  return (
    <Card className="border-border/80 shadow-xs bg-card">
      <CardHeader className="py-4 px-5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Daily Profit Simulator (By Quantity & Price)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Calculate projected wholesale net profit by entering product quantity, landed cost, and selling price
            </CardDescription>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            On-Demand Margin Simulator
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Pick from catalog or custom */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Package className="h-3 w-3 text-primary" />
              <span>Select Product (Catalog)</span>
            </label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20"
              value={selectedProduct?.id || ''}
              onChange={(e) => handleSelectProduct(e.target.value)}
            >
              <option value="">-- Custom Manual Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} • {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name / Label */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground">Product Name / Batch</label>
            <Input
              type="text"
              placeholder="e.g. Energy Drink Carton"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground">Quantity (Units / Boxes)</label>
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="h-9 text-xs font-mono font-bold"
            />
          </div>

          {/* Rates: Cost vs Selling */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Cost Rate</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-9 text-xs font-mono text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Selling Rate</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-9 text-xs font-mono font-bold text-primary"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Results */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Total Landed Cost */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Inward Cost
            </div>
            <div className="text-lg font-black font-mono text-foreground">
              {formatCurrency(totalCost)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {quantity} × {formatCurrency(costPrice)}
            </div>
          </div>

          {/* Total Wholesale Revenue */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Gross Wholesale Revenue
            </div>
            <div className="text-lg font-black font-mono text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {quantity} × {formatCurrency(sellingPrice)}
            </div>
          </div>

          {/* Calculated Net Profit */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>Calculated Net Profit</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(grossProfit)}
            </div>
            <div className="text-[10px] text-emerald-600/80 font-mono">
              +{formatCurrency(unitProfit)} / unit
            </div>
          </div>

          {/* Margin & Markup */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center justify-between">
              <span>Profit Margin</span>
              <Percent className="h-3.5 w-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-primary">
              {profitMarginPercent.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Markup: {markupPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

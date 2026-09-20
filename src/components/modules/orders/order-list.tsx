import React, { useState } from 'react';
import { useOrders } from '@/lib/queries/use-orders';
import { Order } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { OrderStatusBadge } from './order-status-badge';
import { OrderDetail } from './order-detail';
import { OrderForm } from './order-form';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils/date';
import { Plus, Search, Eye, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useNavigate } from 'react-router-dom';

export const OrderList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const navigate = useNavigate();
  const resetCart = useCartStore((state) => state.resetCart);
  const addItem = useCartStore((state) => state.addItem);
  const setShop = useCartStore((state) => state.setShop);
  const setBooker = useCartStore((state) => state.setBooker);
  const setLinkedOrder = useCartStore((state) => state.setLinkedOrder);

  const { data: response, isLoading } = useOrders({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });

  const orders = response?.data || [];
  const pagination = response?.pagination;

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDetailOpen(true);
  };

  const handleConvertToBill = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    resetCart();
    setShop(order.shop_id);
    setBooker(order.order_booker_id);
    setLinkedOrder(order.id);

    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        addItem(
          {
            id: item.product_id,
            sku: item.sku || '',
            name: item.product_name || 'Item',
            unit: 'BOX',
            selling_price: item.unit_price,
            current_stock: 999,
            min_stock_alert: 5,
            is_active: 1,
            created_at: '',
            updated_at: '',
          },
          item.quantity
        );
      });
    }

    navigate('/billing');
  };

  const columns: ColumnDef<Order>[] = [
    {
      header: 'Order #',
      accessorKey: 'order_number',
      className: 'font-mono font-bold text-xs text-primary',
    },
    {
      header: 'Retail Shop',
      accessorKey: 'shop_name',
      className: 'font-semibold text-foreground text-xs',
    },
    {
      header: 'Order Booker',
      accessorKey: 'booker_name',
      className: 'text-xs text-muted-foreground',
    },
    {
      header: 'Date',
      cell: (order) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDateTime(order.order_date)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      header: 'Total Amount',
      className: 'text-right',
      cell: (order) => (
        <AmountDisplay amount={order.total_amount} size="sm" className="font-bold font-mono" />
      ),
    },
    {
      header: 'Actions',
      className: 'text-center w-28',
      cell: (order) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(order.id);
            }}
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {order.status !== 'CANCELLED' && order.status !== 'BILLED' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                handleConvertToBill(order.id);
              }}
              title="Convert to Bill"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Top Bar: Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Pre-Booking Orders [F2]</h1>
          <p className="text-xs text-muted-foreground">
            Manage wholesale orders taken by bookers, dispatch slips, and invoice conversion
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="gap-2 font-semibold shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Wholesale Order</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-sm">
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="BILLED">Billed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        onRowClick={(order) => handleViewOrder(order.id)}
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

      {/* Order Detail Modal */}
      <OrderDetail
        orderId={selectedOrderId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onConvertToBill={handleConvertToBill}
      />

      {/* New Order Form Modal */}
      <OrderForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onOrderCreated={(newId) => handleViewOrder(newId)}
      />
    </div>
  );
};

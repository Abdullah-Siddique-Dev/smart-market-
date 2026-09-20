import { create } from 'zustand';
import { Product } from '@/types/entities';
import { PaymentStatus } from '@/types/enums';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_selling_price: number;
  line_total: number;
}

interface CartState {
  items: CartItem[];
  selectedShopId: number | null;
  selectedBookerId: number | null;
  linkedOrderId: number | null;
  discountAmount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;

  // Computed Totals
  subtotal: () => number;
  netTotal: () => number;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  removeItem: (productId: number) => void;
  setShop: (shopId: number | null) => void;
  setBooker: (bookerId: number | null) => void;
  setLinkedOrder: (orderId: number | null) => void;
  setDiscount: (discount: number) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setPaidAmount: (amount: number) => void;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedShopId: null,
  selectedBookerId: null,
  linkedOrderId: null,
  discountAmount: 0,
  paymentStatus: 'PAID',
  paidAmount: 0,

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.line_total, 0);
  },

  netTotal: () => {
    const sub = get().subtotal();
    return Math.max(0, sub - get().discountAmount);
  },

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...state.items];
        const existing = newItems[existingIndex];
        const newQty = Math.min(product.current_stock, existing.quantity + quantity);
        newItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          line_total: newQty * existing.unit_selling_price,
        };
        return { items: newItems };
      }

      const initialQty = Math.min(product.current_stock, quantity);
      const newItem: CartItem = {
        product,
        quantity: initialQty > 0 ? initialQty : 1,
        unit_selling_price: product.selling_price,
        line_total: (initialQty > 0 ? initialQty : 1) * product.selling_price,
      };

      const updatedItems = [...state.items, newItem];
      const newSubtotal = updatedItems.reduce((sum, i) => sum + i.line_total, 0);
      const newNet = Math.max(0, newSubtotal - state.discountAmount);

      return {
        items: updatedItems,
        paidAmount: state.paymentStatus === 'PAID' ? newNet : state.paidAmount,
      };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const qty = Math.max(1, quantity);
          return {
            ...item,
            quantity: qty,
            line_total: qty * item.unit_selling_price,
          };
        }
        return item;
      });

      const newSub = newItems.reduce((sum, i) => sum + i.line_total, 0);
      const newNet = Math.max(0, newSub - state.discountAmount);

      return {
        items: newItems,
        paidAmount: state.paymentStatus === 'PAID' ? newNet : state.paidAmount,
      };
    });
  },

  updatePrice: (productId, price) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const p = Math.max(0, price);
          return {
            ...item,
            unit_selling_price: p,
            line_total: item.quantity * p,
          };
        }
        return item;
      });

      const newSub = newItems.reduce((sum, i) => sum + i.line_total, 0);
      const newNet = Math.max(0, newSub - state.discountAmount);

      return {
        items: newItems,
        paidAmount: state.paymentStatus === 'PAID' ? newNet : state.paidAmount,
      };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.product.id !== productId);
      const newSub = newItems.reduce((sum, i) => sum + i.line_total, 0);
      const newNet = Math.max(0, newSub - state.discountAmount);

      return {
        items: newItems,
        paidAmount: state.paymentStatus === 'PAID' ? newNet : state.paidAmount,
      };
    });
  },

  setShop: (shopId) => set({ selectedShopId: shopId }),
  setBooker: (bookerId) => set({ selectedBookerId: bookerId }),
  setLinkedOrder: (orderId) => set({ linkedOrderId: orderId }),
  setDiscount: (discount) => {
    set((state) => {
      const d = Math.max(0, discount);
      const sub = state.subtotal();
      const newNet = Math.max(0, sub - d);
      return {
        discountAmount: d,
        paidAmount: state.paymentStatus === 'PAID' ? newNet : state.paidAmount,
      };
    });
  },
  setPaymentStatus: (paymentStatus) => {
    set((state) => ({
      paymentStatus,
      paidAmount: paymentStatus === 'PAID' ? state.netTotal() : paymentStatus === 'CREDIT' ? 0 : state.paidAmount,
    }));
  },
  setPaidAmount: (paidAmount) => set({ paidAmount: Math.max(0, paidAmount) }),

  resetCart: () =>
    set({
      items: [],
      selectedShopId: null,
      selectedBookerId: null,
      linkedOrderId: null,
      discountAmount: 0,
      paymentStatus: 'PAID',
      paidAmount: 0,
    }),
}));

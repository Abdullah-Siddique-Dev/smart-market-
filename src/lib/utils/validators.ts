import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  unit: z.string().default('BOX'),
  purchase_price: z.coerce.number().min(0, 'Purchase price must be positive'),
  selling_price: z.coerce.number().min(0, 'Selling price must be positive'),
  current_stock: z.coerce.number().int().min(0).default(0),
  min_stock_alert: z.coerce.number().int().min(0).default(10),
});

export const importSchema = z.object({
  product_id: z.coerce.number().int().positive('Please select a product'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative'),
  supplier_info: z.string().optional(),
  import_date: z.string().optional(),
  update_master_cost: z.boolean().default(false),
});

export const shopSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  owner_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  credit_limit: z.coerce.number().min(0).default(0),
});

export const bookerSchema = z.object({
  name: z.string().min(1, 'Booker name is required'),
  phone: z.string().min(1, 'Phone is required'),
  territory: z.string().optional(),
  commission_rate: z.coerce.number().min(0).default(0),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  payment_method: z.string().default('CASH'),
  notes: z.string().optional(),
});

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface CreateBillPayload {
  order_id?: number;
  shop_id: number;
  order_booker_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_selling_price: number;
  }>;
  discount_amount?: number;
  payment_status: 'PAID' | 'PARTIAL' | 'CREDIT';
  paid_amount: number;
}

export interface BillResponse {
  success: boolean;
  bill: {
    id: number;
    bill_number: string;
    net_amount: number;
    stock_deducted: boolean;
  };
  stock_warnings?: string[];
}

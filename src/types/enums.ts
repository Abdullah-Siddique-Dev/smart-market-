export const USER_ROLES = {
  OWNER: 'OWNER',
  OPERATOR: 'OPERATOR',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  DISPATCHED: 'DISPATCHED',
  BILLED: 'BILLED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const PAYMENT_STATUSES = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  CREDIT: 'CREDIT',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const INVENTORY_TRANSACTION_TYPES = {
  IMPORT: 'IMPORT',
  SALE_BILL: 'SALE_BILL',
  BOOKER_DISPATCH: 'BOOKER_DISPATCH',
  BOOKER_RETURN: 'BOOKER_RETURN',
  DAMAGE_ADJUSTMENT: 'DAMAGE_ADJUSTMENT',
} as const;

export type InventoryTransactionType =
  (typeof INVENTORY_TRANSACTION_TYPES)[keyof typeof INVENTORY_TRANSACTION_TYPES];

export const ORDER_SOURCES = {
  MANUAL_WHATSAPP: 'MANUAL_WHATSAPP',
  MANUAL_IN_PERSON: 'MANUAL_IN_PERSON',
  DIRECT_PHONE: 'DIRECT_PHONE',
  DIRECT_WALKIN: 'DIRECT_WALKIN',
} as const;

export type OrderSource = (typeof ORDER_SOURCES)[keyof typeof ORDER_SOURCES];

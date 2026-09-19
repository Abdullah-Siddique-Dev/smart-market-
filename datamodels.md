# Data Models Specification — Smart Market OS

## 1. Overview & Data Integrity Principles

The database layer is implemented using **SQLite 3** running with `WAL` (Write-Ahead Logging) and `PRAGMA foreign_keys = ON;`. 

### Key Design Principles:
1. **Financial Immutability:** Historical unit purchase costs and selling prices are snapshotted on bill generation. If a product's base purchase cost increases tomorrow, past profit records remain 100% accurate and unchanged.
2. **Anti-Corruption Audit Trail:** Every single physical movement of stock is recorded in an append-only `inventory_ledger` table.
3. **Derived vs. Stored Data:** Calculated values (such as line totals and profit margins) are documented clearly. Where stored for fast indexing, their derivation formula is strictly defined.

---

## 2. Entity-Relationship Overview

```
 ┌────────────────┐         ┌────────────────────┐
 │  system_users  │         │   product_imports  │
 └───────┬────────┘         └─────────┬──────────┘
         │                            │
         │                            ▼
         │                  ┌────────────────────┐
         │                  │      products      │◄────────────────────────┐
         │                  └─────────┬──────────┘                         │
         │                            │                                    │
         ▼                            ▼                                    │
┌─────────────────┐         ┌────────────────────┐         ┌───────────────┴────┐
│  order_bookers  │         │    order_items     │         │  inventory_ledger  │
└────────┬────────┘         └─────────▲──────────┘         │   (AUDIT TRAIL)    │
         │                            │                    └───────────────▲────┘
         ├────────────────────────┐   │                                    │
         ▼                        ▼   │                                    │
┌─────────────────┐         ┌─────┴───┴──────────┐                         │
│ dispatch_slips  │         │       orders       │                         │
└────────┬────────┘         └─────────┬──────────┘                         │
         │                            │                                    │
         ▼                            ▼                                    │
┌─────────────────┐         ┌────────────────────┐                         │
│   shop_bills    │────────►│  shop_bill_items   │─────────────────────────┘
└────────┬────────┘         └────────────────────┘
         │
         ▼
┌─────────────────┐
│  retail_shops   │
└─────────────────┘
```

---

## 3. Entity Definitions

### 3.1 `system_users`
Stores internal users who can access the desktop application.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique user identifier |
| `username` | `TEXT` | `NOT NULL UNIQUE` | Login username |
| `password_hash` | `TEXT` | `NOT NULL` | Argon2/bcrypt password hash |
| `full_name` | `TEXT` | `NOT NULL` | Display name of the operator/owner |
| `role` | `TEXT` | `NOT NULL CHECK (role IN ('OWNER', 'OPERATOR'))` | System access tier |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))` | Active account flag |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Account creation timestamp |

---

### 3.2 `products`
The master catalog of imported and wholesale goods.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique product identifier |
| `sku` | `TEXT` | `NOT NULL UNIQUE` | Barcode or internal stock keeping code |
| `name` | `TEXT` | `NOT NULL` | Commercial product name |
| `unit` | `TEXT` | `NOT NULL DEFAULT 'BOX'` | Unit of measure (`BOX`, `CARTON`, `PIECE`, `PACK`) |
| `purchase_price` | `REAL` | `NOT NULL CHECK (purchase_price >= 0)` | Current landed import cost per unit |
| `selling_price` | `REAL` | `NOT NULL CHECK (selling_price >= purchase_price)` | Default wholesale selling rate |
| `current_stock` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (current_stock >= 0)` | Physical stock on hand |
| `min_stock_alert` | `INTEGER` | `NOT NULL DEFAULT 10 CHECK (min_stock_alert >= 0)` | Low-stock notification threshold |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))` | Active status |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Record creation timestamp |
| `updated_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Last updated timestamp |

*Indexes:*
- `idx_products_sku` ON (`sku`)
- `idx_products_name` ON (`name`)

---

### 3.3 `product_imports`
Tracks incoming bulk shipments and landed costs to update inventory.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique import batch identifier |
| `import_number` | `TEXT` | `NOT NULL UNIQUE` | Human-readable batch/shipment code (e.g. `IMP-2026-001`) |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Product imported |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Quantity received into warehouse |
| `unit_cost` | `REAL` | `NOT NULL CHECK (unit_cost >= 0)` | Landed purchase cost per unit for this batch |
| `supplier_info` | `TEXT` | `NULL` | Supplier name or bill of lading reference |
| `import_date` | `TEXT` | `NOT NULL DEFAULT (date('now', 'localtime'))` | Arrival date |
| `received_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | User who verified stock inward |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Timestamp |

---

### 3.4 `retail_shops`
Master records for the retail shops and customers served by the wholesale business.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique shop identifier |
| `shop_name` | `TEXT` | `NOT NULL` | Registered or commercial shop name |
| `owner_name` | `TEXT` | `NULL` | Shopkeeper / proprietor contact name |
| `phone` | `TEXT` | `NULL` | Contact phone number |
| `address` | `TEXT` | `NULL` | Physical market/area location |
| `outstanding_balance` | `REAL` | `NOT NULL DEFAULT 0.0` | Running ledger/credit (Khata) balance |
| `credit_limit` | `REAL` | `NOT NULL DEFAULT 0.0` | Maximum authorized credit limit |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Creation timestamp |

*Indexes:*
- `idx_retail_shops_name` ON (`shop_name`)

---

### 3.5 `order_bookers`
Sales and delivery field representatives responsible for booking orders and delivering goods.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique order booker identifier |
| `name` | `TEXT` | `NOT NULL` | Full name of the booker |
| `phone` | `TEXT` | `NOT NULL` | Contact number |
| `territory` | `TEXT` | `NULL` | Assigned market sector or route |
| `commission_rate` | `REAL` | `NOT NULL DEFAULT 0.0 CHECK (commission_rate >= 0)` | Commission percentage (if applicable) |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))` | Active employment flag |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Registration timestamp |

---

### 3.6 `orders`
Incoming wholesale orders taken by order bookers or received at the desk.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique order ID |
| `order_number` | `TEXT` | `NOT NULL UNIQUE` | Formatted code (e.g. `ORD-2026-0001`) |
| `shop_id` | `INTEGER` | `NOT NULL REFERENCES retail_shops(id)` | Target retail shop |
| `order_booker_id` | `INTEGER` | `NOT NULL REFERENCES order_bookers(id)` | Assigned order booker |
| `order_date` | `TEXT` | `NOT NULL DEFAULT (date('now', 'localtime'))` | Booking date |
| `status` | `TEXT` | `NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'BILLED', 'CANCELLED'))` | Order lifecycle state |
| `total_amount` | `REAL` | `NOT NULL DEFAULT 0.0` | Gross calculated order value |
| `notes` | `TEXT` | `NULL` | Special delivery instructions |
| `created_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who registered order |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Order creation timestamp |

*Indexes:*
- `idx_orders_status` ON (`status`)
- `idx_orders_booker` ON (`order_booker_id`)
- `idx_orders_date` ON (`order_date`)

---

### 3.7 `order_items`
Line items within an order.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique line item ID |
| `order_id` | `INTEGER` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | Associated order |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Selected product |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Ordered quantity |
| `unit_price` | `REAL` | `NOT NULL CHECK (unit_price >= 0)` | Quoted wholesale unit price |
| `line_total` | `REAL` | `NOT NULL` | Computed: `quantity * unit_price` |

---

### 3.8 `dispatch_slips`
The physical and legal gate-pass generated when goods leave the warehouse with an Order Booker.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique slip identifier |
| `slip_number` | `TEXT` | `NOT NULL UNIQUE` | Formatted slip code (e.g. `SLP-2026-0001`) |
| `order_booker_id` | `INTEGER` | `NOT NULL REFERENCES order_bookers(id)` | Booker in custody of items |
| `dispatch_date` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Time goods exited warehouse |
| `status` | `TEXT` | `NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'RECONCILED'))` | Reconciliation status |
| `notes` | `TEXT` | `NULL` | Dispatch remarks |
| `created_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Warehouse operator |

---

### 3.9 `dispatch_slip_items`
Individual items and quantities handed over to an order booker.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique line item ID |
| `dispatch_slip_id` | `INTEGER` | `NOT NULL REFERENCES dispatch_slips(id) ON DELETE CASCADE` | Parent slip |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Product dispatched |
| `dispatched_qty` | `INTEGER` | `NOT NULL CHECK (dispatched_qty > 0)` | Quantity handed to booker |
| `returned_qty` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (returned_qty >= 0)` | Unsold stock returned |
| `billed_qty` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (billed_qty >= 0)` | Stock successfully sold |

*Constraint:* `CHECK (billed_qty + returned_qty <= dispatched_qty)`

---

### 3.10 `bills` (Final Retail Shop Invoices)
The finalized commercial bill issued for a specific retail shop. **Generates atomic stock reduction upon insert.**

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique bill identifier |
| `bill_number` | `TEXT` | `NOT NULL UNIQUE` | Formatted invoice number (e.g. `INV-2026-0001`) |
| `order_id` | `INTEGER` | `NULL REFERENCES orders(id)` | Associated order (if converted from order) |
| `shop_id` | `INTEGER` | `NOT NULL REFERENCES retail_shops(id)` | Customer retail shop |
| `order_booker_id` | `INTEGER` | `NOT NULL REFERENCES order_bookers(id)` | Booker who fulfilled sale |
| `bill_date` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Invoicing timestamp |
| `subtotal` | `REAL` | `NOT NULL CHECK (subtotal >= 0)` | Sum of line items |
| `discount_amount`| `REAL` | `NOT NULL DEFAULT 0.0 CHECK (discount_amount >= 0)` | Authorized bill discount |
| `net_amount` | `REAL` | `NOT NULL CHECK (net_amount >= 0)` | Final payable amount |
| `paid_amount` | `REAL` | `NOT NULL DEFAULT 0.0 CHECK (paid_amount >= 0)` | Cash collected at billing |
| `payment_status` | `TEXT` | `NOT NULL CHECK (payment_status IN ('PAID', 'PARTIAL', 'CREDIT'))` | Payment condition |
| `created_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who issued bill |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | System creation time |

*Indexes:*
- `idx_bills_date` ON (`bill_date`)
- `idx_bills_shop` ON (`shop_id`)
- `idx_bills_booker` ON (`order_booker_id`)

---

### 3.11 `bill_items`
Individual line items on a shop bill. **Snapshots purchase cost to lock in historical profit.**

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique bill item ID |
| `bill_id` | `INTEGER` | `NOT NULL REFERENCES bills(id) ON DELETE CASCADE` | Associated invoice |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Sold product |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Quantity sold |
| `unit_purchase_price` | `REAL` | `NOT NULL CHECK (unit_purchase_price >= 0)` | **Historical landed cost at time of sale** |
| `unit_selling_price` | `REAL` | `NOT NULL CHECK (unit_selling_price >= 0)` | Agreed selling rate |
| `line_total` | `REAL` | `NOT NULL` | Stored: `quantity * unit_selling_price` |
| `line_profit` | `REAL` | `NOT NULL` | Stored: `(unit_selling_price - unit_purchase_price) * quantity` |

---

### 3.12 `inventory_ledger` (ANTI-CORRUPTION AUDIT TRAIL)
**Strictly Append-Only Table.** Logs every addition, deduction, return, and damage adjustment.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique audit log sequence number |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Product modified |
| `change_qty` | `INTEGER` | `NOT NULL CHECK (change_qty != 0)` | Positive (inward) or negative (outward) qty |
| `balance_after` | `INTEGER` | `NOT NULL CHECK (balance_after >= 0)` | Verifiable stock balance after change |
| `transaction_type` | `TEXT` | `NOT NULL CHECK (transaction_type IN ('IMPORT', 'SALE_BILL', 'BOOKER_DISPATCH', 'BOOKER_RETURN', 'DAMAGE_ADJUSTMENT'))` | Reason code |
| `reference_id` | `INTEGER` | `NOT NULL` | ID of the source record (`bill_id`, `import_id`, etc.) |
| `reference_type` | `TEXT` | `NOT NULL` | Name of source table (`bills`, `product_imports`, etc.) |
| `performed_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | User who initiated the action |
| `notes` | `TEXT` | `NULL` | Context or adjustment reason |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Tamper-evident timestamp |

*Indexes:*
- `idx_ledger_product` ON (`product_id`)
- `idx_ledger_timestamp` ON (`created_at`)

---

### 3.13 `booker_reconciliations`
End-of-day verification sheet settling cash, credit bills, and returned stock for each booker.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique reconciliation ID |
| `reconciliation_date`| `TEXT` | `NOT NULL DEFAULT (date('now', 'localtime'))` | Settlement date |
| `order_booker_id` | `INTEGER` | `NOT NULL REFERENCES order_bookers(id)` | Booker being settled |
| `orders_count_total` | `INTEGER` | `NOT NULL DEFAULT 0` | Total orders assigned |
| `orders_count_collected` | `INTEGER` | `NOT NULL DEFAULT 0` | Delivered & collected orders |
| `orders_count_pending` | `INTEGER` | `NOT NULL DEFAULT 0` | Undelivered / pending orders |
| `total_cash_submitted` | `REAL` | `NOT NULL DEFAULT 0.0` | Physical cash deposited at counter |
| `total_credit_issued` | `REAL` | `NOT NULL DEFAULT 0.0` | Amount booked to shop Khata |
| `shortage_amount` | `REAL` | `NOT NULL DEFAULT 0.0` | Unaccounted cash/stock deficit |
| `verified_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Owner / Supervisor who verified |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Settlement timestamp |

---

## 4. Stored vs. Derived Data Reference

| Field / Metric | Category | Computation Formula / Invariant Rule |
| :--- | :--- | :--- |
| `current_stock` | **Stored & Derived** | Stored on `products` for instant lookup; verified by: $\sum \text{Ledger Inward} - \sum \text{Ledger Outward}$. |
| `line_total` | **Stored** | `quantity * unit_selling_price`. Stored to accelerate aggregate billing queries. |
| `line_profit` | **Stored** | `(unit_selling_price - unit_purchase_price) * quantity`. Snapshotted to prevent cost revision corruption. |
| `daily_net_profit`| **Derived** | $\sum_{\text{Day}} \text{line\_profit} - \sum_{\text{Day}} \text{discount\_amount}$. |
| `booker_pending` | **Derived** | $\text{Count of Orders assigned to Booker with status } = \text{'PENDING'}$. |
| `booker_collected`| **Derived** | $\text{Count of Orders assigned to Booker with status } = \text{'BILLED'}$. |
| `shop_balance` | **Stored & Derived** | Stored on `retail_shops`; verified by: $\sum \text{Credit Bills} - \sum \text{Payments Received}$. |

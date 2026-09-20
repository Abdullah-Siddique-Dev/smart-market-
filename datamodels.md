# Data Models Specification — Smart Market OS
## Unified Single-Desk Architecture (Offline-First Wholesale ERP)

---

## 1. Overview & Operational Principles

Smart Market OS operates as a **Unified Single-Operator Desktop System** for wholesale and import distribution. 

### Operational Realities & Single-Desk Paradigm
1. **No External Portals / No "Double Sides":** 
   There is **NO** Order Booker Portal, **NO** mobile field app, and **NO** customer-facing web portal. The system is strictly a single, authoritative desktop application operated by the wholesale owner / counter operator.
2. **Field Order Booker Operations (WhatsApp & In-Person):**
   Order bookers are physical field salesmen and delivery agents who visit retail shops. They do **not** have logins or software access. They communicate orders to the wholesale desk either:
   - via **WhatsApp** (text messages, voice notes, photos of physical paper booking slips), or
   - by **physically visiting** the wholesale counter.
3. **Manual Operator Intake:**
   The single desk operator / owner manually enters all incoming orders, attributes them to the respective field booker and retail customer, and processes them through dispatch, billing, and settlement.
4. **Bookers as Tracked Physical Entities:**
   The `order_bookers` table stores sales representatives solely for:
   - **Sales Attribution:** Who booked or delivered the order.
   - **Commission Tracking:** Automatic percentage calculations for payouts.
   - **Warehouse Custody Transfer:** Tracking goods released via Dispatch Gate Passes.
   - **End-of-Day Cash & Stock Reconciliation:** Verifying submitted cash and returned unsold inventory.
5. **Financial & Cost Immutability:**
   Historical purchase costs are snapshotted on bill generation into `bill_items.unit_purchase_price`. If import costs change in subsequent shipments, past invoices and profit reports remain mathematically true.
6. **Anti-Corruption Audit Trail:**
   Every physical stock movement (inward import, POS bill, booker dispatch, returned stock, damage adjustment) writes an immutable record to `inventory_ledger`.

---

## 2. Entity-Relationship Overview

```
                      ┌────────────────────────────────────────┐
                      │        EXTERNAL FIELD SOURCES          │
                      │  • Bookers via WhatsApp (Text/Photo)   │
                      │  • In-Person Counter Visits            │
                      │  • Direct Phone Orders                 │
                      └───────────────────┬────────────────────┘
                                          │ Manual Entry by Operator
                                          ▼
┌────────────────┐               ┌─────────────────┐         ┌────────────────────┐
│  system_users  │──────────────►│     orders      │◄────────┤    retail_shops    │
│(Owner/Operator)│               └──┬────────────┬─┘         └─────────┬──────────┘
└───────┬────────┘                  │            │                     │
        │                           ▼            │                     │
        │                  ┌─────────────────┐   │                     │
        │                  │   order_items   │   │                     │
        │                  └────────┬────────┘   │                     │
        │                           │            │                     │
        │                           ▼            │                     │
        │                  ┌─────────────────┐   │                     │
        │                  │    products     │◄──┼─────────┐           │
        │                  └────────┬────────┘   │         │           │
        │                           │            │         │           │
        ▼                           ▼            │         │           │
┌────────────────┐         ┌────────┴────────┐   │         │           │
│ order_bookers  │         │ product_imports │   │         │           │
│(Tracked Reps)  │         └─────────────────┘   │         │           │
└───────┬────────┘                               │         │           │
        │                                        │         │           │
        ├───────────────────────┬────────────────┘         │           │
        ▼                       ▼                          │           │
┌────────────────┐      ┌────────────────┐                 │           │
│ dispatch_slips │      │   shop_bills   │─────────────────┼───────────┤
└───────┬────────┘      └───────┬────────┘                 │           │
        │                       │                          │           │
        ▼                       ▼                          ▼           ▼
┌────────────────┐      ┌────────────────┐      ┌─────────────────────────┐
│ dispatch_items │      │   bill_items   │      │    inventory_ledger     │
└────────────────┘      └────────────────┘      │ (IMMUTABLE AUDIT TRAIL) │
                                                └─────────────────────────┘
```

---

## 3. Entity Definitions

### 3.1 `system_users`
Stores authenticated local users of the desktop application (Owner / Operator).

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique user identifier |
| `username` | `TEXT` | `NOT NULL UNIQUE` | Login username (e.g. `owner`) |
| `password_hash` | `TEXT` | `NOT NULL` | Argon2/bcrypt hash |
| `full_name` | `TEXT` | `NOT NULL` | Operator / Owner display name |
| `role` | `TEXT` | `NOT NULL CHECK (role IN ('OWNER', 'OPERATOR'))` | System access tier |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))` | Active account flag |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Account creation timestamp |

---

### 3.2 `products`
The master catalog of imported wholesale goods and stock balances.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique product identifier |
| `sku` | `TEXT` | `NOT NULL UNIQUE` | Barcode or internal SKU code |
| `name` | `TEXT` | `NOT NULL` | Commercial product name |
| `unit` | `TEXT` | `NOT NULL DEFAULT 'BOX'` | Packaging unit (`BOX`, `CARTON`, `PIECE`, `PACK`) |
| `purchase_price` | `REAL` | `NOT NULL CHECK (purchase_price >= 0)` | Current landed purchase cost |
| `selling_price` | `REAL` | `NOT NULL CHECK (selling_price >= purchase_price)` | Default wholesale selling rate |
| `current_stock` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (current_stock >= 0)` | Physical warehouse stock |
| `min_stock_alert` | `INTEGER` | `NOT NULL DEFAULT 10 CHECK (min_stock_alert >= 0)` | Low-stock notification trigger |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))` | Active catalog status |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Record creation timestamp |
| `updated_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Last updated timestamp |

*Indexes:*
- `idx_products_sku` ON (`sku`)
- `idx_products_name` ON (`name`)
- `idx_products_active` ON (`is_active`)

---

### 3.3 `product_imports`
Inward container / bulk shipments received into warehouse stock.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique import batch identifier |
| `import_number` | `TEXT` | `NOT NULL UNIQUE` | Batch code (e.g. `IMP-2026-0001`) |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Imported product |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Quantity added to warehouse stock |
| `unit_cost` | `REAL` | `NOT NULL CHECK (unit_cost >= 0)` | Landed purchase cost per unit |
| `supplier_info` | `TEXT` | `NULL` | Supplier name or shipping reference |
| `import_date` | `TEXT` | `NOT NULL DEFAULT (date('now', 'localtime'))` | Arrival date |
| `received_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who recorded inward receipt |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Timestamp |

---

### 3.4 `retail_shops`
Customer accounts and running Khata (credit) balances.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique customer shop identifier |
| `shop_name` | `TEXT` | `NOT NULL` | Commercial shop name |
| `owner_name` | `TEXT` | `NULL` | Shopkeeper / contact name |
| `phone` | `TEXT` | `NULL` | Phone / WhatsApp contact number |
| `address` | `TEXT` | `NULL` | Market location / territory |
| `outstanding_balance` | `REAL` | `NOT NULL DEFAULT 0.0` | Running credit debt (Khata) |
| `credit_limit` | `REAL` | `NOT NULL DEFAULT 0.0` | Authorized maximum credit |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Customer registration timestamp |

---

### 3.5 `order_bookers`
Field sales agents and delivery representatives. **No software login account**; tracked purely for commission, delivery assignment, and end-of-day reconciliation.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique booker identifier |
| `name` | `TEXT` | `NOT NULL` | Full name of the booker |
| `phone` | `TEXT` | `NOT NULL` | Contact / WhatsApp number |
| `territory` | `TEXT` | `NULL` | Assigned market sector or route |
| `commission_rate` | `REAL` | `NOT NULL DEFAULT 0.0 CHECK (commission_rate >= 0)` | Commission percentage (e.g. `2.5`) |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))` | Active field rep flag |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Registration timestamp |

---

### 3.6 `orders`
Wholesale orders booked for retail shops. Manually entered by the operator from **WhatsApp messages**, **in-person booker visits**, or **direct phone calls**.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique order ID |
| `order_number` | `TEXT` | `NOT NULL UNIQUE` | Formatted code (e.g. `ORD-2026-0001`) |
| `shop_id` | `INTEGER` | `NOT NULL REFERENCES retail_shops(id)` | Target retail shop |
| `order_booker_id` | `INTEGER` | `NULL REFERENCES order_bookers(id)` | Attributed booker (optional for direct walk-ins) |
| `order_source` | `TEXT` | `NOT NULL DEFAULT 'MANUAL_WHATSAPP' CHECK (order_source IN ('MANUAL_WHATSAPP', 'MANUAL_IN_PERSON', 'DIRECT_PHONE', 'DIRECT_WALKIN'))` | Channel through which order was received |
| `order_date` | `TEXT` | `NOT NULL DEFAULT (date('now', 'localtime'))` | Booking date |
| `status` | `TEXT` | `NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'BILLED', 'CANCELLED'))` | Order lifecycle state |
| `total_amount` | `REAL` | `NOT NULL DEFAULT 0.0 CHECK (total_amount >= 0)` | Gross calculated order value |
| `notes` | `TEXT` | `NULL` | WhatsApp message excerpt, paper slip reference, or delivery notes |
| `created_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who keyed in the order |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Order intake timestamp |

*Indexes:*
- `idx_orders_status` ON (`status`)
- `idx_orders_booker` ON (`order_booker_id`)
- `idx_orders_shop` ON (`shop_id`)
- `idx_orders_date` ON (`order_date`)
- `idx_orders_source` ON (`order_source`)

---

### 3.7 `order_items`
Itemized products within an order.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique line item ID |
| `order_id` | `INTEGER` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | Associated order |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Product ordered |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Ordered quantity |
| `unit_price` | `REAL` | `NOT NULL CHECK (unit_price >= 0)` | Quoted wholesale unit rate |
| `line_total` | `REAL` | `NOT NULL CHECK (line_total >= 0)` | Stored: `quantity * unit_price` |

---

### 3.8 `dispatch_slips` (Warehouse Gate Pass)
Custody transfer document generated when physical goods are handed to an Order Booker for field delivery.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique gate pass ID |
| `slip_number` | `TEXT` | `NOT NULL UNIQUE` | Formatted slip code (e.g. `SLP-2026-0001`) |
| `order_booker_id` | `INTEGER` | `NOT NULL REFERENCES order_bookers(id)` | Booker in custody of items |
| `dispatch_date` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Release timestamp |
| `status` | `TEXT` | `NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'RECONCILED'))` | Dispatch status |
| `notes` | `TEXT` | `NULL` | Gate remarks |
| `created_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who issued the gate pass |

---

### 3.9 `dispatch_slip_items`
Individual items and quantities released to the booker.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique line item ID |
| `dispatch_slip_id` | `INTEGER` | `NOT NULL REFERENCES dispatch_slips(id) ON DELETE CASCADE` | Parent gate pass |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Dispatched product |
| `dispatched_qty` | `INTEGER` | `NOT NULL CHECK (dispatched_qty > 0)` | Quantity handed to booker |
| `returned_qty` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (returned_qty >= 0)` | Unsold stock returned to warehouse |
| `billed_qty` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (billed_qty >= 0)` | Stock delivered & billed to customer |

*Constraint:* `CHECK (billed_qty + returned_qty <= dispatched_qty)`

---

### 3.10 `bills` (Shop Invoices / POS Settlement)
Final commercial invoice issued to a retail shop. **Generates atomic stock reduction and ledger entry upon insert.**

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique bill identifier |
| `bill_number` | `TEXT` | `NOT NULL UNIQUE` | Invoice code (e.g. `INV-2026-0001`) |
| `order_id` | `INTEGER` | `NULL REFERENCES orders(id)` | Associated order (if converted from order) |
| `shop_id` | `INTEGER` | `NOT NULL REFERENCES retail_shops(id)` | Customer retail shop |
| `order_booker_id` | `INTEGER` | `NULL REFERENCES order_bookers(id)` | Attributed booker (optional for direct walk-in) |
| `bill_date` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Invoicing timestamp |
| `subtotal` | `REAL` | `NOT NULL CHECK (subtotal >= 0)` | Sum of line items |
| `discount_amount`| `REAL` | `NOT NULL DEFAULT 0.0 CHECK (discount_amount >= 0)` | Authorized bill discount |
| `net_amount` | `REAL` | `NOT NULL CHECK (net_amount >= 0)` | Final payable total |
| `paid_amount` | `REAL` | `NOT NULL DEFAULT 0.0 CHECK (paid_amount >= 0)` | Cash collected at billing |
| `payment_status` | `TEXT` | `NOT NULL CHECK (payment_status IN ('PAID', 'PARTIAL', 'CREDIT'))` | Settlement status |
| `created_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who processed sale |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Record creation timestamp |

---

### 3.11 `bill_items`
Individual products billed on an invoice. **Permanently snapshots landed purchase cost for historical profit integrity.**

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique line item ID |
| `bill_id` | `INTEGER` | `NOT NULL REFERENCES bills(id) ON DELETE CASCADE` | Associated invoice |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Product sold |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Units sold |
| `unit_purchase_price` | `REAL` | `NOT NULL CHECK (unit_purchase_price >= 0)` | **Locked-in landed purchase cost at moment of billing** |
| `unit_selling_price` | `REAL` | `NOT NULL CHECK (unit_selling_price >= 0)` | Actual wholesale price charged |
| `line_total` | `REAL` | `NOT NULL` | Stored: `quantity * unit_selling_price` |
| `line_profit` | `REAL` | `NOT NULL` | Stored: `(unit_selling_price - unit_purchase_price) * quantity` |

---

### 3.12 `inventory_ledger` (ANTI-CORRUPTION AUDIT LOG)
**Strictly Append-Only Table.** Logs every physical stock change.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Sequence sequence number |
| `product_id` | `INTEGER` | `NOT NULL REFERENCES products(id)` | Product modified |
| `change_qty` | `INTEGER` | `NOT NULL CHECK (change_qty != 0)` | Positive (+inward) or negative (-outward) delta |
| `balance_after` | `INTEGER` | `NOT NULL CHECK (balance_after >= 0)` | Resulting stock balance |
| `transaction_type` | `TEXT` | `NOT NULL CHECK (transaction_type IN ('IMPORT', 'SALE_BILL', 'BOOKER_DISPATCH', 'BOOKER_RETURN', 'DAMAGE_ADJUSTMENT'))` | Action type |
| `reference_id` | `INTEGER` | `NOT NULL` | ID of origin document |
| `reference_type` | `TEXT` | `NOT NULL` | Document table name |
| `performed_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator who performed action |
| `notes` | `TEXT` | `NULL` | Reason / reference note |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Tamper-evident timestamp |

---

### 3.13 `booker_reconciliations`
End-of-day settlement performed at the counter when a booker returns from the field.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique reconciliation record ID |
| `reconciliation_date`| `TEXT` | `NOT NULL DEFAULT (date('now', 'localtime'))` | Settlement date |
| `order_booker_id` | `INTEGER` | `NOT NULL REFERENCES order_bookers(id)` | Booker being settled |
| `orders_count_total` | `INTEGER` | `NOT NULL DEFAULT 0` | Total orders assigned for delivery |
| `orders_count_collected` | `INTEGER` | `NOT NULL DEFAULT 0` | Delivered & billed orders |
| `orders_count_pending` | `INTEGER` | `NOT NULL DEFAULT 0` | Undelivered / pending orders |
| `total_cash_submitted` | `REAL` | `NOT NULL DEFAULT 0.0` | Physical cash deposited at counter |
| `total_credit_issued` | `REAL` | `NOT NULL DEFAULT 0.0` | Amount charged to customer Khata |
| `shortage_amount` | `REAL` | `NOT NULL DEFAULT 0.0` | Deficit between delivered goods value and deposited funds |
| `verified_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Owner / Operator verifying reconciliation |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Timestamp |

---

### 3.14 `shop_payments`
Cash recoveries deposited against a retail shop's outstanding Khata balance.

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique payment transaction ID |
| `shop_id` | `INTEGER` | `NOT NULL REFERENCES retail_shops(id)` | Shop paying balance |
| `amount` | `REAL` | `NOT NULL CHECK (amount > 0)` | Amount collected |
| `payment_date` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Payment date |
| `payment_method` | `TEXT` | `NOT NULL DEFAULT 'CASH'` | Payment mode (`CASH`, `BANK_TRANSFER`, `CHEQUE`) |
| `notes` | `TEXT` | `NULL` | Receipt remarks / deposit slip ref |
| `received_by` | `INTEGER` | `NOT NULL REFERENCES system_users(id)` | Operator receiving cash |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now', 'localtime'))` | Timestamp |

---

## 4. Stored vs. Derived Formulae

| Metric | Derivation / Formula |
| :--- | :--- |
| **Catalog Current Stock** | $\text{Initial} + \sum \text{Ledger Imports} + \sum \text{Ledger Returns} - \sum \text{Ledger Sales} - \sum \text{Ledger Dispatches} - \sum \text{Ledger Damages}$ |
| **Gross Profit per Line** | `(unit_selling_price - unit_purchase_price) * quantity` |
| **Net Bill Margin** | $\sum \text{line\_profit} - \text{discount\_amount}$ |
| **Khata Running Balance** | $\sum \text{Credit/Partial Invoices Net} - \sum \text{Cash Payments Received}$ |
| **Booker Deficit** | $\text{Expected Cash to Collect} - \text{Actual Cash Deposited}$ |

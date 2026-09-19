# Implementation Roadmap & Phases — Smart Market OS

## 1. Roadmap Architecture & Dependency Graph

Development follows a strict dependency order to guarantee that data layers, transactions, and hardware interfaces are solid before building higher-level dashboards.

```
Phase 1: Foundation & Desktop Shell (Tauri + React + Tailwind)
   │
   ▼
Phase 2: Embedded Database & Schema Migration Engine (SQLite)
   │
   ▼
Phase 3: Authentication & Role-Based Access Control (RBAC)
   │
   ▼
Phase 4: Product Master Catalog & Pricing Structure
   │
   ▼
Phase 5: Import Shipments & Inward Stock Receiving
   │
   ▼
Phase 6: Retail Shops (Customer Directory & Khata Ledgers)
   │
   ▼
Phase 7: Order Bookers & Route Management
   │
   ▼
Phase 8: Order Registration & Order Lifecycle
   │
   ▼
Phase 9: Dispatch Slip Generation & Physical Handover
   │
   ▼
Phase 10: High-Speed Billing POS & Atomic Stock Decrement Engine
   │
   ▼
Phase 11: Booker End-of-Day Settlement & Reconciliation Matrix
   │
   ▼
Phase 12: Automated Daily, 3-Day, Weekly, Monthly Profit Analytics
   │
   ▼
Phase 13: Anti-Corruption Audit Shield & Verification
   │
   ▼
Phase 14: Automated Local Backup, Hardening & Installer Packaging
```

---

## Phase 1: Foundation & Desktop Shell

- **Goal:** Initialize the desktop application container and establish the frontend build pipeline.
- **Scope:** Tauri 2.0 initialization, Vite + React 19 + TypeScript configuration, Tailwind CSS setup, and `shadcn/ui` base component library.
- **Expected Files/Modules:**
  - `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`
  - `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`
  - `src/components/ui/*` (Button, Input, Card, Dialog, Badge, Tabs)
  - `src/app/App.tsx`, `src/app/Layout.tsx`
- **Dependencies:** None.
- **Implementation Tasks:**
  1. Scaffold Tauri 2.0 app with React and TypeScript template.
  2. Configure Tailwind CSS with enterprise neutral color palette.
  3. Set up `shadcn/ui` and base components.
  4. Build persistent app shell layout (Top status bar, collapsible sidebar, main viewport).
  5. Register global navigation hotkeys (`F1`–`F8`).
- **Validation Tasks:**
  - App compiles and runs natively via `npm run tauri dev`.
  - Window frame controls (minimize, maximize, close) function as expected.
  - Hotkeys successfully switch navigation views.
- **Completion Criteria:** Standalone desktop window launches cleanly with zero console errors and sub-second startup time.

---

## Phase 2: Embedded Database & Schema Migration Engine

- **Goal:** Establish a reliable, zero-config local SQLite persistence layer with automated migrations.
- **Scope:** Database connection pooling via Tauri native plugins, schema migration scripts, SQLite pragmas enforcement (`WAL`, `foreign_keys`).
- **Expected Files/Modules:**
  - `src-tauri/src/db/mod.rs`
  - `src-tauri/src/db/migrations/001_initial_schema.sql`
  - `src/lib/db/client.ts`
  - `src/types/database.ts`
- **Dependencies:** Phase 1.
- **Implementation Tasks:**
  1. Add `tauri-plugin-sql` (with SQLite feature) to Rust dependencies.
  2. Implement database initialization hook that sets `PRAGMA journal_mode = WAL;` and `PRAGMA foreign_keys = ON;`.
  3. Create versioned SQL migration runner executing on application launch.
  4. Define complete table definitions from `datamodels.md`.
  5. Create database health check command invokable by frontend.
- **Validation Tasks:**
  - SQLite `.sqlite` file is created automatically in user's `%LOCALAPPDATA%` directory.
  - Foreign key constraints actively reject invalid inserts.
  - WAL journal mode is verified via `PRAGMA journal_mode;`.
- **Completion Criteria:** All tables, indexes, and constraints defined in `datamodels.md` exist and can be queried.

---

## Phase 3: Authentication & Role-Based Access Control (RBAC)

- **Goal:** Secure the private application and segregate sensitive cost/profit data.
- **Scope:** Local user login (PIN/Password), session store, and role differentiation (`OWNER` vs `OPERATOR`).
- **Expected Files/Modules:**
  - `src-tauri/src/commands/auth.rs`
  - `src/stores/useAuthStore.ts`
  - `src/components/modules/auth/LoginModal.tsx`
  - `src/components/shared/RoleGuard.tsx`
- **Dependencies:** Phase 2.
- **Implementation Tasks:**
  1. Create password hashing utility in Rust (Argon2 or bcrypt).
  2. Implement seed logic for initial `OWNER` administrative account.
  3. Create frontend login screen supporting quick numeric PIN or password.
  4. Enforce frontend component guards hiding purchase costs and profit tabs from `OPERATOR` role.
  5. Enforce backend command guards preventing unauthorized report queries.
- **Validation Tasks:**
  - Logging in as `OPERATOR` completely hides the Profit/Report views and purchase price inputs.
  - Logging in as `OWNER` enables all executive views and cost fields.
- **Completion Criteria:** Users can authenticate; permissions are enforced at both the UI and native command layers.

---

## Phase 4: Product Master Catalog & Pricing Structure

- **Goal:** Provide management of wholesale products, units, landed costs, and selling rates.
- **Scope:** Product CRUD, barcode/SKU indexing, low-stock threshold configurations.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/products.rs`
  - `src/components/modules/inventory/ProductList.tsx`
  - `src/components/modules/inventory/ProductFormDialog.tsx`
  - `src/hooks/useProducts.ts`
- **Dependencies:** Phase 3.
- **Implementation Tasks:**
  1. Implement Rust IPC commands: `get_products`, `create_product`, `update_product`.
  2. Build high-density TanStack Table listing all products with search and category filters.
  3. Implement product creation dialog with Zod validation (`selling_price >= purchase_price`).
  4. Add quick SKU / barcode duplicate detection.
- **Validation Tasks:**
  - Adding 1,000 mock products renders without UI lag or frame drops.
  - Attempting to set selling price lower than purchase price triggers an explicit warning.
- **Completion Criteria:** Products can be searched, created, and updated with strict price and stock validity checks.

---

## Phase 5: Import Shipments & Inward Stock Receiving

- **Goal:** Allow the business to record imported shipments and update warehouse stock with audit traceability.
- **Scope:** Bulk import entry form, purchase cost assignment, and atomic inward ledger creation.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/imports.rs`
  - `src/components/modules/inventory/ImportShipmentDialog.tsx`
  - `src/components/modules/inventory/StockOverview.tsx`
- **Dependencies:** Phase 4.
- **Implementation Tasks:**
  1. Build Import Receiving Dialog recording: Shipment #, Supplier, Product, Quantity, Unit Landed Cost.
  2. Implement atomic transaction:
     - Insert record into `product_imports`.
     - Increment `products.current_stock`.
     - Insert audit row into `inventory_ledger` with type `'IMPORT'`.
  3. Update product's master `purchase_price` if batch cost changed (optional prompt).
- **Validation Tasks:**
  - Receiving 50 boxes of an SKU immediately increments `current_stock` by 50.
  - Corresponding record appears in the inventory audit ledger.
- **Completion Criteria:** Inward goods correctly update physical inventory and generate tamper-evident audit logs.

---

## Phase 6: Retail Shops & Customer Khata (Ledgers)

- **Goal:** Manage the B2B customer directory and track outstanding credit balances.
- **Scope:** Shop records, contact details, credit limits, and running balance calculation.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/shops.rs`
  - `src/components/modules/shops/ShopDirectory.tsx`
  - `src/components/modules/shops/ShopLedgerDrawer.tsx`
- **Dependencies:** Phase 2.
- **Implementation Tasks:**
  1. Implement Rust IPC commands: `get_shops`, `create_shop`, `get_shop_ledger`.
  2. Build shop directory view with quick phone/address search and balance badge.
  3. Create Shop Ledger view listing previous invoices and payment receipts.
  4. Implement credit limit warnings for overdue retail shops.
- **Validation Tasks:**
  - Creating a shop stores contact and credit limit details.
  - Adding a credit transaction updates the shop's `outstanding_balance`.
- **Completion Criteria:** Complete directory of retail shops is queryable with live credit balance tracking.

---

## Phase 7: Order Bookers & Route Management

- **Goal:** Register field order bookers and track their operational status.
- **Scope:** Booker profiles, assigned territories, active status, and phone numbers.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/bookers.rs`
  - `src/components/modules/bookers/BookerList.tsx`
  - `src/components/modules/bookers/BookerFormDialog.tsx`
- **Dependencies:** Phase 2.
- **Implementation Tasks:**
  1. Implement CRUD commands for `order_bookers`.
  2. Build Order Booker management view showing active representatives and assigned territories.
  3. Create select dropdown component (`BookerSelector`) for use in orders and billing.
- **Validation Tasks:**
  - Booker profiles persist and can be toggled active/inactive.
- **Completion Criteria:** Order bookers are registered and ready for assignment to orders and slips.

---

## Phase 8: Order Intake & Booking Lifecycle

- **Goal:** Digitize incoming retail shop orders and track their progress from booking to fulfillment.
- **Scope:** Order entry screen, line items selection, status pipeline (`PENDING` -> `DISPATCHED` -> `BILLED` -> `CANCELLED`).
- **Expected Files/Modules:**
  - `src-tauri/src/commands/orders.rs`
  - `src/components/modules/orders/OrderIntakeForm.tsx`
  - `src/components/modules/orders/OrderPipelineTable.tsx`
- **Dependencies:** Phases 4, 6, 7.
- **Implementation Tasks:**
  1. Build Order Intake form with shop autocomplete, booker selection, and multi-product line items table.
  2. Calculate line totals and gross order amount dynamically.
  3. Save orders in `PENDING` state without deducting warehouse inventory yet.
  4. Implement pipeline view filtering orders by status and booker.
- **Validation Tasks:**
  - An order can be booked in under 30 seconds using keyboard inputs.
  - Stock is **not** deducted while an order is merely `PENDING`.
- **Completion Criteria:** Incoming orders are recorded with clean shop and booker associations.

---

## Phase 9: Dispatch Slip Generation & Physical Handover

- **Goal:** Generate formal dispatch gate-passes when bookers pull physical stock from the warehouse.
- **Scope:** Slip generation, item consolidation across assigned orders, print formatting (80mm/A4).
- **Expected Files/Modules:**
  - `src-tauri/src/commands/slips.rs`
  - `src/components/modules/slips/DispatchSlipModal.tsx`
  - `src/components/modules/slips/PrintableSlip.tsx`
- **Dependencies:** Phase 8.
- **Implementation Tasks:**
  1. Build Slip Generation workflow: Select Booker -> Consolidate all pending orders for that Booker -> Generate `dispatch_slips` record.
  2. Transition consolidated orders to `DISPATCHED` status.
  3. Generate printable slip with items, quantities, date, and signature lines.
  4. Log dispatch event in `inventory_ledger` as `'BOOKER_DISPATCH'`.
- **Validation Tasks:**
  - Generating a slip updates all included orders to `DISPATCHED`.
  - Slip print preview accurately renders on 80mm thermal and A4 paper profiles.
- **Completion Criteria:** Warehouse can hand physical stock to a booker with an authorized, signed dispatch slip.

---

## Phase 10: High-Speed Billing POS & Atomic Stock Decrement Engine

- **Goal:** Deliver the counter billing terminal that issues individual shop bills and atomically updates stock.
- **Scope:** Keyboard-first POS screen, atomic transaction (Bill + Bill Items + Stock Decrement + Ledger Insert), and receipt printing.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/billing.rs`
  - `src/components/modules/billing/BillingTerminal.tsx`
  - `src/components/modules/billing/InvoiceSummaryCard.tsx`
  - `src/components/modules/billing/PrintableInvoice.tsx`
  - `src/stores/useBillingCartStore.ts`
- **Dependencies:** Phases 4, 6, 7, 8.
- **Implementation Tasks:**
  1. Build fast POS screen with SKU search, quantity adjustments, and keyboard hotkeys (`F1`, `Enter`, `F10`).
  2. Implement atomic Rust transaction:
     ```sql
     BEGIN TRANSACTION;
     -- 1. Insert into bills
     -- 2. Insert into bill_items (snapshot unit_purchase_price)
     -- 3. Decrement products.current_stock
     -- 4. Insert into inventory_ledger (type: 'SALE_BILL')
     -- 5. Update retail_shops.outstanding_balance if credit
     COMMIT;
     ```
  3. Handle conversion of a `DISPATCHED` order into a finalized `BILL`.
  4. Integrate direct ESC/POS thermal printing and standard A4 invoice printing.
- **Validation Tasks:**
  - Generating a bill with 5 units of Product A instantly reduces `products.current_stock` by 5.
  - If a transaction attempts to sell more than available stock, transaction rolls back cleanly with an explicit error.
  - Printed invoice displays shop name, itemized lines, net payable, and previous running balance.
- **Completion Criteria:** Bills are created, stock is atomically decremented, and receipts print reliably.

---

## Phase 11: Booker End-of-Day Settlement & Reconciliation Matrix

- **Goal:** Reconcile each order booker’s daily route to eliminate cash leakage and unaccounted stock.
- **Scope:** Booker settlement sheet: Dispatched stock vs. Billed items vs. Returned items, cash collected vs. credit.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/reconciliation.rs`
  - `src/components/modules/bookers/BookerReconciliationSheet.tsx`
  - `src/components/modules/bookers/DiscrepancyAlertBanner.tsx`
- **Dependencies:** Phases 9, 10.
- **Implementation Tasks:**
  1. Build settlement interface querying booker's active dispatch slips for the day.
  2. Compute variance formula: $\text{Dispatched Qty} - (\text{Billed Qty} + \text{Returned Qty})$.
  3. Process returned unsold stock: increment warehouse inventory and record `'BOOKER_RETURN'` in `inventory_ledger`.
  4. Reconcile cash deposited at counter vs. total cash invoices.
  5. Flag shortages and record finalized `booker_reconciliations` row.
- **Validation Tasks:**
  - Returning 3 unsold boxes increments warehouse inventory back by 3.
  - Cash deficit alerts supervisor before closing booker's shift.
- **Completion Criteria:** Daily booker shifts can be closed with zero unaccounted stock or cash.

---

## Phase 12: Automated Daily, 3-Day, Weekly, Monthly Profit Analytics

- **Goal:** Replace verbal and mental profit estimates with automated, real-time COGS calculations.
- **Scope:** Time-horizon filtering (Today, 3 Days, Week, Month, Custom), Gross Profit calculation, Recharts visualizations.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/reports.rs`
  - `src/components/modules/reports/ExecutiveDashboard.tsx`
  - `src/components/modules/reports/ProfitTrendChart.tsx`
  - `src/components/modules/reports/ProductPerformanceTable.tsx`
- **Dependencies:** Phases 10, 11.
- **Implementation Tasks:**
  1. Write optimized SQLite aggregation queries for date windows:
     - Today (`date('now', 'localtime')`)
     - 3-Day Window (`date('now', '-2 days', 'localtime')`)
     - Current Week (`date('now', 'weekday 0', '-6 days')`)
     - Current Month (`strftime('%Y-%m', 'now', 'localtime')`)
  2. Calculate True Gross Profit:
     $$\text{Gross Profit} = \sum (\text{unit\_selling\_price} - \text{unit\_purchase\_price}) \times \text{qty} - \text{discounts}$$
  3. Render metric KPI cards and interactive charts using `Recharts`.
  4. Render Booker Performance Matrix (Orders Assigned vs. Collected vs. Pending).
- **Validation Tasks:**
  - Invoices generated with known purchase and selling prices produce 100% exact mathematical profit totals.
  - Switching between Today, 3-Day, Weekly, and Monthly tabs renders instantly without lag.
- **Completion Criteria:** Owner can view accurate daily and periodic net profits at a single glance.

---

## Phase 13: Anti-Corruption Audit Shield & Verification

- **Goal:** Provide complete visibility into inventory movements and prevent unauthorized tampering.
- **Scope:** Tamper-evident audit ledger viewer, discrepancy detection report, and export tools.
- **Expected Files/Modules:**
  - `src-tauri/src/commands/audit.rs`
  - `src/components/modules/audit/AuditLedgerViewer.tsx`
  - `src/components/modules/audit/DiscrepancyReport.tsx`
- **Dependencies:** Phases 5, 10, 11.
- **Implementation Tasks:**
  1. Build full-featured Audit Ledger table with product, event type, and date filters.
  2. Implement Stock Integrity Verification command: compares current stock against the calculated ledger sum:
     $$\text{Physical Stock} \stackrel{?}{=} \sum \text{Inward} - \sum \text{Outward}$$
  3. Highlight any manual stock adjustments or unusual return frequencies.
  4. Provide secure CSV export of the audit log.
- **Validation Tasks:**
  - Every single import, bill, dispatch, and return appears in the audit ledger in correct chronological order.
  - Verification tool confirms zero variance between products table and ledger sum.
- **Completion Criteria:** Business owner has an unalterable audit log of every item that entered or left the business.

---

## Phase 14: Automated Local Backup, Hardening & Packaging

- **Goal:** Protect company data against hardware failure, harden security, and produce a production installer.
- **Scope:** Automatic daily database snapshot on app close, manual backup to USB, Windows NSIS installer build.
- **Expected Files/Modules:**
  - `src-tauri/src/backup/mod.rs`
  - `src/components/modules/settings/BackupSettings.tsx`
  - `src-tauri/tauri.conf.json` (Bundle & NSIS config)
- **Dependencies:** Phases 1–13.
- **Implementation Tasks:**
  1. Implement Rust routine that creates timestamped copies of `smart_market.sqlite` into a configured backup folder.
  2. Add manual "Backup to USB / External Folder" button in settings.
  3. Add SQLite database integrity check (`PRAGMA integrity_check;`) on startup.
  4. Configure Windows NSIS installer bundling all icons, metadata, and WebView2 bootstrapper.
- **Validation Tasks:**
  - Closing the application generates a valid, non-corrupted `.sqlite` backup copy.
  - Running the generated `.exe` installer installs and runs the software on a clean Windows machine without requiring internet access.
- **Completion Criteria:** A production-ready Windows desktop installer that self-maintains and self-backs-up.

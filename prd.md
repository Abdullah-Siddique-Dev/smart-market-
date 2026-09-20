# Product Requirements Document (PRD) — Smart Market OS

## 1. Document Control & Hierarchy

### 1.1 Source of Truth Hierarchy
When evaluating requirements, architectural designs, or implementation details, the following hierarchy strictly governs:
1. **Actual Business Requirements provided by the Project Owner** (Primary: `Management system.png`)
2. **prd.md** (This document)
3. **architecture.md**
4. **datamodels.md**
5. **design.md**
6. **phases.md**
7. **memory.md**
8. **Existing Codebase Implementation**

> [!IMPORTANT]
> If any conflict is detected between documents or requests, execution must stop immediately and the conflict must be surfaced for resolution before writing code.

---

## 2. Business Overview & Problem Statement

### 2.1 The Business Model
**Smart Market OS** is a specialized, private enterprise management operating system designed for an **Import and Wholesale Distribution Business**. 

The business purchases/imports goods in bulk from manufacturers or overseas suppliers, stores them in a central warehouse/facility, and sells them as a wholesale distributor to local retail shops. Sales and deliveries are carried out via field **Order Bookers** (sales/delivery representatives) as well as direct counter sales.

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐       ┌──────────────┐
│ Import Products │ ────► │ Central Inventory│ ────► │  Order Bookers  │ ────► │ Retail Shops │
│ (Bulk Inward)   │       │ (Warehouse)      │       │ (Field Sales)   │       │ (B2B Buyers) │
└─────────────────┘       └──────────────────┘       └─────────────────┘       └──────────────┘
```

### 2.2 Current Workflow ("Present Business")
Based directly on the documented business reality (`Management system.png`):
1. **Imports Products:** The business imports and stocks inventory items.
2. **Wholesale Operations:** Goods are sold in wholesale volumes to retail shops.
3. **Order Booker Field Cycle:** Order bookers take customer orders, physically pull products from inventory/warehouse, and distribute them to retail shops.
4. **Owner Blind Spots & Confusion:** The business owner has no reliable visibility into how much stock has actually been sold versus what is currently left in the warehouse or in transit.
5. **Verbal / Mental Profit Calculation:** The owner estimates profit verbally/mentally without accurate Cost of Goods Sold (COGS) tracking, expense deduction, or real-time margin visibility.
6. **Vulnerability to Corruption / Leakage:** Without systemic checks, inventory leakage, unauthorized discounts, unaccounted stock shrinkage, and cash collection discrepancies occur.
7. **Manual Disjointed Billing:** Separate bills must be created manually for each retail shop, leading to billing bottlenecks, pricing mistakes, and delayed customer reconciliations.

### 2.3 Proposed System Solution
**Smart Market OS** is an offline-first, private desktop operating system running on-premises inside the company. It digitizes the entire lifecycle from order booking to dispatch, billing, stock deduction, payment tracking, and net profit reporting while establishing an immutable anti-corruption audit trail.

---

## 3. Main Users & System Roles

| Role | Primary Responsibilities | System Access |
| :--- | :--- | :--- |
| **Business Owner / Administrator** | Oversees all operations, views financial analytics, tracks daily/weekly/monthly net profits, audits stock, monitors booker reconciliations, sets product purchase costs. | Full access to all modules, financial reports, margins, audit logs, and system settings. |
| **Billing & Counter Operator** | Enters incoming orders, generates dispatch slips for order bookers, creates finalized retail shop bills, receives payment records. | Access to Order Entry, Slip Generation, Billing POS, Shop Ledgers, and basic inventory lookup. Hidden cost/profit margins. |
| **Warehouse / Inventory Custodian** | Records stock imports, confirms goods handed over against dispatch slips, inspects returned goods from bookers. | Access to Stock Inward (Import entry), Dispatch Slip verification, and Stock Adjustments. |
| **Order Booker (Field Representative)** | Books retail orders in the market, collects dispatch slips with stock, delivers to shops, collects cash/credit, reconciles end-of-day. | Does not directly operate the desktop system. Managed as an entity within the system with assigned slips, pending orders, and cash balances. |

---

## 4. Detailed Functional Requirements

Every requirement below is directly traceable to the provided business requirements (`Management system.png`):

### 4.1 Order Management
- **REQ-ORD-01 (Order Registration):** The system shall allow operators to register incoming orders with shop name, date, order booker assigned, products, quantities, and agreed wholesale unit prices.
- **REQ-ORD-02 (Order Status Lifecycle):** Orders must track clear statuses:
  - `PENDING`: Order recorded, awaiting slip generation/packing.
  - `DISPATCHED`: Stock packed and handed over to order booker with a dispatch slip.
  - `BILLED`: Delivered to retail shop and invoice generated.
  - `CANCELLED`: Order cancelled before dispatch (no stock deducted).
- **REQ-ORD-03 (Order Booker Assignment):** Each order must be explicitly tied to the responsible Order Booker.

### 4.2 Slip Generation & Assignment
- **REQ-SLP-01 (Dispatch Slip Generation):** When goods are physically handed over to an order booker, the system shall generate a formal **Dispatch Slip** (Pick/Delivery Slip).
- **REQ-SLP-02 (Booker Stock Binding):** The dispatch slip must clearly list the booker's name, timestamp, retail destination shops, itemized products, and dispatched quantities.
- **REQ-SLP-03 (Digital Slip Generation & Preview):** Dispatch slips must be generated and rendered digitally on-screen with full itemization and authorization sections (physical hardware printing is temporarily excluded).
- **REQ-SLP-04 (Slip Verification):** Dispatched quantities remain legally bound to the order booker until the final bill is issued or unsold stock is formally returned to the warehouse.

### 4.3 Billing & Retail Shop Invoicing
- **REQ-BIL-01 (Separate Bills per Shop):** The system shall generate distinct, serialized, professional bills/invoices for each individual retail shop.
- **REQ-BIL-02 (Itemized Billing):** Each bill must contain: Invoice number, Date, Shop details, Booker name, Line items (Product name, Quantity, Rate, Total), Gross Total, Discount (if any), Net Payable, and Payment Mode (Cash, Credit/Khata).
- **REQ-BIL-03 (Fast Keyboard Entry):** The billing screen must be keyboard-first (shortcuts for search, quantity entry, and save) to enable rapid counter checkout.
- **REQ-BIL-04 (Shop Ledger / Outstanding Balance):** Invoices on credit must update the retail shop’s running balance (Khata) and display the previous unpaid balance on the digital invoice view.

### 4.4 Real-Time Atomic Stock Reduction
- **REQ-STK-01 (Atomic Stock Decrement):** The system must automatically and atomically decrement warehouse stock the moment a bill is generated.
- **REQ-STK-02 (Transactional Integrity):** Bill creation and stock reduction must occur within a single database transaction (`ACID`). If stock is insufficient or bill creation fails, the transaction must roll back entirely.
- **REQ-STK-03 (Overselling Prevention):** The system shall block or require authorized override if a bill or dispatch slip attempts to deduct more stock than is physically available in the warehouse.
- **REQ-STK-04 (Real-time Stock Count):** Current stock levels for all imported products must be visible instantly across the application without manual refresh.

### 4.5 Product & Import Inventory Management
- **REQ-INV-01 (Product Catalog):** Store product name, SKU/barcode, category, unit of measure (box, carton, pieces), current purchase cost (landed import cost), and standard wholesale selling price.
- **REQ-INV-02 (Import Stock Inward):** System shall record incoming shipments/imports: supplier details, arrival date, quantities received, and unit purchase cost.
- **REQ-INV-03 (Cost Tracking):** Maintain accurate purchase prices to enable exact Cost of Goods Sold (COGS) calculations.

### 4.6 Order Booker Tracking & Reconciliation
- **REQ-BKR-01 (Collected vs. Pending Tracking):** The system must track each order booker's real-time metrics:
  - Total orders assigned
  - Total orders delivered and collected
  - Total orders pending delivery
  - Total cash collected vs. outstanding retail credit
- **REQ-BKR-02 (End-of-Day Booker Reconciliation):** The system shall provide a reconciliation interface where:
  - `Stock Taken` must equal `Stock Billed + Stock Returned to Warehouse`.
  - `Cash Collected` must match total cash bills minus authorized expenses.
  - Any variance must be flagged as a booker shortage/discrepancy.

### 4.7 Automated Daily Profit & Sales Calculation
- **REQ-PRF-01 (Automated Profit Formula):** Profit must be computed automatically from system data, eliminating verbal estimation:
  $$\text{Line Profit} = (\text{Selling Price} - \text{Unit Purchase Cost}) \times \text{Quantity}$$
  $$\text{Net Gross Profit} = \sum \text{Line Profits} - \text{Authorized Discounts}$$
- **REQ-PRF-02 (Daily Profit Calculation):** Operators/Owners can view exact daily profit calculated across all bills generated on that day.
- **REQ-PRF-03 (Security of Profit Data):** Profit margins and unit purchase costs must only be viewable by the `OWNER` role, hidden completely from operators and bookers.

### 4.8 Sales & Business Reporting
- **REQ-REP-01 (Temporal Aggregations):** The system shall provide sales and profit reporting across predefined and custom business time horizons:
  - **Today (Last Day / Daily):** Current day's performance.
  - **3-Day Window:** Rolling 3-day short-term cycle.
  - **Weekly:** Current week and previous 7 days.
  - **Monthly:** Current calendar month and previous 30 days.
  - **Custom Date Range:** Configurable start and end dates.
- **REQ-REP-02 (Total Sales Metrics):** Provide total sales revenue, total volume of items sold, total discounts given, and total cash vs. credit split.
- **REQ-REP-03 (Product Performance):** Display top-selling products by quantity and by generated profit.

### 4.9 Anti-Corruption & Audit Shield
- **REQ-AUD-01 (Immutable Stock Ledger):** Every single change to inventory (Import, Dispatch, Bill Sale, Return, Damage Adjustment) must be written to an append-only audit ledger with:
  - Exact timestamp
  - Product ID & change quantity (+/-)
  - Resulting balance after transaction
  - Source document reference (Bill #, Slip #, Import #)
  - User ID who performed the action
- **REQ-AUD-02 (No Silent Stock Edits):** Manual stock adjustments (e.g. damages, shrinkage) must require mandatory justification notes and `OWNER` approval.
- **REQ-AUD-03 (Bill Tampering Prevention):** Once a bill is finalized, it cannot be deleted. Any correction must occur via a recorded Credit Note / Return Slip with an audit entry.

### 4.10 Data Navigation & Pagination
- **REQ-PAG-01 (Server-Side Pagination):** All data listing interfaces (Products, Orders, Bills, Retail Shops, and Audit Ledger) must implement server-side pagination with configurable page sizes (25, 50, 100) to ensure high rendering speed and prevent memory overload.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Deployment & Infrastructure
- **NFR-DEP-01 (Zero Hosting / Zero VPS):** The system must operate 100% locally on the company's hardware. No cloud hosting, no virtual private servers (VPS), and no external server bills are required.
- **NFR-DEP-02 (Offline-First):** Complete core operations (billing, stock updates, slip generation, reporting) must function without any internet connection.

### 5.2 Security & Authentication
- **NFR-SEC-01 (Passport.js & Cookie Security):** Authentication is managed via Passport.js (Local Strategy) with HTTP-only, secure session cookies handled via `cookie-parser`.
- **NFR-SEC-02 (CORS Protection):** Cross-Origin Resource Sharing (`cors`) is strictly configured to permit only trusted local application origins (`tauri://localhost`, local dev host).

### 5.2 Performance & Speed
- **NFR-PERF-01 (Instant Billing):** Search and product selection during billing must return results in under 50ms for product catalogs up to 10,000 SKUs.
- **NFR-PERF-02 (Transaction Speed):** Saving a bill, updating stock, and generating the print preview must complete in under 300ms.
- **NFR-PERF-03 (Lightweight Footprint):** Idle RAM usage must remain under 100MB on standard Windows office computers.

### 5.3 Reliability & Data Integrity
- **NFR-REL-01 (ACID Compliance):** All financial and stock transactions must satisfy strict Atomicity, Consistency, Isolation, and Durability.
- **NFR-REL-02 (Crash Recovery):** In the event of a sudden power outage during billing, the database must recover without data corruption upon restart (Write-Ahead Logging mode).
- **NFR-REL-03 (Automated Local Backup):** The system must offer an automated or single-click database backup mechanism to copy the local database file to a secondary folder or USB drive.

### 5.4 Usability & Hardware Integration
- **NFR-USE-01 (Keyboard Driven):** Standard counter billing must be achievable 100% via keyboard shortcuts without needing a mouse.
- **NFR-USE-02 (Hardware Printing Status):** Physical printer integration (ESC/POS thermal & A4 drivers) is **temporarily excluded / deferred**. Slips and bills are rendered and previewed digitally on-screen.

---

## 6. Scope Definition

### 6.1 In-Scope
- Product catalog and landed purchase cost management.
- Import inventory receiving (stock inwards).
- Order entry and booker assignment.
- Dispatch slip generation and digital on-screen preview.
- Retail shop profile management and shop-specific invoicing.
- Atomic stock reduction on invoice issuance.
- Order Booker performance and daily order reconciliation (collected vs pending).
- Automated daily, 3-day, weekly, and monthly profit and sales reporting.
- Immutable anti-corruption inventory audit trail.
- Role-based UI access (Owner vs Billing Operator).
- Standalone Windows desktop installer with embedded local database.

### 6.2 Explicitly Out-of-Scope
*(Preventing feature creep and keeping the system focused on the core wholesale business)*
- Physical hardware printer drivers and direct ESC/POS thermal printing integration (temporarily excluded for the time being; digital slips & bills only).
- Customer-facing public e-commerce portal or website.
- Online credit card / payment gateway processing (operations are physical cash, bank deposit, or Khata credit).
- Multi-currency forex trading calculations (all transactions recorded in local base currency).
- Complex multi-tiered manufacturing BOM (Bill of Materials) — this is an import/distribution business, not raw material assembly.
- Cloud-synced mobile apps for order bookers (orders are registered at the counter/dispatch desk via slips for Phase 1).

---

## 7. Acceptance Criteria (Traceability Matrix)

| Ref ID | Requirement Source (`Management system.png`) | Verification & Acceptance Criteria |
| :--- | :--- | :--- |
| **AC-01** | *Imports products you have* | Able to create product records and record batch imports with quantities and unit purchase costs. |
| **AC-02** | *Order comes and we register it in our system* | Operator can quickly register an order with customer shop, product list, and assigned booker. |
| **AC-03** | *Slip generation and assign to seller* | Generating an order generates a printable dispatch slip with assigned booker details and item quantities. |
| **AC-04** | *Making separate bills for each shop* | System prints individual, serialized bills for each retail shop with line items and running balance. |
| **AC-05** | *Stock is reducing each time bill is generating* | Verifiable database test: Stock count immediately decrements by exact invoice quantities upon bill generation. |
| **AC-06** | *Anti corruption features to know how much stock sell and how much left* | Full audit ledger lists every addition/deduction with timestamp and user ID; physical warehouse count matches system balance. |
| **AC-07** | *Order booker how much order collected & pending* | Booker report clearly displays count and value of: Assigned vs. Delivered/Collected vs. Pending orders. |
| **AC-08** | *Daily calculate profit by entering product qty & price* | Dashboard displays gross profit computed from `(Selling Price - Purchase Cost) * Qty` for any selected day. |
| **AC-09** | *Monthly, weekly, last day, 3 day analytics* | Reporting screen displays accurate aggregated sales and profit numbers filtered by Today, 3-Day, Weekly, and Monthly tabs. |

# UI/UX Design Specification — Smart Market OS

## 1. Design Principles & Philosophy

The user interface of **Smart Market OS** is built for a fast-paced wholesale commercial environment. Counter clerks and business owners cannot afford sluggish web animations or fiddly mouse-based interactions.

### Core Principles
1. **Utility & Speed over Decoration:** Minimalist, high-density layouts optimized for quick visual scanning. No distracting particle effects, floating blobs, or unnecessary transition delays.
2. **Keyboard-First Ergonomics:** 100% of core repetitive workflows (adding items to an invoice, looking up stock, printing slips) must be executable via keyboard shortcuts.
3. **Information Density with Clarity:** High-contrast data tables displaying comprehensive item information (SKU, Name, Unit, Stock, Price) without horizontal scrolling on standard office screens.
4. **Defensive Interaction Design:** Critical financial and stock-altering operations (issuing credit, adjusting stock, reconciling booker shortages) require explicit confirmation and visual signposting.

---

## 2. Global Application Shell & Layout

The desktop shell utilizes a standard enterprise workspace architecture:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] Smart Market OS   │ Shift: Active │ DB: OK (Local) │ Auto-Backup: Saved  │
├──────────────┬───────────────────────────────────────────────────────────────────┤
│ [F1] Billing │  Active Module / Breadcrumb                                       │
│ [F2] Orders  ├───────────────────────────────────────────────────────────────────┤
│ [F3] Slips   │                                                                   │
│ [F4] Stock   │                                                                   │
│ [F5] Bookers │                      MAIN WORKSPACE VIEWPORT                      │
│ [F6] Shops   │                   (High-Density Content Area)                     │
│ [F7] Reports │                                                                   │
│ [F8] Audit   │                                                                   │
├──────────────┤                                                                   │
│ [Ctrl+B]     │                                                                   │
│ Collapse Nav │                                                                   │
└──────────────┴───────────────────────────────────────────────────────────────────┘
```

### 2.1 Top System Status Bar
A persistent 36px header displaying mission-critical system health:
- **System Indicator:** App Name & Version.
- **Database Status Indicator:** Green badge `Local SQLite: Connected` (shows WAL activity).
- **Current Operator Badge:** Displays logged-in user name and role (`OWNER` or `OPERATOR`).
- **Backup Status:** Displays last successful timestamp (e.g. `Backup: Today 08:30 AM`).
- **System Clock:** Live date and time for billing reference.

### 2.2 Left Navigation Sidebar
Collapsible navigation menu with clear keyboard shortcuts mapped directly to function keys:
- **[F1] Billing POS:** Fast invoice creation and shop billing terminal.
- **[F2] Orders:** Incoming order registration and status tracking.
- **[F3] Dispatch Slips:** Booker dispatch gate-passes and delivery assignments.
- **[F4] Inventory & Imports:** Stock catalog, bulk inward shipments, and stock balances.
- **[F5] Order Bookers:** Booker performance matrix, collection tracking, and reconciliation.
- **[F6] Retail Shops:** Shop directory, customer ledgers (Khata), and credit balances.
- **[F7] Profit & Sales Reports:** Daily, 3-day, weekly, and monthly financial analytics.
- **[F8] Audit Ledger:** Anti-corruption immutable stock event viewer.

---

## 3. High-Speed Billing POS Interface ([F1])

The billing interface is the heartbeat of the wholesale counter. It uses a **Two-Pane Split Layout**:

```
┌────────────────────────────────────────────────────────┬─────────────────────────┐
│ SEARCH PRODUCT: [ SKU / Barcode / Name (Enter) ]       │ INVOICE SUMMARY         │
├────────────────────────────────────────────────────────┼─────────────────────────┤
│ # │ SKU   │ Product Name │ Qty │ Unit │ Rate │ Total   │ Shop: [ Select Shop ▼ ] │
├───┼───────┼──────────────┼─────┼──────┼──────┼─────────┤ Booker: [ Farhan ▼ ]    │
│ 1 │ P-102 │ Energy Drink │ 10  │ Box  │ $120 │ $1,200  │ Date: 2026-09-19        │
│ 2 │ P-205 │ Wafer Bisco  │ 25  │ Ctn  │ $45  │ $1,125  ├─────────────────────────┤
│   │       │              │     │      │      │         │ Subtotal:     $2,325.00 │
│   │       │              │     │      │      │         │ Discount:     $   25.00 │
│   │       │              │     │      │      │         │ Net Amount:   $2,300.00 │
│   │       │              │     │      │      │         ├─────────────────────────┤
│   │       │              │     │      │      │         │ Paid:         $2,300.00 │
│   │       │              │     │      │      │         │ Mode: [ CASH / CREDIT ] │
├───┴───────┴──────────────┴─────┴──────┴──────┴─────────┼─────────────────────────┤
│ [Ctrl+N] New Line  │ [Del] Remove  │ [Ctrl+S] Save     │ [F10] Save & Print Slip │
└────────────────────────────────────────────────────────┴─────────────────────────┘
```

### Keyboard Shortcuts in POS Mode:
- `F1`: Reset / New Invoice.
- `F2`: Focus Search Box (instant barcode scanner or type-ahead SKU matching).
- `Down/Up Arrow`: Traverse suggested product dropdown.
- `Enter`: Add selected product to line items and jump focus to Quantity field.
- `Tab`: Jump from Quantity to Custom Wholesale Rate (if permitted).
- `Ctrl + P` or `F10`: Atomic Save & Direct Print (triggers ESC/POS thermal or A4).
- `Esc`: Cancel line edit or close modal.

---

## 4. Executive Profit & Analytics Dashboard ([F7])

The owner’s dashboard translates complex accounting into instantaneous business clarity:

### 4.1 Temporal Horizon Selector
A prominent segmented tab bar at the top of the reporting view:
- **[ Today ]** (Last 24 Hours / Daily Performance)
- **[ 3 Days ]** (Short-term 72-hour operating cycle)
- **[ This Week ]** (Rolling 7-day performance)
- **[ This Month ]** (Current 30-day billing cycle)
- **[ Custom Range ]** (Date Range Picker with quick-presets)

### 4.2 KPI Metric Cards Grid
Four high-impact metric cards updating in real time:
1. **Total Wholesale Sales:** Aggregate revenue generated across completed bills.
2. **Calculated Net Gross Profit:** Computed automatically from:
   $$\sum (\text{Selling Price} - \text{Unit Purchase Cost}) \times \text{Qty} - \text{Discounts}$$
3. **Orders Delivered vs. Pending:** Circular progress indicator displaying fulfillment ratio.
4. **Cash In Hand vs. Credit Balance:** Liquid cash collections vs. outstanding retail receivables.

### 4.3 Interactive Visualizations
- **Sales & Profit Trend Line Chart:** Double-line graph comparing daily revenue against true gross profit.
- **Top 5 Fast-Moving Wholesale Products:** Bar chart highlighting volume and profitability.
- **Booker Collection Leaderboard:** Bar comparison of cash deposited vs. pending credit.

---

## 5. Order Booker & Dispatch Slip Interfaces ([F2], [F3], [F5])

### 5.1 Order Registration Screen ([F2])
- **Quick Order Intake:** Record customer shop, phone, destination area, product line items, and assigned Booker.
- **Status Badges:**
  - `PENDING` (Amber badge): Registered at desk, stock not yet dispatched.
  - `DISPATCHED` (Blue badge): Dispatched with booker on a signed slip.
  - `BILLED` (Green badge): Fulfilled, shop bill generated, stock deducted.
  - `CANCELLED` (Red badge): Voided before dispatch.

### 5.2 Dispatch Slip Generation & Preview ([F3])
- Formats goods exit authorization.
- Generates slip # with date, booker name, vehicle/route, and table of physical items handed over.
- **Physical Handover Signature Block:** Clear printed lines for *Warehouse Custodian Signature* and *Booker Acceptance Signature*.

### 5.3 Booker Reconciliation Matrix ([F5])
An interactive end-of-day settlement sheet:
- **Dispatched Stock Column** vs. **Billed Quantity** vs. **Returned Quantity**.
- The system flags any non-zero difference:
  $$\text{Discrepancy} = \text{Dispatched} - (\text{Billed} + \text{Returned})$$
- Shortages trigger a highlighted alert requiring supervisor sign-off before the booker's session is cleared.

---

## 6. Anti-Corruption & Audit Ledger Viewer ([F8])

A tamper-evident, read-only interface displaying the physical movement of all inventory:

| Timestamp | Product SKU & Name | Movement | Reason / Event Type | Reference Document | Performed By | Balance After |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-09-19 09:15` | `P-102 Energy Drink` | <span style="color:red">-10 Box</span> | `SALE_BILL` | `INV-2026-0042` | Operator1 | `85 Box` |
| `2026-09-19 08:30` | `P-102 Energy Drink` | <span style="color:green">+50 Box</span> | `IMPORT` | `IMP-2026-003` | Admin (Owner)| `95 Box` |
| `2026-09-18 17:45` | `P-205 Wafer Bisco` | <span style="color:green">+3 Ctn</span> | `BOOKER_RETURN` | `SLP-2026-0012` | Operator1 | `48 Ctn` |

- **Security Constraint:** No edit or delete buttons exist on this page.
- **Export Facility:** One-click CSV/Excel export for external accountant review.

---

## 7. Reusable UI Components & Tokens

### 7.1 Typography & Color Tokens
- **Font Stack:** Inter / Segoe UI (system native font for zero latency).
- **Surface Colors:**
  - Background: Neutral Slate 50 (`#F8FAFC`) / Dark Mode: Zinc 950 (`#09090B`)
  - Panels & Cards: Pure White (`#FFFFFF`) / Dark Mode: Zinc 900 (`#18181B`)
  - Borders: Slate 200 (`#E2E8F0`) / Dark Mode: Zinc 800 (`#27272A`)
- **Semantic Colors:**
  - Primary / Brand: Indigo 600 (`#4F46E5`)
  - Success / Paid / Inward: Emerald 600 (`#059669`)
  - Warning / Pending: Amber 500 (`#F59E0B`)
  - Destructive / Deficit / Outward: Rose 600 (`#E11D48`)

### 7.2 Tables & Data Grids
- Virtualized rows for lists exceeding 100 items.
- Alternating subtle row zebra striping.
- Sticky table headers with ascending/descending sort indicators.
- In-place quick filter input located immediately above table header.

### 7.3 Forms & Inputs
- Monospace font for numerical values (prices, quantities, barcodes, invoice totals) to guarantee vertical alignment.
- Auto-selection on focus: Entering an input field automatically selects existing text for immediate overtyping.
- Explicit inline error labels (e.g. `Quantity exceeds warehouse stock (Available: 14)`).

---

## 8. Print Templates (Hardware Formatting)

### 8.1 80mm / 58mm Thermal Print Layout (ESC/POS)
```
========================================
           SMART MARKET WHOLESALE       
      Market Road, Commercial Zone 1    
            Ph: +1-234-567-8900         
========================================
Invoice #: INV-2026-0042
Date: 19-Sep-2026 09:15 AM
Shop: City Mart (Shop #14)
Booker: Farhan (Route 3)
----------------------------------------
Item              Qty   Rate     Total
----------------------------------------
Energy Drink       10   $120   $1,200.00
Wafer Bisco        25    $45   $1,125.00
----------------------------------------
Subtotal:                      $2,325.00
Discount:                         $25.00
NET PAYABLE:                   $2,300.00
Paid (Cash):                   $2,300.00
----------------------------------------
Previous Balance:                $450.00
Current Total Due:               $450.00
========================================
      Thank you for your business!      
```

### 8.2 A4 Standard Commercial Wholesale Invoice
- Standard 2-column formal header with Company Details on left, Retail Shop Details & Invoice Metadata on right.
- Detailed tabular breakdown with unit descriptions, itemized discount columns, and bank account transfer details.
- Dual signature authorizations: *Prepared By* and *Customer Shop Receiver Signature*.

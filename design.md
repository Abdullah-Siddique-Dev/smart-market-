# UI/UX Design Specification — Smart Market OS
## Unified Single-Dashboard Wholesale Management System

---

## 1. Design Principles & Philosophy

The user interface of **Smart Market OS** is built for a high-volume, offline wholesale commercial environment. The entire system is consolidated into a **single, unified desktop dashboard** for the business owner and counter operator.

### Core Principles
1. **Single-Desk Centralization:** All wholesale activities—taking orders received via WhatsApp or in person, issuing warehouse dispatch passes, rapid POS counter billing, managing customer Khata balances, and settling booker collections—occur within **one unified interface**. There are no separate external portals or field apps.
2. **Keyboard-First Ergonomics:** 100% of repetitive counter workflows are mapped directly to physical function keys (`F1` through `F8`) with tactile `<kbd>` styling.
3. **High-Contrast Layered Canvas:** Slate-50 background canvas with elevated pure white cards, crisp border dividers, and high legibility typography (`Plus Jakarta Sans` for UI text, `JetBrains Mono` for currency, SKUs, and quantities).
4. **Fast Manual Order Intake:** Specialized order entry form optimized for transcribing orders received via WhatsApp messages, voice notes, or handwritten paper slips brought in by bookers.
5. **Defensive Financial Signposting:** Clear visual alerts for over-limit customer Khata balances and booker cash reconciliation shortages.

---

## 2. Global Application Shell & Layout

The desktop shell utilizes an enterprise single-console workspace:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] Smart Market OS   │ Local SQLite WAL: Active │ Mode: Counter POS │ User: Owner (Admin)    │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────┤
│ [F1] Billing │  Active Module Viewport                                                           │
│ [F2] Orders  ├───────────────────────────────────────────────────────────────────────────────────┤
│ [F3] Slips   │                                                                                   │
│ [F4] Stock   │                      CENTRAL WORKSPACE CONTENT AREA                               │
│ [F5] Bookers │                (High-Density Metric Strips & Data Grids)                          │
│ [F6] Shops   │                                                                                   │
│ [F7] Reports │                                                                                   │
│ [F8] Audit   │                                                                                   │
│ [Settings]   │                                                                                   │
├──────────────┤                                                                                   │
│ [Ctrl+B]     │                                                                                   │
│ Collapse Nav │                                                                                   │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Top System Status Bar
- **Brand & POS Mode:** Smart Market OS logo with active mode tag.
- **Database Status Indicator:** Pulsing green badge `SQLite WAL Active`.
- **User Profile Pill:** User avatar circle with name and role tag (`OWNER`).
- **Live Clock:** Real-time clock for timestamping counter bills.

### 2.2 Left Navigation Sidebar
Collapsible navigation sidebar with tactile `<kbd>` keycaps:
- **`[F1]` Counter POS Billing:** Rapid wholesale invoice creation, instant SKU search, and cash settlement.
- **`[F2]` Pre-Booking Orders:** Manual intake from WhatsApp and in-person booker visits; 1-click bill conversion.
- **`[F3]` Dispatch Slips:** Warehouse gate-passes for goods released to order bookers.
- **`[F4]` Inventory & Imports:** Central catalog, stock levels, and inward container receiving.
- **`[F5]` Order Bookers:** Field agent directory, commission tracking, and daily cash reconciliation.
- **`[F6]` Retail Customers:** Customer shop directory, credit limits, and running Khata balances.
- **`[F7]` Executive Profit Analytics:** Landed COGS profitability, daily revenue, and trend charts.
- **`[F8]` Immutable Audit Ledger:** Cryptographic physical stock audit log and integrity checker.

---

## 3. High-Speed Counter POS Billing (`[F1]`)

Two-pane split terminal optimized for sub-second billing:

```
┌────────────────────────────────────────────────────────┬─────────────────────────┐
│ SEARCH PRODUCT: [ SKU / Product Name (F2) ]            │ INVOICE SUMMARY         │
├────────────────────────────────────────────────────────┼─────────────────────────┤
│ # │ SKU   │ Product Name │ Qty │ Unit │ Rate │ Total   │ Shop: [ Select Shop ▼ ] │
│───┼───────┼──────────────┼─────┼──────┼──────┼─────────┤ Booker: [ Optional ▼ ]  │
│ 1 │ P-102 │ Energy Drink │ 10  │ Box  │ $120 │ $1,200  │ Date: Today             │
│ 2 │ P-205 │ Wafer Bisco  │ 25  │ Ctn  │ $45  │ $1,125  ├─────────────────────────┤
│   │       │              │     │      │      │         │ Subtotal:     $2,325.00 │
│   │       │              │     │      │      │         │ Discount: [ 2% 5% 10% ] │
│   │       │              │     │      │      │         ├─────────────────────────┤
│   │       │              │     │      │      │         │ NET PAYABLE:  $2,300.00 │
│   │       │              │     │      │      │         │ [ Charge Bill (F1) ]    │
├───┴───────┴──────────────┴─────┴──────┴──────┴─────────┼─────────────────────────┤
│ Empty Cart: Quick-Add Popular Wholesale Products Grid  │ Mode: [ Full Cash / Cr] │
└────────────────────────────────────────────────────────┴─────────────────────────┘
```

- **Quick-Add Catalog:** The empty cart displays 1-click quick-add wholesale tiles so cashiers never face a blank void.
- **High-Speed SKU Search & Hotkeys:** Instant search dropdown with F2 hotkey and quick arrow selection.
- **Settlement Panel:** Bold Net Payable card with instant discount presets (2%, 5%, 10%) and glowing green settlement button.

---

## 4. Manual Order Intake Interface (`[F2]`)

Specialized for entering orders sent by field bookers via **WhatsApp** or brought in **in person**:

### 4.1 Order Intake Workflow
1. **Intake Source Selector:**
   - `WhatsApp Message` (Default)
   - `In-Person Booker Visit`
   - `Direct Phone Order`
   - `Direct Counter Walk-in`
2. **Customer & Attribution:**
   - Fast type-ahead selection of target Retail Shop.
   - Optional selection of attributed Order Booker (or Direct).
3. **Item Entry Grid:**
   - Fast SKU/name lookup with instant keyboard focus on quantity.
   - Shows live warehouse stock so operator can immediately see if goods are in stock.
4. **WhatsApp Reference Notes:**
   - Multiline notes field to paste WhatsApp message snippets, voice note transcriptions, or physical slip numbers.
5. **Actions:**
   - **Save Wholesale Order:** Saves as `PENDING` for warehouse picking.
   - **Convert to Bill (`[F1]`):** 1-click loads order into POS cart for immediate checkout.

---

## 5. Booker Dispatch & End-of-Day Reconciliation (`[F3]`, `[F5]`)

### 5.1 Warehouse Dispatch Gate Pass (`[F3]`)
- Generates custody transfer gate pass when goods are handed to a booker for field delivery.
- Shows total dispatched quantities per SKU.

### 5.2 End-of-Day Cash & Stock Settlement (`[F5]`)
- When the booker returns to the warehouse in the evening:
  1. Operator enters returned unsold goods (automatically restocked to warehouse inventory).
  2. System calculates exact cash expected:
     $$\text{Expected Cash} = \text{Dispatched Goods Value} - \text{Returned Stock Value} - \text{Authorized Credit to Khata}$$
  3. Operator enters physical cash deposited. Any deficit is flagged as a `shortage_amount`.

---

## 6. Digital Invoices & Exclusion of Physical Printing

Per system specifications:
- Direct physical printer drivers and browser print dialogs are **excluded**.
- Invoices and dispatch gate passes are rendered on-screen as high-fidelity digital slips.
- 1-click **"Copy Invoice Details"** copies a clean text summary to clipboard for sending back to the customer or booker via WhatsApp.

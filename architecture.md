# System Architecture Document — Smart Market OS
## Unified Single-Desk Wholesale Management System

---

## 1. Executive Summary & Architectural Goals

**Smart Market OS** is an **Offline-First, Single-Desk Enterprise Management System** purpose-built for wholesale import and distribution businesses. It operates completely on-premises without requiring cloud hosting, external database clusters, or recurring subscription fees.

### Core Architectural Decisions & Clarifications
1. **Single Unified Dashboard (No "Double Sides"):** 
   The application is designed entirely around a **single authoritative desk** operated by the wholesale owner or counter clerk. There is **no Order Booker Portal**, no separate booker app, and no customer portal.
2. **Manual Field Order Intake (WhatsApp / In-Person):**
   Field order bookers operate offline in the market with notepads or messaging apps. They convey customer orders to the wholesale counter either:
   - by sending details via **WhatsApp** (text lists, voice notes, photos of physical order slips), or
   - by **physically visiting** the wholesale desk.
   The counter operator manually records these orders into the central system with full attribution to the shop and booker.
3. **Atomic Financial & Stock Integrity:**
   Generating an invoice atomically reduces warehouse stock, locks in historical landed cost, updates customer Khata, and writes to an append-only audit ledger in a single SQLite transaction.
4. **Append-Only Anti-Corruption Ledger:**
   Every physical stock movement is immutably logged with timestamp, user ID, delta, and balance after.
5. **Zero Cloud / Strictly Offline-Capable:**
   100% operational during telecom or internet outages.

---

## 2. System Topology & Information Flow

```
   ┌────────────────────────────────────────────────────────┐
   │                  FIELD SALES AGENTS                    │
   │  • Order Bookers visit retail shops                    │
   │  • Take orders on physical paper slips                 │
   │  • Send details via WhatsApp / In-Person visits        │
   └───────────────────────────┬────────────────────────────┘
                               │
            WhatsApp Messages / Voice Notes / Paper Slips
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             WHOLESALE COUNTER / OFFICE DESK            │
   │        (Single Unified Smart Market OS Console)        │
   │                                                        │
   │   ┌────────────────────────────────────────────────┐   │
   │   │             Owner / Operator Actions           │   │
   │   │  1. Manual Order Intake (WhatsApp / In-Person) │   │
   │   │  2. Issue Warehouse Dispatch Gate Passes (F3)  │   │
   │   │  3. High-Speed Counter POS Billing (F1)        │   │
   │   │  4. Customer Khata Balance Recovery (F6)       │   │
   │   │  5. End-of-Day Booker Cash Reconciliation (F5) │   │
   │   │  6. Inward Container Stock Receiving (F4)      │   │
   │   │  7. Executive Landed-Cost Profit Reports (F7)  │   │
   │   │  8. Physical Stock Audit Verification (F8)     │   │
   │   └────────────────────────────────────────────────┘   │
   └───────────────────────────┬────────────────────────────┘
                               │ Direct IPC / Localhost API
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │              LOCAL PERSISTENCE & DATA LAYER            │
   │  • SQLite 3 Engine in Write-Ahead Logging (WAL) Mode   │
   │  • PRAGMA foreign_keys = ON                            │
   │  • Automated Daily Database Snapshot Backups           │
   │  • Fully offline, local directory storage              │
   └────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Presentation Layer (Frontend)
- **Framework:** React 19 with TypeScript in strict mode.
- **Build Tool:** Vite 6 with instant local dev server and optimized Rollup production bundler.
- **Design System:** Tailwind CSS with high-contrast executive tokens and Google Fonts (`Plus Jakarta Sans` & `JetBrains Mono`).
- **Data Tables:** TanStack Table v8 with standardized server-side pagination, zebra striping, and empty states.
- **Data Caching:** TanStack Query (React Query v5) for automatic cache invalidation and background refetching.
- **State Management:** Zustand for lightweight POS shopping cart, session auth, and UI states.
- **Keyboard Ergonomics:** Global hotkey router mapped to physical `F1`–`F8` function keys and `<kbd>` keycaps.
- **Hardware Barcode Listener:** Global non-blocking keyboard listener capturing hardware USB/Bluetooth barcode scanners.

### Service & Backend Layer
- **Runtime:** Node.js LTS with Express.js REST API.
- **Language:** TypeScript with ES Modules.
- **Authentication:** Passport.js Local Strategy with secure session cookies and `cookie-parser`.
- **CORS:** Configured for local desktop communication (`http://localhost:5173`).
- **Database Driver:** `better-sqlite3` native bindings for synchronous, zero-overhead SQLite operations.
- **Journal Mode:** Write-Ahead Logging (`WAL`) enabling concurrent reads while writing.

---

## 4. Domain Modules (Unified Console)

All wholesale functionality is consolidated into a single unified workspace:

| Key | Module | Purpose |
| :--- | :--- | :--- |
| **`[F1]`** | **Billing POS Terminal** | High-speed retail counter billing, barcode scanning, item discounts, cash/credit settlement. |
| **`[F2]`** | **Pre-Booking Orders** | Manual order intake from WhatsApp and in-person booker visits; 1-click conversion to bills. |
| **`[F3]`** | **Warehouse Dispatch Slips** | Custody transfer gate-passes for goods released to bookers; returned goods restock. |
| **`[F4]`** | **Inventory Catalog & Imports**| Central product catalog, stock levels, inward container shipments, landed purchase costs. |
| **`[F5]`** | **Order Bookers & Field Sales**| Booker profiles, assigned routes/beats, commission percentages, and daily cash reconciliation. |
| **`[F6]`** | **Retail Customers & Khata** | Customer shop directory, credit limits, outstanding Khata balances, and payment receipts. |
| **`[F7]`** | **Executive Profit & Analytics**| Landed COGS profitability, daily revenue, sales vs. cash collection trend charts. |
| **`[F8]`** | **Immutable Audit Ledger** | Append-only physical stock transaction log with database integrity discrepancy check. |

---

## 5. Security & Multi-Role Governance

Even though the system is operated from a single central desk:
1. **Owner Role (`OWNER`):**
   - Full access to all modules including True Landed Cost Margins (`F7`), Audit Logs (`F8`), and System Settings.
   - Ability to manage authorized operator accounts and create database backups.
2. **Operator Role (`OPERATOR`):**
   - Access restricted to counter billing (`F1`), order entry (`F2`), dispatch slips (`F3`), and customer Khata entries (`F6`).
   - Landed purchase costs, true profit margins, and audit adjustments are hidden.
3. **No Booker Role:**
   - Order bookers are **not** system users and cannot log in.

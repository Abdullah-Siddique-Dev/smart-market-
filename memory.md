# Project Memory — Smart Market OS

## 1. Project Identity & Purpose

- **Project Name:** Smart Market OS
- **System Nature:** Private, on-premises, offline-first Enterprise Management Desktop Application for an **Import & Wholesale Distribution Business**.
- **Primary Platform:** Windows Desktop (`.exe`), built with **Tauri 2.0 + React 19 (TypeScript) + Embedded SQLite**.
- **Primary Business Objectives:**
  1. Eliminate owner confusion over stock sold vs. stock remaining.
  2. Stop verbal/mental profit estimations by automating exact daily, 3-day, weekly, and monthly net profit calculations.
  3. Prevent theft and corruption between warehouse stock, field order bookers, and customer cash.
  4. Provide high-speed counter billing that generates individual shop bills and atomically reduces warehouse inventory.

---

## 2. Business Glossary & Domain Concepts

| Term | Definition & Business Meaning |
| :--- | :--- |
| **Landed / Purchase Cost** | The exact cost of importing/acquiring a product unit. Used as the baseline to compute true gross profit: `Selling Price - Purchase Cost`. |
| **Order Booker** | A field sales and delivery representative who visits retail shops, books orders, takes physical stock from the warehouse, delivers goods, and collects payments. |
| **Dispatch Slip** | A formal warehouse gate-pass and custody transfer document listing the exact quantities of goods handed over to an Order Booker. |
| **Shop Bill / Invoice** | The commercial itemized bill issued to a specific retail customer shop. Generating this bill triggers the atomic reduction of warehouse stock. |
| **Shop Khata (Ledger)** | The running credit account of a retail shop. Tracks unpaid balances, previous debt, and partial payments. |
| **Atomic Stock Reduction** | Database-level guarantee where issuing an invoice and deducting physical inventory happen simultaneously in one transaction. |
| **Anti-Corruption Ledger** | An append-only historical audit table (`inventory_ledger`) logging every addition, dispatch, sale, return, and damage adjustment with timestamps and user IDs. |
| **Booker Reconciliation** | The mandatory end-of-day settlement where: `Stock Dispatched` must equal `Stock Billed + Stock Returned to Warehouse`. Any deficit is flagged as a cash or inventory shortage. |

---

## 3. Core Architectural Decisions (ADRs)

### ADR-01: Desktop Native over Web/Cloud Application
- **Decision:** Build as an offline-first Windows desktop app using **Tauri 2.0**.
- **Rationale:** The business requires zero recurring hosting costs, zero VPS maintenance, 100% offline capability during internet/telecom outages, and direct low-latency access to local thermal printers.

### ADR-02: Embedded SQLite over Client-Server RDBMS
- **Decision:** Use an embedded **SQLite 3** engine with Write-Ahead Logging (`WAL`) mode via `tauri-plugin-sql` and Rust backend.
- **Rationale:** Eliminates the need for a separate database server installation (PostgreSQL/MySQL), requires zero database administration, runs fully self-contained inside the application directory, and provides instant portability and backup by copying a single `.sqlite` file.

### ADR-03: Historical Cost Snapshotting in Bill Items
- **Decision:** When a bill item is created, the current product `purchase_price` is permanently copied into `bill_items.unit_purchase_price`.
- **Rationale:** Product import costs fluctuate over time. If a product imported at $10 in January is imported at $15 in March, past January invoices must still reflect a $10 cost to ensure historical profit reports remain 100% accurate.

### ADR-04: Append-Only Anti-Corruption Ledger
- **Decision:** Stock movements cannot be updated or deleted in `inventory_ledger`.
- **Rationale:** Direct fulfillment of the owner's requirement for anti-corruption features. Physical stock in the warehouse must always be mathematically reconcilable against the cumulative sum of ledger transactions.

### ADR-05: Keyboard-First POS UI
- **Decision:** High-volume billing workflows are bound to keyboard shortcuts (`F1`–`F10`, `Enter`, `Tab`, `Esc`).
- **Rationale:** Wholesale billing clerks need to process long lists of items in seconds without reaching for a mouse.

### ADR-06: Physical Hardware Printing Temporarily Excluded
- **Decision:** Direct ESC/POS thermal printing and physical printer driver integrations are deferred and temporarily excluded from the current scope.
- **Rationale:** Streamlines core business validation (order booking, atomic inventory reduction, booker reconciliation, and profit calculations). Slips and bills will be generated, saved, and previewed digitally on-screen within the application.

### ADR-07: Express.js Backend with Passport.js, Cookie-Parser & CORS
- **Decision:** Implement a local Node.js / Express backend service layer connecting to the SQLite database, using `cors`, `cookie-parser`, and `passport.js` (Local Strategy with session cookies) for authentication and role management, with Tauri 2.0 hosting the desktop frontend shell.
- **Rationale:** Enables full TypeScript/JavaScript across the entire stack, leverages mature authentication middleware (`passport.js` + `cookie-parser`), and safely handles desktop-to-API communication with `cors`.

### ADR-08: Standardized Server-Side Pagination
- **Decision:** Implement standardized server-side pagination (`page`, `limit` / `pageSize`, `totalCount`, `totalPages`) across all list endpoints (`products`, `orders`, `bills`, `retail_shops`, `inventory_ledger`).
- **Rationale:** Wholesale businesses accumulate tens of thousands of records. Server-side pagination prevents memory bloat in the desktop webview, reduces SQLite I/O, and ensures smooth 60fps rendering in TanStack Table.

---

## 4. Current Implementation Status

- **Current State:** **Greenfield (Project Documentation Phase Complete).**
- **Completed Deliverables:**
  - `prd.md` (Product Requirements Document)
  - `architecture.md` (System & Technical Architecture)
  - `datamodels.md` (Data Models & Entity Relationships)
  - `design.md` (UI/UX Design Specification)
  - `phases.md` (Implementation Roadmap & Phases)
  - `memory.md` (This document)
  - `rules.md` (AI Coding Agent Development Rules)
- **Completed Code Phases:** None (Application code has not been started).
- **Next Immediate Action:** Begin **Phase 1: Foundation & Desktop Shell** as outlined in `phases.md`.

---

## 5. Known Hardware & Operational Constraints

1. **Operating Environment:** Windows 10 / Windows 11 (64-bit).
2. **Connectivity:** Strictly offline-capable. No requirement for active internet access.
3. **Printing Status:** **Temporarily Excluded / Deferred.** Slips and bills are rendered and previewed digitally on-screen (no physical printer driver required).
4. **Display Targets:** Optimized for standard office monitor resolutions (1366x768 to 1920x1080).

---

## 6. Critical Lessons for Future AI Agents

1. **NEVER silently invent CRM or ERP modules:** Stick strictly to what is defined in `prd.md`. Do not add foreign exchange modules, public customer portals, or subscription billing.
2. **NEVER update inventory with raw unrecorded SQL:** Any stock change must ALWAYS insert a corresponding record into `inventory_ledger`.
3. **NEVER use JavaScript floating-point math for money:** Store monetary amounts as fixed-precision decimals or clean rounded numbers to prevent rounding drift in profit reports.
4. **ALWAYS check the Source of Truth Hierarchy before making architectural deviations:** The Project Owner's original business requirements (`Management system.png`) and `prd.md` override assumptions.

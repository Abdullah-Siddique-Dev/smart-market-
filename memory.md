# Project Memory — Smart Market OS

## 1. Project Identity & Purpose

- **Project Name:** Smart Market OS
- **System Nature:** Private, on-premises, offline-first Enterprise Management Desktop Application for an **Import & Wholesale Distribution Business**.
- **Primary Platform:** Windows Desktop (`.exe`), built with **React 19 (TypeScript) + Express.js + Embedded SQLite (WAL mode)**.
- **Primary Business Objectives:**
  1. Eliminate owner confusion over stock sold vs. stock remaining.
  2. Stop verbal/mental profit estimations by automating exact daily, 3-day, weekly, and monthly net profit calculations based on landed COGS.
  3. Prevent theft and corruption between warehouse stock, field order bookers, and customer cash.
  4. Provide high-speed counter billing that generates individual shop bills and atomically reduces warehouse inventory.
  5. Provide a **single unified management console** for the wholesale owner/operator to manage orders, billing, inventory, booker reconciliation, and customer Khata without needing multiple apps or field logins.

---

## 2. Business Glossary & Domain Concepts

| Term | Definition & Business Meaning |
| :--- | :--- |
| **Unified Single Dashboard** | A single all-inclusive management console for the wholesale owner/operator. There are **no** double sides, no separate booker portal, and no external customer portal. |
| **Landed / Purchase Cost** | The exact cost of importing/acquiring a product unit. Used as the baseline to compute true gross profit: `Selling Price - Purchase Cost`. |
| **Order Booker** | A field sales agent who visits retail shops. **Has no software login**. Transmits orders via WhatsApp or physical visits; tracked in the system by the operator for commission, dispatch, and reconciliation. |
| **Manual WhatsApp Order Intake** | The process where the counter operator takes order details received via WhatsApp (text, voice note, photo) and keys them into the system. |
| **Dispatch Slip (Gate Pass)** | A formal warehouse gate-pass and custody transfer document listing the exact quantities of goods handed over to an Order Booker for delivery. |
| **Shop Bill / Invoice** | The commercial itemized bill issued to a specific retail customer shop. Generating this bill triggers the atomic reduction of warehouse stock. |
| **Shop Khata (Ledger)** | The running credit account of a retail shop. Tracks unpaid balances, previous debt, and partial payments. |
| **Atomic Stock Reduction** | Database-level guarantee where issuing an invoice and deducting physical inventory happen simultaneously in one transaction. |
| **Anti-Corruption Ledger** | An append-only historical audit table (`inventory_ledger`) logging every addition, dispatch, sale, return, and damage adjustment with timestamps and user IDs. |
| **Booker Reconciliation** | The mandatory end-of-day settlement where: `Stock Dispatched` must equal `Stock Billed + Stock Returned to Warehouse`. Any deficit is flagged as a cash or inventory shortage. |

---

## 3. Core Architectural Decisions (ADRs)

### ADR-01: Desktop Native over Web/Cloud Application
- **Decision:** Build as an offline-first Windows desktop application.
- **Rationale:** The business requires zero recurring hosting costs, zero VPS maintenance, 100% offline capability during internet/telecom outages, and direct low-latency access.

### ADR-02: Embedded SQLite over Client-Server RDBMS
- **Decision:** Use an embedded **SQLite 3** engine with Write-Ahead Logging (`WAL`) mode and foreign keys enabled.
- **Rationale:** Eliminates the need for a separate database server installation (PostgreSQL/MySQL), requires zero database administration, runs fully self-contained inside the application directory, and provides instant portability and backup by copying a single `.sqlite` file.

### ADR-03: Historical Cost Snapshotting in Bill Items
- **Decision:** When a bill item is created, the current product `purchase_price` is permanently copied into `bill_items.unit_purchase_price`.
- **Rationale:** Product import costs fluctuate over time. If a product imported at $10 in January is imported at $15 in March, past January invoices must still reflect a $10 cost to ensure historical profit reports remain 100% accurate.

### ADR-04: Append-Only Anti-Corruption Ledger
- **Decision:** Stock movements cannot be updated or deleted in `inventory_ledger`.
- **Rationale:** Direct fulfillment of the owner's requirement for anti-corruption features. Physical stock in the warehouse must always be mathematically reconcilable against the cumulative sum of ledger transactions.

### ADR-05: Keyboard-First POS UI
- **Decision:** High-volume billing workflows are bound to keyboard shortcuts (`F1`–`F8`, `Enter`, `Tab`, `Esc`).
- **Rationale:** Wholesale billing clerks need to process long lists of items in seconds without reaching for a mouse.

### ADR-06: Physical Hardware Printing Temporarily Excluded
- **Decision:** Direct ESC/POS thermal printing and physical printer driver integrations are deferred and temporarily excluded from the current scope.
- **Rationale:** Streamlines core business validation (order booking, atomic inventory reduction, booker reconciliation, and profit calculations). Slips and bills are generated, saved, and previewed digitally on-screen within the application.

### ADR-07: Express.js Backend with Passport.js, Cookie-Parser & CORS
- **Decision:** Implement a local Node.js / Express backend service layer connecting to the SQLite database, using `cors`, `cookie-parser`, and `passport.js` (Local Strategy with session cookies) for authentication.
- **Rationale:** Enables full TypeScript/JavaScript across the entire stack, leverages mature authentication middleware, and safely handles client-to-API communication.

### ADR-08: Standardized Server-Side Pagination
- **Decision:** Implement standardized server-side pagination (`page`, `limit`, `totalRecords`, `totalPages`) across all list endpoints (`products`, `orders`, `bills`, `retail_shops`, `inventory_ledger`).
- **Rationale:** Wholesale businesses accumulate tens of thousands of records. Server-side pagination prevents memory bloat in the desktop webview, reduces SQLite I/O, and ensures smooth 60fps rendering.

### ADR-09: Single Unified Owner Console & Manual Order Intake (WhatsApp / In-Person)
- **Decision:** Consolidate all ERP capabilities into a **single, unified Owner dashboard**. Eliminate any double-sided portal architecture (NO Order Booker portal or customer-facing apps).
- **Rationale:** Per business specification, field order bookers communicate order details verbally in-person or via WhatsApp messages/photos. The owner/operator manually keys these orders into the central system. Order bookers are represented only as attribution and reconciliation entities within the database, without login credentials.

### ADR-10: Strictly Single-Sided - Owner Console Only (No Operator Role)
- **Decision:** Eliminate the `OPERATOR` role tier entirely. The application operates strictly as a **Single-Sided Wholesale Owner Dashboard** where all ERP modules, inventory purchase costs, landed profit calculations, and audit logs are unconditionally available without role restrictions.
- **Rationale:** The wholesale owner requested a single dashboard with all features implemented directly on the owner side, without multi-user role boundaries or restricted operator modes. All features (F1 through F8) are unlocked directly.

---

## 4. Current Implementation Status

- **Architecture:** Single unified desktop dashboard for wholesale owner/operator.
- **Backend:** Express.js + SQLite in WAL mode with Passport.js session auth.
- **Frontend:** React 19 + Tailwind CSS + TanStack Query with full F1-F8 keyboard navigation.
- **Domain Modules:**
  1. Billing POS Terminal (`F1`)
  2. Pre-Booking Orders (`F2`) — Supports manual WhatsApp / in-person order registration
  3. Warehouse Dispatch Slips (`F3`) — Booker gate-passes & reconciliation
  4. Inventory & Stock Receiving (`F4`) — Catalog & inward imports
  5. Order Bookers & Field Sales (`F5`) — Booker commissions & route assignments
  6. Retail Customers & Khata (`F6`) — Customer directory & ledger
  7. Profit & Sales Analytics (`F7`) — Landed COGS profitability reports
  8. Immutable Audit Ledger (`F8`) — Cryptographic physical stock audit trail
  9. System Settings — Database backup snapshot triggers & security

---

## 5. Known Operational Rules

1. **Single Operator Desk:** All data entry is centralized at the counter.
2. **Bookers Have No App Access:** Never create external login screens or mobile clients for bookers.
3. **Connectivity:** Strictly offline-capable. No requirement for active internet access.
4. **Printing Status:** **Temporarily Excluded / Deferred.** Digital on-screen slips only.
5. **Anti-Corruption Rule:** Every physical stock change must ALWAYS create an `inventory_ledger` row.

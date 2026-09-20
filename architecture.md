# System Architecture Document — Smart Market OS

## 1. Executive Summary & Architectural Goals

**Smart Market OS** is engineered as an **Offline-First, Desktop-Native Enterprise Application** specifically designed for a wholesale import and distribution business. It operates entirely on-premises without requiring cloud hosting, external database servers, or monthly VPS infrastructure fees.

### Key Architectural Pillars
1. **Zero External Server Dependency:** 100% self-contained desktop deployment using an embedded SQLite database engine.
2. **ACID Financial & Inventory Integrity:** Transactional boundaries ensure billing and inventory deductions are atomic.
3. **High-Speed Keyboard Ergonomics:** Sub-50ms UI response times for high-volume wholesale counter billing.
4. **Tamper-Evident Anti-Corruption Architecture:** Append-only inventory transaction logging to prevent theft and unauthorized adjustments.
5. **Ultra-Lightweight Footprint:** Memory usage under 80MB using Tauri 2.0 and native WebView2.

---

## 2. Overall System Architecture

The application adopts a **Two-Tier Native Desktop Architecture** consisting of a **React/TypeScript Presentation Layer** and a **Rust-Powered Tauri Host Layer**, accessing an **Embedded SQLite Database Engine**.

```
┌────────────────────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER (Webview2 / React 19)                 │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Wholesale Billing POS │  │ Order & Dispatch │  │ Profit Reports  │  │
│  └───────────┬───────────┘  └────────┬─────────┘  └────────┬────────┘  │
│              │                       │                     │           │
│  ┌───────────▼───────────────────────▼─────────────────────▼────────┐  │
│  │               Client State & Data Access Layer                   │  │
│  │   • Zustand (Session/Cart)       • TanStack Query (DB Cache)     │  │
│  │   • Zod (Validation Schemas)     • Keyboard Hotkey Router        │  │
│  └───────────────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ Strongly-Typed IPC (Tauri Invoke)
┌──────────────────────────────────────▼─────────────────────────────────┐
│                    TAURI 2.0 NATIVE CORE (Rust)                        │
│                                                                        │
│  ┌─────────────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Native Command Handlers │  │ Hardware Printer │  │ Auto-Backup   │  │
│  │ (Validation & Routing)  │  │ Driver (ESC/POS) │  │ Worker Service│  │
│  └────────────┬────────────┘  └────────┬─────────┘  └───────┬───────┘  │
│               │                        │                    │          │
│  ┌────────────▼────────────────────────▼────────────────────▼───────┐  │
│  │                   Database Connection Manager                    │  │
│  │         • SQLite Connection Pool (WAL Mode Enabled)              │  │
│  │         • Migration Engine & Transaction Controller              │  │
│  └─────────────────────────────────────┬────────────────────────────┘  │
└────────────────────────────────────────┼───────────────────────────────┘
                                         │ Direct File I/O
                                         ▼
                        ┌─────────────────────────────────┐
                        │      LOCAL PERSISTENCE LAYER    │
                        │    %LOCALAPPDATA%/SmartMarket/  │
                        │    └── smart_market.sqlite      │
                        │    └── backups/ (Daily copies)  │
                        └─────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Technology Stack
- **Framework:** React 19 with TypeScript in strict mode.
- **Build Tool:** Vite (ESBuild-powered hot module replacement and tree-shaking).
- **Styling Engine:** Tailwind CSS with CSS Variables for theme consistency.
- **UI Components:** `shadcn/ui` (accessible, headless Radix UI primitives with zero runtime style overhead).
- **Tabular Data Grid:** `TanStack Table v8` (virtualized rendering for thousands of product SKUs and invoice lines).
- **Data Fetching & Cache:** `TanStack Query (React Query v5)` for asynchronous SQLite reads, optimistic UI updates, and cache invalidation.
- **Client State:** `Zustand` for lightweight, non-persisted application states (active counter invoice cart, current user shift, active filters).
- **Form Handling:** `React Hook Form` paired with `Zod` schemas for client-side input validation.
- **Keyboard Navigation:** `react-hotkeys-hook` for global and contextual hotkeys (`F1` for New Bill, `F2` for Product Search, `Enter` for cell traversal).
- **Data Visualization:** `Recharts` for high-performance SVG rendering of daily, 3-day, weekly, and monthly trends.

### 3.2 Component Layering
```
src/
├── app/                  # Application routing & layout shell
├── components/
│   ├── ui/               # Generic base UI (Button, Input, Dialog, etc.)
│   ├── shared/           # Common domain components (ProductCombobox, ShopSelector)
│   └── modules/          # Feature-specific components
│       ├── billing/      # Billing POS terminal, invoice table, summary card
│       ├── orders/       # Order intake form, dispatch slip viewer
│       ├── bookers/      # Booker status matrix, reconciliation modal
│       ├── inventory/    # Stock import table, manual adjustment dialog
│       ├── reports/      # Profit analytics, temporal filters (1d, 3d, 7d, 30d)
│       └── audit/        # Immutable stock ledger log viewer
├── hooks/                # Custom React hooks (useHotkeys, useBarcodeScanner)
├── stores/               # Zustand state stores (useCartStore, useAuthStore)
├── lib/
│   ├── api/              # Tauri IPC bridge wrappers
│   ├── db/               # Client-side SQL execution wrappers
│   └── utils/            # Currency formatters, date helpers, math helpers
└── types/                # Shared TypeScript models and IPC contracts
```

---

## 4. Backend & API Architecture

The system utilizes an **Express.js (Node.js) API Service Layer** coupled with the **Tauri 2.0 Desktop Shell** and **SQLite Engine**, providing standard middleware security, robust session management, and cross-platform flexibility.

### 4.1 Server Middleware & Security Stack
- **`cors`:** Configures Cross-Origin Resource Sharing allowing authorized desktop origins (e.g. `tauri://localhost`, `http://localhost:5173` in development) to access the local API with credentials.
- **`cookie-parser`:** Parses HTTP-only, secure cookies for session token management and protection against client-side script tampering.
- **`passport.js`:** Manages user authentication via `passport-local` strategy:
  - Validates username/password or PIN against Argon2/bcrypt hashes.
  - Serializes/deserializes user sessions stored locally in SQLite.
  - Enforces role-based route middleware (`ensureAuthenticated`, `requireRole('OWNER')`).

```typescript
// Express Backend Middleware Pipeline
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';

const app = express();

app.use(cors({
  origin: ['tauri://localhost', 'http://localhost:5173'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'smart-market-local-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
```

### 4.2 Standardized Pagination Architecture
To maintain sub-50ms UI performance across thousands of products, orders, bills, and audit records, all listing endpoints implement server-side pagination:

- **Query Parameters:** `page` (default `1`), `limit` (default `25`, max `100`), `search`, `sortBy`, `sortOrder`.
- **SQL Implementation:** Efficient `LIMIT :limit OFFSET :offset` queries coupled with indexed `COUNT(*)` over total matching records.
- **Paginated Response Envelope:**
```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

---

## 5. Database Architecture

### 5.1 SQLite Configuration & Tuning
To achieve enterprise-grade reliability and concurrency on local hardware:
- **Journal Mode (`WAL`):** Write-Ahead Logging allows concurrent readers while a write transaction is in progress, preventing UI freezes during heavy billing.
- **Synchronous Mode (`NORMAL`):** Provides complete crash-safety with significantly higher write throughput.
- **Foreign Keys:** Strictly enforced at all times (`PRAGMA foreign_keys = ON;`).
- **Busy Timeout (`5000ms`):** Prevents database locked errors by queuing concurrent write attempts.

```sql
-- Initial PRAGMA Execution on Connection
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA temp_store = MEMORY;
```

### 5.2 Transactional Guarantees
All operations affecting multiple tables—specifically **Bill Creation + Stock Deduction + Ledger Entry**—are wrapped in an atomic transaction:

```
BEGIN TRANSACTION;
  1. Insert into bills
  2. Insert into bill_items
  3. Update products (Decrement physical stock)
  4. Insert into inventory_ledger (Audit entry for each line item)
  5. Update shop balance (If credit invoice)
COMMIT;
```
If any step fails (e.g. stock constraint violation), the entire operation rolls back automatically, leaving the database 100% consistent.

---

## 6. Detailed Data Flow Architecture

### 6.1 Order → Dispatch Slip → Shop Bill → Stock Deduction → Profit Flow

```
[ Customer / Retail Shop ]
           │
           ▼
[ 1. Order Registration ] ────► Inserts into `orders` & `order_items` (Status: PENDING)
           │
           ▼
[ 2. Dispatch Slip Gen ]  ────► Inserts into `dispatch_slips` (Assigned to Order Booker)
                                (Status: DISPATCHED)
           │
           ▼
[ 3. Retail Delivery ]    ────► Bill Confirmation at Counter / Field Return
           │
           ▼
[ 4. ATOMIC BILLING TX ]  ────► BEGIN TRANSACTION;
                                ├── Insert `bills` & `bill_items`
                                ├── Decrement `products.current_stock`
                                ├── Insert `inventory_ledger` (Type: SALE_BILL)
                                ├── Update `order_bookers` collection liability
                                └── COMMIT;
           │
           ▼
[ 5. Automated Analytics ] ───► Calculates:
                                ├── Daily Gross Profit = Sum((Selling Price - Cost Price) * Qty)
                                ├── Booker Matrix = Delivered vs. Pending vs. Cash Collected
                                └── Executive Dashboard (1d, 3d, 7d, 30d views)
```

---

## 7. Authentication & Authorization Architecture

The system operates as a private internal tool with two distinct local system roles:

```
                    ┌────────────────────────────┐
                    │      Local Login Gate      │
                    │   (PIN / Password Auth)    │
                    └──────────────┬─────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
      ┌─────────────────────────┐     ┌─────────────────────────┐
      │       Role: OWNER       │     │     Role: OPERATOR      │
      ├─────────────────────────┤     ├─────────────────────────┤
      │ • Full Module Access    │     │ • Order Entry & Booking │
      │ • View Purchase Costs   │     │ • Slip & Bill Printing  │
      │ • View Net Profit & ROI │     │ • Customer / Shop View  │
      │ • Stock Adjustments     │     │ ✕ Hidden Purchase Costs │
      │ • Backup / Restore      │     │ ✕ Hidden Profit Reports │
      │ • Booker Reconciliation │     │ ✕ Cannot Delete Records │
      └─────────────────────────┘     └─────────────────────────┘
```

---

## 8. Error-Handling & Resilience Strategy

1. **Frontend Boundary:** React Error Boundaries intercept rendering failures and display actionable recovery actions without terminating the application.
2. **IPC Error Serialization:** Rust `Result<T, AppError>` types are mapped into structured error objects containing domain-specific error codes (`INSUFFICIENT_STOCK`, `DUPLICATE_SKU`, `BOOKER_NOT_FOUND`).
3. **Database Guardrails:** SQLite `CHECK` constraints prevent negative stock balances or invalid order statuses at the lowest database layer.
4. **Crash Resilience:** The SQLite WAL file guarantees zero database corruption in the event of an abrupt power failure or system crash.

---

## 9. Anti-Corruption & Audit Architecture

To directly satisfy the owner's requirement for anti-corruption and stock shrinkage protection:
- **Append-Only Inventory Ledger:** The `inventory_ledger` table permits only `INSERT` operations. `UPDATE` and `DELETE` operations on this table are strictly prohibited.
- **Stock Reconciliation Formula:**
  $$\text{Warehouse Physical Count} \equiv \sum \text{Ledger Inward Transactions} - \sum \text{Ledger Outward Transactions}$$
- **Traceability References:** Every ledger transaction requires a foreign reference type (`IMPORT`, `BILL`, `DISPATCH_SLIP`, `RETURN`, `DAMAGE`) and the ID of the operator who executed it.

---

## 10. File & Folder Responsibilities

```
Smart Market OS/
├── src/                          # Frontend React Source
│   ├── app/                      # Main Window shell & routing
│   ├── components/               # UI components categorized by module
│   │   ├── billing/              # High-speed POS billing components
│   │   ├── slips/                # Dispatch slip generation & preview
│   │   ├── inventory/            # Import receiving & stock tables
│   │   ├── bookers/              # Booker tracking & reconciliation
│   │   └── reports/              # Daily/weekly/monthly profit charts
│   ├── hooks/                    # Custom keyboard and query hooks
│   ├── lib/                      # Core helpers, math, formatting
│   ├── stores/                   # Global Zustand state stores
│   └── types/                    # Shared TypeScript interfaces
├── src-tauri/                    # Native Rust Core
│   ├── src/
│   │   ├── main.rs               # Tauri entry point & setup
│   │   ├── commands/             # Invokable IPC commands
│   │   │   ├── billing.rs        # Transactional bill execution
│   │   │   ├── inventory.rs      # Stock queries & adjustments
│   │   │   ├── bookers.rs        # Booker performance queries
│   │   │   └── reports.rs        # Aggregated profit calculations
│   │   ├── db/
│   │   │   ├── mod.rs            # Database connection pool
│   │   │   └── migrations/       # SQL schema migration scripts
│   │   ├── printer/              # Direct ESC/POS printing routines
│   │   └── backup/               # Background database backup service
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri window & bundle configuration
├── documentation/                # Project architecture & specifications
└── package.json                  # Frontend dependencies & scripts
```

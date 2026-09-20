# Smart Market OS

**Smart Market OS** is an offline-first, single-desk desktop enterprise management system built specifically for wholesale import and distribution businesses.

---

## 1. System Overview & Core Workflow

The application operates as a **Single Unified Owner/Operator Dashboard**. 

### Operational Workflow
- **No External Portals / No "Double Sides":** There is no separate Order Booker portal, field app, or customer portal. All business operations are centralized at the wholesale counter / office desk.
- **Manual WhatsApp & In-Person Order Intake:** Field order bookers operate offline in retail markets. They communicate order requests to the counter via **WhatsApp** (text, voice notes, photos of paper slips) or **in person**.
- **Central Data Entry:** The counter operator manually keys in the orders under the attributed customer shop and booker.
- **Counter POS Billing & Dispatch:** The operator issues warehouse dispatch gate passes (`F3`) for field delivery or settles immediate counter sales via high-speed POS billing (`F1`).
- **End-of-Day Booker Reconciliation:** When bookers return in the evening, the operator records returned unsold goods (automatically restocked) and reconciles collected cash against dispatched stock.
- **Khata Management:** Customer credit limits, running balances, and cash recoveries are tracked seamlessly with zero paper ledger confusion.
- **Landed COGS Profitability:** True gross profit is computed on every sale based on locked-in landed import costs.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite 6, TanStack Query v5, Zustand, Recharts.
- **Backend Service:** Node.js, Express.js REST API, TypeScript, Passport.js session authentication, Cookie-Parser, CORS.
- **Database Engine:** SQLite 3 with Write-Ahead Logging (`WAL`), `PRAGMA foreign_keys = ON`, and automated daily snapshot backups.
- **Offline Capability:** Strictly 100% offline-first. Runs self-contained on local hardware with zero cloud dependencies.

---

## 3. Function Key Map (Tactile Ergonomics)

| Key | Module | Description |
| :--- | :--- | :--- |
| **`[F1]`** | **Counter POS Billing** | Rapid wholesale invoice creation, barcode scanner support, discount chips, cash settlement. |
| **`[F2]`** | **Pre-Booking Orders** | Manual order intake from WhatsApp and in-person visits; 1-click conversion to POS bills. |
| **`[F3]`** | **Warehouse Dispatch Slips** | Goods custody transfer gate passes for bookers; returned goods reconciliation. |
| **`[F4]`** | **Inventory Catalog & Imports**| Master product catalog, stock levels, inward container shipments, landed costs. |
| **`[F5]`** | **Order Bookers & Field Sales**| Booker directory, territory routes, commission tracking, and daily cash reconciliation. |
| **`[F6]`** | **Retail Customers & Khata** | Customer directory, credit limits, outstanding Khata balances, and payment receipts. |
| **`[F7]`** | **Executive Profit Analytics**| True landed COGS profitability, daily revenue, sales vs. cash collection trend charts. |
| **`[F8]`** | **Immutable Audit Ledger** | Append-only physical stock transaction log with database integrity discrepancy check. |

---

## 4. Getting Started

### Prerequisites
- Node.js LTS (v18+)
- pnpm and npm installed

### 1. Start the SQLite Backend Service
```powershell
cd "server"
pnpm run dev
# Starts Express.js on http://localhost:5000 in WAL mode
```

### 2. Start the Frontend Application
```powershell
# From root directory:
npm run dev
# Starts Vite on http://localhost:5173
```

### 3. Default Credentials
- **Username:** `owner`
- **Password:** `admin123`
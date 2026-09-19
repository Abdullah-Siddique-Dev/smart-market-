# AI Coding Agent Development Rules — Smart Market OS

## 1. Core Mandate & Hierarchy of Truth

All AI coding agents interacting with this repository must strictly adhere to the rules in this document. No autonomous deviation from the specified business requirements or architecture is permitted.

### 1.1 Source of Truth Hierarchy
If an apparent contradiction or ambiguity arises, agents must resolve it strictly according to this hierarchy:
1. **Actual Business Requirements provided by the Project Owner** (`Management system.png`)
2. **`prd.md`** (Product Requirements Document)
3. **`architecture.md`** (System & Technical Architecture)
4. **`datamodels.md`** (Data Models & Constraints)
5. **`design.md`** (UI/UX Design Specification)
6. **`phases.md`** (Implementation Roadmap)
7. **`memory.md`** (Project Context & Decisions)
8. **Existing Implementation Codebase**

> [!CAUTION]
> **STOP AND ASK:** If a requirement in a prompt contradicts `prd.md` or `Management system.png`, the agent MUST NOT guess or quietly choose an arbitrary path. It must pause and present the conflict to the user.

---

## 2. Requirements & Business Logic Discipline

1. **Do Not Invent Features:** Only implement features specified in `prd.md`. Do not add generic ERP features (e.g. multi-currency conversion, supplier purchase orders, public customer portals, payroll) unless explicitly requested.
2. **Do Not Modify Business Logic Casually:** The profit formula:
   $$\text{Gross Profit} = (\text{Selling Price} - \text{Unit Purchase Cost}) \times \text{Quantity} - \text{Discounts}$$
   and the reconciliation equation:
   $$\text{Dispatched} \equiv \text{Billed} + \text{Returned}$$
   are immutable core business logic.
3. **Consult Documentation Before Coding:** At the start of any new session or phase, the agent must review `memory.md`, `phases.md`, and the relevant specification documents before writing code.
4. **Update `memory.md` Upon Milestone Completion:** When a phase from `phases.md` is completed or a significant architectural decision is made, the agent must update `memory.md` to reflect the new state.

---

## 3. Data Integrity & Financial Integrity Rules

1. **Atomic Billing & Stock Deduction:** Creating a bill and decrementing inventory MUST be executed inside an atomic transaction (`BEGIN TRANSACTION ... COMMIT`). Writing a bill without deducting stock or updating stock without generating a ledger entry is a catastrophic bug.
2. **Snapshotted Unit Costs:** When inserting records into `bill_items`, the current `purchase_price` of the product MUST be copied into `bill_items.unit_purchase_price`. Never rely on a dynamic join to the `products` table for historical profit calculations.
3. **Immutable Inventory Ledger:** The `inventory_ledger` table is strictly append-only. NEVER write `UPDATE` or `DELETE` SQL queries against this table.
4. **Foreign Key Enforcement:** Every SQLite connection must immediately execute `PRAGMA foreign_keys = ON;`.
5. **No Floating-Point Rounding Bugs:** Never perform currency math using raw floating-point operations where IEEE 754 inaccuracies can compound. Use rounded fixed-decimal representations (2 decimal places) or integer cents.

---

## 4. Architecture & Code Quality Rules

1. **Adhere to Folder Boundaries:** Follow the exact directory structure outlined in `architecture.md`. Do not scatter utility functions or components in arbitrary root folders.
2. **Type Safety Across IPC:** All Tauri IPC commands must have matching TypeScript interface definitions for both arguments and return values. No `any` types in IPC payloads.
3. **Component Reusability:** Reuse components from `src/components/ui/` (`shadcn/ui`). Do not install redundant UI libraries or duplicate base inputs/buttons.
4. **Keyboard Accessibility First:** All transactional screens (Billing, Order Intake) must support standard keyboard navigation (`Enter`, `Tab`, `Escape`, function keys).
5. **Defensive Error Handling:**
   - Never swallow errors with empty `catch` blocks.
   - Rust commands must return `Result<T, AppError>` with human-readable error messages and structured error codes.
   - The UI must display explicit toast or alert notifications when a database or validation error occurs.

---

## 5. Coding Standards & Naming Conventions

### 5.1 Database (SQLite)
- Table names: `snake_case`, plural (e.g. `products`, `retail_shops`, `bill_items`).
- Column names: `snake_case` (e.g. `purchase_price`, `order_booker_id`, `created_at`).
- Foreign keys: `<singular_table_name>_id` (e.g. `shop_id`, `product_id`).
- Timestamps: ISO-8601 strings in local time (`datetime('now', 'localtime')`).

### 5.2 Frontend (React & TypeScript)
- Components: `PascalCase` (e.g. `BillingTerminal.tsx`, `ProductFormDialog.tsx`).
- Custom Hooks: `camelCase` with `use` prefix (e.g. `useProducts.ts`, `useKeyboardHotkeys.ts`).
- Utility Functions: `camelCase` (e.g. `formatCurrency.ts`, `calculateNetProfit.ts`).
- Interfaces & Types: `PascalCase` (e.g. `Product`, `CreateBillPayload`, `ApiResponse`).
- State Stores: `use<Name>Store` (e.g. `useCartStore.ts`, `useAuthStore.ts`).

### 5.3 Backend (Rust & Tauri)
- File names: `snake_case.rs` (e.g. `billing.rs`, `reconciliation.rs`).
- Function names: `snake_case` (e.g. `create_bill`, `get_daily_profit`).
- Structs & Enums: `PascalCase` (e.g. `BillItemPayload`, `OrderStatus`).
- Error Types: Explicit enum variants with `thiserror`.

---

## 6. Verification & Testing Requirements

1. **Verification Before Task Completion:**
   - Run the frontend linter / TypeScript compiler (`npm run build` or `npx tsc --noEmit`) to verify zero type errors.
   - Run Cargo check (`cargo check` in `src-tauri`) to verify Rust compilation.
2. **Transactional Rollback Verification:** Any newly created database transaction must be verified for failure handling (e.g. attempting to bill with zero stock must abort cleanly and leave the database unmodified).
3. **No Dead Code:** Remove debug logs, mock variables, and unused imports before completing a phase.

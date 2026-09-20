import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { productRoutes } from './product.routes.js';
import { importRoutes } from './import.routes.js';
import { orderRoutes } from './order.routes.js';
import { dispatchSlipRoutes } from './dispatchSlip.routes.js';
import { billRoutes } from './bill.routes.js';
import { shopRoutes } from './shop.routes.js';
import { bookerRoutes } from './booker.routes.js';
import { reportRoutes } from './report.routes.js';
import { auditRoutes } from './audit.routes.js';
import { systemRoutes } from './system.routes.js';

const router = Router();

// Domain 1: Authentication & Sessions
router.use('/auth', authRoutes);

// Domain 2: Product Catalog & Inward Stock Imports
router.use('/products', productRoutes);
router.use('/imports', importRoutes);

// Domain 3: Order Intake & Lifecycle Pipeline
router.use('/orders', orderRoutes);

// Domain 4: Dispatch Slips & Custody Gate-Passes
router.use('/dispatch-slips', dispatchSlipRoutes);

// Domain 5: Core POS Billing & Invoicing (Atomic Stock Decrement)
router.use('/bills', billRoutes);

// Domain 6: Retail Shops & Customer Khata Ledgers
router.use('/shops', shopRoutes);

// Domain 7: Order Bookers & End-of-Day Settlement
router.use('/bookers', bookerRoutes);

// Domain 8: Executive Reports & Net Profit Analytics (OWNER only)
router.use('/reports', reportRoutes);

// Domain 9: Anti-Corruption & Immutable Audit Ledger
router.use('/audit', auditRoutes);

// Domain 10: System Health, SQLite Snapshots & User Administration
router.use('/system', systemRoutes);

export const apiRouter = router;

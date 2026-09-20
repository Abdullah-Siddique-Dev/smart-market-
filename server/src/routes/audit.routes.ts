import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { ensureAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { z } from 'zod';

const router = Router();

const adjustmentSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive('Product ID is required'),
    adjustment_qty: z.number().int().refine(val => val !== 0, 'Adjustment cannot be zero'),
    reason: z.string().min(5, 'Mandatory reason is required (minimum 5 characters)'),
  }),
});

router.use(ensureAuthenticated);

router.get('/inventory-ledger', AuditController.getLedger);
router.get('/ledger/:product_id', AuditController.getLedgerByProduct);
router.get('/stock-reconciliation', AuditController.getStockReconciliation);
router.get('/export', AuditController.exportCsv);

// Manual adjustment requires OWNER role
router.post('/stock-adjustment', requireRole(USER_ROLES.OWNER), validate(adjustmentSchema), AuditController.recordStockAdjustment);

export const auditRoutes = router;

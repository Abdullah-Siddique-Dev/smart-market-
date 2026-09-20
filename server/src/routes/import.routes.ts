import { Router } from 'express';
import { ImportController } from '../controllers/import.controller.js';
import { ensureAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { z } from 'zod';

const router = Router();

const recordImportSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive('Valid product ID is required'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    unit_cost: z.number().nonnegative('Unit cost cannot be negative'),
    supplier_info: z.string().optional(),
    import_date: z.string().optional(),
    update_master_cost: z.boolean().optional(),
  }),
});

router.use(ensureAuthenticated);

// Only OWNER can view import costs and record new imports
router.get('/', requireRole(USER_ROLES.OWNER), ImportController.getImports);
router.get('/:id', requireRole(USER_ROLES.OWNER), ImportController.getImportById);
router.post('/', requireRole(USER_ROLES.OWNER), validate(recordImportSchema), ImportController.recordImport);

export const importRoutes = router;

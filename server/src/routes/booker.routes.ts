import { Router } from 'express';
import { BookerController } from '../controllers/booker.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createBookerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Booker name is required'),
    phone: z.string().min(1, 'Phone is required'),
    territory: z.string().optional(),
    commission_rate: z.number().nonnegative().optional(),
  }),
});

const updateBookerSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    territory: z.string().optional(),
    commission_rate: z.number().nonnegative().optional(),
    is_active: z.number().int().min(0).max(1).optional(),
  }),
});

const reconcileSchema = z.object({
  body: z.object({
    total_cash_submitted: z.number().nonnegative('Submitted cash cannot be negative'),
    shortage_amount: z.number().nonnegative().optional(),
  }),
});

router.use(ensureAuthenticated);

router.get('/', BookerController.getBookers);
router.post('/', validate(createBookerSchema), BookerController.createBooker);
router.get('/:id', BookerController.getBookerById);
router.put('/:id', validate(updateBookerSchema), BookerController.updateBooker);
router.get('/:id/performance', BookerController.getBookerPerformance);
router.get('/:id/reconciliation', BookerController.getTodayReconciliation);
router.post('/:id/reconcile', validate(reconcileSchema), BookerController.reconcileBooker);

export const bookerRoutes = router;

import { Router } from 'express';
import { DispatchSlipController } from '../controllers/dispatchSlip.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createSlipSchema = z.object({
  body: z.object({
    order_booker_id: z.number().int().positive('Booker ID is required'),
    order_ids: z.array(z.number().int().positive()).optional(),
    items: z.array(
      z.object({
        product_id: z.number().int().positive(),
        dispatched_qty: z.number().int().positive(),
      })
    ).optional(),
    notes: z.string().optional(),
  }),
});

const reconcileSlipSchema = z.object({
  body: z.object({
    reconciled_items: z.array(
      z.object({
        product_id: z.number().int().positive(),
        returned_qty: z.number().int().nonnegative(),
        billed_qty: z.number().int().nonnegative(),
      })
    ).min(1, 'At least one item is required for reconciliation'),
  }),
});

router.use(ensureAuthenticated);

router.get('/', DispatchSlipController.getSlips);
router.post('/', validate(createSlipSchema), DispatchSlipController.generateSlip);
router.get('/:id', DispatchSlipController.getSlipById);
router.put('/:id/reconcile', validate(reconcileSlipSchema), DispatchSlipController.reconcileSlip);

export const dispatchSlipRoutes = router;

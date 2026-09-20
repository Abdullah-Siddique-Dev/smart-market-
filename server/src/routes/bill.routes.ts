import { Router } from 'express';
import { BillController } from '../controllers/bill.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createBillSchema = z.object({
  body: z.object({
    order_id: z.number().int().positive().optional(),
    shop_id: z.number().int().positive('Shop ID is required'),
    order_booker_id: z.number().int().positive('Booker ID is required'),
    items: z.array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive('Quantity must be > 0'),
        unit_selling_price: z.number().nonnegative('Unit selling price must be >= 0'),
      })
    ).min(1, 'At least one line item is required'),
    discount_amount: z.number().nonnegative().optional(),
    payment_status: z.enum(['PAID', 'PARTIAL', 'CREDIT']),
    paid_amount: z.number().nonnegative(),
  }),
});

router.use(ensureAuthenticated);

router.get('/', BillController.getBills);
router.post('/', validate(createBillSchema), BillController.createBill);
router.get('/:id', BillController.getBillById);
router.get('/:id/print', BillController.getPrintBill);

export const billRoutes = router;

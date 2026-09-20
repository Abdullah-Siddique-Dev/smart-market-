import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createOrderSchema = z.object({
  body: z.object({
    shop_id: z.number().int().positive('Valid shop ID is required'),
    order_booker_id: z.number().int().positive('Valid order booker ID is required'),
    order_date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive('Quantity must be > 0'),
        unit_price: z.number().nonnegative('Unit price must be >= 0'),
      })
    ).min(1, 'At least one line item is required'),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'DISPATCHED', 'BILLED', 'CANCELLED']),
  }),
});

const billOrderSchema = z.object({
  body: z.object({
    discount_amount: z.number().nonnegative().optional(),
    payment_status: z.enum(['PAID', 'PARTIAL', 'CREDIT']),
    paid_amount: z.number().nonnegative(),
  }),
});

router.use(ensureAuthenticated);

router.get('/', OrderController.getOrders);
router.post('/', validate(createOrderSchema), OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);
router.put('/:id', OrderController.updateOrder);
router.put('/:id/status', validate(updateStatusSchema), OrderController.updateOrderStatus);

// Lifecycle actions
router.post('/:id/dispatch', OrderController.dispatchOrder);
router.post('/:id/bill', validate(billOrderSchema), OrderController.billOrder);

export const orderRoutes = router;

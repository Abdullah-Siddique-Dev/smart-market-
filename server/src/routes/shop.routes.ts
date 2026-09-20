import { Router } from 'express';
import { ShopController } from '../controllers/shop.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createShopSchema = z.object({
  body: z.object({
    shop_name: z.string().min(1, 'Shop name is required'),
    owner_name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    credit_limit: z.number().nonnegative().optional(),
  }),
});

const updateShopSchema = z.object({
  body: z.object({
    shop_name: z.string().min(1).optional(),
    owner_name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    credit_limit: z.number().nonnegative().optional(),
  }),
});

const paymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Payment amount must be greater than zero'),
    payment_method: z.string().optional(),
    notes: z.string().optional(),
  }),
});

router.use(ensureAuthenticated);

router.get('/', ShopController.getShops);
router.post('/', validate(createShopSchema), ShopController.createShop);
router.get('/:id', ShopController.getShopById);
router.put('/:id', validate(updateShopSchema), ShopController.updateShop);
router.get('/:id/ledger', ShopController.getShopLedger);
router.post('/:id/payment', validate(paymentSchema), ShopController.recordPayment);

export const shopRoutes = router;

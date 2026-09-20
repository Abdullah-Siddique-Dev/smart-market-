import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { ensureAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { z } from 'zod';

const router = Router();

const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Product name is required'),
    unit: z.string().optional(),
    purchase_price: z.number().nonnegative('Purchase price cannot be negative'),
    selling_price: z.number().nonnegative('Selling price cannot be negative'),
    current_stock: z.number().int().nonnegative().optional(),
    min_stock_alert: z.number().int().nonnegative().optional(),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    unit: z.string().optional(),
    purchase_price: z.number().nonnegative().optional(),
    selling_price: z.number().nonnegative().optional(),
    min_stock_alert: z.number().int().nonnegative().optional(),
    is_active: z.number().int().min(0).max(1).optional(),
  }),
});

router.use(ensureAuthenticated);

router.get('/', ProductController.getProducts);
router.get('/stock-status', ProductController.getStockStatus);
router.get('/search', ProductController.searchProducts);
router.get('/:id', ProductController.getProductById);

// Creation, modification, and deactivation require OWNER role
router.post('/', requireRole(USER_ROLES.OWNER), validate(createProductSchema), ProductController.createProduct);
router.put('/:id', requireRole(USER_ROLES.OWNER), validate(updateProductSchema), ProductController.updateProduct);
router.delete('/:id', requireRole(USER_ROLES.OWNER), ProductController.deactivateProduct);

export const productRoutes = router;

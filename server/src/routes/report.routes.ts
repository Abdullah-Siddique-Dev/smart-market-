import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { ensureAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(ensureAuthenticated);
// All reporting endpoints are strictly reserved for the OWNER
router.use(requireRole(USER_ROLES.OWNER));

router.get('/profit', ReportController.getProfit);
router.get('/sales', ReportController.getSales);
router.get('/top-products', ReportController.getTopProducts);
router.get('/booker-performance', ReportController.getBookerPerformance);

export const reportRoutes = router;

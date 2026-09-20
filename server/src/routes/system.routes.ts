import { Router } from 'express';
import { SystemController } from '../controllers/system.controller.js';
import { ensureAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { z } from 'zod';

const router = Router();

const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(1, 'Full name is required'),
    role: z.literal(USER_ROLES.OWNER).optional().default(USER_ROLES.OWNER),
  }),
});

// System health check can be public for uptime monitoring
router.get('/status', SystemController.getStatus);

router.use(ensureAuthenticated);

// Manual backup can be triggered by authenticated users
router.post('/backup', SystemController.triggerBackup);

// User administration is strictly for OWNER
router.get('/users', requireRole(USER_ROLES.OWNER), SystemController.getUsers);
router.post('/users', requireRole(USER_ROLES.OWNER), validate(createUserSchema), SystemController.createUser);

export const systemRoutes = router;

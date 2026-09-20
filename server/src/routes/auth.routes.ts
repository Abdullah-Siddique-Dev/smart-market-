import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/session', AuthController.getSession);
router.post('/change-password', ensureAuthenticated, validate(changePasswordSchema), AuthController.changePassword);

export const authRoutes = router;

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthenticatedUser } from '../auth/passport.js';

export class AuthController {
  static login(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate(
      'local',
      (err: Error | null, user: AuthenticatedUser | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) {
          res.status(401).json(errorResponse(info?.message || 'Login failed', 'INVALID_CREDENTIALS'));
          return;
        }

        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              full_name: user.full_name,
            },
            message: 'Logged in successfully',
          });
        });
      }
    )(req, res, next);
  }

  static logout(req: Request, res: Response, next: NextFunction): void {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json(successResponse(null, 'Logged out successfully'));
      });
    });
  }

  static getSession(req: Request, res: Response): void {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      res.json({
        success: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          full_name: req.user.full_name,
        },
      });
      return;
    }

    res.json({
      success: true,
      user: null,
    });
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }
}

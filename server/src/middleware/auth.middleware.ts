import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { UserRole } from '../config/constants.js';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json(errorResponse('Authentication required. Please log in.', 'UNAUTHORIZED'));
}

export function requireRole(allowedRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json(errorResponse('Authentication required.', 'UNAUTHORIZED'));
      return;
    }

    if (req.user?.role !== allowedRole) {
      res.status(403).json(
        errorResponse(
          `Forbidden: This action requires ${allowedRole} administrative privileges.`,
          'FORBIDDEN'
        )
      );
      return;
    }

    next();
  };
}

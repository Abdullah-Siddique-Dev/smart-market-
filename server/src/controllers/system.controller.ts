import { Request, Response, NextFunction } from 'express';
import { SystemService } from '../services/system.service.js';
import { successResponse } from '../utils/response.js';

export class SystemController {
  static getStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const status = SystemService.getStatus();
      res.json(successResponse(status));
    } catch (error) {
      next(error);
    }
  }

  static async triggerBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const backup = await SystemService.triggerBackup();
      res.status(201).json(successResponse(backup, 'Database snapshot backup created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static getUsers(req: Request, res: Response, next: NextFunction): void {
    try {
      const users = SystemService.getUsers();
      res.json(successResponse(users));
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await SystemService.createUser(req.body);
      res.status(201).json(successResponse(user, 'System user created successfully'));
    } catch (error) {
      next(error);
    }
  }
}

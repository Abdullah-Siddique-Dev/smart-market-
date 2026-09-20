import { Request, Response, NextFunction } from 'express';
import { DispatchSlipService } from '../services/dispatchSlip.service.js';
import { successResponse } from '../utils/response.js';

export class DispatchSlipController {
  static getSlips(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = DispatchSlipService.getSlips(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getSlipById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const slip = DispatchSlipService.getSlipById(id);
      res.json(successResponse(slip));
    } catch (error) {
      next(error);
    }
  }

  static generateSlip(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const slip = DispatchSlipService.generateSlip({
        ...req.body,
        created_by: userId,
      });
      res.status(201).json(successResponse(slip, 'Dispatch slip generated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static reconcileSlip(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const { reconciled_items } = req.body;
      const updated = DispatchSlipService.reconcileSlip(id, reconciled_items, userId);
      res.json(successResponse(updated, 'Dispatch slip reconciled and returned stock credited'));
    } catch (error) {
      next(error);
    }
  }
}

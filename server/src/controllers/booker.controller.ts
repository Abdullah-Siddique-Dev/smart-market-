import { Request, Response, NextFunction } from 'express';
import { BookerService } from '../services/booker.service.js';
import { successResponse } from '../utils/response.js';

export class BookerController {
  static getBookers(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = BookerService.getBookers(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getBookerById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const booker = BookerService.getBookerById(id);
      res.json(successResponse(booker));
    } catch (error) {
      next(error);
    }
  }

  static createBooker(req: Request, res: Response, next: NextFunction): void {
    try {
      const booker = BookerService.createBooker(req.body);
      res.status(201).json(successResponse(booker, 'Order booker added successfully'));
    } catch (error) {
      next(error);
    }
  }

  static updateBooker(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = BookerService.updateBooker(id, req.body);
      res.json(successResponse(updated, 'Order booker updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static getBookerPerformance(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const performance = BookerService.getBookerPerformance(id);
      res.json(successResponse(performance));
    } catch (error) {
      next(error);
    }
  }

  static getTodayReconciliation(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const reconciliation = BookerService.getTodayReconciliation(id);
      res.json(successResponse(reconciliation));
    } catch (error) {
      next(error);
    }
  }

  static reconcileBooker(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const result = BookerService.reconcileBooker(id, {
        ...req.body,
        verified_by: userId,
      });
      res.json(successResponse(result, 'Booker settlement recorded successfully'));
    } catch (error) {
      next(error);
    }
  }
}

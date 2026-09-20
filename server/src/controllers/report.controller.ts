import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';
import { successResponse } from '../utils/response.js';

export class ReportController {
  static getProfit(req: Request, res: Response, next: NextFunction): void {
    try {
      const period = String(req.query.period || 'month');
      const startDate = req.query.start_date ? String(req.query.start_date) : undefined;
      const endDate = req.query.end_date ? String(req.query.end_date) : undefined;

      const report = ReportService.getProfitReport(period, startDate, endDate);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static getSales(req: Request, res: Response, next: NextFunction): void {
    try {
      const period = String(req.query.period || 'month');
      const startDate = req.query.start_date ? String(req.query.start_date) : undefined;
      const endDate = req.query.end_date ? String(req.query.end_date) : undefined;

      const report = ReportService.getSalesReport(period, startDate, endDate);
      res.json(successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  static getTopProducts(req: Request, res: Response, next: NextFunction): void {
    try {
      const period = String(req.query.period || 'week');
      const limit = parseInt(String(req.query.limit || '10'), 10);

      const products = ReportService.getTopProducts(period, limit);
      res.json(successResponse(products));
    } catch (error) {
      next(error);
    }
  }

  static getBookerPerformance(req: Request, res: Response, next: NextFunction): void {
    try {
      const summary = ReportService.getBookerPerformanceSummary();
      res.json(successResponse(summary));
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service.js';
import { successResponse } from '../utils/response.js';

export class AuditController {
  static getLedger(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = AuditService.getInventoryLedger(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getLedgerByProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      const productId = parseInt(req.params.product_id, 10);
      const result = AuditService.getLedgerByProductId(productId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getStockReconciliation(req: Request, res: Response, next: NextFunction): void {
    try {
      const reconciliation = AuditService.getStockReconciliation();
      res.json(successResponse(reconciliation));
    } catch (error) {
      next(error);
    }
  }

  static recordStockAdjustment(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const entry = AuditService.recordStockAdjustment({
        ...req.body,
        performed_by: userId,
      });
      res.status(201).json(successResponse(entry, 'Stock adjustment recorded with audit trail'));
    } catch (error) {
      next(error);
    }
  }

  static exportCsv(req: Request, res: Response, next: NextFunction): void {
    try {
      const csv = AuditService.exportLedgerCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="smart_market_inventory_audit_${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

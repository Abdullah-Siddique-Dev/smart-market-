import { Request, Response, NextFunction } from 'express';
import { BillService } from '../services/bill.service.js';
import { successResponse } from '../utils/response.js';

export class BillController {
  static getBills(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = BillService.getBills(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getBillById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const bill = BillService.getBillById(id);
      res.json(successResponse(bill));
    } catch (error) {
      next(error);
    }
  }

  static createBill(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const result = BillService.createBill({
        ...req.body,
        created_by: userId,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static getPrintBill(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const printData = BillService.getBillPrintData(id);
      res.json(successResponse(printData));
    } catch (error) {
      next(error);
    }
  }
}

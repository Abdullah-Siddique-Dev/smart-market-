import { Request, Response, NextFunction } from 'express';
import { ShopService } from '../services/shop.service.js';
import { successResponse } from '../utils/response.js';

export class ShopController {
  static getShops(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = ShopService.getShops(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getShopById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const shop = ShopService.getShopById(id);
      res.json(successResponse(shop));
    } catch (error) {
      next(error);
    }
  }

  static createShop(req: Request, res: Response, next: NextFunction): void {
    try {
      const shop = ShopService.createShop(req.body);
      res.status(201).json(successResponse(shop, 'Retail shop added successfully'));
    } catch (error) {
      next(error);
    }
  }

  static updateShop(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = ShopService.updateShop(id, req.body);
      res.json(successResponse(updated, 'Retail shop updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static getShopLedger(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const ledger = ShopService.getShopLedger(id);
      res.json(successResponse(ledger));
    } catch (error) {
      next(error);
    }
  }

  static recordPayment(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const result = ShopService.recordPayment(id, {
        ...req.body,
        received_by: userId,
      });
      res.status(201).json(successResponse(result, 'Payment recorded and balance updated'));
    } catch (error) {
      next(error);
    }
  }
}

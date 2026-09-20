import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { DispatchSlipService } from '../services/dispatchSlip.service.js';
import { BillService } from '../services/bill.service.js';
import { successResponse } from '../utils/response.js';

export class OrderController {
  static getOrders(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = OrderService.getOrders(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getOrderById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const order = OrderService.getOrderById(id);
      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  }

  static createOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const order = OrderService.createOrder({
        ...req.body,
        created_by: userId,
      });
      res.status(201).json(successResponse(order, 'Order created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static updateOrderStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const updated = OrderService.updateOrderStatus(id, status);
      res.json(successResponse(updated, 'Order status updated'));
    } catch (error) {
      next(error);
    }
  }

  static updateOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = OrderService.updateOrder(id, req.body);
      res.json(successResponse(updated, 'Order updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static dispatchOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const order = OrderService.getOrderById(id);
      const userId = req.user!.id;

      const slip = DispatchSlipService.generateSlip({
        order_booker_id: order.order_booker_id,
        order_ids: [id],
        notes: `Auto-generated for order ${order.order_number}`,
        created_by: userId,
      });

      res.status(201).json(successResponse(slip, 'Dispatch slip generated for order'));
    } catch (error) {
      next(error);
    }
  }

  static billOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const { discount_amount, payment_status, paid_amount } = req.body;

      const billResult = BillService.convertOrderToBill({
        order_id: id,
        discount_amount: discount_amount || 0,
        payment_status: payment_status || 'PAID',
        paid_amount: paid_amount || 0,
        created_by: userId,
      });

      res.status(201).json(billResult);
    } catch (error) {
      next(error);
    }
  }
}

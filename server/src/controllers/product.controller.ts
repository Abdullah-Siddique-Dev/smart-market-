import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { successResponse } from '../utils/response.js';
import { USER_ROLES } from '../config/constants.js';

export class ProductController {
  static getProducts(req: Request, res: Response, next: NextFunction): void {
    try {
      const isOwner = req.user?.role === USER_ROLES.OWNER;
      const result = ProductService.getProducts(req.query, isOwner);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getProductById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const isOwner = req.user?.role === USER_ROLES.OWNER;
      const product = ProductService.getProductById(id, isOwner);
      res.json(successResponse(product));
    } catch (error) {
      next(error);
    }
  }

  static createProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      const newProduct = ProductService.createProduct(req.body);
      res.status(201).json(successResponse(newProduct, 'Product created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static updateProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = ProductService.updateProduct(id, req.body);
      res.json(successResponse(updated, 'Product updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static deactivateProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      ProductService.deactivateProduct(id);
      res.json(successResponse(null, 'Product deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static getStockStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const lowStock = ProductService.getLowStockProducts();
      res.json(successResponse(lowStock));
    } catch (error) {
      next(error);
    }
  }

  static searchProducts(req: Request, res: Response, next: NextFunction): void {
    try {
      const q = String(req.query.q || req.query.search || '');
      const results = ProductService.searchProductsForPos(q);
      res.json(successResponse(results));
    } catch (error) {
      next(error);
    }
  }
}

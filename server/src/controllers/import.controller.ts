import { Request, Response, NextFunction } from 'express';
import { ImportService } from '../services/import.service.js';
import { successResponse } from '../utils/response.js';

export class ImportController {
  static getImports(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = ImportService.getImports(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getImportById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const record = ImportService.getImportById(id);
      res.json(successResponse(record));
    } catch (error) {
      next(error);
    }
  }

  static recordImport(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const record = ImportService.recordImport({
        ...req.body,
        received_by: userId,
      });
      res.status(201).json(successResponse(record, 'Import batch recorded and stock incremented successfully'));
    } catch (error) {
      next(error);
    }
  }
}

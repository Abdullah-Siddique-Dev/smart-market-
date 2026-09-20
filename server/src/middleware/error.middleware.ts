import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code, err.details));
    return;
  }

  // Handle SQLite specific errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json(errorResponse('A record with this unique identifier already exists', 'DUPLICATE_RESOURCE'));
    return;
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json(errorResponse('Referenced foreign key record does not exist', 'FOREIGN_KEY_VIOLATION'));
    return;
  }

  if (err.message && err.message.includes('CHECK constraint failed')) {
    res.status(400).json(errorResponse(`Validation rule failed: ${err.message}`, 'CHECK_CONSTRAINT_VIOLATION'));
    return;
  }

  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json(
    errorResponse(
      isDev ? err.message : 'An internal server error occurred',
      'INTERNAL_SERVER_ERROR',
      isDev ? err.stack : undefined
    )
  );
}

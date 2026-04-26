import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { MulterError } from 'multer';

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[Error]', err.message);

  // Multer-specific errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${process.env['MAX_FILE_SIZE_MB'] ?? 10}MB.`,
      });
      return;
    }

    res.status(400).json({ success: false, message: err.message });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({ success: false, message });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  });
}

import type { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
): void {
  const body: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  error?: string,
): void {
  const body: ApiResponse = { success: false, message, error };
  res.status(statusCode).json(body);
}

export function sendEmpty(res: Response, message = 'No content available'): void {
  res.status(200).json({ success: true, message, data: null });
}

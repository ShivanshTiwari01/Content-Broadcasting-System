import type { Request, Response, RequestHandler } from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerService, loginService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, 'Validation failed', 400, result.error.issues[0]?.message);
      return;
    }

    const data = await registerService(result.data);
    sendSuccess(res, 'User registered successfully', data, 201);
  },
);

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, 'Validation failed', 400, result.error.issues[0]?.message);
      return;
    }

    const data = await loginService(result.data);
    sendSuccess(res, 'Login successful', data);
  },
);

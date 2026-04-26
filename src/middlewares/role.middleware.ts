import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import { sendError } from '../utils/response.js';

/**
 * Factory that returns a middleware requiring the user to have one of the specified roles.
 * Must be used after `authenticate`.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}`,
        403,
      );
      return;
    }

    next();
  };
}

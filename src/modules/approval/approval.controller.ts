import type { Response, RequestHandler } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { rejectSchema } from './approval.schema.js';
import {
  getPendingContent,
  approveContent,
  rejectContent,
} from './approval.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listPending: RequestHandler = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const content = await getPendingContent();
    sendSuccess(res, 'Pending content fetched successfully', content);
  },
);

export const approve: RequestHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const content = await approveContent(
      req.params['id']! as string,
      req.user!.userId,
    );
    sendSuccess(res, 'Content approved successfully', content);
  },
);

export const reject: RequestHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = rejectSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, 'Validation failed', 400, result.error.issues[0]?.message);
      return;
    }

    const content = await rejectContent(
      req.params['id']! as string,
      req.user!.userId,
      result.data,
    );
    sendSuccess(res, 'Content rejected', content);
  },
);

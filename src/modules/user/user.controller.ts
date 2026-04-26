import type { Response, RequestHandler } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { getUserProfile, listTeachers } from './user.service.js';
import { sendSuccess } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getProfile: RequestHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await getUserProfile(req.user!.userId);
    sendSuccess(res, 'Profile fetched successfully', user);
  },
);

export const getTeachers: RequestHandler = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const teachers = await listTeachers();
    sendSuccess(res, 'Teachers fetched successfully', teachers);
  },
);

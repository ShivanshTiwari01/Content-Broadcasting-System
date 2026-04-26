import type { Request, Response, RequestHandler } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { uploadContentSchema } from './content.schema.js';
import {
  uploadContent,
  getMyContent,
  getContentById,
  getAllContent,
  deleteContent,
} from './content.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const upload: RequestHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      sendError(res, 'File is required', 400);
      return;
    }

    const result = uploadContentSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, 'Validation failed', 400, result.error.issues[0]?.message);
      return;
    }

    const content = await uploadContent(
      req.user!.userId,
      req.file,
      result.data,
    );
    sendSuccess(res, 'Content uploaded and pending approval', content, 201);
  },
);

export const getMyContentHandler: RequestHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const content = await getMyContent(req.user!.userId);
    sendSuccess(res, 'Content fetched successfully', content);
  },
);

export const getOne: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const content = await getContentById(req.params['id']! as string);
    sendSuccess(res, 'Content fetched successfully', content);
  },
);

export const getAll: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, subject, teacherId } = req.query as Record<
      string,
      string | undefined
    >;
    const content = await getAllContent({ status, subject, teacherId });
    sendSuccess(res, 'Content fetched successfully', content);
  },
);

export const remove: RequestHandler = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await deleteContent(req.params['id']! as string, req.user!.userId);
    sendSuccess(res, 'Content deleted successfully');
  },
);

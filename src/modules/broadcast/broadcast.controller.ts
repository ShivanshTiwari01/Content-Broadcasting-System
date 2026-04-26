import type { Request, Response, RequestHandler } from 'express';
import { getLiveContent, getSubjectAnalytics } from './broadcast.service.js';
import { sendSuccess, sendEmpty } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * GET /content/live/:teacherId
 * GET /content/live/:teacherId?subject=maths
 *
 * Public endpoint – no authentication required.
 * Returns currently active content per subject for the given teacher.
 */
export const getLive: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { teacherId } = req.params as { teacherId: string };
    const subject = req.query['subject'] as string | undefined;

    const result = await getLiveContent(teacherId, subject);

    // If the result object is empty or all subjects have null content
    const hasContent = Object.values(result).some((v) => v !== null);

    if (!hasContent) {
      sendEmpty(res, 'No content available');
      return;
    }

    sendSuccess(res, 'Live content fetched successfully', result);
  },
);

/**
 * GET /content/live/:teacherId/analytics
 * Bonus: subject-wise analytics for a teacher's approved content
 */
export const getAnalytics: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { teacherId } = req.params as { teacherId: string };
    const analytics = await getSubjectAnalytics(teacherId);
    sendSuccess(res, 'Analytics fetched successfully', analytics);
  },
);

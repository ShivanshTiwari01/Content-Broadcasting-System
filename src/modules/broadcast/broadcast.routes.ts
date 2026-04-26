import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getLive, getAnalytics } from './broadcast.controller.js';

const router = Router();

// Rate limiter: max 60 requests per minute per IP on the public broadcast API
const liveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * GET /content/live/:teacherId
 * PUBLIC – no auth required
 */
router.get('/:teacherId', liveLimiter, getLive);

/**
 * GET /content/live/:teacherId/analytics
 * Bonus analytics endpoint (public)
 */
router.get('/:teacherId/analytics', liveLimiter, getAnalytics);

export default router;

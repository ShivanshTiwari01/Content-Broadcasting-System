import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { getProfile, getTeachers } from './user.controller.js';

const router: Router = Router();

router.get('/me', authenticate, getProfile);

router.get(
  '/teachers',
  authenticate,
  requireRole('PRINCIPAL', 'TEACHER'),
  getTeachers,
);

export default router;

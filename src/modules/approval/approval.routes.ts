import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { listPending, approve, reject } from './approval.controller.js';

const router: Router = Router();

router.use(authenticate, requireRole('PRINCIPAL'));

router.get('/pending', listPending);

router.patch('/:id/approve', approve);

router.patch('/:id/reject', reject);

export default router;

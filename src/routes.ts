import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import contentRoutes from './modules/content/content.routes.js';
import approvalRoutes from './modules/approval/approval.routes.js';
import broadcastRoutes from './modules/broadcast/broadcast.routes.js';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content/live', broadcastRoutes);
router.use('/content', contentRoutes);
router.use('/approval', approvalRoutes);

export default router;

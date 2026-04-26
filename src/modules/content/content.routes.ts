import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { upload as uploadMiddleware } from '../../middlewares/upload.middleware.js';
import {
  upload,
  getMyContentHandler,
  getOne,
  getAll,
  remove,
} from './content.controller.js';

const router: Router = Router();

router.post(
  '/upload',
  authenticate,
  requireRole('TEACHER'),
  uploadMiddleware.single('file'),
  upload,
);

router.get('/mine', authenticate, requireRole('TEACHER'), getMyContentHandler);

router.get('/', authenticate, requireRole('PRINCIPAL'), getAll);

router.get('/:id', authenticate, getOne);

router.delete('/:id', authenticate, requireRole('TEACHER'), remove);

export default router;

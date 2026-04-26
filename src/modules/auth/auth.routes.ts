import { Router } from 'express';
import { register, login } from './auth.controller.js';

const router: Router = Router();

/**
 * POST /auth/register
 * Body: { name, email, password, role? }
 */
router.post('/register', register);

/**
 * POST /auth/login
 * Body: { email, password }
 */
router.post('/login', login);

export default router;

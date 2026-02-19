/**
 * Rutas de autenticación
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/diagnostic
router.get('/diagnostic', authController.diagnostic);

// GET /api/auth/me - requiere autenticación
router.get('/me', authMiddleware, authController.me);

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

// POST /api/auth/refresh - refrescar token
router.post('/refresh', authController.refresh);

export default router;

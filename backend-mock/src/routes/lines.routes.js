/**
 * Rutas para líneas dibujadas
 */

import { Router } from 'express';
import { linesController } from '../controllers/lines.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Requiere auth para asociar createdBy
router.get('/', authMiddleware, linesController.list);
router.post('/', authMiddleware, linesController.create);

export default router;

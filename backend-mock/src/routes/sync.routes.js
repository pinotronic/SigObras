/**
 * Rutas de sincronización
 */

import { Router } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/sync/status - obtener estado de sincronización
router.get('/status', syncController.getStatus);

// POST /api/sync/batch - sincronizar lote de operaciones
router.post('/batch', syncController.batch);

export default router;

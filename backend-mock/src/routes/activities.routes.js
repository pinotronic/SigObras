/**
 * Rutas de actividades
 */

import { Router } from 'express';
import { activitiesController } from '../controllers/activities.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/activities/:workId/:activityId/start
router.post('/:workId/:activityId/start', activitiesController.start);

// POST /api/activities/:workId/:activityId/complete
router.post('/:workId/:activityId/complete', activitiesController.complete);

// PUT /api/activities/:workId/:activityId
router.put('/:workId/:activityId', activitiesController.update);

// GET /api/activities/:workId/:activityId
router.get('/:workId/:activityId', activitiesController.getById);

export default router;

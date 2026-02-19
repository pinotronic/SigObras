/**
 * Rutas de obras
 */

import { Router } from 'express';
import { worksController } from '../controllers/works.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/works - listar obras (con filtros)
router.get('/', worksController.list);

// GET /api/works/:id - obtener detalle de obra
router.get('/:id', worksController.getById);

// GET /api/works/:id/activities - obtener actividades de una obra
router.get('/:id/activities', worksController.getActivities);

// POST /api/works - crear obra (admin/coordinador)
router.post('/', worksController.create);

// PUT /api/works/:id - actualizar obra
router.put('/:id', worksController.update);

// DELETE /api/works/:id - eliminar obra (admin only)
router.delete('/:id', worksController.delete);

export default router;

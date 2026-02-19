/**
 * Rutas de mapas (proxy a MapServer)
 */

import { Router } from 'express';
import { mapsController } from '../controllers/maps.controller.js';

const router = Router();

// GET /api/maps/proxy - Proxy a MapServer (no requiere auth para facilitar desarrollo)
router.get('/proxy', mapsController.proxy);

// GET /api/maps/layers - Obtener info de capas disponibles
router.get('/layers', mapsController.getLayers);

export default router;

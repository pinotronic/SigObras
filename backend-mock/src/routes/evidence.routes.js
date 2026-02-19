/**
 * Rutas de evidencias
 */

import { Router } from 'express';
import multer from 'multer';
import { evidenceController } from '../controllers/evidence.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Configurar multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/evidence - subir evidencia
router.post('/', upload.single('file'), evidenceController.upload);

// GET /api/evidence/:id - obtener evidencia
router.get('/:id', evidenceController.getById);

// DELETE /api/evidence/:id - eliminar evidencia
router.delete('/:id', evidenceController.delete);

export default router;

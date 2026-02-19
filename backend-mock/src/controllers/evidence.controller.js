/**
 * Controlador de evidencias
 */

import { v4 as uuidv4 } from 'uuid';

// Almacenar evidencias en memoria (en producción usar filesystem o S3)
const evidenceStore = new Map();

/**
 * POST /api/evidence
 */
async function upload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No se proporcionó archivo'
      });
    }

    const { activityId, notes, latitude, longitude } = req.body;

    // Generar ID
    const evidenceId = `evidence_${uuidv4()}`;

    // Crear registro de evidencia
    const evidence = {
      id: evidenceId,
      activityId,
      tipo: 'foto',
      mimetype: req.file.mimetype,
      size: req.file.size,
      originalName: req.file.originalname,
      notes: notes || '',
      location: (latitude && longitude) ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      } : null,
      usuario: req.user.id,
      timestamp: new Date().toISOString(),
      // En mock, guardamos el buffer en memoria
      buffer: req.file.buffer
    };

    // Guardar en store
    evidenceStore.set(evidenceId, evidence);

    console.log(`[Evidence] Subida: ${evidenceId} por ${req.user.username}`);

    // Responder sin el buffer
    const { buffer, ...evidenceResponse } = evidence;

    res.json({
      success: true,
      data: {
        ...evidenceResponse,
        url: `/api/evidence/${evidenceId}` // URL para recuperar
      },
      message: 'Evidencia guardada correctamente'
    });

  } catch (error) {
    console.error('[Evidence] Error en upload:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al subir evidencia'
    });
  }
}

/**
 * GET /api/evidence/:id
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const evidence = evidenceStore.get(id);

    if (!evidence) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Evidencia no encontrada'
      });
    }

    // Si se pide la imagen, devolverla
    if (req.query.download === 'true' && evidence.buffer) {
      res.setHeader('Content-Type', evidence.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${evidence.originalName}"`);
      return res.send(evidence.buffer);
    }

    // Devolver metadata
    const { buffer, ...metadata } = evidence;

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('[Evidence] Error en getById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener evidencia'
    });
  }
}

/**
 * DELETE /api/evidence/:id
 */
async function deleteEvidence(req, res) {
  try {
    const { id } = req.params;

    if (!evidenceStore.has(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Evidencia no encontrada'
      });
    }

    evidenceStore.delete(id);

    console.log(`[Evidence] Eliminada: ${id} por ${req.user.username}`);

    res.json({
      success: true,
      message: 'Evidencia eliminada'
    });

  } catch (error) {
    console.error('[Evidence] Error en delete:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al eliminar evidencia'
    });
  }
}

export const evidenceController = {
  upload,
  getById,
  delete: deleteEvidence
};

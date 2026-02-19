/**
 * Controlador de actividades
 */

import { mockActivities } from '../data/activities.data.js';

/**
 * POST /api/activities/:workId/:activityId/start
 */
async function start(req, res) {
  try {
    const { workId, activityId } = req.params;
    const { timestamp, location } = req.body;

    const activity = mockActivities.find(
      a => a.id === activityId && a.workId === workId
    );

    if (!activity) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Actividad no encontrada'
      });
    }

    if (activity.status !== 'pendiente') {
      return res.status(400).json({
        error: 'Invalid State',
        message: `Actividad en estado ${activity.status}, no se puede iniciar`
      });
    }

    // Actualizar actividad (en memoria)
    activity.status = 'en_proceso';
    activity.timestamps.inicio = timestamp || new Date().toISOString();
    activity.usuario = req.user.id;

    console.log(`[Activities] Iniciada: ${activity.nombre} por ${req.user.username}`);

    res.json({
      success: true,
      data: activity,
      message: 'Actividad iniciada'
    });

  } catch (error) {
    console.error('[Activities] Error en start:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al iniciar actividad'
    });
  }
}

/**
 * POST /api/activities/:workId/:activityId/complete
 */
async function complete(req, res) {
  try {
    const { workId, activityId } = req.params;
    const { evidenceIds, metrics, notes, geometry } = req.body;

    const activity = mockActivities.find(
      a => a.id === activityId && a.workId === workId
    );

    if (!activity) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Actividad no encontrada'
      });
    }

    if (activity.status === 'completada') {
      return res.status(400).json({
        error: 'Invalid State',
        message: 'Actividad ya completada'
      });
    }

    // Validar requisitos
    const validationErrors = [];

    if (activity.requisitos.geometria_requerida && !geometry) {
      validationErrors.push('Geometría requerida');
    }

    if (evidenceIds && evidenceIds.length < activity.requisitos.min_fotos) {
      validationErrors.push(`Mínimo ${activity.requisitos.min_fotos} fotos requeridas`);
    }

    if (activity.requisitos.campos_obligatorios) {
      for (const campo of activity.requisitos.campos_obligatorios) {
        if (!metrics || !metrics[campo]) {
          validationErrors.push(`Campo requerido: ${campo}`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Requisitos no cumplidos',
        validationErrors
      });
    }

    // Actualizar actividad
    activity.status = 'completada';
    activity.timestamps.fin = new Date().toISOString();
    activity.datos = metrics || activity.datos;
    activity.geometria = geometry || activity.geometria;
    activity.evidencias = evidenceIds || activity.evidencias;
    activity.notas = notes;

    console.log(`[Activities] Completada: ${activity.nombre} por ${req.user.username}`);

    res.json({
      success: true,
      data: activity,
      message: 'Actividad completada'
    });

  } catch (error) {
    console.error('[Activities] Error en complete:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al completar actividad'
    });
  }
}

/**
 * PUT /api/activities/:workId/:activityId
 */
async function update(req, res) {
  try {
    // TODO: Implementar actualización
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Actualizar actividad no implementado en mock'
    });

  } catch (error) {
    console.error('[Activities] Error en update:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al actualizar actividad'
    });
  }
}

/**
 * GET /api/activities/:workId/:activityId
 */
async function getById(req, res) {
  try {
    const { workId, activityId } = req.params;

    const activity = mockActivities.find(
      a => a.id === activityId && a.workId === workId
    );

    if (!activity) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Actividad no encontrada'
      });
    }

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('[Activities] Error en getById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener actividad'
    });
  }
}

export const activitiesController = {
  start,
  complete,
  update,
  getById
};

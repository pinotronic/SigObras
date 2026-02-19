/**
 * Controlador de obras
 */

import { mockWorks } from '../data/works.data.js';
import { mockActivities } from '../data/activities.data.js';

/**
 * GET /api/works - Listar obras con filtros
 */
async function list(req, res) {
  try {
    const {
      assignedTo,
      tipo,
      status,
      prioridad,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    let filteredWorks = [...mockWorks];

    // Filtrar por asignación (supervisor)
    if (assignedTo) {
      filteredWorks = filteredWorks.filter(w => w.responsable === assignedTo);
    }

    // Filtrar por tipo (agua, drenaje, mixta)
    if (tipo) {
      filteredWorks = filteredWorks.filter(w => w.tipo === tipo);
    }

    // Filtrar por status
    if (status) {
      filteredWorks = filteredWorks.filter(w => w.status === status);
    }

    // Filtrar por prioridad
    if (prioridad) {
      filteredWorks = filteredWorks.filter(w => w.prioridad === prioridad);
    }

    // Búsqueda de texto
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWorks = filteredWorks.filter(w =>
        w.nombre.toLowerCase().includes(searchLower) ||
        w.folio.toLowerCase().includes(searchLower) ||
        w.ubicacion.calle.toLowerCase().includes(searchLower)
      );
    }

    // Paginación
    const total = filteredWorks.length;
    const paginatedWorks = filteredWorks.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedWorks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('[Works] Error en list:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener obras'
    });
  }
}

/**
 * GET /api/works/:id - Obtener detalle de obra
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const work = mockWorks.find(w => w.id === id);

    if (!work) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Obra ${id} no encontrada`
      });
    }

    res.json({
      success: true,
      data: work
    });

  } catch (error) {
    console.error('[Works] Error en getById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener obra'
    });
  }
}

/**
 * GET /api/works/:id/activities - Obtener actividades de una obra
 */
async function getActivities(req, res) {
  try {
    const { id } = req.params;

    // Verificar que la obra existe
    const work = mockWorks.find(w => w.id === id);

    if (!work) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Obra ${id} no encontrada`
      });
    }

    // Obtener actividades de esta obra
    const activities = mockActivities.filter(a => a.workId === id);

    // Ordenar por orden sugerido
    activities.sort((a, b) => a.orden - b.orden);

    res.json({
      success: true,
      data: activities,
      summary: {
        total: activities.length,
        completadas: activities.filter(a => a.status === 'completada').length,
        enProceso: activities.filter(a => a.status === 'en_proceso').length,
        pendientes: activities.filter(a => a.status === 'pendiente').length,
        porcentajeAvance: Math.round(
          (activities.filter(a => a.status === 'completada').length / activities.length) * 100
        )
      }
    });

  } catch (error) {
    console.error('[Works] Error en getActivities:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener actividades'
    });
  }
}

/**
 * POST /api/works - Crear nueva obra
 */
async function create(req, res) {
  try {
    // TODO: Validar datos y crear obra
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Crear obra no implementado en mock'
    });

  } catch (error) {
    console.error('[Works] Error en create:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al crear obra'
    });
  }
}

/**
 * PUT /api/works/:id - Actualizar obra
 */
async function update(req, res) {
  try {
    // TODO: Validar datos y actualizar obra
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Actualizar obra no implementado en mock'
    });

  } catch (error) {
    console.error('[Works] Error en update:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al actualizar obra'
    });
  }
}

/**
 * DELETE /api/works/:id - Eliminar obra
 */
async function deleteWork(req, res) {
  try {
    // TODO: Eliminar obra
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Eliminar obra no implementado en mock'
    });

  } catch (error) {
    console.error('[Works] Error en delete:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al eliminar obra'
    });
  }
}

export const worksController = {
  list,
  getById,
  getActivities,
  create,
  update,
  delete: deleteWork
};

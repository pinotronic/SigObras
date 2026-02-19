/**
 * Controlador de sincronización
 */

// Almacenar último sync por usuario (en memoria)
const lastSyncByUser = new Map();

/**
 * GET /api/sync/status
 */
async function getStatus(req, res) {
  try {
    const userId = req.user.id;
    const lastSync = lastSyncByUser.get(userId);

    res.json({
      success: true,
      data: {
        lastSync: lastSync || null,
        serverTime: new Date().toISOString(),
        pendingCount: 0 // En mock no hay pendientes
      }
    });

  } catch (error) {
    console.error('[Sync] Error en getStatus:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener estado de sincronización'
    });
  }
}

/**
 * POST /api/sync/batch - Sincronizar lote de operaciones
 */
async function batch(req, res) {
  try {
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Se requiere un array de operaciones'
      });
    }

    console.log(`[Sync] Procesando ${operations.length} operaciones de ${req.user.username}`);

    const results = {
      synced: [],
      errors: []
    };

    // Procesar cada operación
    for (const op of operations) {
      try {
        // Validar operación
        if (!op.type || !op.entity || !op.payload) {
          throw new Error('Operación inválida: faltan campos requeridos');
        }

        // Simular procesamiento
        await processOperation(op, req.user);

        results.synced.push({
          id: op.id,
          type: op.type,
          entity: op.entity,
          success: true
        });

      } catch (error) {
        console.error(`[Sync] Error en operación ${op.id}:`, error);

        results.errors.push({
          id: op.id,
          type: op.type,
          entity: op.entity,
          error: error.message
        });
      }
    }

    // Actualizar último sync
    lastSyncByUser.set(req.user.id, new Date().toISOString());

    res.json({
      success: true,
      data: results,
      summary: {
        total: operations.length,
        synced: results.synced.length,
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error('[Sync] Error en batch:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al sincronizar'
    });
  }
}

/**
 * Procesar una operación de sincronización
 */
async function processOperation(operation, user) {
  const { type, entity, payload } = operation;

  console.log(`[Sync] Procesando: ${type} ${entity}`);

  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 100));

  // Aquí se procesaría la operación real
  // Por ahora solo simulamos éxito

  return { success: true };
}

export const syncController = {
  getStatus,
  batch
};

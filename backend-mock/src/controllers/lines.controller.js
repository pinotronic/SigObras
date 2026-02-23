/**
 * Controlador de líneas dibujadas en mapa
 * - POST /api/lines
 * - GET  /api/lines
 */

import { v4 as uuidv4 } from 'uuid';
import { addMockLine, listMockLines } from '../data/lines.data.js';
import { insertLine, isLinesDbEnabled, listLines } from '../models/lines.repository.js';

function toFeature(row) {
  const geometry = row.geojson;
  return {
    type: 'Feature',
    id: row.id,
    geometry,
    properties: {
      ...(row.properties || {}),
      createdBy: row.created_by,
      createdAt: row.created_at
    }
  };
}

function validateLineString(geometry) {
  if (!geometry || geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates)) {
    return 'geometry debe ser un GeoJSON LineString';
  }

  if (geometry.coordinates.length < 2) {
    return 'LineString requiere al menos 2 puntos';
  }

  for (const coord of geometry.coordinates) {
    if (!Array.isArray(coord) || coord.length < 2) {
      return 'Cada coordenada debe ser [lng, lat]';
    }

    const [lng, lat] = coord;
    if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) {
      return 'Coordenadas deben ser números';
    }
  }

  return null;
}

export const linesController = {
  async create(req, res) {
    try {
      const { geometry, properties } = req.body || {};

      const validationError = validateLineString(geometry);
      if (validationError) {
        return res.status(400).json({
          error: 'Bad Request',
          message: validationError
        });
      }

      const id = `line_${uuidv4()}`;
      const createdBy = req.user?.username || req.user?.id || 'unknown';

      if (isLinesDbEnabled()) {
        const row = await insertLine({ id, createdBy, geometry, properties });
        return res.status(201).json({
          success: true,
          feature: toFeature(row),
          storage: 'postgres'
        });
      }

      const mockRecord = {
        id,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        geojson: geometry,
        properties: properties || {}
      };

      addMockLine(mockRecord);

      return res.status(201).json({
        success: true,
        feature: toFeature(mockRecord),
        storage: 'memory'
      });

    } catch (error) {
      console.error('[LinesController] Error creando línea:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Error al guardar línea'
      });
    }
  },

  async list(req, res) {
    try {
      const rows = isLinesDbEnabled()
        ? await listLines()
        : listMockLines();

      const features = rows.map(toFeature);

      return res.json({
        type: 'FeatureCollection',
        features,
        storage: isLinesDbEnabled() ? 'postgres' : 'memory'
      });

    } catch (error) {
      console.error('[LinesController] Error listando líneas:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Error al listar líneas'
      });
    }
  }
};

export default linesController;

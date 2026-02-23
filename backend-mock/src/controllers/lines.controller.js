/**
 * Controlador de líneas dibujadas en mapa
 * - POST /api/lines
 * - GET  /api/lines
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';
import { appendFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { addMockLine, listMockLines } from '../data/lines.data.js';
import { insertLine, isLinesDbEnabled, listLines } from '../models/lines.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// backend-mock/src/controllers -> backend-mock
const backendRootDir = path.resolve(__dirname, '..', '..');

function shouldLogLinesToFile() {
  const raw = process.env.LINES_LOG_TO_FILE;
  if (raw === undefined || raw === null || raw === '') {
    // Requisito: registrar para observación de forma temporal por defecto.
    return true;
  }
  return String(raw).toLowerCase() === 'true' || String(raw) === '1';
}

function resolveLinesLogFilePath() {
  const configured = process.env.LINES_LOG_FILE;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(backendRootDir, configured);
  }

  // Por defecto: backend-mock/data/lines-temp.txt
  return path.resolve(backendRootDir, 'data', 'lines-temp.txt');
}

async function logLineToFile({ id, createdBy, geometry, properties, storage }) {
  if (!shouldLogLinesToFile()) return;

  const filePath = resolveLinesLogFilePath();
  const dir = path.dirname(filePath);

  const entry = {
    timestamp: new Date().toISOString(),
    id,
    createdBy,
    storage,
    geometry,
    properties: properties || {}
  };

  try {
    await mkdir(dir, { recursive: true });
    await appendFile(filePath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8' });
  } catch (error) {
    // No romper el guardado principal si el log temporal falla.
    console.warn('[LinesController] No se pudo escribir lines log file:', error?.message || error);
  }
}

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

        await logLineToFile({
          id: row.id,
          createdBy: row.created_by,
          geometry: row.geojson,
          properties: row.properties,
          storage: 'postgres'
        });

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

      await logLineToFile({
        id: mockRecord.id,
        createdBy: mockRecord.created_by,
        geometry: mockRecord.geojson,
        properties: mockRecord.properties,
        storage: 'memory'
      });

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

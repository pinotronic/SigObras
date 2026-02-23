/**
 * Repositorio de líneas (Postgres/PostGIS)
 */

import { dbEnabled, dbQuery } from '../utils/db.js';

export function isLinesDbEnabled() {
  return dbEnabled;
}

export async function insertLine({ id, createdBy, geometry, properties }) {
  const geojson = JSON.stringify(geometry);
  const props = properties ? JSON.stringify(properties) : JSON.stringify({});

  const result = await dbQuery(
    `INSERT INTO public.sapal_lines (
      id,
      created_by,
      geom,
      geojson,
      properties
    ) VALUES (
      $1,
      $2,
      ST_SetSRID(ST_GeomFromGeoJSON($3), 4326),
      $3::jsonb,
      $4::jsonb
    )
    RETURNING id, created_by, created_at, geojson, properties;`,
    [id, createdBy, geojson, props]
  );

  return result.rows[0];
}

export async function listLines() {
  const result = await dbQuery(
    `SELECT id, created_by, created_at, geojson, properties
     FROM public.sapal_lines
     ORDER BY created_at DESC
     LIMIT 500;`
  );

  return result.rows;
}

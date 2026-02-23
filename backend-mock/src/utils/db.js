/**
 * DB helper (Postgres/PostGIS) - opcional
 */

import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || '';

export const dbEnabled = Boolean(connectionString);

let pool = null;

export function getPool() {
  if (!dbEnabled) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString
    });
  }

  return pool;
}

export async function dbQuery(text, params = []) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('DB no configurada (DATABASE_URL vacío)');
  }

  return await activePool.query(text, params);
}

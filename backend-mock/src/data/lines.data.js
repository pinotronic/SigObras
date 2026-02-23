/**
 * Datos mock de líneas (fallback cuando no hay Postgres/PostGIS)
 */

export const mockLines = [];

export function addMockLine(line) {
  mockLines.unshift(line);
  return line;
}

export function listMockLines() {
  return mockLines;
}

export default mockLines;

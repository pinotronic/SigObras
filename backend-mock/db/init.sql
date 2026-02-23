-- Inicialización Postgres/PostGIS para SAPAL Obras

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.sapal_lines (
  id text PRIMARY KEY,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  geom geometry(LineString, 4326) NOT NULL,
  geojson jsonb NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sapal_lines_geom ON public.sapal_lines USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_sapal_lines_created_at ON public.sapal_lines (created_at DESC);

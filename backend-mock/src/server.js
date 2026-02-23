/**
 * Servidor Express Mock para desarrollo de SAPAL Obras Móvil
 */

// Cargar variables desde backend-mock/.env si existe
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import worksRoutes from './routes/works.routes.js';
import activitiesRoutes from './routes/activities.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import syncRoutes from './routes/sync.routes.js';
import mapsRoutes from './routes/maps.routes.js';
import linesRoutes from './routes/lines.routes.js';

// Configuración
const PORT = process.env.PORT || 3001;
const app = express();

// Middleware de seguridad y performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());

// CORS - permitir todas las origins en desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsers
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'mock',
    authMode: (process.env.AUTH_MODE || 'mock').toLowerCase(),
    authUrl: process.env.AUTH_URL || null,
    mapServerUrl: process.env.MAPSERVER_URL || null
  });
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/lines', linesRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'SAPAL Obras Backend Mock',
    version: '0.1.0',
    status: 'running',
    endpoints: [
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'GET /api/works',
      'GET /api/works/:id',
      'GET /api/works/:id/activities',
      'POST /api/works/:workId/activities/:activityId/start',
      'POST /api/works/:workId/activities/:activityId/complete',
      'POST /api/evidence',
      'GET /api/sync/status',
      'POST /api/sync/batch',
      'GET /api/maps/proxy'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} no encontrado`,
    availableEndpoints: '/api'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════');
  console.log('  SAPAL Obras Backend Mock');
  console.log('═══════════════════════════════════════════════');
  console.log(`  🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log(`  📚 Endpoints: http://localhost:${PORT}/api`);
  console.log(`  ❤️  Health: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════');
  console.log('  [MODO MOCK] - Datos de prueba activos');
  console.log('  Credenciales: admin/admin, supervisor/supervisor');
  console.log('═══════════════════════════════════════════════\n');
});

export default app;

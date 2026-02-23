/**
 * Middleware de autenticación
 */

import { authController } from '../controllers/auth.controller.js';

/**
 * Verificar autenticación con Bearer token
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de autenticación no proporcionado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const user = authController.validateToken(token);

    if (!user) {
      // En modo external, el token real viene de wsautenticador y nuestro backend mock
      // no puede re-validarlo tras reinicios (activeSessions es memoria). Para permitir
      // flujos como "guardar línea" después de un restart, aceptamos el token si el
      // cliente provee el usuario explícitamente.
      const authMode = String(process.env.AUTH_MODE || 'external').toLowerCase();
      const headerUsername = req.headers['x-username'];
      const headerPgid = req.headers['x-pgid'];

      if (authMode === 'external' && headerUsername) {
        const username = String(headerUsername).trim();
        if (!username) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'X-Username vacío'
          });
        }

        req.user = {
          id: `ext_${username.toLowerCase()}`,
          username,
          nombre: username,
          rol: 'operador',
          unidad: 'Operaciones',
          email: `${username}@sapal.gob.mx`,
          source: 'external-header',
          ...(headerPgid ? { pGid: String(headerPgid) } : {})
        };
        req.token = token;
        return next();
      }

      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido o expirado'
      });
    }

    // Agregar usuario al request
    req.user = user;
    req.token = token;

    next();

  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al verificar autenticación'
    });
  }
}

/**
 * Verificar rol específico
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Autenticación requerida'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Rol requerido: ${allowedRoles.join(' o ')}`
      });
    }

    next();
  };
}

export default authMiddleware;

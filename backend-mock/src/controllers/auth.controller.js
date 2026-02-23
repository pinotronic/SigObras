/**
 * Controlador de autenticación
 */

import { v4 as uuidv4 } from 'uuid';
import { mockUsers } from '../data/users.data.js';

// Modo de autenticación
// - external: valida contra wsautenticador (dev) y devuelve token real para MapServer
// - mock: valida contra usuarios locales (admin/admin, etc.)
const AUTH_MODE = (process.env.AUTH_MODE || 'external').toLowerCase();
const AUTH_FALLBACK_TO_MOCK = process.env.AUTH_FALLBACK_TO_MOCK !== 'false';

const EXTERNAL_AUTH_URL =
  process.env.AUTH_URL ||
  'https://dev.wsautenticador.sapal.gob.mx/api/autenticador/fObtenerToken/';

const ALLOW_INSECURE_TLS = process.env.AUTH_ALLOW_INSECURE_TLS === 'true';

if (ALLOW_INSECURE_TLS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('[Auth] AUTH_ALLOW_INSECURE_TLS=true -> TLS verification disabled (solo desarrollo)');
}

// Almacén de tokens en memoria (en producción usar Redis o BD)
const activeSessions = new Map();

/**
 * Generar token mock
 */
function generateToken(userId) {
  const token = `mock_${userId}_${Date.now()}_${uuidv4()}`;
  const expiresAt = Date.now() + (8 * 60 * 60 * 1000); // 8 horas

  return { token, expiresAt };
}

function extractExternalToken(payload) {
  if (!payload) return null;

  if (typeof payload === 'string') {
    return payload;
  }

  const tokenKeys = new Set([
    'token',
    'access_token',
    'accesstoken',
    'accessToken'.toLowerCase(),
    'cltoken',
    'cl_token',
    'jwt'
  ]);

  const visit = (node, depth = 0) => {
    if (!node || depth > 4) return null;

    if (typeof node === 'string') {
      return node;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        const keyLower = String(key).toLowerCase();
        if (tokenKeys.has(keyLower) && typeof value === 'string' && value) {
          return value;
        }
      }

      for (const value of Object.values(node)) {
        const found = visit(value, depth + 1);
        if (found) return found;
      }
    }

    return null;
  };

  return visit(payload);
}

function extractExternalGid(payload) {
  if (!payload || typeof payload === 'string') return null;

  const gidKeys = new Set([
    'pgid',
    'pgId'.toLowerCase(),
    'pgidusuario',
    'gid',
    'clgid',
    'idgrupo',
    'id_group'
  ]);

  const visit = (node, depth = 0) => {
    if (!node || depth > 4) return null;
    if (typeof node === 'string' || typeof node === 'number') return null;

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item, depth + 1);
        if (found !== null) return found;
      }
      return null;
    }

    if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        const keyLower = String(key).toLowerCase();
        if (gidKeys.has(keyLower) && (typeof value === 'string' || typeof value === 'number') && value !== '') {
          return value;
        }
      }

      for (const value of Object.values(node)) {
        const found = visit(value, depth + 1);
        if (found !== null) return found;
      }
    }

    return null;
  };

  return visit(payload);
}

async function authenticateWithExternal(username, password) {
  let externalResponse;

  try {
    externalResponse = await fetch(EXTERNAL_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clOperador: username,
        clPassword: password
      })
    });
  } catch (error) {
    const networkCode = error?.cause?.code || null;
    const networkMessage =
      networkCode === 'ENOTFOUND' ? 'No se pudo resolver el host del autenticador (DNS).' :
      networkCode === 'ETIMEDOUT' ? 'Tiempo de espera agotado al conectar con autenticador.' :
      networkCode === 'ECONNREFUSED' ? 'Conexión rechazada por el autenticador.' :
      networkCode === 'ECONNRESET' ? 'Conexión interrumpida por la red o firewall.' :
      networkCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ? 'Certificado TLS no confiable para Node. Requiere certificado corporativo o AUTH_ALLOW_INSECURE_TLS=true en desarrollo.' :
      'No hay conectividad al servicio de autenticación (VPN/proxy/firewall).';

    const connectivityError = new Error(networkMessage);
    connectivityError.type = 'CONNECTIVITY_ERROR';
    connectivityError.code = networkCode;
    throw connectivityError;
  }

  const rawBody = await externalResponse.text();

  let parsedBody = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = { message: rawBody };
    }
  }

  if (!externalResponse.ok) {
    const externalMessage =
      parsedBody?.message ||
      parsedBody?.mensaje ||
      parsedBody?.error ||
      'Usuario o contraseña incorrectos';

    const externalError = new Error(externalMessage);
    externalError.type = externalResponse.status >= 500 ? 'CONNECTIVITY_ERROR' : 'AUTH_ERROR';
    externalError.status = externalResponse.status;
    throw externalError;
  }

  const token = extractExternalToken(parsedBody);
  if (!token) {
    const keys = (parsedBody && typeof parsedBody === 'object') ? Object.keys(parsedBody) : null;
    const payloadType = Array.isArray(parsedBody) ? 'array' : typeof parsedBody;
    throw new Error(
      `El servicio externo no devolvió token (payloadType=${payloadType}${keys ? ` keys=${keys.join(',')}` : ''})`
    );
  }

  return {
    token,
    externalPayload: parsedBody
  };
}

function authenticateWithMock(username, password) {
  const mockUser = mockUsers.find(
    u => u.username.toLowerCase() === String(username).toLowerCase()
  );

  if (!mockUser || mockUser.password !== password) {
    const invalidCredentialsError = new Error('Usuario o contraseña incorrectos');
    invalidCredentialsError.type = 'AUTH_ERROR';
    throw invalidCredentialsError;
  }

  if (mockUser.active === false) {
    const inactiveUserError = new Error('Usuario inactivo');
    inactiveUserError.type = 'AUTH_ERROR';
    throw inactiveUserError;
  }

  const { token, expiresAt } = generateToken(mockUser.id);

  // Guardar sesión
  activeSessions.set(token, {
    userId: mockUser.id,
    username: mockUser.username,
    createdAt: Date.now(),
    expiresAt
  });

  const { password: _, ...userData } = mockUser;

  return {
    token,
    expiresAt,
    userData: {
      ...userData,
      source: 'mock'
    }
  };
}

/**
 * GET /api/auth/diagnostic
 * Diagnóstico de conectividad hacia el autenticador externo
 */
async function diagnostic(req, res) {
  try {
    const startTime = Date.now();

    const response = await fetch(EXTERNAL_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clOperador: 'diagnostic',
        clPassword: 'diagnostic'
      })
    });

    const elapsedMs = Date.now() - startTime;
    const rawBody = await response.text();

    let parsedBody = null;
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = { message: rawBody };
      }
    }

    const extractedToken = extractExternalToken(parsedBody);
    const extractedGid = extractExternalGid(parsedBody);

    res.json({
      success: true,
      url: EXTERNAL_AUTH_URL,
      reachable: true,
      status: response.status,
      ok: response.ok,
      elapsedMs,
      payload: {
        type: Array.isArray(parsedBody) ? 'array' : typeof parsedBody,
        topLevelKeys: (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) ? Object.keys(parsedBody) : null,
        rawBodyLength: rawBody ? rawBody.length : 0,
        tokenExtracted: Boolean(extractedToken),
        gidExtracted: extractedGid ?? null
      },
      message:
        parsedBody?.message ||
        parsedBody?.mensaje ||
        parsedBody?.error ||
        'Respuesta recibida',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      url: EXTERNAL_AUTH_URL,
      reachable: false,
      error: error.message || 'Error de conectividad',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const rawUsername = req.body?.username ?? req.body?.user ?? req.body?.email;
    const rawPassword = req.body?.password;

    const username = rawUsername === undefined || rawUsername === null ? '' : String(rawUsername).trim();
    const password = rawPassword === undefined || rawPassword === null ? '' : String(rawPassword);

    // Validar campos
    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Usuario y contraseña son requeridos'
      });
    }

    if (AUTH_MODE !== 'external') {
      const { token, expiresAt, userData } = authenticateWithMock(username, password);

      console.log(`[Auth] Login mock exitoso: ${username}`);

      return res.json({
        success: true,
        token,
        expiresAt,
        user: userData
      });
    }

    const mockUser = mockUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    let token;
    let externalPayload;

    try {
      const externalResult = await authenticateWithExternal(username, password);
      token = externalResult.token;
      externalPayload = externalResult.externalPayload;
    } catch (error) {
      const isConnectivity = error?.type === 'CONNECTIVITY_ERROR';
      const status = error?.status || null;
      const isServerFailure = status && Number(status) >= 500;

      if (AUTH_FALLBACK_TO_MOCK && mockUser && (isConnectivity || isServerFailure)) {
        const mockResult = authenticateWithMock(username, password);

        console.warn(`[Auth] Fallback a login mock por falla externa (status=${status ?? 'n/a'}): ${username}`);

        return res.json({
          success: true,
          token: mockResult.token,
          expiresAt: mockResult.expiresAt,
          user: mockResult.userData,
          fallback: {
            mode: 'mock',
            reason: error?.message || 'auth externo no disponible',
            externalUrl: EXTERNAL_AUTH_URL
          }
        });
      }

      throw error;
    }

    const userId = mockUser?.id || `ext_${String(username).toLowerCase()}`;
    const expiresAt = Date.now() + (8 * 60 * 60 * 1000);

    // Guardar sesión
    activeSessions.set(token, {
      userId,
      username,
      createdAt: Date.now(),
      expiresAt
    });

    const externalGid = extractExternalGid(externalPayload);

    const userData = {
      id: userId,
      username,
      nombre: mockUser?.nombre || username,
      rol: mockUser?.rol || 'operador',
      unidad: mockUser?.unidad || 'Operaciones',
      email: mockUser?.email || `${username}@sapal.gob.mx`,
      source: 'wsautenticador',
      ...(externalGid ? { pGid: externalGid } : {})
    };

    console.log(`[Auth] Login externo exitoso: ${username}`);

    return res.json({
      success: true,
      token,
      expiresAt,
      user: userData,
      external: externalPayload
    });

  } catch (error) {
    console.error('[Auth] Error en login:', error);
    if (AUTH_MODE === 'external' && error.type === 'CONNECTIVITY_ERROR') {
      return res.status(503).json({
        error: 'Connectivity Error',
        message: error.message || 'No se pudo conectar con el autenticador externo',
        details: {
          authUrl: EXTERNAL_AUTH_URL,
          code: error.code || null,
          status: error.status || null
        }
      });
    }

    // Si estamos en modo mock, aclarar que sólo aceptará usuarios de prueba.
    if (AUTH_MODE !== 'external') {
      const baseMessage = error.message || 'Usuario o contraseña incorrectos';
      const shouldHint = /incorrectos/i.test(baseMessage);

      return res.status(401).json({
        error: 'Authentication Error',
        message: shouldHint
          ? `${baseMessage} (AUTH_MODE=mock: usa admin/admin o ejecuta con AUTH_MODE=external para credenciales SIGSAPAL)`
          : baseMessage
      });
    }

    res.status(401).json({
      error: 'Authentication Error',
      message: error.message || 'Usuario o contraseña incorrectos'
    });
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  try {
    // El usuario viene del middleware
    const { password: _, ...userData } = req.user;

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('[Auth] Error en /me:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener datos de usuario'
    });
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      activeSessions.delete(token);
      console.log(`[Auth] Logout: ${req.user.username}`);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });

  } catch (error) {
    console.error('[Auth] Error en logout:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al cerrar sesión'
    });
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res) {
  try {
    const oldToken = req.headers.authorization?.replace('Bearer ', '');

    if (!oldToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token no proporcionado'
      });
    }

    const session = activeSessions.get(oldToken);

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Sesión inválida'
      });
    }

    // Buscar usuario
    const user = mockUsers.find(u => u.id === session.userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuario no encontrado'
      });
    }

    // Generar nuevo token
    const { token: newToken, expiresAt } = generateToken(user.id);

    // Eliminar sesión anterior
    activeSessions.delete(oldToken);

    // Guardar nueva sesión
    activeSessions.set(newToken, {
      userId: user.id,
      username: user.username,
      createdAt: Date.now(),
      expiresAt
    });

    console.log(`[Auth] Token refrescado: ${user.username}`);

    res.json({
      success: true,
      token: newToken,
      expiresAt
    });

  } catch (error) {
    console.error('[Auth] Error en refresh:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al refrescar token'
    });
  }
}

/**
 * Validar token (usado por middleware)
 */
function validateToken(token) {
  const session = activeSessions.get(token);

  if (!session) {
    return null;
  }

  // Verificar expiración
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return null;
  }

  // Buscar usuario
  const user = mockUsers.find(u => u.id === session.userId);

  return user || null;
}

export const authController = {
  login,
  diagnostic,
  me,
  logout,
  refresh,
  validateToken
};

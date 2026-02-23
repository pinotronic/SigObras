/**
 * Configuración principal de la aplicación
 * @module config/app
 */

// Detectar entorno
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

function resolveDevHostUrl(urlString) {
  // En móvil, si abres Vite por IP (ej. http://192.168.x.x:3000),
  // `localhost` en VITE_API_BASE_URL apunta al teléfono, no a tu PC.
  // Si el URL configurado usa localhost/127.0.0.1, lo reescribimos al host actual.
  if (!isDevelopment) return urlString;

  const currentHostname = globalThis?.location?.hostname;
  if (!currentHostname) return urlString;
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') return urlString;

  try {
    const url = new URL(urlString);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = currentHostname;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // Si no es un URL absoluto válido, no lo tocamos
  }

  return urlString;
}

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const rawMapServerUrl = import.meta.env.VITE_MAPSERVER_URL ||
  'https://wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData';

export const APP_CONFIG = {
  // Información de la app
  app: {
    name: 'SAPAL Obras Móvil',
    version: '0.1.0',
    environment: isDevelopment ? 'development' : 'production'
  },

  // Configuración de API
  api: {
    // URL base del backend (mock en desarrollo, real en producción)
    baseUrl: resolveDevHostUrl(rawApiBaseUrl),

    // MapServer (usar proxy en desarrollo para evitar CORS)
    mapServerUrl: resolveDevHostUrl(rawMapServerUrl),

    // Timeout en milisegundos
    timeout: 30000,

    // Reintentos
    retries: 3,
    retryDelay: 1000
  },

  // Configuración GIS
  gis: {
    // Proyección nativa del sistema
    nativeProjection: 'EPSG:32614', // UTM Zone 14N

    // Proyección para display (Web Mercator)
    displayProjection: 'EPSG:3857',

    // Proyección GPS (WGS84)
    gpsProjection: 'EPSG:4326',

    // Extent del área de servicio (en UTM metros)
    extent: {
      minX: 182916.955339,
      minY: 2309262.755359,
      maxX: 254143.488068,
      maxY: 2360276.552781
    },

    // Centro inicial (León, Gto aprox en UTM)
    initialCenter: [218530, 2334770],

    // Zoom inicial operativo para capas de predios/tuberías
    initialZoom: 16,

    // Capas base disponibles
    layers: {
      calles: {
        name: 'SS_MAP_GRAL_CALLES',
        mapfile: './data/SIG/map_calles.map',
        title: 'Calles',
        visible: true,
        type: 'wms'
      },
      predios: {
        name: 'SS_MAP_INFO_PREDIOS',
        mapfile: './data/SIG/map_predios.map',
        title: 'Predios',
        visible: true,
        type: 'wms',
        queryable: true,
        params: {
          SCALE: 1
        }
      },
      tuberiasAgua: {
        name: 'SS_MAP_AGUA_TUBERIA_AGUA',
        mapfile: './data/SIG/map_tuberia_agua.map',
        title: 'Tuberías de Agua Potable',
        visible: true,
        type: 'wms'
      },
      tuberiasDrenaje: {
        name: 'SS_MAP_DREN_TUBERIA_DRENAJE',
        mapfile: './data/SIG/map_tuberia_drenaje.map',
        title: 'Tuberías de Drenaje',
        visible: true,
        type: 'wms'
      }
    }
  },

  // Configuración de autenticación
  auth: {
    tokenKey: 'sapal_auth_token',
    userKey: 'sapal_user_data',
    tokenExpiry: 8 * 60 * 60 * 1000, // 8 horas
    refreshThreshold: 30 * 60 * 1000, // Refrescar 30 min antes
    ssoLoginUrl: import.meta.env.VITE_SSO_LOGIN_URL ||
      'https://dev.appgestionusuarios.sapal.gob.mx/#/Login?fgHash=true',
    ssoSolicitante: import.meta.env.VITE_SSO_SOLICITANTE || '',
    defaultPgid: import.meta.env.VITE_MAP_PGID || '0'
  },

  // Configuración de almacenamiento
  storage: {
    dbName: 'sapal_obras_db',
    version: 1,
    stores: {
      works: 'works',
      activities: 'activities',
      evidence: 'evidence',
      syncOutbox: 'syncOutbox',
      mapCache: 'mapCache',
      user: 'user'
    }
  },

  // Configuración de sincronización
  sync: {
    // Intervalo de sincronización automática (ms)
    autoSyncInterval: 5 * 60 * 1000, // 5 minutos

    // Reintentos para operaciones fallidas
    maxRetries: 5,

    // Tiempo entre reintentos (exponencial backoff)
    retryBackoff: 2,

    // Batch size para sincronización
    batchSize: 10
  },

  // Configuración de evidencias
  evidence: {
    // Tamaño máximo de imagen (bytes)
    maxFileSize: 5 * 1024 * 1024, // 5 MB

    // Calidad de compresión JPEG (0-1)
    compressionQuality: 0.8,

    // Dimensiones máximas
    maxWidth: 1920,
    maxHeight: 1920,

    // Formatos permitidos
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],

    // Mínimo de fotos requeridas por actividad crítica
    minPhotosRequired: 1
  },

  // Configuración de UI
  ui: {
    // Modo oscuro por defecto
    darkMode: false,

    // Animaciones habilitadas
    animations: true,

    // Duración de notificaciones (ms)
    notificationDuration: 3000,

    // Vibración en interacciones
    haptics: true
  },

  // Configuración de Phaser
  phaser: {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#f5f5f5',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
      createContainer: true
    },
    physics: {
      default: false // No necesitamos física
    },
    fps: {
      target: 60,
      forceSetTimeOut: false
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    }
  },

  // Configuración de desarrollo
  debug: {
    enabled: isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'error',
    mockData: isDevelopment,
    showFPS: isDevelopment,
    logSync: isDevelopment,
    logStorage: isDevelopment
  },

  // Validaciones de actividades
  validation: {
    // Radio máximo desde la obra para marcar geometría (metros)
    maxDistanceFromWork: 500,

    // Campos requeridos por tipo de actividad
    requiredFieldsByType: {
      'marcacion': ['geometry'],
      'excavacion': ['profundidad', 'photos'],
      'instalacion': ['diametro', 'material', 'longitud', 'photos'],
      'compactacion': ['capas', 'photos'],
      'pavimentacion': ['acabado', 'photos']
    }
  },

  // Features flags
  features: {
    offlineMode: true,
    gpsTracking: true,
    camera: true,
    signatures: false, // Fase 2
    qualityControl: false, // Fase 2
    materialTracking: false, // Fase 2
    notifications: false, // Fase 2
    analytics: false // Fase 3
  }
};

// Configuración específica por ambiente
if (isDevelopment) {
  // Usar backend mock local
  APP_CONFIG.api.baseUrl = 'http://localhost:3001/api';
  APP_CONFIG.api.mapServerUrl = 'http://localhost:3001/api/maps/proxy';
}

// Definiciones de proyecciones para Proj4
export const PROJ4_DEFS = {
  'EPSG:32614': '+proj=utm +zone=14 +datum=WGS84 +units=m +no_defs',
  'EPSG:3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
  'EPSG:4326': '+proj=longlat +datum=WGS84 +no_defs'
};

export default APP_CONFIG;

/**
 * Controlador de mapas (proxy a MapServer)
 */

import proj4 from 'proj4';

const isDev = String(process.env.NODE_ENV || '').toLowerCase() === 'development';

if (isDev && !process.env.NODE_EXTRA_CA_CERTS && process.env.MAPS_ALLOW_INSECURE_TLS === undefined) {
  process.env.MAPS_ALLOW_INSECURE_TLS = 'true';
}

const allowInsecureTlsForMaps = String(process.env.MAPS_ALLOW_INSECURE_TLS || '').toLowerCase() === 'true';
if (allowInsecureTlsForMaps) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('[Maps] MAPS_ALLOW_INSECURE_TLS=true: validación TLS deshabilitada solo para desarrollo');
}

proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('EPSG:32614', '+proj=utm +zone=14 +datum=WGS84 +units=m +no_defs');

function webMercatorToWgs84(x, y) {
  const radius = 6378137;
  const lon = (x / radius) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / radius)) - (Math.PI / 2)) * (180 / Math.PI);
  return [lon, lat];
}

/**
 * GET /api/maps/proxy
 * Proxy transparente a MapServer con headers CORS
 */
async function proxy(req, res) {
  try {
    // URL del MapServer real
    const mapServerUrl = process.env.MAPSERVER_URL ||
      'https://wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData';

    const queryParams = { ...req.query };
    const readParam = (...keys) => {
      for (const key of keys) {
        if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
          return queryParams[key];
        }
      }

      const lowerMap = new Map(Object.keys(queryParams).map((key) => [key.toLowerCase(), key]));
      for (const key of keys) {
        const originalKey = lowerMap.get(String(key).toLowerCase());
        if (originalKey && queryParams[originalKey] !== undefined && queryParams[originalKey] !== null && queryParams[originalKey] !== '') {
          return queryParams[originalKey];
        }
      }

      return undefined;
    };

    const mapfileRoot = readParam('mapfile_root', 'mapfileRoot', 'MAPFILE_ROOT');
    const providedMap = readParam('MAP', 'map');

    if (providedMap) {
      const mapValue = String(providedMap);
      const hasAuthPrefix = mapValue.includes('clusuario=') || mapValue.includes('/clToken=');
      if (!hasAuthPrefix && mapfileRoot) {
        queryParams.MAP = `${String(mapfileRoot)}${mapValue}`;
      } else {
        queryParams.MAP = mapValue;
      }
    }

    const reqSrs = String(readParam('SRS', 'srs', 'CRS', 'crs') || '').toUpperCase();
    const reqBbox = readParam('BBOX', 'bbox');

    if (reqSrs === 'EPSG:3857' && reqBbox) {
      const parts = String(reqBbox).split(',').map(Number);

      if (parts.length === 4 && parts.every(Number.isFinite)) {
        const [minX, minY, maxX, maxY] = parts;
        const [lonMin, latMin] = webMercatorToWgs84(minX, minY);
        const [lonMax, latMax] = webMercatorToWgs84(maxX, maxY);

        const [utmMinX, utmMinY] = proj4('EPSG:4326', 'EPSG:32614', [lonMin, latMin]);
        const [utmMaxX, utmMaxY] = proj4('EPSG:4326', 'EPSG:32614', [lonMax, latMax]);

        queryParams.BBOX = `${utmMinX},${utmMinY},${utmMaxX},${utmMaxY}`;
        queryParams.SRS = 'EPSG:32614';
        delete queryParams.srs;
        delete queryParams.CRS;
        delete queryParams.crs;
        delete queryParams.bbox;
      }
    }

    Object.keys(queryParams).forEach((key) => {
      const normalized = key.toLowerCase();
      if (normalized === 'mapfile_root' || normalized === 'mapfileroot') {
        delete queryParams[key];
      }
      if (normalized === 'map' && key !== 'MAP') {
        delete queryParams[key];
      }
    });

    const queryString = Object.keys(queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const targetUrl = `${mapServerUrl}${queryString ? '?' + queryString : ''}`;

    const debugFields = {
      REQUEST: readParam('REQUEST', 'request'),
      LAYER: readParam('LAYER', 'layer'),
      LAYERS: readParam('LAYERS', 'layers'),
      MAPFILE_ROOT_LEN: String(readParam('mapfile_root', 'mapfileRoot', 'MAPFILE_ROOT') || '').length,
      SRS: readParam('SRS', 'srs', 'CRS', 'crs'),
      BBOX: readParam('BBOX', 'bbox'),
      WIDTH: readParam('WIDTH', 'width'),
      HEIGHT: readParam('HEIGHT', 'height'),
      MAP_LEN: String(queryParams.MAP || '').length
    };
    console.log('[Maps] Request params:', debugFields);
    console.log(`[Maps] Proxying request to: ${targetUrl.substring(0, 220)}...`);

    // Hacer request al MapServer
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SAPAL-Obras-Mock/1.0'
      }
    });

    if (!response.ok) {
      const upstreamText = await response.text();

      console.error(`[Maps] Upstream error ${response.status}: ${response.statusText}`);

      return res.status(response.status).json({
        error: 'MapServer Error',
        message: `MapServer respondió ${response.status} ${response.statusText}`,
        details: upstreamText?.slice(0, 2000) || null,
        targetUrl
      });
    }

    // Obtener content type
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    console.log(`[Maps] Upstream OK ${response.status} content-type=${contentType || 'unknown'} length=${contentLength || 'n/a'}`);

    // Si es imagen, enviarla directamente
    if (contentType && contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(buffer));
    }

    // Si es JSON o XML, enviarlo como texto
    const text = await response.text();
    res.setHeader('Content-Type', contentType || 'text/plain');
    res.send(text);

  } catch (error) {
    console.error('[Maps] Error en proxy:', error);

    // En modo desarrollo, devolver imagen de prueba en caso de error
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        error: 'MapServer no disponible',
        message: error.message,
        mockMode: true,
        note: 'En producción conectar al MapServer real'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al conectar con MapServer',
      details: error.message
    });
  }
}

/**
 * GET /api/maps/layers
 * Devolver información de capas disponibles
 */
async function getLayers(req, res) {
  try {
    // Información de capas desde el inventario
    const layers = [
      {
        id: 'calles',
        name: 'SS_MAP_GRAL_CALLES',
        title: 'Calles',
        type: 'wms',
        visible: true,
        queryable: false,
        minScale: null,
        maxScale: null
      },
      {
        id: 'predios',
        name: 'SS_MAP_INFO_PREDIOS',
        title: 'Predios',
        type: 'wms',
        visible: true,
        queryable: true,
        minScale: null,
        maxScale: 15900
      },
      {
        id: 'tuberiasAgua',
        name: 'SS_MAP_AGUA_TUBERIA',
        title: 'Tuberías de Agua Potable',
        type: 'wms',
        visible: true,
        queryable: false,
        minScale: 1,
        maxScale: 15000
      },
      {
        id: 'tuberiasDrenaje',
        name: 'SS_MAP_DREN_TUBERIA_DRENAJE',
        title: 'Tuberías de Drenaje',
        type: 'wms',
        visible: true,
        queryable: false,
        minScale: 1,
        maxScale: 15000
      }
    ];

    res.json({
      success: true,
      data: layers,
      projection: 'EPSG:32614',
      extent: {
        minX: 182916.955339,
        minY: 2309262.755359,
        maxX: 254143.488068,
        maxY: 2360276.552781
      }
    });

  } catch (error) {
    console.error('[Maps] Error en getLayers:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener capas'
    });
  }
}

export const mapsController = {
  proxy,
  getLayers
};

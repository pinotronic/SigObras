/**
 * MapAdapter - Encapsula Leaflet para integración con Phaser
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import { APP_CONFIG, PROJ4_DEFS } from '../../config/app.config.js';
import { AuthService } from '../auth/AuthService.js';

Object.entries(PROJ4_DEFS).forEach(([code, def]) => {
  if (!proj4.defs(code)) {
    proj4.defs(code, def);
  }
});

class MapAdapter {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.map = null;
    this.layers = {};
    this.markers = {};
    this.isInitialized = false;

    this.config = {
      center: options.center || APP_CONFIG.gis.initialCenter,
      zoom: options.zoom || APP_CONFIG.gis.initialZoom,
      minZoom: options.minZoom || 7,
      maxZoom: options.maxZoom || 20
    };

    console.log('[MapAdapter] Instancia creada');
  }

  getMapAuthParams() {
    const auth = AuthService.getInstance();
    const token = auth.getToken();
    const user = auth.getCurrentUser();

    if (!token || !user?.username) {
      return {};
    }

    const pGid = user.pGid || user.gid || user.pgId || APP_CONFIG.auth.defaultPgid || '0';
    return {
      mapfile_root: `clusuario=${user.username}/clToken=${token}/pGid=${pGid}`
    };
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    try {
      const centerLatLng = this.utmToLatLng(this.config.center[0], this.config.center[1]);

      this.map = L.map(this.containerId, {
        center: centerLatLng,
        zoom: this.config.zoom,
        minZoom: this.config.minZoom,
        maxZoom: this.config.maxZoom,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      setTimeout(() => this.map?.invalidateSize(), 150);
      this.addConfiguredLayers();

      this.isInitialized = true;
      console.log('[MapAdapter] Inicializado correctamente');
      return this.map;
    } catch (error) {
      console.error('[MapAdapter] Error al inicializar:', error);
      throw error;
    }
  }

  /**
   * Agregar capas configuradas del APP_CONFIG
   */
  addConfiguredLayers() {
    const { layers } = APP_CONFIG.gis;

    Object.entries(layers).forEach(([key, layerConfig]) => {
      if (layerConfig.type === 'wms') {
        this.addWMSLayer(key, layerConfig);
      }
    });
  }

  /**
   * Agregar capa WMS
   */
  addWMSLayer(id, config) {
    try {
      const wmsUrl = `${APP_CONFIG.api.mapServerUrl}`;
      const authParams = this.getMapAuthParams();

      const wmsLayer = L.tileLayer.wms(wmsUrl, {
        layers: config.name,
        map: config.mapfile,
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        srs: 'EPSG:3857',
        uppercase: true,
        opacity: 0.95,
        attribution: 'SAPAL León',
        ...(config.params || {}),
        ...authParams
      });

      wmsLayer.on('tileerror', (event) => {
        console.error(`[MapAdapter] Tile error en capa ${id}:`, event);
      });

      this.layers[id] = {
        layer: wmsLayer,
        config: config,
        visible: config.visible
      };

      this.requestLegendGraphic(config, authParams);

      // Agregar al mapa si está visible por defecto
      if (config.visible) {
        wmsLayer.addTo(this.map);
      }

      console.log(`[MapAdapter] Capa WMS agregada: ${id} (${config.title})`);

    } catch (error) {
      console.error(`[MapAdapter] Error al agregar WMS ${id}:`, error);
    }
  }

  requestLegendGraphic(config, authParams) {
    try {
      const params = new URLSearchParams({
        REQUEST: 'GetLegendGraphic',
        SCALE: String(config.params?.SCALE ?? 1),
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        WIDTH: '250',
        LAYER: config.name,
        FORMAT: 'image/png',
        map: config.mapfile,
        ...(authParams.mapfile_root ? { mapfile_root: authParams.mapfile_root } : {})
      });

      const legendUrl = `${APP_CONFIG.api.mapServerUrl}?${params.toString()}`;

      fetch(legendUrl, { method: 'GET' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          console.log(`[MapAdapter] Leyenda cargada para ${config.name}: ${blob.size} bytes`);
        })
        .catch((error) => {
          console.warn(`[MapAdapter] No se pudo cargar leyenda ${config.name}:`, error.message);
        });
    } catch (error) {
      console.warn(`[MapAdapter] Error al solicitar leyenda ${config.name}:`, error.message);
    }
  }

  /**
   * Mostrar/ocultar capa
   */
  toggleLayer(layerId, visible = null) {
    const layerData = this.layers[layerId];

    if (!layerData) {
      console.warn(`[MapAdapter] Capa no encontrada: ${layerId}`);
      return;
    }

    const shouldBeVisible = visible !== null ? visible : !layerData.visible;

    if (shouldBeVisible && !layerData.visible) {
      layerData.layer.addTo(this.map);
      layerData.visible = true;
      console.log(`[MapAdapter] Capa mostrada: ${layerId}`);
    } else if (!shouldBeVisible && layerData.visible) {
      this.map.removeLayer(layerData.layer);
      layerData.visible = false;
      console.log(`[MapAdapter] Capa oculta: ${layerId}`);
    }
  }

  /**
   * Agregar marcador
   */
  addMarker(id, lat, lng, options = {}) {
    const markerCoords = [lat, lng];

    let markerIcon;

    if (options.icon) {
      markerIcon = options.icon instanceof L.Icon
        ? options.icon
        : L.icon(options.icon);
    } else {
      markerIcon = new L.Icon.Default();
    }

    const marker = L.marker(markerCoords, {
      title: options.title || '',
      icon: markerIcon
    });

    if (options.popup) {
      marker.bindPopup(options.popup);
    }

    marker.addTo(this.map);
    this.markers[id] = marker;

    console.log(`[MapAdapter] Marcador agregado: ${id}`);

    return marker;
  }

  /**
   * Remover marcador
   */
  removeMarker(id) {
    const marker = this.markers[id];

    if (marker) {
      this.map.removeLayer(marker);
      delete this.markers[id];
      console.log(`[MapAdapter] Marcador removido: ${id}`);
    }
  }

  /**
   * Centrar mapa en coordenadas
   */
  panTo(lat, lng, zoom = null) {
    if (!this.map) return;

    this.map.panTo([lat, lng]);

    if (zoom !== null) {
      this.map.setZoom(zoom);
    }
  }

  /**
   * Ajustar vista a bounds
   */
  fitBounds(bounds) {
    if (!this.map) return;

    // bounds = [[south, west], [north, east]]
    this.map.fitBounds(bounds);
  }

  /**
   * Convertir coordenadas UTM (EPSG:32614) a LatLng (EPSG:4326)
   */
  utmToLatLng(x, y) {
    const [lng, lat] = proj4(
      APP_CONFIG.gis.nativeProjection,
      APP_CONFIG.gis.gpsProjection,
      [x, y]
    );

    return [lat, lng];
  }

  /**
   * Convertir LatLng a UTM
   */
  latLngToUtm(lat, lng) {
    const [x, y] = proj4(
      APP_CONFIG.gis.gpsProjection,
      APP_CONFIG.gis.nativeProjection,
      [lng, lat]
    );

    return [x, y];
  }

  /**
   * Obtener centro del mapa actual
   */
  getCenter() {
    if (!this.map) return null;

    const center = this.map.getCenter();
    return [center.lat, center.lng];
  }

  /**
   * Obtener zoom actual
   */
  getZoom() {
    if (!this.map) return null;

    return this.map.getZoom();
  }

  /**
   * Obtener bounds actuales
   */
  getBounds() {
    if (!this.map) return null;

    const bounds = this.map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }

  /**
   * Invalidar tamaño del mapa (útil después de resize)
   */
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Limpiar todos los marcadores
   */
  clearMarkers() {
    Object.keys(this.markers).forEach(id => {
      this.removeMarker(id);
    });
  }

  /**
   * Destruir el mapa
   */
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.layers = {};
      this.markers = {};
      this.isInitialized = false;
      console.log('[MapAdapter] Destruido');
    }
  }

  /**
   * Obtener instancia de Leaflet map (para operaciones avanzadas)
   */
  getLeafletMap() {
    return this.map;
  }

  /**
   * Obtener información de capas
   */
  getLayersInfo() {
    return Object.entries(this.layers).map(([id, data]) => ({
      id,
      title: data.config.title,
      visible: data.visible,
      type: data.config.type
    }));
  }
}

export { MapAdapter };
export default MapAdapter;

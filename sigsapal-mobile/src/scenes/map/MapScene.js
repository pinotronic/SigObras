/**
 * MapScene - Visualización de mapas con capas GIS usando Leaflet
 */

import Phaser from 'phaser';
import L from 'leaflet';
import { MapAdapter } from '../../modules/maps/MapAdapter.js';
import { APP_CONFIG } from '../../config/app.config.js';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
    this.mapAdapter = null;
    this.mapContainer = null;

    // Trazado de líneas
    this.drawMode = null; // 'start' | 'end' | null
    this.startLatLng = null;
    this.endLatLng = null;
    this.tempPolyline = null;
    this.savedLinesLayer = null;
  }

  create() {
    console.log('[MapScene] Iniciada');

    // Servicio de auth para headers Bearer
    this.auth = this.registry.get('auth');

    const { width, height } = this.scale;

    // Header
    this.createHeader();

    // Contenedor del mapa (DOM)
    this.createMapContainer();

    // Inicializar MapAdapter
    this.initMap();
  }

  createHeader() {
    const { width } = this.scale;

    // Fondo del header
    this.add.rectangle(width / 2, 40, width, 80, 0x0066cc);

    // Botón volver
    this.add.text(20, 40, '← Volver', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.mapAdapter) {
          this.mapAdapter.destroy();
        }
        this.scene.start('HomeScene');
      });

    // Título
    this.add.text(width / 2, 40, 'Mapa de Obras', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createMapContainer() {
    const { width, height } = this.scale;

    this.mapContainer = this.add.dom(width / 2, (height / 2) + 40).createFromHTML(`
      <div id="map-root" style="position: relative; width: ${width}px; height: ${height - 80}px; background: #e0e0e0;">
        <div id="leaflet-map" style="width: 100%; height: 100%; background: #e0e0e0;"></div>
        <div id="map-controls" style="position: absolute; top: 12px; right: 12px; z-index: 1000; width: min(260px, calc(100% - 24px)); background: rgba(255,255,255,0.95); border: 2px solid #0066cc; border-radius: 10px; padding: 12px; box-sizing: border-box; font-family: Arial, sans-serif;">
          <div style="font-size: 18px; font-weight: bold; color: #0066cc; margin-bottom: 10px;">Capas</div>
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#333;"><input type="checkbox" data-layer-id="calles" checked> Calles</label>
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#333;"><input type="checkbox" data-layer-id="predios" checked> Predios</label>
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#333;"><input type="checkbox" data-layer-id="tuberiasAgua" checked> Tuberías Agua</label>
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px; color:#333;"><input type="checkbox" data-layer-id="tuberiasDrenaje" checked> Tuberías Drenaje</label>
          <button id="btn-center-map" type="button" style="width:100%; border:none; border-radius:8px; background:#0066cc; color:#fff; padding:10px; font-size:15px; font-weight:600; cursor:pointer;">📍 Centrar</button>

          <div style="height: 1px; background: rgba(0,102,204,0.25); margin: 12px 0;"></div>
          <div style="font-size: 16px; font-weight: bold; color: #0066cc; margin-bottom: 10px;">Trazado</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="btn-set-start" type="button" style="border:none; border-radius:8px; background:#004999; color:#fff; padding:10px; font-size:14px; font-weight:600; cursor:pointer;">📍 Inicio</button>
            <button id="btn-set-end" type="button" style="border:none; border-radius:8px; background:#004999; color:#fff; padding:10px; font-size:14px; font-weight:600; cursor:pointer;">🏁 Fin</button>
            <button id="btn-save-line" type="button" disabled style="grid-column: 1 / span 2; border:none; border-radius:8px; background:#4caf50; color:#fff; padding:10px; font-size:14px; font-weight:700; cursor:not-allowed; opacity:0.7;">💾 Guardar línea</button>
            <button id="btn-clear-line" type="button" style="grid-column: 1 / span 2; border:2px solid #0066cc; border-radius:8px; background:#fff; color:#0066cc; padding:10px; font-size:14px; font-weight:700; cursor:pointer;">Limpiar</button>
          </div>

          <div id="draw-hint" style="margin-top: 10px; font-size: 12px; color: #666; line-height: 1.2;">
            Selecciona Inicio o Fin y toca el mapa.
          </div>
        </div>
      </div>
    `);

    this.bindLayerControls();
  }

  initMap() {
    try {
      this.time.delayedCall(100, () => {
        this.mapAdapter = new MapAdapter('leaflet-map');
        this.mapAdapter.init();

        this.setupLineDrawing();
        this.loadSavedLines();

        const [lat, lng] = this.mapAdapter.getCenter();
        this.mapAdapter.addMarker('center', lat, lng, {
          popup: 'Centro de León, Gto',
          title: 'Centro'
        });
      });
    } catch (error) {
      console.error('[MapScene] Error al inicializar mapa:', error);
    }
  }

  setupLineDrawing() {
    if (!this.mapAdapter) return;

    const map = this.mapAdapter.getLeafletMap();
    if (!map) return;

    // Capa para líneas guardadas
    if (!this.savedLinesLayer) {
      this.savedLinesLayer = L.layerGroup().addTo(map);
    }

    // Click en mapa para fijar puntos
    map.on('click', (event) => {
      if (!this.drawMode) return;

      const latlng = event.latlng;

      if (this.drawMode === 'start') {
        this.startLatLng = latlng;
        this.mapAdapter.addMarker('route-start', latlng.lat, latlng.lng, {
          title: 'Inicio',
          popup: 'Inicio'
        });
        this.setHint('Inicio definido. Selecciona Fin y toca el mapa.');
      }

      if (this.drawMode === 'end') {
        this.endLatLng = latlng;
        this.mapAdapter.addMarker('route-end', latlng.lat, latlng.lng, {
          title: 'Fin',
          popup: 'Fin'
        });
        this.setHint('Fin definido. Puedes guardar la línea.');
      }

      this.drawMode = null;
      this.updateTempLine();
      this.updateSaveButtonState();
    });

    // Botones del panel
    const root = this.mapContainer?.node;
    if (!root) return;

    const btnStart = root.querySelector('#btn-set-start');
    const btnEnd = root.querySelector('#btn-set-end');
    const btnSave = root.querySelector('#btn-save-line');
    const btnClear = root.querySelector('#btn-clear-line');

    btnStart?.addEventListener('click', () => {
      this.drawMode = 'start';
      this.setHint('Toca el mapa para definir el Inicio.');
    });

    btnEnd?.addEventListener('click', () => {
      this.drawMode = 'end';
      this.setHint('Toca el mapa para definir el Fin.');
    });

    btnClear?.addEventListener('click', () => {
      this.clearTempLine();
      this.setHint('Selecciona Inicio o Fin y toca el mapa.');
    });

    btnSave?.addEventListener('click', async () => {
      if (btnSave.disabled) return;
      await this.saveLine(btnSave);
    });

    this.updateSaveButtonState();
  }

  setHint(text) {
    const hint = this.mapContainer?.node?.querySelector('#draw-hint');
    if (hint) hint.textContent = text;
  }

  updateTempLine() {
    const map = this.mapAdapter?.getLeafletMap();
    if (!map) return;

    if (this.tempPolyline) {
      this.tempPolyline.remove();
      this.tempPolyline = null;
    }

    if (!this.startLatLng || !this.endLatLng) return;

    this.tempPolyline = L.polyline(
      [this.startLatLng, this.endLatLng],
      { color: '#0066cc', weight: 5, opacity: 0.9 }
    ).addTo(map);
  }

  updateSaveButtonState() {
    const btnSave = this.mapContainer?.node?.querySelector('#btn-save-line');
    if (!btnSave) return;

    const canSave = Boolean(this.startLatLng && this.endLatLng);
    btnSave.disabled = !canSave;
    btnSave.style.cursor = canSave ? 'pointer' : 'not-allowed';
    btnSave.style.opacity = canSave ? '1' : '0.7';
  }

  clearTempLine() {
    if (this.mapAdapter) {
      this.mapAdapter.removeMarker('route-start');
      this.mapAdapter.removeMarker('route-end');
    }

    this.startLatLng = null;
    this.endLatLng = null;

    if (this.tempPolyline) {
      this.tempPolyline.remove();
      this.tempPolyline = null;
    }

    this.updateSaveButtonState();
  }

  async saveLine(btnSave) {
    if (!this.startLatLng || !this.endLatLng) return;

    const geometry = {
      type: 'LineString',
      coordinates: [
        [this.startLatLng.lng, this.startLatLng.lat],
        [this.endLatLng.lng, this.endLatLng.lat]
      ]
    };

    btnSave.disabled = true;
    btnSave.textContent = 'Guardando...';
    btnSave.style.cursor = 'not-allowed';

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(this.auth?.getAuthHeaders?.() || {})
      };

      const response = await fetch(`${APP_CONFIG.api.baseUrl}/lines`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          geometry,
          properties: {
            source: 'mobile',
            createdIn: 'MapScene'
          }
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      btnSave.textContent = '✓ Guardada';
      await this.loadSavedLines();
      this.clearTempLine();
      this.setHint('Línea guardada. Puedes trazar otra.');

      setTimeout(() => {
        btnSave.textContent = '💾 Guardar línea';
        this.updateSaveButtonState();
      }, 800);

    } catch (error) {
      console.error('[MapScene] Error guardando línea:', error);
      btnSave.textContent = '💾 Guardar línea';
      this.updateSaveButtonState();
      this.setHint(error.message || 'No se pudo guardar la línea');
    }
  }

  async loadSavedLines() {
    if (!this.mapAdapter) return;

    const map = this.mapAdapter.getLeafletMap();
    if (!map) return;

    if (!this.savedLinesLayer) {
      this.savedLinesLayer = L.layerGroup().addTo(map);
    }

    try {
      const headers = {
        ...(this.auth?.getAuthHeaders?.() || {})
      };

      const response = await fetch(`${APP_CONFIG.api.baseUrl}/lines`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        return;
      }

      const fc = await response.json();
      const features = Array.isArray(fc?.features) ? fc.features : [];

      this.savedLinesLayer.clearLayers();

      const geoJsonLayer = L.geoJSON(features, {
        style: { color: '#ff5722', weight: 4, opacity: 0.85 }
      });

      geoJsonLayer.addTo(this.savedLinesLayer);
    } catch (error) {
      console.warn('[MapScene] No se pudieron cargar líneas guardadas:', error.message);
    }
  }

  bindLayerControls() {
    if (!this.mapContainer || !this.mapContainer.node) {
      return;
    }

    const root = this.mapContainer.node;
    const layerInputs = root.querySelectorAll('input[data-layer-id]');

    layerInputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        const target = event.target;
        const layerId = target.dataset.layerId;

        if (this.mapAdapter && layerId) {
          this.mapAdapter.toggleLayer(layerId, target.checked);
        }
      });
    });

    const centerBtn = root.querySelector('#btn-center-map');
    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        if (this.mapAdapter) {
          this.mapAdapter.panTo(21.1212, -101.6796, 16);
        }
      });
    }
  }

  shutdown() {
    if (this.mapAdapter) {
      this.mapAdapter.destroy();
      this.mapAdapter = null;
    }

    if (this.mapContainer) {
      this.mapContainer.destroy();
      this.mapContainer = null;
    }
  }
}

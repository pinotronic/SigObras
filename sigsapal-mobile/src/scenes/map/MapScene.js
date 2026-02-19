/**
 * MapScene - Visualización de mapas con capas GIS usando Leaflet
 */

import Phaser from 'phaser';
import { MapAdapter } from '../../modules/maps/MapAdapter.js';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
    this.mapAdapter = null;
    this.mapContainer = null;
  }

  create() {
    console.log('[MapScene] Iniciada');

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

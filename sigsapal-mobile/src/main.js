/**
 * Punto de entrada principal de la aplicación
 * Inicializa Phaser y los módulos principales
 */

import Phaser from 'phaser';
import { APP_CONFIG, PROJ4_DEFS } from './config/app.config.js';
import proj4 from 'proj4';

// Importar escenas
import BootScene from './scenes/boot/BootScene.js';
import LoginScene from './scenes/login/LoginScene.js';
import HomeScene from './scenes/home/HomeScene.js';
import MapScene from './scenes/map/MapScene.js';
import WorkDetailScene from './scenes/work-detail/WorkDetailScene.js';
import ActivityFormScene from './scenes/activity-form/ActivityFormScene.js';

/**
 * Configurar proyecciones de Proj4
 */
function setupProjections() {
  Object.entries(PROJ4_DEFS).forEach(([code, definition]) => {
    proj4.defs(code, definition);
  });

  if (APP_CONFIG.debug.enabled) {
    console.log('[Main] Proyecciones configuradas:', Object.keys(PROJ4_DEFS));
  }
}

/**
 * Inicializar la aplicación
 */
async function init() {
  try {
    // Configurar proyecciones
    setupProjections();

    // Configuración de Phaser con escenas
    const phaserConfig = {
      ...APP_CONFIG.phaser,
      scene: [
        BootScene,
        LoginScene,
        HomeScene,
        MapScene,
        WorkDetailScene,
        ActivityFormScene
      ]
    };

    // Crear instancia de Phaser
    const game = new Phaser.Game(phaserConfig);

    // Exponer globalmente para debugging (solo en desarrollo)
    if (APP_CONFIG.debug.enabled) {
      window.phaserGame = game;
      window.APP_CONFIG = APP_CONFIG;
      console.log('[Main] Aplicación iniciada en modo desarrollo');
      console.log('[Main] Game instance:', game);
    }

    // Ocultar loading screen después de un momento
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 500);
      }
    }, 1000);

    // Registrar service worker en producción
    if (APP_CONFIG.app.environment === 'production' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('[Main] Service Worker registrado');
      } catch (error) {
        console.warn('[Main] Error al registrar Service Worker:', error);
      }
    }

    return game;

  } catch (error) {
    console.error('[Main] Error al inicializar aplicación:', error);

    // Mostrar error al usuario
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>Error al cargar la aplicación</h2>
          <p style="margin-top: 10px; opacity: 0.8;">${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #0066cc; border: none; border-radius: 5px; cursor: pointer;">
            Reintentar
          </button>
        </div>
      `;
    }

    throw error;
  }
}

/**
 * Manejar errores no capturados
 */
window.addEventListener('error', (event) => {
  console.error('[Main] Error no capturado:', event.error);

  if (APP_CONFIG.debug.enabled) {
    // En desarrollo, mostrar el error
    alert(`Error: ${event.error?.message || 'Error desconocido'}`);
  }
});

/**
 * Manejar rechazos de promesas no capturados
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] Promesa rechazada:', event.reason);

  if (APP_CONFIG.debug.enabled) {
    alert(`Promesa rechazada: ${event.reason?.message || 'Error desconocido'}`);
  }
});

/**
 * Detectar cuando la app vuelve a estar visible
 */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && APP_CONFIG.debug.enabled) {
    console.log('[Main] Aplicación visible nuevamente');
  }
});

/**
 * Detectar orientación del dispositivo
 */
window.addEventListener('orientationchange', () => {
  if (APP_CONFIG.debug.enabled) {
    console.log('[Main] Orientación cambió:', screen.orientation?.type);
  }
});

/**
 * Información del dispositivo (debugging)
 */
if (APP_CONFIG.debug.enabled) {
  console.log('[Main] Info del dispositivo:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenSize: `${screen.width}x${screen.height}`,
    pixelRatio: window.devicePixelRatio,
    online: navigator.onLine,
    language: navigator.language,
    standalone: window.matchMedia('(display-mode: standalone)').matches
  });
}

// Iniciar la aplicación
init().catch(error => {
  console.error('[Main] Error fatal:', error);
});

// Exponer para uso en otros módulos si es necesario
export { init };

/**
 * BootScene - Primera escena que se carga
 * Inicializa servicios, carga assets básicos y verifica autenticación
 */

import Phaser from 'phaser';
import { APP_CONFIG } from '../../config/app.config.js';
import { StorageService } from '../../modules/storage/StorageService.js';
import { AuthService } from '../../modules/auth/AuthService.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create() {
    console.log('[BootScene] Iniciando...');

    try {
      // Mostrar logo temporal
      this.showLogo();

      // Inicializar servicios core
      await this.initializeServices();

      // Verificar autenticación
      const isAuthenticated = await this.checkAuthentication();

      // Esperar un momento para que se vea el logo
      await this.sleep(1000);

      // Navegar a la escena apropiada
      if (isAuthenticated) {
        console.log('[BootScene] Usuario autenticado, ir a Home');
        this.scene.start('HomeScene');
      } else {
        console.log('[BootScene] No autenticado, ir a Login');
        this.scene.start('LoginScene');
      }

    } catch (error) {
      console.error('[BootScene] Error durante el boot:', error);
      this.showError(error.message);
    }
  }

  /**
   * Mostrar logo de SAPAL
   */
  showLogo() {
    const { width, height } = this.scale;

    // Fondo
    this.add.rectangle(width / 2, height / 2, width, height, 0x0066cc);

    // Logo (emoji temporal, reemplazar con imagen real)
    const logo = this.add.text(width / 2, height / 2 - 80, '💧', {
      fontSize: '120px'
    }).setOrigin(0.5);

    // Título
    this.add.text(width / 2, height / 2 + 60, 'SAPAL Obras', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtítulo
    this.add.text(width / 2, height / 2 + 100, 'Sistema de Seguimiento', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      alpha: 0.9
    }).setOrigin(0.5);

    // Versión
    this.add.text(width / 2, height - 40, `v${APP_CONFIG.app.version}`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      alpha: 0.7
    }).setOrigin(0.5);

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 + 160, 'Iniciando...', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      alpha: 0.8
    }).setOrigin(0.5);
  }

  /**
   * Inicializar servicios principales
   */
  async initializeServices() {
    this.updateLoadingText('Inicializando almacenamiento...');

    // Inicializar StorageService
    const storage = StorageService.getInstance();
    await storage.init();

    this.updateLoadingText('Configurando servicios...');

    // Inicializar AuthService
    const auth = AuthService.getInstance();
    await auth.init();

    // Registrar servicios globalmente para acceso desde otras escenas
    this.registry.set('storage', storage);
    this.registry.set('auth', auth);

    console.log('[BootScene] Servicios inicializados');
  }

  /**
   * Verificar si hay una sesión activa
   */
  async checkAuthentication() {
    this.updateLoadingText('Verificando sesión...');

    const auth = this.registry.get('auth');
    return await auth.isAuthenticated();
  }

  /**
   * Actualizar texto de carga
   */
  updateLoadingText(text) {
    if (this.loadingText) {
      this.loadingText.setText(text);
    }
  }

  /**
   * Mostrar error
   */
  showError(message) {
    const { width, height } = this.scale;

    // Limpiar escena
    this.children.removeAll();

    // Fondo rojo
    this.add.rectangle(width / 2, height / 2, width, height, 0xcc0000);

    // Icono de error
    this.add.text(width / 2, height / 2 - 60, '⚠️', {
      fontSize: '80px'
    }).setOrigin(0.5);

    // Mensaje
    this.add.text(width / 2, height / 2 + 40, 'Error al iniciar', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 80, message, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      alpha: 0.9,
      wordWrap: { width: width - 80 },
      align: 'center'
    }).setOrigin(0.5);

    // Botón de reintentar
    const retryBtn = this.add.text(width / 2, height / 2 + 150, 'Reintentar', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#004999',
      padding: { x: 30, y: 15 },
      fixedWidth: 200,
      align: 'center'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.restart();
      });
  }

  /**
   * Utilidad: esperar X milisegundos
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

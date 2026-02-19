/**
 * HomeScene - Pantalla principal con lista de obras asignadas
 */

import Phaser from 'phaser';

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
    this.auth = null;
  }

  create() {
    console.log('[HomeScene] Iniciada');

    this.auth = this.registry.get('auth');

    const { width, height } = this.scale;

    // Fondo
    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f5f5);

    // Header
    this.add.rectangle(width / 2, 60, width, 120, 0x0066cc);
    this.add.text(width / 2, 60, 'Mis Obras', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón cerrar sesión
    this.add.text(width - 20, 60, 'Cerrar sesión', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#004999',
      padding: { x: 12, y: 8 }
    })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleLogout());

    // Placeholder
    this.add.text(width / 2, height / 2, 'Lista de obras\n(En desarrollo)', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5);

    // Botón temporal a mapa
    const mapBtn = this.add.text(width / 2, height / 2 + 100, 'Ver Mapa', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#0066cc',
      padding: { x: 30, y: 15 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MapScene'));
  }

  async handleLogout() {
    try {
      if (this.auth) {
        await this.auth.logout();
      }

      this.scene.start('LoginScene');
    } catch (error) {
      console.error('[HomeScene] Error al cerrar sesión:', error);
    }
  }
}

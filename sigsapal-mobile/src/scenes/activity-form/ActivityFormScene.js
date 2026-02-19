/**
 * ActivityFormScene - Formulario para registrar actividad
 */

import Phaser from 'phaser';

export default class ActivityFormScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ActivityFormScene' });
  }

  create() {
    console.log('[ActivityFormScene] Iniciada');

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f5f5);

    this.add.text(width / 2, height / 2, 'Formulario de Actividad\n(En desarrollo)', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5);
  }
}

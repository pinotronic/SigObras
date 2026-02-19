/**
 * WorkDetailScene - Detalle de una obra específica
 */

import Phaser from 'phaser';

export default class WorkDetailScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorkDetailScene' });
  }

  create() {
    console.log('[WorkDetailScene] Iniciada');

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f5f5);

    this.add.text(width / 2, height / 2, 'Detalle de Obra\n(En desarrollo)', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5);
  }
}

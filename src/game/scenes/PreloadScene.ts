import Phaser from 'phaser';
import { generateArt } from '../graphics/generatedArt';
import type { GameApp } from '../GameApp';

export class PreloadScene extends Phaser.Scene {
  constructor(private readonly app: GameApp) {
    super('preload');
  }

  create(): void {
    const camera = this.cameras.main;
    camera.setBackgroundColor('#111823');

    this.add
      .text(320, 180, 'Loading Jonah...', {
        fontFamily: 'Georgia, serif',
        color: '#f0dfae',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.add
      .text(320, 220, 'Forging tiles, voices, and a very stubborn prophet.', {
        fontFamily: 'Georgia, serif',
        color: '#c7b48d',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.time.delayedCall(60, () => {
      generateArt(this);
      this.app.registerPreloadComplete();
      this.scene.start('title');
    });
  }
}

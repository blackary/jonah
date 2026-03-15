import Phaser from 'phaser';
import type { GameApp } from '../GameApp';

export class BootScene extends Phaser.Scene {
  constructor(private readonly app: GameApp) {
    super('boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f1620');
    this.app.registerBootScene();
    this.scene.start('preload');
  }
}

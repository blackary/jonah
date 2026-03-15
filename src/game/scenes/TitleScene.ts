import Phaser from 'phaser';
import type { GameApp } from '../GameApp';

export class TitleScene extends Phaser.Scene {
  private waterBands: Phaser.GameObjects.Rectangle[] = [];

  private boat?: Phaser.GameObjects.Image;

  constructor(private readonly app: GameApp) {
    super('title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#121823');

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x181f2c, 0x181f2c, 0x5a3a2e, 0x5a3a2e, 1);
    sky.fillRect(0, 0, 640, 480);

    this.add.circle(520, 88, 46, 0xf3be57, 0.9);
    this.add.image(460, 112, 'object-city_far').setScale(4).setAlpha(0.75);
    this.add.image(196, 142, 'object-city_far').setScale(2.6).setAlpha(0.45);

    for (let index = 0; index < 5; index += 1) {
      const band = this.add.rectangle(
        320,
        290 + index * 28,
        720,
        18,
        Phaser.Display.Color.GetColor(25 + index * 6, 78 + index * 10, 110 + index * 8),
        0.85,
      );
      this.waterBands.push(band);
    }

    this.boat = this.add.image(150, 286, 'object-ship_shadow').setScale(2.5).setAlpha(0.85);
    this.add.image(520, 140, 'char-jonah', 0).setScale(3).setAlpha(0.25);

    this.app.attachTitleScene(this);
  }

  update(time: number): void {
    this.waterBands.forEach((band, index) => {
      band.x = 320 + Math.sin(time / 800 + index) * (6 + index * 3);
    });

    if (this.boat) {
      this.boat.x = 150 + Math.sin(time / 900) * 10;
      this.boat.y = 286 + Math.cos(time / 700) * 4;
    }
  }
}

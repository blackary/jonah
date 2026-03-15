import Phaser from 'phaser';
import { COLLISION_TILES, MAPS } from '../content/maps';
import { meetsRequirements } from '../runtime/requirements';
import type { GameApp } from '../GameApp';
import type {
  Direction,
  MapActor,
  MapDefinition,
  MapObject,
} from '../types';

const TILE_SIZE = 32;
const FRAME_WIDTH = 640;
const FRAME_HEIGHT = 480;
const IDLE_FRAMES: Record<Direction, number> = {
  down: 0,
  left: 2,
  right: 4,
  up: 6,
};

interface ActiveActor {
  data: MapActor;
  sprite: Phaser.GameObjects.Sprite;
}

interface ActiveObject {
  data: MapObject;
  sprite: Phaser.GameObjects.Image;
}

export class WorldScene extends Phaser.Scene {
  private currentMap?: MapDefinition;

  private floorLayer?: Phaser.GameObjects.Container;

  private decorationLayer?: Phaser.GameObjects.Container;

  private objectLayer?: Phaser.GameObjects.Container;

  private actorLayer?: Phaser.GameObjects.Container;

  private ambientLayer?: Phaser.GameObjects.Container;

  private player?: Phaser.GameObjects.Sprite;

  private readonly actorSprites = new Map<string, ActiveActor>();

  private readonly objectSprites = new Map<string, ActiveObject>();

  private readonly ambientSprites: Phaser.GameObjects.Image[] = [];

  private moving = false;

  private nextMoveAt = 0;

  private virtualDirections = new Set<Direction>();

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private keys?: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(private readonly app: GameApp) {
    super('world');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f131a');
    this.cameras.main.setBounds(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

    this.floorLayer = this.add.container();
    this.ambientLayer = this.add.container();
    this.decorationLayer = this.add.container();
    this.objectLayer = this.add.container();
    this.actorLayer = this.add.container();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,Z,X,ENTER,SPACE,ESC') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    this.app.attachWorldScene(this);
    void this.loadFromSession(true);
  }

  update(time: number): void {
    if (!this.currentMap || !this.player) {
      return;
    }

    if (!this.keys) {
      return;
    }

    this.updateAmbient(time);

    if (!this.app.canAcceptWorldInput() || this.moving) {
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.Z) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER)
    ) {
      void this.interact();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) || Phaser.Input.Keyboard.JustDown(this.keys.X)) {
      void this.app.togglePause();
      return;
    }

    const direction = this.getHeldDirection();
    if (!direction || time < this.nextMoveAt) {
      return;
    }

    this.nextMoveAt = time + 150;
    void this.tryMove(direction);
  }

  getCurrentMap(): MapDefinition | undefined {
    return this.currentMap;
  }

  getObjectDefinition(objectId: string): MapObject | undefined {
    return this.currentMap?.objects.find((object) => object.id === objectId);
  }

  setVirtualDirection(direction: Direction, active: boolean): void {
    if (active) {
      this.virtualDirections.add(direction);
      return;
    }

    this.virtualDirections.delete(direction);
  }

  async loadFromSession(showBanner: boolean): Promise<void> {
    const save = this.app.session.requireSave();
    const map = MAPS[save.map];
    this.currentMap = map;

    this.floorLayer?.removeAll(true);
    this.ambientLayer?.removeAll(true);
    this.decorationLayer?.removeAll(true);
    this.objectLayer?.removeAll(true);
    this.actorLayer?.removeAll(true);
    this.actorSprites.clear();
    this.objectSprites.clear();
    this.ambientSprites.length = 0;
    this.player = undefined;

    this.buildTiles(map);
    this.buildAmbient(map.theme);
    this.buildDecorations(map);
    this.buildObjects(map);
    this.buildActors(map);
    this.buildPlayer(save.player.x, save.player.y, save.player.facing);
    this.refreshFromSave();

    this.cameras.main.centerOn(FRAME_WIDTH / 2, FRAME_HEIGHT / 2);
    this.app.refreshHud();
    if (showBanner) {
      this.app.ui.showChapterBanner(map.chapter, map.name);
    }

    if (map.onEnterEvent) {
      await this.app.dispatchEvent(map.onEnterEvent, { kind: 'map' });
    }
  }

  async transitionToMap(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        void this.loadFromSession(true).then(() => {
          this.cameras.main.fadeIn(260, 6, 9, 12);
          resolve();
        });
      });
      this.cameras.main.fadeOut(220, 6, 9, 12);
    });
  }

  async fadeOut(duration = 600): Promise<void> {
    await new Promise<void>((resolve) => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
      this.cameras.main.fadeOut(duration, 6, 9, 12);
    });
  }

  refreshFromSave(): void {
    const save = this.app.session.requireSave();

    this.objectSprites.forEach(({ data, sprite }) => {
      sprite.setVisible(meetsRequirements(data.visibleWhen, save));
      const textureKey = this.resolveObjectTexture(data);
      sprite.setTexture(textureKey);
      sprite.setDepth(data.y * 10 + 2);
    });

    this.actorSprites.forEach(({ data, sprite }) => {
      sprite.setVisible(meetsRequirements(data.visibleWhen, save));
      sprite.setDepth(data.y * 10 + 6);
      this.setIdleFrame(sprite, data.sprite, data.facing);
    });

    if (this.player) {
      this.player.setDepth(save.player.y * 10 + 8);
      this.setIdleFrame(this.player, 'jonah', save.player.facing);
    }
  }

  shake(duration = 240, intensity = 0.008): void {
    this.cameras.main.shake(duration, intensity);
  }

  async interact(): Promise<void> {
    if (!this.currentMap || !this.player || !this.app.canAcceptWorldInput()) {
      return;
    }

    const save = this.app.session.requireSave();
    const [dx, dy] = this.directionToVector(save.player.facing);
    const targetX = save.player.x + dx;
    const targetY = save.player.y + dy;

    const actor = [...this.actorSprites.values()].find(
      ({ data, sprite }) => sprite.visible && data.x === targetX && data.y === targetY,
    );
    if (actor) {
      await this.app.handleEvent(actor.data.event, { kind: 'actor', actorId: actor.data.id });
      return;
    }

    const object = [...this.objectSprites.values()].find(
      ({ data, sprite }) => sprite.visible && data.x === targetX && data.y === targetY,
    );
    if (object) {
      await this.app.handleEvent(object.data.event, { kind: 'object', objectId: object.data.id });
    }
  }

  private buildTiles(map: MapDefinition): void {
    map.tiles.forEach((row, y) => {
      [...row].forEach((code, x) => {
        const kind = map.legend[code];
        const image = this.add.image(x * TILE_SIZE + 16, y * TILE_SIZE + 16, `tile-${kind}`);
        image.setDisplaySize(TILE_SIZE, TILE_SIZE);
        image.setDepth(0);
        this.floorLayer?.add(image);
      });
    });
  }

  private buildAmbient(theme: string): void {
    const colorByTheme: Record<string, number> = {
      harbor: 0xe9d7aa,
      storm: 0xd8ecf7,
      fish: 0x8df4e2,
      desert: 0xf7d28a,
      gate: 0xd5d6dc,
      city: 0xf2e0b9,
      hillside: 0xf4c66a,
    };

    for (let index = 0; index < 18; index += 1) {
      const sprite = this.add.image(
        Phaser.Math.Between(0, FRAME_WIDTH),
        Phaser.Math.Between(0, FRAME_HEIGHT),
        'particle',
      );
      sprite.setTint(colorByTheme[theme] ?? 0xffffff);
      sprite.setAlpha(theme === 'storm' ? 0.5 : 0.22 + Math.random() * 0.3);
      sprite.setScale(theme === 'storm' ? 0.5 : 0.7 + Math.random() * 0.8);
      sprite.setDepth(1);
      this.ambientLayer?.add(sprite);
      this.ambientSprites.push(sprite);
    }
  }

  private buildDecorations(map: MapDefinition): void {
    map.decorations?.forEach((decoration) => {
      const image = this.add.image(
        decoration.x * TILE_SIZE + 16,
        decoration.y * TILE_SIZE + 16,
        `object-${decoration.kind}`,
      );
      image.setDepth(decoration.y * 10 + (decoration.depthOffset ?? 1));
      this.decorationLayer?.add(image);
    });
  }

  private buildObjects(map: MapDefinition): void {
    map.objects.forEach((object) => {
      const image = this.add.image(
        object.x * TILE_SIZE + 16,
        object.y * TILE_SIZE + 16,
        this.resolveObjectTexture(object),
      );
      image.setDepth(object.y * 10 + 2);
      this.objectLayer?.add(image);
      this.objectSprites.set(object.id, { data: object, sprite: image });
    });
  }

  private buildActors(map: MapDefinition): void {
    map.npcs.forEach((actor) => {
      const sprite = this.add.sprite(actor.x * TILE_SIZE + 16, actor.y * TILE_SIZE + 24, `char-${actor.sprite}`);
      sprite.setScale(1.6);
      sprite.setDepth(actor.y * 10 + 6);
      this.setIdleFrame(sprite, actor.sprite, actor.facing);
      this.actorLayer?.add(sprite);
      this.actorSprites.set(actor.id, { data: actor, sprite });
    });
  }

  private buildPlayer(x: number, y: number, facing: Direction): void {
    if (!this.player) {
      this.player = this.add.sprite(x * TILE_SIZE + 16, y * TILE_SIZE + 24, 'char-jonah');
      this.player.setScale(1.7);
      this.actorLayer?.add(this.player);
    } else {
      this.player.setPosition(x * TILE_SIZE + 16, y * TILE_SIZE + 24);
    }

    this.setIdleFrame(this.player, 'jonah', facing);
    this.player.setDepth(y * 10 + 8);
  }

  private updateAmbient(time: number): void {
    if (!this.currentMap) {
      return;
    }

    this.ambientSprites.forEach((sprite, index) => {
      switch (this.currentMap?.theme) {
        case 'storm':
          sprite.y += 2.8;
          sprite.x -= 0.7;
          if (sprite.y > FRAME_HEIGHT + 8) sprite.y = -8;
          if (sprite.x < -8) sprite.x = FRAME_WIDTH + 8;
          break;
        case 'fish':
          sprite.y -= 0.4;
          sprite.x += Math.sin(time / 500 + index) * 0.25;
          if (sprite.y < -8) sprite.y = FRAME_HEIGHT + 8;
          break;
        case 'desert':
        case 'hillside':
          sprite.x -= 0.45;
          sprite.y += Math.sin(time / 900 + index) * 0.12;
          if (sprite.x < -8) sprite.x = FRAME_WIDTH + 8;
          break;
        default:
          sprite.y += Math.sin(time / 1000 + index) * 0.04;
          sprite.x += Math.cos(time / 1200 + index) * 0.05;
      }
    });
  }

  private resolveObjectTexture(object: MapObject): string {
    if (!object.puzzleId || typeof object.puzzleIndex !== 'number') {
      return `object-${object.kind}`;
    }

    const state = this.app.session.getPuzzleState(object.puzzleId)[object.puzzleIndex] ?? 0;
    return `object-${state ? object.kindOn ?? object.kind : object.kindOff ?? object.kind}`;
  }

  private getHeldDirection(): Direction | undefined {
    const pressed = new Set<Direction>();
    if (this.cursors?.up.isDown || this.keys?.W.isDown || this.virtualDirections.has('up')) pressed.add('up');
    if (this.cursors?.down.isDown || this.keys?.S.isDown || this.virtualDirections.has('down')) pressed.add('down');
    if (this.cursors?.left.isDown || this.keys?.A.isDown || this.virtualDirections.has('left')) pressed.add('left');
    if (this.cursors?.right.isDown || this.keys?.D.isDown || this.virtualDirections.has('right')) pressed.add('right');

    return ['up', 'down', 'left', 'right'].find((direction) => pressed.has(direction as Direction)) as
      | Direction
      | undefined;
  }

  private async tryMove(direction: Direction): Promise<void> {
    if (!this.player || !this.currentMap) {
      return;
    }

    const save = this.app.session.requireSave();
    const [dx, dy] = this.directionToVector(direction);
    const nextX = save.player.x + dx;
    const nextY = save.player.y + dy;
    this.app.session.setPlayerFacing(direction);
    this.setIdleFrame(this.player, 'jonah', direction);

    if (this.isBlocked(nextX, nextY)) {
      return;
    }

    this.moving = true;
    this.player.play(`char-jonah-${direction}`, true);
    this.app.session.setPlayerPosition(nextX, nextY, direction);

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.player,
        x: nextX * TILE_SIZE + 16,
        y: nextY * TILE_SIZE + 24,
        duration: 140,
        ease: 'Cubic.Out',
        onComplete: () => resolve(),
      });
    });

    this.setIdleFrame(this.player, 'jonah', direction);
    this.player.setDepth(nextY * 10 + 8);
    this.moving = false;
    await this.onTileArrival(nextX, nextY);
  }

  private async onTileArrival(x: number, y: number): Promise<void> {
    const exit = this.currentMap?.exits?.find(
      (entry) =>
        x >= entry.x &&
        x < entry.x + entry.width &&
        y >= entry.y &&
        y < entry.y + entry.height &&
        meetsRequirements(entry.activeWhen, this.app.session.requireSave()),
    );

    if (exit) {
      await this.app.transitionToMap(exit.targetMap, exit.targetSpawn);
      return;
    }

    const trigger = this.currentMap?.triggers?.find(
      (entry) =>
        x >= entry.x &&
        x < entry.x + (entry.width ?? 1) &&
        y >= entry.y &&
        y < entry.y + (entry.height ?? 1) &&
        meetsRequirements(entry.activeWhen, this.app.session.requireSave()),
    );

    if (trigger) {
      const onceFlag = `triggered:${trigger.id}`;
      if (trigger.once && this.app.session.getFlag(onceFlag) === true) {
        return;
      }
      if (trigger.once) {
        this.app.session.setFlag(onceFlag, true);
      }
      await this.app.handleEvent(trigger.event, { kind: 'trigger', triggerId: trigger.id });
    }
  }

  private isBlocked(x: number, y: number): boolean {
    if (!this.currentMap || x < 0 || y < 0 || y >= this.currentMap.tiles.length || x >= this.currentMap.tiles[0].length) {
      return true;
    }

    const tileKind = this.currentMap.legend[this.currentMap.tiles[y][x]];
    if (COLLISION_TILES.has(tileKind)) {
      return true;
    }

    const save = this.app.session.requireSave();
    const objectCollision = [...this.objectSprites.values()].some(({ data, sprite }) => {
      if (!sprite.visible || !data.solid) return false;
      return data.x === x && data.y === y && meetsRequirements(data.visibleWhen, save);
    });
    if (objectCollision) {
      return true;
    }

    return [...this.actorSprites.values()].some(({ data, sprite }) => {
      if (!sprite.visible && !meetsRequirements(data.visibleWhen, save)) return false;
      return (data.solid ?? true) && data.x === x && data.y === y;
    });
  }

  private setIdleFrame(sprite: Phaser.GameObjects.Sprite, textureId: string, direction: Direction): void {
    sprite.anims.stop();
    sprite.setTexture(`char-${textureId}`);
    sprite.setFrame(IDLE_FRAMES[direction]);
  }

  private directionToVector(direction: Direction): [number, number] {
    switch (direction) {
      case 'up':
        return [0, -1];
      case 'down':
        return [0, 1];
      case 'left':
        return [-1, 0];
      case 'right':
        return [1, 0];
    }
  }
}

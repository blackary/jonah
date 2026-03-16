import Phaser from 'phaser';
import { COLLISION_TILES, getObjectiveTargets, MAPS } from '../content/maps';
import { meetsRequirements } from '../runtime/requirements';
import type { GameApp } from '../GameApp';
import type {
  Direction,
  MapActor,
  MapDecoration,
  MapDefinition,
  MapObject,
  SaveState,
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
  indicator: Phaser.GameObjects.Image;
}

interface ActiveObject {
  data: MapObject;
  sprite: Phaser.GameObjects.Image;
  indicator: Phaser.GameObjects.Image;
}

interface ActiveDecoration {
  data: MapDecoration;
  sprite: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
}

export class WorldScene extends Phaser.Scene {
  private currentMap?: MapDefinition;

  private floorLayer?: Phaser.GameObjects.Container;

  private decorationLayer?: Phaser.GameObjects.Container;

  private foregroundLayer?: Phaser.GameObjects.Container;

  private objectLayer?: Phaser.GameObjects.Container;

  private actorLayer?: Phaser.GameObjects.Container;

  private ambientLayer?: Phaser.GameObjects.Container;

  private effectLayer?: Phaser.GameObjects.Container;

  private indicatorLayer?: Phaser.GameObjects.Container;

  private moodOverlay?: Phaser.GameObjects.Image;

  private player?: Phaser.GameObjects.Sprite;

  private readonly actorSprites = new Map<string, ActiveActor>();

  private readonly objectSprites = new Map<string, ActiveObject>();

  private readonly decorationSprites: ActiveDecoration[] = [];

  private readonly ambientSprites: Phaser.GameObjects.Image[] = [];

  private readonly animatedDecorations: ActiveDecoration[] = [];

  private moving = false;

  private nextMoveAt = 0;

  private virtualDirections = new Set<Direction>();

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private keys?: Record<string, Phaser.Input.Keyboard.Key>;

  private contextHint = '';

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
    this.foregroundLayer = this.add.container();
    this.effectLayer = this.add.container();
    this.indicatorLayer = this.add.container();

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
    this.updateInteractionFeedback(time);

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
    this.foregroundLayer?.removeAll(true);
    this.effectLayer?.removeAll(true);
    this.indicatorLayer?.removeAll(true);
    this.actorSprites.clear();
    this.objectSprites.clear();
    this.decorationSprites.length = 0;
    this.ambientSprites.length = 0;
    this.animatedDecorations.length = 0;
    this.moodOverlay = undefined;
    this.player = undefined;

    this.buildTiles(map);
    this.buildAmbient(map.theme);
    this.buildDecorations(map);
    this.buildObjects(map);
    this.buildActors(map);
    this.buildPlayer(save.player.x, save.player.y, save.player.facing);
    this.buildMoodOverlay(map.theme);
    this.refreshFromSave();

    this.cameras.main.centerOn(FRAME_WIDTH / 2, FRAME_HEIGHT / 2);
    this.app.refreshHud();
    this.contextHint = '';
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

    this.decorationSprites.forEach(({ data, sprite }) => {
      sprite.setVisible(meetsRequirements(data.visibleWhen, save));
      sprite.setDepth(data.y * 10 + (data.depthOffset ?? 1));
    });

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

    this.updateInteractionFeedback(this.time.now);
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
      return;
    }

    const decoration = this.getFacingDecoration(save);
    if (decoration) {
      await this.app.examineFeature(
        decoration.data.name ?? this.getDecorationLabel(decoration.data),
        decoration.data.inspectText ?? this.getDecorationInspectionText(decoration.data),
      );
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
    const ambientByTheme: Record<
      string,
      {
        texture: string;
        tint: number;
        count: number;
        minAlpha: number;
        alphaSpread: number;
        minScale: number;
        scaleSpread: number;
        minX?: number;
        maxX?: number;
        minY?: number;
        maxY?: number;
      }
    > = {
      harbor: {
        texture: 'particle-gull',
        tint: 0xf2dfb6,
        count: 8,
        minAlpha: 0.11,
        alphaSpread: 0.1,
        minScale: 0.36,
        scaleSpread: 0.18,
        minY: 12,
        maxY: 132,
      },
      storm: {
        texture: 'particle-rain',
        tint: 0xe0f2fb,
        count: 24,
        minAlpha: 0.32,
        alphaSpread: 0.22,
        minScale: 0.55,
        scaleSpread: 0.4,
      },
      fish: {
        texture: 'particle-bubble',
        tint: 0x9ef9ee,
        count: 18,
        minAlpha: 0.18,
        alphaSpread: 0.22,
        minScale: 0.7,
        scaleSpread: 0.5,
      },
      desert: {
        texture: 'particle-dust',
        tint: 0xf5d08f,
        count: 16,
        minAlpha: 0.14,
        alphaSpread: 0.16,
        minScale: 0.7,
        scaleSpread: 0.45,
      },
      gate: {
        texture: 'particle-mote',
        tint: 0xf0dbc0,
        count: 12,
        minAlpha: 0.08,
        alphaSpread: 0.12,
        minScale: 0.8,
        scaleSpread: 0.4,
      },
      city: {
        texture: 'particle-mote',
        tint: 0xeccf9b,
        count: 14,
        minAlpha: 0.08,
        alphaSpread: 0.14,
        minScale: 0.8,
        scaleSpread: 0.45,
      },
      hillside: {
        texture: 'particle-dust',
        tint: 0xf3c770,
        count: 16,
        minAlpha: 0.13,
        alphaSpread: 0.15,
        minScale: 0.7,
        scaleSpread: 0.45,
      },
    };
    const config = ambientByTheme[theme] ?? ambientByTheme.harbor;

    for (let index = 0; index < config.count; index += 1) {
      const sprite = this.add.image(
        Phaser.Math.Between(config.minX ?? 0, config.maxX ?? FRAME_WIDTH),
        Phaser.Math.Between(config.minY ?? 0, config.maxY ?? FRAME_HEIGHT),
        config.texture,
      );
      sprite.setTint(config.tint);
      sprite.setAlpha(config.minAlpha + Math.random() * config.alphaSpread);
      sprite.setScale(config.minScale + Math.random() * config.scaleSpread);
      sprite.setDepth(1);
      this.ambientLayer?.add(sprite);
      this.ambientSprites.push(sprite);
    }
  }

  private buildMoodOverlay(theme: string): void {
    this.moodOverlay = this.add.image(FRAME_WIDTH / 2, FRAME_HEIGHT / 2, `mood-${theme}`);
    this.moodOverlay.setDepth(5);
    this.effectLayer?.add(this.moodOverlay);
  }

  private buildDecorations(map: MapDefinition): void {
    map.decorations?.forEach((decoration) => {
      const image = this.add.image(
        decoration.x * TILE_SIZE + 16,
        decoration.y * TILE_SIZE + 16,
        `object-${decoration.kind}`,
      );
      image.setDepth(decoration.y * 10 + (decoration.depthOffset ?? 1));
      image.setScale(decoration.scale ?? 1);
      image.setAlpha(decoration.alpha ?? 1);
      if (decoration.layer === 'foreground') {
        this.foregroundLayer?.add(image);
      } else {
        this.decorationLayer?.add(image);
      }
      this.decorationSprites.push({
        data: decoration,
        sprite: image,
        baseX: image.x,
        baseY: image.y,
      });
      if (decoration.bobAmplitude) {
        this.animatedDecorations.push({
          data: decoration,
          sprite: image,
          baseX: image.x,
          baseY: image.y,
        });
      }
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
      const indicator = this.createIndicator(image.x, image.y - 24);
      this.objectSprites.set(object.id, { data: object, sprite: image, indicator });
    });
  }

  private buildActors(map: MapDefinition): void {
    map.npcs.forEach((actor) => {
      const sprite = this.add.sprite(actor.x * TILE_SIZE + 16, actor.y * TILE_SIZE + 24, `char-${actor.sprite}`);
      sprite.setScale(1.6);
      sprite.setDepth(actor.y * 10 + 6);
      this.setIdleFrame(sprite, actor.sprite, actor.facing);
      this.actorLayer?.add(sprite);
      const indicator = this.createIndicator(sprite.x, sprite.y - 30);
      this.actorSprites.set(actor.id, { data: actor, sprite, indicator });
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

    this.animatedDecorations.forEach(({ data, sprite, baseX, baseY }, index) => {
      const speed = data.bobSpeed ?? 1400;
      const amplitude = data.bobAmplitude ?? 1;
      sprite.x = baseX + Math.cos(time / (speed * 0.72) + index) * amplitude * 0.35;
      sprite.y = baseY + Math.sin(time / speed + index * 0.45) * amplitude;
    });

    if (!this.moodOverlay) {
      return;
    }

    const baseAlphaByTheme: Record<string, number> = {
      harbor: 0.5,
      storm: 0.68,
      fish: 0.58,
      desert: 0.44,
      gate: 0.5,
      city: 0.46,
      hillside: 0.48,
    };
    const pulseByTheme: Record<string, number> = {
      harbor: 0.018,
      storm: 0.05,
      fish: 0.04,
      desert: 0.014,
      gate: 0.012,
      city: 0.012,
      hillside: 0.016,
    };
    const theme = this.currentMap.theme;
    this.moodOverlay.setAlpha(
      (baseAlphaByTheme[theme] ?? 0.42) +
        Math.sin(time / (theme === 'storm' ? 760 : theme === 'fish' ? 1100 : 2400)) * (pulseByTheme[theme] ?? 0.01),
    );
  }

  private updateInteractionFeedback(time: number): void {
    if (!this.currentMap || !this.player) {
      return;
    }

    const save = this.app.session.requireSave();
    const objectiveTargets = new Set(getObjectiveTargets(save).map((target) => `${target.kind}:${target.id}`));

    let actorIndex = 0;
    this.actorSprites.forEach(({ data, sprite, indicator }) => {
      const offsetIndex = actorIndex;
      actorIndex += 1;
      const isVisible = sprite.visible;
      indicator.setVisible(isVisible);
      if (!isVisible) {
        return;
      }

      const objective = objectiveTargets.has(`actor:${data.id}`);
      indicator.setPosition(sprite.x, sprite.y - 30 - Math.sin(time / 220 + offsetIndex) * 1.8);
      indicator.setDepth(sprite.depth + 20);
      indicator.setTint(objective ? 0xffe3a3 : 0xc78a43);
      indicator.setAlpha(objective ? 0.96 : 0.62);
      indicator.setScale(objective ? 1 : 0.84);
    });

    let objectIndex = 0;
    this.objectSprites.forEach(({ data, sprite, indicator }) => {
      const offsetIndex = objectIndex;
      objectIndex += 1;
      const isVisible = sprite.visible;
      indicator.setVisible(isVisible);
      if (!isVisible) {
        return;
      }

      const objective = objectiveTargets.has(`object:${data.id}`);
      indicator.setPosition(sprite.x, sprite.y - 24 - Math.sin(time / 220 + offsetIndex + 2) * 1.6);
      indicator.setDepth(sprite.depth + 20);
      indicator.setTint(objective ? 0xffe3a3 : 0xc78a43);
      indicator.setAlpha(objective ? 0.96 : 0.62);
      indicator.setScale(objective ? 1 : 0.84);
    });

    const nextHint = this.getContextHint(save);
    if (nextHint !== this.contextHint) {
      this.contextHint = nextHint;
      this.app.ui.updateContextHint(nextHint);
    }
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

  private getContextHint(save: SaveState): string {
    const facingTarget = this.getFacingInteraction(save);
    if (facingTarget) {
      return this.describeInteraction(facingTarget.verb, facingTarget.label, false);
    }

    const guidance = getObjectiveTargets(save).find((target) => {
      if (target.kind === 'actor') {
        return this.actorSprites.get(target.id)?.sprite.visible;
      }
      return this.objectSprites.get(target.id)?.sprite.visible;
    });

    if (guidance) {
      return `Next: ${this.describeObjectiveTarget(guidance.kind, guidance.id)}`;
    }

    return 'Bronze markers show major interactions. Face props as well to examine them with Space / Enter / Z.';
  }

  private getFacingInteraction(save: SaveState): {
    label: string;
    verb: string;
  } | null {
    const [dx, dy] = this.directionToVector(save.player.facing);
    const targetX = save.player.x + dx;
    const targetY = save.player.y + dy;

    const actor = [...this.actorSprites.values()].find(
      ({ data, sprite }) => sprite.visible && data.x === targetX && data.y === targetY,
    );
    if (actor) {
      return {
        label: actor.data.name,
        verb: actor.data.verb ?? 'Talk',
      };
    }

    const object = [...this.objectSprites.values()].find(
      ({ data, sprite }) => sprite.visible && data.x === targetX && data.y === targetY,
    );
    if (object) {
      return {
        label: object.data.name ?? this.getObjectLabel(object.data),
        verb: object.data.verb ?? this.getObjectVerb(object.data.kind),
      };
    }

    const decoration = this.getFacingDecoration(save);
    if (decoration) {
      return {
        label: decoration.data.name ?? this.getDecorationLabel(decoration.data),
        verb: decoration.data.verb ?? this.getDecorationVerb(decoration.data.kind),
      };
    }

    return null;
  }

  private getFacingDecoration(save: SaveState): ActiveDecoration | undefined {
    const [dx, dy] = this.directionToVector(save.player.facing);
    const targetX = save.player.x + dx;
    const targetY = save.player.y + dy;

    return this.decorationSprites.find(
      ({ data, sprite }) =>
        sprite.visible &&
        data.x === targetX &&
        data.y === targetY &&
        meetsRequirements(data.visibleWhen, save),
    );
  }

  private describeObjectiveTarget(kind: 'actor' | 'object', id: string): string {
    if (kind === 'actor') {
      const actor = this.actorSprites.get(id);
      if (!actor) {
        return 'Continue onward.';
      }
      return this.describeInteraction(actor.data.verb ?? 'Talk', actor.data.name, true);
    }

    const object = this.objectSprites.get(id);
    if (!object) {
      return 'Continue onward.';
    }
    return this.describeInteraction(
      object.data.verb ?? this.getObjectVerb(object.data.kind),
      object.data.name ?? this.getObjectLabel(object.data),
      true,
    );
  }

  private describeInteraction(verb: string, label: string, imperative: boolean): string {
    if (!imperative) {
      return `${verb}: ${label}`;
    }

    if (verb === 'Talk') {
      return `Talk to ${label}`;
    }

    if (verb === 'Read' || verb === 'Inspect' || verb === 'Toggle' || verb === 'Gather') {
      return `${verb} ${label}`;
    }

    return `${verb} ${label}`;
  }

  private getObjectLabel(object: MapObject): string {
    const fallbackByKind: Record<string, string> = {
      sign: 'Sign',
      spring: 'Spring',
      milestone: 'Milestone',
      banner: 'Banner',
      altar: 'Altar',
      throne: 'Throne',
      helm: 'Helm',
      door: 'Door',
      cloth: 'Cloth Roll',
      reeds: 'Reed Bundle',
      stone_pile: 'Stone Pile',
      shelter_frame: 'Shelter Frame',
      plant: 'Leafy Plant',
      dead_plant: 'Withered Plant',
      ledger_table: 'Manifest Desk',
      cleat_off: 'Cargo Cleat',
      cleat_on: 'Cargo Cleat',
      sigil_off: 'Sigil',
      sigil_on: 'Sigil',
    };

    return fallbackByKind[object.kind] ?? object.kind.replace(/_/g, ' ');
  }

  private getObjectVerb(kind: string): string {
    const verbByKind: Record<string, string> = {
      sign: 'Read',
      spring: 'Draw Water',
      milestone: 'Read',
      altar: 'Pray',
      throne: 'Inspect',
      banner: 'Inspect',
      door: 'Enter',
      cloth: 'Gather',
      reeds: 'Gather',
      stone_pile: 'Gather',
      shelter_frame: 'Rest',
      plant: 'Inspect',
      dead_plant: 'Inspect',
      ledger_table: 'Take',
      cleat_off: 'Toggle',
      cleat_on: 'Toggle',
      sigil_off: 'Toggle',
      sigil_on: 'Toggle',
    };

    return verbByKind[kind] ?? 'Inspect';
  }

  private getDecorationLabel(decoration: MapDecoration): string {
    const fallbackByKind: Record<string, string> = {
      barrel: 'Barrel',
      crate_stack: 'Crate Stack',
      lantern: 'Lantern',
      dock_post: 'Dock Post',
      net: 'Fishing Net',
      moored_ship: 'Tarshish Ship',
      cargo: 'Cargo Lashings',
      hatch: 'Deck Hatch',
      fish_rib: 'Fish Rib',
      tendril: 'Tendril',
      coral: 'Coral Growth',
      cairn: 'Cairn',
      shrub: 'Desert Shrub',
      prayer_stone: 'Prayer Stone',
      watcher_pair: 'Watchers',
      citizen_group: 'Citizens',
      column: 'Stone Column',
      brazier: 'Brazier',
      market: 'Market Stall',
      awning: 'Awning',
      banner: 'Banner',
      city_far: 'Nineveh',
      sun_mark: 'Sun',
    };

    return decoration.name ?? fallbackByKind[decoration.kind] ?? decoration.kind.replace(/_/g, ' ');
  }

  private getDecorationVerb(kind: string): string {
    const verbByKind: Record<string, string> = {
      banner: 'Inspect',
      city_far: 'Observe',
      sun_mark: 'Observe',
    };

    return verbByKind[kind] ?? 'Examine';
  }

  private getDecorationInspectionText(decoration: MapDecoration): string {
    const textByKind: Record<string, string> = {
      barrel: 'Salt and tar cling to the staves. The barrel has stood on this quay through more than one voyage.',
      crate_stack: 'The crates are bound tight with rope, waiting for hands strong enough to shift them.',
      lantern: 'The lamp throws a patient light, small against sea-dark and gathering dusk.',
      dock_post: 'The post is scarred by rope, tide, and years of departures.',
      net: 'The net smells of brine and labor. Tarshish is not the only thing these docks have hauled in.',
      moored_ship: 'The ship rides low beside the quay, broad-bellied and ready for a long flight west.',
      cargo: 'The cargo has been lashed against the deck, but the storm will test every knot.',
      hatch: 'A dark hatch yawns below deck, promising cramped air and worse seasickness.',
      fish_rib: 'The rib arches overhead like a prison beam, a reminder that Jonah has been spared, not freed.',
      tendril: 'The tendril sways with the creature’s breathing, as if the whole chamber itself were alive and listening.',
      coral: 'Strange growth clings to the chamber walls, soft and pale in the dimness.',
      cairn: 'Patient hands stacked these stones to mark a way through open country.',
      shrub: 'A stubborn shrub claws at the dry ground, living on less mercy than Jonah expects for himself.',
      prayer_stone: 'The stone is worn smooth where knees and hands have lingered in prayer.',
      watcher_pair: 'They keep their distance and watch in silence, measuring Jonah before they trust his word.',
      citizen_group: 'The crowd shifts in uneasy knots, listening for whether judgment or mercy will prevail.',
      column: 'The carved stone column bears its weight without complaint, more steadfast than the prophet beneath it.',
      brazier: 'Heat rolls from the brazier in measured breaths, carrying ash and the smell of oil.',
      market: 'Bolts of cloth, baskets, and rumor gather under the stall’s shade.',
      awning: 'Dyed fabric stretches overhead, casting a narrow mercy of shade on the stones below.',
      banner: 'The banner hangs high in civic pride, proclaiming a greatness that will not stand against the word of the LORD.',
      city_far: 'Nineveh rests on the horizon in hard lines and heat haze, still waiting to hear what Jonah must say.',
      sun_mark: 'The sun presses hard against the hillside, bright enough to turn comfort into complaint.',
    };

    return (
      decoration.inspectText ??
      textByKind[decoration.kind] ??
      'Jonah studies it for a moment, taking in the shape of the place around him.'
    );
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

    const decorationCollision = this.decorationSprites.some(({ data, sprite }) => {
      if (!sprite.visible || !data.solid) return false;
      return data.x === x && data.y === y && meetsRequirements(data.visibleWhen, save);
    });
    if (decorationCollision) {
      return true;
    }

    return [...this.actorSprites.values()].some(({ data, sprite }) => {
      if (!sprite.visible && !meetsRequirements(data.visibleWhen, save)) return false;
      return (data.solid ?? true) && data.x === x && data.y === y;
    });
  }

  private createIndicator(x: number, y: number): Phaser.GameObjects.Image {
    const indicator = this.add.image(x, y, 'ui-marker');
    indicator.setDepth(999);
    this.indicatorLayer?.add(indicator);
    return indicator;
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

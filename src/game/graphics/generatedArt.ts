import Phaser from 'phaser';

type DrawCallback = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

interface CharacterPalette {
  skin: string;
  robe: string;
  trim: string;
  hair: string;
  accent: string;
}

const CHARACTER_PALETTES: Record<string, CharacterPalette> = {
  jonah: { skin: '#f0c28b', robe: '#d2a45b', trim: '#6f4721', hair: '#433126', accent: '#ede2b2' },
  messenger: { skin: '#efc89b', robe: '#cfc7bb', trim: '#934d44', hair: '#57453d', accent: '#f0efe8' },
  merchant: { skin: '#e5ba8d', robe: '#9b6a3f', trim: '#e4c27d', hair: '#3d2c1f', accent: '#d9a05d' },
  sailor: { skin: '#e8be90', robe: '#3e6b87', trim: '#e0d7b8', hair: '#2d2620', accent: '#8bc0d7' },
  sailor2: { skin: '#dba77b', robe: '#46715e', trim: '#d7d6bb', hair: '#2f241b', accent: '#7ac2a2' },
  dockmaster: { skin: '#f2c494', robe: '#7d4d35', trim: '#dcb46e', hair: '#443027', accent: '#f1dca4' },
  captain: { skin: '#efbf92', robe: '#7b2f2f', trim: '#d2b45e', hair: '#463026', accent: '#f5e0b8' },
  traveler: { skin: '#e8b68b', robe: '#8a7458', trim: '#d6cfb8', hair: '#514335', accent: '#dcb87b' },
  guard: { skin: '#e5b07f', robe: '#5a586f', trim: '#c8b07a', hair: '#342720', accent: '#8e90ba' },
  herald: { skin: '#f2c28d', robe: '#8a3d56', trim: '#e4c68a', hair: '#34271d', accent: '#f0dca7' },
  official: { skin: '#e3b38a', robe: '#425d78', trim: '#d7c692', hair: '#30231b', accent: '#9ab9da' },
  king: { skin: '#f0c290', robe: '#4c2f63', trim: '#d7b85c', hair: '#312015', accent: '#ffdb77' },
};

const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;

function createTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: DrawCallback,
): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    throw new Error(`Unable to create texture ${key}`);
  }
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx, width, height);
  texture.refresh();
}

function fill(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function fillCircle(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, radius: number): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function paintLinearGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: Array<[number, string]>,
  width: number,
  height: number,
): void {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([stop, color]) => {
    gradient.addColorStop(stop, color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function paintRadialGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  innerColor: string,
  outerColor: string,
): void {
  const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawWoodTile(ctx: CanvasRenderingContext2D, base: string, line: string, nail: string): void {
  fill(ctx, base, 0, 0, 32, 32);
  for (let y = 0; y < 32; y += 8) {
    fill(ctx, line, 0, y + 3, 32, 1);
  }
  for (let x = 4; x < 32; x += 8) {
    fill(ctx, nail, x, 7, 1, 1);
    fill(ctx, nail, x, 15, 1, 1);
    fill(ctx, nail, x, 23, 1, 1);
  }
}

function drawStoneTile(ctx: CanvasRenderingContext2D, base: string, line: string): void {
  fill(ctx, base, 0, 0, 32, 32);
  for (let y = 0; y < 32; y += 8) {
    fill(ctx, line, 0, y, 32, 1);
  }
  for (let x = 0; x < 32; x += 10) {
    fill(ctx, line, x, 8, 1, 8);
    fill(ctx, line, x + 5, 16, 1, 8);
  }
}

function drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  direction: typeof DIRECTIONS[number],
  step: 0 | 1,
  palette: CharacterPalette,
): void {
  const top = 2;
  const legShift = step === 0 ? 0 : 1;
  fill(ctx, 'rgba(0,0,0,0.25)', offsetX + 5, 23, 10, 2);
  fill(ctx, palette.skin, offsetX + 6, top + 1, 8, 8);
  fill(ctx, palette.hair, offsetX + 5, top, 10, 3);
  fill(ctx, palette.robe, offsetX + 5, top + 9, 10, 9);
  fill(ctx, palette.trim, offsetX + 6, top + 12, 8, 1);
  fill(ctx, palette.accent, offsetX + 8, top + 10, 4, 2);
  fill(ctx, palette.skin, offsetX + 4, top + 10, 1, 4);
  fill(ctx, palette.skin, offsetX + 15, top + 10, 1, 4);
  fill(ctx, '#3b2a1e', offsetX + 6, top + 18 + legShift, 2, 5);
  fill(ctx, '#3b2a1e', offsetX + 12, top + 18 + (step === 0 ? 1 : 0), 2, 5);

  if (direction === 'up') {
    fill(ctx, palette.hair, offsetX + 6, top + 1, 8, 8);
    fill(ctx, palette.trim, offsetX + 7, top + 10, 6, 2);
  }

  if (direction === 'left') {
    fill(ctx, palette.hair, offsetX + 5, top + 2, 2, 5);
    fill(ctx, palette.skin, offsetX + 5, top + 4, 2, 3);
    fill(ctx, palette.trim, offsetX + 5, top + 10, 2, 6);
    fill(ctx, palette.accent, offsetX + 6, top + 12, 2, 3);
  }

  if (direction === 'right') {
    fill(ctx, palette.hair, offsetX + 13, top + 2, 2, 5);
    fill(ctx, palette.skin, offsetX + 13, top + 4, 2, 3);
    fill(ctx, palette.trim, offsetX + 13, top + 10, 2, 6);
    fill(ctx, palette.accent, offsetX + 12, top + 12, 2, 3);
  }
}

function createCharacterSheet(
  scene: Phaser.Scene,
  key: string,
  palette: CharacterPalette,
): void {
  createTexture(scene, key, 20 * 8, 28, (ctx) => {
    DIRECTIONS.forEach((direction, directionIndex) => {
      drawCharacterFrame(ctx, directionIndex * 40, direction, 0, palette);
      drawCharacterFrame(ctx, directionIndex * 40 + 20, direction, 1, palette);
    });
  });

  const texture = scene.textures.get(key);
  if (texture.frameTotal === 1) {
    for (let frame = 0; frame < 8; frame += 1) {
      texture.add(frame, 0, frame * 20, 0, 20, 28);
    }
  }

  if (scene.anims.exists(`${key}-down`)) {
    return;
  }

  DIRECTIONS.forEach((direction, directionIndex) => {
    scene.anims.create({
      key: `${key}-${direction}`,
      frames: scene.anims.generateFrameNumbers(key, {
        start: directionIndex * 2,
        end: directionIndex * 2 + 1,
      }),
      frameRate: 8,
      repeat: -1,
    });
  });
}

export function generateArt(scene: Phaser.Scene): void {
  createTexture(scene, 'particle', 4, 4, (ctx) => {
    fill(ctx, '#f6efc3', 0, 0, 4, 4);
  });

  createTexture(scene, 'particle-mote', 4, 4, (ctx) => {
    fill(ctx, '#fff4d3', 1, 1, 2, 2);
  });

  createTexture(scene, 'particle-dust', 4, 4, (ctx) => {
    fill(ctx, '#f6d899', 1, 1, 2, 1);
    fill(ctx, '#d6b06a', 2, 2, 1, 1);
  });

  createTexture(scene, 'particle-rain', 2, 10, (ctx) => {
    fill(ctx, '#eaf7ff', 0, 0, 2, 7);
    fill(ctx, 'rgba(234,247,255,0.3)', 0, 7, 2, 3);
  });

  createTexture(scene, 'particle-bubble', 6, 6, (ctx) => {
    fillCircle(ctx, 'rgba(230,255,250,0.8)', 3, 3, 2.2);
    fillCircle(ctx, 'rgba(140,235,225,0.4)', 2, 2, 1.2);
  });

  createTexture(scene, 'particle-gull', 10, 6, (ctx) => {
    fill(ctx, '#fff7de', 1, 2, 3, 1);
    fill(ctx, '#fff7de', 6, 2, 3, 1);
    fill(ctx, '#fff7de', 4, 1, 2, 1);
  });

  createTexture(scene, 'ui-marker', 12, 12, (ctx) => {
    fill(ctx, '#7a4e20', 5, 0, 2, 2);
    fill(ctx, '#d9ae62', 4, 2, 4, 4);
    fill(ctx, '#f5df9a', 3, 5, 6, 4);
    fill(ctx, '#7a4e20', 4, 9, 4, 2);
  });

  createTexture(scene, 'mood-harbor', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      0,
      height,
      [
        [0, 'rgba(245,215,155,0.16)'],
        [0.38, 'rgba(115,149,176,0.05)'],
        [1, 'rgba(12,14,20,0.24)'],
      ],
      width,
      height,
    );
    paintRadialGlow(ctx, 98, 66, 0, 160, 'rgba(255,219,137,0.18)', 'rgba(255,219,137,0)');
    paintRadialGlow(ctx, 560, 340, 0, 220, 'rgba(24,77,109,0.12)', 'rgba(24,77,109,0)');
  });

  createTexture(scene, 'mood-storm', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      width,
      height,
      [
        [0, 'rgba(14,21,31,0.2)'],
        [0.45, 'rgba(25,39,55,0.12)'],
        [1, 'rgba(7,10,15,0.34)'],
      ],
      width,
      height,
    );
    paintRadialGlow(ctx, 520, 88, 0, 190, 'rgba(198,226,255,0.12)', 'rgba(198,226,255,0)');
    for (let y = -120; y < height + 160; y += 32) {
      fill(ctx, 'rgba(215,236,245,0.06)', 120 + (y % 90), y, 4, 30);
    }
  });

  createTexture(scene, 'mood-fish', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      0,
      height,
      [
        [0, 'rgba(72,26,78,0.18)'],
        [0.35, 'rgba(60,31,74,0.08)'],
        [1, 'rgba(9,18,24,0.28)'],
      ],
      width,
      height,
    );
    paintRadialGlow(ctx, 320, 210, 0, 190, 'rgba(104,255,220,0.12)', 'rgba(104,255,220,0)');
    paintRadialGlow(ctx, 122, 342, 0, 140, 'rgba(180,115,171,0.08)', 'rgba(180,115,171,0)');
  });

  createTexture(scene, 'mood-desert', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      0,
      height,
      [
        [0, 'rgba(246,205,125,0.12)'],
        [0.52, 'rgba(205,153,79,0.04)'],
        [1, 'rgba(48,29,17,0.18)'],
      ],
      width,
      height,
    );
    paintRadialGlow(ctx, 520, 62, 0, 150, 'rgba(255,235,167,0.16)', 'rgba(255,235,167,0)');
    fill(ctx, 'rgba(199,146,73,0.08)', 0, height - 96, width, 96);
  });

  createTexture(scene, 'mood-gate', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      0,
      height,
      [
        [0, 'rgba(233,212,171,0.11)'],
        [0.58, 'rgba(117,112,118,0.03)'],
        [1, 'rgba(15,15,22,0.18)'],
      ],
      width,
      height,
    );
    fill(ctx, 'rgba(28,19,24,0.09)', 0, 0, 86, height);
    fill(ctx, 'rgba(28,19,24,0.09)', width - 86, 0, 86, height);
  });

  createTexture(scene, 'mood-city', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      0,
      height,
      [
        [0, 'rgba(240,215,152,0.12)'],
        [0.5, 'rgba(176,125,77,0.03)'],
        [1, 'rgba(20,14,17,0.14)'],
      ],
      width,
      height,
    );
    paintRadialGlow(ctx, 480, 78, 0, 180, 'rgba(255,224,148,0.11)', 'rgba(255,224,148,0)');
    fill(ctx, 'rgba(102,59,43,0.05)', 0, height - 112, width, 112);
  });

  createTexture(scene, 'mood-hillside', 640, 480, (ctx, width, height) => {
    paintLinearGradient(
      ctx,
      0,
      0,
      0,
      height,
      [
        [0, 'rgba(247,211,121,0.13)'],
        [0.48, 'rgba(174,124,70,0.03)'],
        [1, 'rgba(20,15,13,0.18)'],
      ],
      width,
      height,
    );
    paintRadialGlow(ctx, 565, 78, 0, 175, 'rgba(255,228,144,0.18)', 'rgba(255,228,144,0)');
    paintRadialGlow(ctx, 124, 220, 0, 220, 'rgba(73,58,82,0.08)', 'rgba(73,58,82,0)');
  });

  createTexture(scene, 'tile-water', 32, 32, (ctx) => {
    fill(ctx, '#18445f', 0, 0, 32, 32);
    fill(ctx, '#286e8a', 0, 5, 32, 3);
    fill(ctx, '#5ba9b5', 4, 8, 18, 2);
    fill(ctx, '#3e8aa0', 16, 18, 12, 2);
    fill(ctx, '#7fd5d5', 22, 11, 6, 1);
  });

  createTexture(scene, 'tile-sand', 32, 32, (ctx) => {
    fill(ctx, '#c9ad6f', 0, 0, 32, 32);
    fill(ctx, '#d9c98b', 4, 4, 3, 3);
    fill(ctx, '#a48a58', 10, 10, 2, 2);
    fill(ctx, '#ead9a2', 20, 8, 4, 2);
    fill(ctx, '#a88e5a', 24, 22, 2, 2);
  });

  createTexture(scene, 'tile-dock', 32, 32, (ctx) => {
    drawWoodTile(ctx, '#805128', '#5c381d', '#c79355');
  });

  createTexture(scene, 'tile-rail', 32, 32, (ctx) => {
    drawWoodTile(ctx, '#684321', '#4d2f17', '#9f7445');
    fill(ctx, '#2d1d13', 0, 0, 32, 4);
    fill(ctx, '#2d1d13', 0, 28, 32, 4);
  });

  createTexture(scene, 'tile-deck', 32, 32, (ctx) => {
    drawWoodTile(ctx, '#936239', '#704424', '#d8ab6b');
  });

  createTexture(scene, 'tile-mast', 32, 32, (ctx) => {
    drawWoodTile(ctx, '#8a5a32', '#69411e', '#c99c5b');
    fill(ctx, '#5f3518', 13, 0, 6, 32);
    fill(ctx, '#dac398', 11, 7, 10, 1);
    fill(ctx, '#dac398', 11, 16, 10, 1);
    fill(ctx, '#dac398', 11, 25, 10, 1);
  });

  createTexture(scene, 'tile-fish_wall', 32, 32, (ctx) => {
    fill(ctx, '#4c2748', 0, 0, 32, 32);
    fill(ctx, '#6d3a64', 4, 4, 24, 24);
    fill(ctx, '#8f557e', 8, 8, 16, 16);
    fill(ctx, '#a86891', 10, 10, 12, 12);
  });

  createTexture(scene, 'tile-fish_floor', 32, 32, (ctx) => {
    fill(ctx, '#6f3f5c', 0, 0, 32, 32);
    fill(ctx, '#91566e', 3, 4, 6, 4);
    fill(ctx, '#7c4b60', 15, 10, 8, 5);
    fill(ctx, '#b47f98', 12, 22, 10, 3);
  });

  createTexture(scene, 'tile-bile', 32, 32, (ctx) => {
    fill(ctx, '#507528', 0, 0, 32, 32);
    fill(ctx, '#84b63f', 3, 6, 10, 6);
    fill(ctx, '#c7ef73', 16, 14, 9, 4);
    fill(ctx, '#8aca4c', 8, 21, 12, 4);
  });

  createTexture(scene, 'tile-road', 32, 32, (ctx) => {
    fill(ctx, '#b08755', 0, 0, 32, 32);
    fill(ctx, '#8b6942', 2, 8, 28, 2);
    fill(ctx, '#7b5c38', 3, 20, 22, 2);
    fill(ctx, '#c89b67', 10, 14, 12, 2);
  });

  createTexture(scene, 'tile-rock', 32, 32, (ctx) => {
    fill(ctx, '#6d5b49', 0, 0, 32, 32);
    fill(ctx, '#8d765f', 4, 3, 9, 8);
    fill(ctx, '#4f4337', 13, 10, 11, 7);
    fill(ctx, '#a48c72', 6, 20, 13, 7);
  });

  createTexture(scene, 'tile-spring_pool', 32, 32, (ctx) => {
    fill(ctx, '#7f6a4d', 0, 0, 32, 32);
    fill(ctx, '#4aa1b6', 5, 5, 22, 22);
    fill(ctx, '#81d8e4', 9, 9, 14, 14);
    fill(ctx, '#dffaf8', 11, 12, 8, 4);
  });

  createTexture(scene, 'tile-wall', 32, 32, (ctx) => {
    drawStoneTile(ctx, '#6a6471', '#403b46');
    fill(ctx, '#817a89', 0, 0, 32, 3);
  });

  createTexture(scene, 'tile-stone', 32, 32, (ctx) => {
    drawStoneTile(ctx, '#988f85', '#6a635b');
  });

  createTexture(scene, 'tile-garden', 32, 32, (ctx) => {
    fill(ctx, '#557349', 0, 0, 32, 32);
    fill(ctx, '#6e915f', 4, 4, 6, 5);
    fill(ctx, '#8bb276', 12, 10, 8, 5);
    fill(ctx, '#4a613f', 21, 21, 6, 4);
  });

  createTexture(scene, 'tile-hill', 32, 32, (ctx) => {
    fill(ctx, '#594636', 0, 0, 32, 32);
    fill(ctx, '#725a45', 2, 5, 11, 9);
    fill(ctx, '#3d2f24', 16, 11, 13, 8);
    fill(ctx, '#89705a', 6, 22, 15, 5);
  });

  createTexture(scene, 'tile-soil', 32, 32, (ctx) => {
    fill(ctx, '#8f6a43', 0, 0, 32, 32);
    fill(ctx, '#b48755', 6, 8, 10, 2);
    fill(ctx, '#6a4b32', 10, 20, 14, 2);
    fill(ctx, '#cf9d5f', 20, 12, 6, 2);
  });

  createTexture(scene, 'tile-grass', 32, 32, (ctx) => {
    fill(ctx, '#667f45', 0, 0, 32, 32);
    fill(ctx, '#8ba95c', 4, 4, 4, 10);
    fill(ctx, '#9dcf66', 10, 8, 3, 12);
    fill(ctx, '#78974b', 18, 5, 4, 14);
    fill(ctx, '#b5dd7a', 24, 10, 3, 10);
  });

  const objectFactories: Record<string, DrawCallback> = {
    'object-crate': (ctx) => {
      fill(ctx, '#7f4f28', 6, 8, 20, 16);
      fill(ctx, '#4f3117', 6, 8, 20, 2);
      fill(ctx, '#4f3117', 6, 22, 20, 2);
      fill(ctx, '#d3a160', 14, 8, 2, 16);
    },
    'object-sign': (ctx) => {
      fill(ctx, '#6b4422', 14, 12, 4, 14);
      fill(ctx, '#a07042', 6, 6, 20, 10);
      fill(ctx, '#3d2918', 8, 9, 16, 1);
    },
    'object-barrel': (ctx) => {
      fill(ctx, '#825329', 9, 8, 14, 16);
      fill(ctx, '#452814', 9, 9, 14, 2);
      fill(ctx, '#c69658', 10, 14, 12, 2);
      fill(ctx, '#452814', 9, 21, 14, 2);
    },
    'object-crate_stack': (ctx) => {
      fill(ctx, '#7a4d26', 4, 12, 12, 12);
      fill(ctx, '#926037', 16, 8, 12, 16);
      fill(ctx, '#d4a566', 9, 14, 2, 8);
      fill(ctx, '#d4a566', 21, 11, 2, 10);
    },
    'object-ship_shadow': (ctx) => {
      fill(ctx, 'rgba(11,25,36,0.45)', 4, 15, 24, 8);
      fill(ctx, 'rgba(11,25,36,0.6)', 8, 10, 14, 5);
    },
    'object-dock_post': (ctx) => {
      fill(ctx, '#5f381c', 13, 8, 6, 18);
      fill(ctx, '#a87b4a', 12, 8, 8, 3);
      fill(ctx, '#d3b078', 9, 15, 4, 3);
    },
    'object-door': (ctx) => {
      fill(ctx, '#53321a', 7, 5, 18, 22);
      fill(ctx, '#8d6035', 9, 7, 14, 18);
      fill(ctx, '#5d3a1d', 13, 7, 2, 18);
      fill(ctx, '#5d3a1d', 17, 7, 2, 18);
      fill(ctx, '#d4b07a', 20, 16, 2, 2);
    },
    'object-ledger_table': (ctx) => {
      fill(ctx, '#6d4525', 6, 14, 20, 8);
      fill(ctx, '#4b2d17', 8, 22, 3, 5);
      fill(ctx, '#4b2d17', 21, 22, 3, 5);
      fill(ctx, '#d9cda8', 10, 9, 12, 6);
      fill(ctx, '#8f6a43', 12, 11, 8, 2);
      fill(ctx, '#b3373a', 18, 10, 2, 4);
    },
    'object-rope_coil': (ctx) => {
      fill(ctx, '#6a4421', 8, 15, 16, 7);
      fill(ctx, '#c9a36d', 10, 14, 12, 9);
      fill(ctx, '#7f562e', 13, 16, 6, 4);
    },
    'object-net_stack': (ctx) => {
      fill(ctx, '#45615c', 6, 11, 20, 10);
      fill(ctx, '#7aa396', 8, 13, 16, 1);
      fill(ctx, '#7aa396', 8, 17, 16, 1);
      fill(ctx, '#d8bf79', 9, 9, 4, 4);
      fill(ctx, '#c98b55', 18, 8, 4, 4);
    },
    'object-lantern': (ctx) => {
      fill(ctx, '#5d3a1d', 14, 6, 4, 18);
      fill(ctx, '#f2d28b', 10, 10, 12, 10);
      fill(ctx, '#a86b2a', 11, 11, 10, 8);
      fill(ctx, '#fff0b8', 13, 12, 6, 6);
    },
    'object-sail_roll': (ctx) => {
      fill(ctx, '#7b522c', 6, 16, 20, 6);
      fill(ctx, '#ddcfad', 8, 10, 16, 8);
      fill(ctx, '#b89d73', 8, 18, 16, 2);
      fill(ctx, '#8f6940', 10, 12, 12, 1);
    },
    'object-cleat_off': (ctx) => {
      fill(ctx, '#4d3118', 10, 16, 12, 6);
      fill(ctx, '#9f7a4b', 8, 12, 4, 12);
      fill(ctx, '#9f7a4b', 20, 12, 4, 12);
    },
    'object-cleat_on': (ctx) => {
      fill(ctx, '#6b441d', 10, 16, 12, 6);
      fill(ctx, '#f0d58d', 8, 12, 4, 12);
      fill(ctx, '#f0d58d', 20, 12, 4, 12);
      fill(ctx, '#d0b35d', 6, 10, 20, 2);
    },
    'object-helm': (ctx) => {
      fill(ctx, '#68411f', 14, 5, 4, 22);
      fill(ctx, '#dcb172', 5, 13, 22, 4);
      fill(ctx, '#dcb172', 10, 8, 12, 14);
    },
    'object-cargo': (ctx) => {
      fill(ctx, '#895932', 6, 11, 20, 13);
      fill(ctx, '#6b4424', 6, 11, 20, 2);
      fill(ctx, '#d1a368', 10, 15, 12, 2);
    },
    'object-hatch': (ctx) => {
      fill(ctx, '#4a2d16', 6, 8, 20, 16);
      fill(ctx, '#9c7045', 8, 10, 16, 12);
      fill(ctx, '#c19661', 14, 10, 2, 12);
    },
    'object-sigil_off': (ctx) => {
      fill(ctx, '#5d3f5c', 10, 10, 12, 12);
      fill(ctx, '#90607d', 12, 12, 8, 8);
    },
    'object-sigil_on': (ctx) => {
      fill(ctx, '#6f5784', 9, 9, 14, 14);
      fill(ctx, '#9df7eb', 12, 12, 8, 8);
      fill(ctx, '#defdf7', 14, 14, 4, 4);
    },
    'object-altar': (ctx) => {
      fill(ctx, '#8d6683', 8, 10, 16, 12);
      fill(ctx, '#c99cb6', 10, 12, 12, 2);
      fill(ctx, '#4ce1c4', 14, 6, 4, 4);
    },
    'object-coral': (ctx) => {
      fill(ctx, '#ad6f96', 11, 10, 3, 14);
      fill(ctx, '#6be8c7', 15, 9, 3, 15);
      fill(ctx, '#ca8db4', 9, 16, 10, 2);
    },
    'object-fish_rib': (ctx) => {
      fill(ctx, '#c9a9b7', 14, 5, 4, 22);
      fill(ctx, '#efd7df', 11, 8, 10, 3);
      fill(ctx, '#efd7df', 9, 13, 14, 3);
      fill(ctx, '#efd7df', 8, 19, 16, 3);
    },
    'object-tendril': (ctx) => {
      fill(ctx, '#7f476a', 14, 4, 4, 24);
      fill(ctx, '#b06f96', 12, 8, 8, 4);
      fill(ctx, '#9de9dc', 13, 18, 6, 4);
    },
    'object-spring': (ctx) => {
      fill(ctx, '#5b6d3d', 6, 16, 20, 8);
      fill(ctx, '#52bfd2', 8, 8, 16, 12);
      fill(ctx, '#c8ffff', 12, 11, 8, 4);
    },
    'object-milestone': (ctx) => {
      fill(ctx, '#90897e', 11, 6, 10, 20);
      fill(ctx, '#6f675f', 13, 10, 6, 8);
    },
    'object-shrub': (ctx) => {
      fill(ctx, '#5e7338', 8, 15, 16, 7);
      fill(ctx, '#8aab55', 10, 10, 12, 8);
      fill(ctx, '#b4d06d', 14, 8, 6, 5);
    },
    'object-cairn': (ctx) => {
      fill(ctx, '#8e877d', 9, 19, 14, 5);
      fill(ctx, '#aaa296', 11, 14, 10, 5);
      fill(ctx, '#736d66', 14, 10, 6, 4);
    },
    'object-prayer_stone': (ctx) => {
      fill(ctx, '#8f8578', 11, 6, 10, 20);
      fill(ctx, '#696158', 13, 10, 6, 2);
      fill(ctx, '#d7c59b', 13, 14, 6, 1);
      fill(ctx, '#d7c59b', 13, 17, 6, 1);
    },
    'object-banner': (ctx) => {
      fill(ctx, '#6b421c', 13, 4, 3, 24);
      fill(ctx, '#a33f4f', 16, 7, 8, 12);
      fill(ctx, '#f4d27b', 18, 10, 4, 3);
    },
    'object-brazier': (ctx) => {
      fill(ctx, '#5f4f46', 12, 17, 8, 6);
      fill(ctx, '#34251d', 14, 10, 4, 8);
      fill(ctx, '#f09a43', 11, 8, 10, 6);
      fill(ctx, '#ffe59a', 14, 7, 4, 4);
    },
    'object-column': (ctx) => {
      fill(ctx, '#9c9588', 11, 6, 10, 20);
      fill(ctx, '#d0c6b3', 9, 6, 14, 3);
      fill(ctx, '#d0c6b3', 9, 23, 14, 3);
      fill(ctx, '#756d63', 13, 9, 6, 14);
    },
    'object-awning': (ctx) => {
      fill(ctx, '#734626', 8, 14, 2, 12);
      fill(ctx, '#734626', 22, 14, 2, 12);
      fill(ctx, '#a83e47', 5, 8, 22, 8);
      fill(ctx, '#e8d18d', 7, 10, 18, 2);
      fill(ctx, '#c26052', 9, 12, 14, 2);
    },
    'object-throne': (ctx) => {
      fill(ctx, '#5c334d', 8, 10, 16, 14);
      fill(ctx, '#dfbc69', 8, 8, 16, 3);
      fill(ctx, '#e2c87a', 10, 12, 12, 6);
    },
    'object-market': (ctx) => {
      fill(ctx, '#7d5031', 10, 16, 12, 10);
      fill(ctx, '#b93d52', 6, 10, 20, 6);
      fill(ctx, '#e7d287', 6, 13, 20, 1);
    },
    'object-watcher_pair': (ctx) => {
      fill(ctx, '#4f3527', 8, 15, 5, 9);
      fill(ctx, '#6f4f3d', 9, 10, 4, 5);
      fill(ctx, '#624634', 17, 14, 5, 10);
      fill(ctx, '#8c6950', 18, 10, 4, 4);
      fill(ctx, '#d2b184', 10, 10, 3, 3);
      fill(ctx, '#d8b891', 18, 10, 3, 3);
    },
    'object-citizen_group': (ctx) => {
      fill(ctx, '#6a4850', 6, 16, 5, 8);
      fill(ctx, '#835b40', 13, 14, 6, 10);
      fill(ctx, '#5f6643', 21, 15, 5, 9);
      fill(ctx, '#dfbb90', 7, 12, 3, 3);
      fill(ctx, '#e5c39a', 14, 10, 3, 3);
      fill(ctx, '#d9b587', 22, 11, 3, 3);
    },
    'object-cloth': (ctx) => {
      fill(ctx, '#d7c69c', 7, 10, 18, 12);
      fill(ctx, '#9e6e45', 7, 22, 18, 2);
    },
    'object-reeds': (ctx) => {
      fill(ctx, '#8c9c57', 8, 8, 2, 18);
      fill(ctx, '#b7c86d', 12, 6, 2, 20);
      fill(ctx, '#9aae60', 16, 10, 2, 16);
      fill(ctx, '#715130', 6, 22, 14, 2);
    },
    'object-stone_pile': (ctx) => {
      fill(ctx, '#8d867c', 6, 18, 8, 6);
      fill(ctx, '#aaa298', 12, 14, 10, 8);
      fill(ctx, '#736d65', 18, 19, 6, 5);
    },
    'object-shelter_frame': (ctx) => {
      fill(ctx, '#7a552f', 8, 10, 2, 14);
      fill(ctx, '#7a552f', 22, 10, 2, 14);
      fill(ctx, '#7a552f', 10, 10, 12, 2);
      fill(ctx, '#ccb98a', 11, 12, 10, 9);
    },
    'object-plant': (ctx) => {
      fill(ctx, '#4a6425', 15, 12, 2, 14);
      fill(ctx, '#7cbf42', 8, 8, 7, 8);
      fill(ctx, '#9fe45e', 16, 7, 8, 10);
      fill(ctx, '#5d8a31', 11, 15, 10, 4);
    },
    'object-dead_plant': (ctx) => {
      fill(ctx, '#624321', 15, 12, 2, 14);
      fill(ctx, '#876238', 9, 10, 6, 6);
      fill(ctx, '#74532d', 17, 9, 5, 6);
    },
    'object-sun_mark': (ctx) => {
      fill(ctx, '#f1b04a', 9, 9, 14, 14);
      fill(ctx, '#f7d17c', 12, 12, 8, 8);
    },
    'object-city_far': (ctx) => {
      fill(ctx, 'rgba(35,24,43,0.55)', 4, 18, 24, 8);
      fill(ctx, 'rgba(35,24,43,0.7)', 8, 12, 4, 6);
      fill(ctx, 'rgba(35,24,43,0.7)', 14, 8, 4, 10);
      fill(ctx, 'rgba(35,24,43,0.7)', 20, 14, 4, 4);
    },
  };

  Object.entries(objectFactories).forEach(([key, draw]) => {
    createTexture(scene, key, 32, 32, draw);
  });

  Object.entries(CHARACTER_PALETTES).forEach(([key, palette]) => {
    createCharacterSheet(scene, `char-${key}`, palette);
  });
}

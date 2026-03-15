import type { HudState, MapDefinition, SaveState } from '../types';
import { ITEM_LABELS } from './items';

export const MAPS: Record<string, MapDefinition> = {
  JOPPA_DOCKS: {
    id: 'JOPPA_DOCKS',
    name: 'Joppa Docks',
    chapter: 'Jonah 1',
    theme: 'harbor',
    tiles: [
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~........~~~~~~',
      '~~~~...........~~~~~',
      '~~~..==========..~~~',
      '~~...=........=...~~',
      '.....=........=.....',
      '.....=........=.....',
      '.....=........=.....',
      '.....====..====.....',
      '.....=........=.....',
      '.....=........=.....',
      '.....=........=.....',
      '.....==========.....',
      '....................',
      '....................',
    ],
    legend: {
      '~': 'water',
      '.': 'sand',
      '=': 'dock',
    },
    spawns: {
      dock_start: { x: 3, y: 13, facing: 'up' },
      merchant_side: { x: 14, y: 8, facing: 'left' },
    },
    npcs: [
      { id: 'messenger', name: 'Messenger', sprite: 'messenger', x: 3, y: 12, facing: 'down', event: 'script:messenger' },
      { id: 'merchant', name: 'Merchant', sprite: 'merchant', x: 15, y: 6, facing: 'left', event: 'script:merchant' },
      { id: 'sailor', name: 'Sailor', sprite: 'sailor', x: 16, y: 10, facing: 'left', event: 'script:sailor' },
      { id: 'dockmaster', name: 'Dockmaster', sprite: 'dockmaster', x: 9, y: 4, facing: 'down', event: 'script:dockmaster' },
      { id: 'captain', name: 'Captain', sprite: 'captain', x: 12, y: 4, facing: 'down', event: 'script:captain' },
    ],
    objects: [
      { id: 'manifest_crate', x: 13, y: 7, kind: 'crate', event: 'script:manifestCrate', solid: true },
      { id: 'dock_sign', x: 6, y: 9, kind: 'sign', event: 'dialogue:joppa_sign' },
    ],
    decorations: [
      { id: 'barrel_a', x: 5, y: 5, kind: 'barrel' },
      { id: 'barrel_b', x: 6, y: 5, kind: 'barrel' },
      { id: 'crate_stack', x: 11, y: 10, kind: 'crate_stack' },
      { id: 'boat_shadow', x: 17, y: 3, kind: 'ship_shadow' },
    ],
  },
  SHIP_DECK: {
    id: 'SHIP_DECK',
    name: 'Ship Deck',
    chapter: 'Jonah 1',
    theme: 'storm',
    onEnterEvent: 'script:onEnterShip',
    tiles: [
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~########~~~~~',
      '~~~~~~#========#~~~~',
      '~~~~~#==========#~~~',
      '~~~~~#===....===#~~~',
      '~~~~~#===.||.===#~~~',
      '~~~~~#==========#~~~',
      '~~~~~#====##====#~~~',
      '~~~~~#==========#~~~',
      '~~~~~#===....===#~~~',
      '~~~~~#==========#~~~',
      '~~~~~~#========#~~~~',
      '~~~~~~~########~~~~~',
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~',
    ],
    legend: {
      '~': 'water',
      '#': 'rail',
      '=': 'deck',
      '.': 'deck',
      '|': 'mast',
    },
    spawns: {
      gangplank: { x: 10, y: 10, facing: 'up' },
    },
    npcs: [
      { id: 'captain', name: 'Ship Captain', sprite: 'captain', x: 10, y: 3, facing: 'down', event: 'script:shipCaptain' },
      { id: 'sailor_port', name: 'Sailor', sprite: 'sailor', x: 7, y: 9, facing: 'right', event: 'script:stormSailor' },
      { id: 'sailor_starboard', name: 'Sailor', sprite: 'sailor2', x: 13, y: 9, facing: 'left', event: 'script:stormSailor' },
    ],
    objects: [
      {
        id: 'cleat_port',
        x: 7,
        y: 7,
        kind: 'cleat_off',
        kindOn: 'cleat_on',
        kindOff: 'cleat_off',
        event: 'script:toggleCargoCleat',
        puzzleId: 'cargo_cleats',
        puzzleIndex: 0,
      },
      {
        id: 'cleat_center',
        x: 10,
        y: 7,
        kind: 'cleat_off',
        kindOn: 'cleat_on',
        kindOff: 'cleat_off',
        event: 'script:toggleCargoCleat',
        puzzleId: 'cargo_cleats',
        puzzleIndex: 1,
      },
      {
        id: 'cleat_starboard',
        x: 13,
        y: 7,
        kind: 'cleat_off',
        kindOn: 'cleat_on',
        kindOff: 'cleat_off',
        event: 'script:toggleCargoCleat',
        puzzleId: 'cargo_cleats',
        puzzleIndex: 2,
      },
      { id: 'helm', x: 10, y: 11, kind: 'helm', event: 'dialogue:ship_helm' },
    ],
    decorations: [
      { id: 'cargo_a', x: 8, y: 4, kind: 'cargo' },
      { id: 'cargo_b', x: 12, y: 4, kind: 'cargo' },
      { id: 'hatch', x: 10, y: 9, kind: 'hatch' },
    ],
  },
  FISH_INTERIOR: {
    id: 'FISH_INTERIOR',
    name: 'Fish Interior',
    chapter: 'Jonah 2',
    theme: 'fish',
    onEnterEvent: 'script:onEnterFish',
    tiles: [
      '%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%',
      '%%%%%:::::::::%%%%%%',
      '%%%%:::::::::::%%%%%',
      '%%%:::::~~~:::::%%%%',
      '%%:::::.....:::::%%%',
      '%%::::.......::::%%%',
      '%%:::.........:::%%%',
      '%%::::.......::::%%%',
      '%%:::::.....:::::%%%',
      '%%%:::::~~~:::::%%%%',
      '%%%%:::::::::::%%%%%',
      '%%%%%:::::::::%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%',
    ],
    legend: {
      '%': 'fish_wall',
      ':': 'fish_floor',
      '.': 'fish_floor',
      '~': 'bile',
    },
    spawns: {
      swallowed: { x: 10, y: 11, facing: 'up' },
    },
    npcs: [],
    objects: [
      {
        id: 'sigil_north',
        x: 10,
        y: 5,
        kind: 'sigil_off',
        kindOn: 'sigil_on',
        kindOff: 'sigil_off',
        event: 'script:toggleFishSigil',
        puzzleId: 'fish_sigils',
        puzzleIndex: 0,
      },
      {
        id: 'sigil_west',
        x: 7,
        y: 7,
        kind: 'sigil_off',
        kindOn: 'sigil_on',
        kindOff: 'sigil_off',
        event: 'script:toggleFishSigil',
        puzzleId: 'fish_sigils',
        puzzleIndex: 1,
      },
      {
        id: 'sigil_east',
        x: 13,
        y: 7,
        kind: 'sigil_off',
        kindOn: 'sigil_on',
        kindOff: 'sigil_off',
        event: 'script:toggleFishSigil',
        puzzleId: 'fish_sigils',
        puzzleIndex: 2,
      },
      {
        id: 'sigil_south',
        x: 10,
        y: 9,
        kind: 'sigil_off',
        kindOn: 'sigil_on',
        kindOff: 'sigil_off',
        event: 'script:toggleFishSigil',
        puzzleId: 'fish_sigils',
        puzzleIndex: 3,
      },
      { id: 'altar', x: 10, y: 3, kind: 'altar', event: 'script:fishAltar' },
    ],
    decorations: [
      { id: 'spore_a', x: 6, y: 5, kind: 'coral' },
      { id: 'spore_b', x: 14, y: 9, kind: 'coral' },
    ],
  },
  COAST_ROAD: {
    id: 'COAST_ROAD',
    name: 'Coast Road',
    chapter: 'Jonah 3',
    theme: 'desert',
    onEnterEvent: 'script:onEnterRoad',
    tiles: [
      '..^^^^^^^^^^........',
      '..^^^....^^^........',
      '..^^......^^........',
      '.....;;;;;..........',
      '....;;...;;....oo...',
      '...;;.....;;...oo...',
      '..;;.......;;.......',
      '..;;.......;;.......',
      '..;;.......;;.......',
      '...;;.....;;........',
      '....;;...;;.........',
      '.....;;;;;..........',
      '...............^^^^.',
      '..............^^^^^.',
      '....................',
    ],
    legend: {
      '.': 'sand',
      ';': 'road',
      '^': 'rock',
      'o': 'spring_pool',
    },
    spawns: {
      shoreline: { x: 3, y: 11, facing: 'up' },
    },
    npcs: [
      { id: 'traveler', name: 'Traveler', sprite: 'traveler', x: 7, y: 7, facing: 'right', event: 'script:traveler' },
      { id: 'guard', name: 'Caravan Guard', sprite: 'guard', x: 10, y: 6, facing: 'left', event: 'dialogue:road_guard' },
    ],
    objects: [
      { id: 'spring', x: 16, y: 4, kind: 'spring', event: 'script:spring' },
      { id: 'milestone', x: 12, y: 11, kind: 'milestone', event: 'dialogue:road_sign' },
    ],
    exits: [
      {
        id: 'to_gate',
        x: 18,
        y: 6,
        width: 2,
        height: 3,
        targetMap: 'NINEVEH_GATE',
        targetSpawn: 'roadside',
        activeWhen: {
          allFlags: ['roadPassGranted'],
        },
      },
    ],
  },
  NINEVEH_GATE: {
    id: 'NINEVEH_GATE',
    name: 'Nineveh Gate',
    chapter: 'Jonah 3',
    theme: 'gate',
    tiles: [
      '####################',
      '####################',
      '###......##......###',
      '###......##......###',
      '###......##......###',
      '........;..;........',
      '........;..;........',
      '........;..;........',
      '........;..;........',
      '###......##......###',
      '###......##......###',
      '###......##......###',
      '####################',
      '####################',
      '........,,,,........',
    ],
    legend: {
      '#': 'wall',
      '.': 'stone',
      ';': 'road',
      ',': 'grass',
    },
    spawns: {
      roadside: { x: 2, y: 7, facing: 'right' },
    },
    npcs: [
      { id: 'gate_guard', name: 'Guard', sprite: 'guard', x: 8, y: 7, facing: 'left', event: 'script:gateGuard' },
    ],
    objects: [
      { id: 'city_banner_left', x: 6, y: 4, kind: 'banner', event: 'dialogue:gate_banner' },
      { id: 'city_banner_right', x: 13, y: 4, kind: 'banner', event: 'dialogue:gate_banner' },
    ],
    exits: [
      {
        id: 'to_center',
        x: 9,
        y: 2,
        width: 2,
        height: 1,
        targetMap: 'NINEVEH_CENTER',
        targetSpawn: 'west_entry',
        activeWhen: {
          allFlags: ['enteredNineveh'],
        },
      },
    ],
  },
  NINEVEH_CENTER: {
    id: 'NINEVEH_CENTER',
    name: 'Nineveh Center',
    chapter: 'Jonah 3',
    theme: 'city',
    onEnterEvent: 'script:onEnterNineveh',
    tiles: [
      '####################',
      '#......,,,,......###',
      '#....,,....,,....###',
      '#...,,......,,...###',
      '#..,,..;;;;..,,..###',
      '#..,..;;..;;..,..###',
      '#.....;;..;;.....###',
      '#.....;;..;;.....###',
      '#..,..;;..;;..,..###',
      '#..,,..;;;;..,,..###',
      '#...,,......,,...###',
      '#....,,....,,....###',
      '#......,,,,......###',
      '###.............####',
      '#######.....########',
    ],
    legend: {
      '#': 'wall',
      '.': 'stone',
      ';': 'road',
      ',': 'garden',
    },
    spawns: {
      west_entry: { x: 2, y: 7, facing: 'right' },
    },
    npcs: [
      { id: 'herald', name: 'Herald', sprite: 'herald', x: 6, y: 8, facing: 'right', event: 'script:herald' },
      { id: 'official', name: 'Official', sprite: 'official', x: 13, y: 8, facing: 'left', event: 'script:official' },
      { id: 'king', name: 'King of Nineveh', sprite: 'king', x: 10, y: 2, facing: 'down', event: 'script:king' },
    ],
    objects: [
      { id: 'throne', x: 10, y: 1, kind: 'throne', event: 'dialogue:throne' },
    ],
    decorations: [
      { id: 'banner_l', x: 4, y: 5, kind: 'banner' },
      { id: 'banner_r', x: 15, y: 5, kind: 'banner' },
      { id: 'market_l', x: 5, y: 11, kind: 'market' },
      { id: 'market_r', x: 14, y: 11, kind: 'market' },
    ],
    exits: [
      {
        id: 'to_east_city',
        x: 18,
        y: 6,
        width: 2,
        height: 3,
        targetMap: 'EAST_OF_CITY',
        targetSpawn: 'overlook',
        activeWhen: {
          allFlags: ['ninevehRepented'],
        },
      },
    ],
  },
  EAST_OF_CITY: {
    id: 'EAST_OF_CITY',
    name: 'East of the City',
    chapter: 'Jonah 4',
    theme: 'hillside',
    onEnterEvent: 'script:onEnterEastCity',
    tiles: [
      '^^^^^^^^^^^^^^^^^^^^',
      '^^^^^^^.....^^^^^^^^',
      '^^^^^........^^^^^^^',
      '^^^^..........^^^^^^',
      '^^^....,,,,....^^^^^',
      '^^....,,..,,....^^^^',
      '^....,......,....^^^',
      '^....,......,....^^^',
      '^....,......,....^^^',
      '^^....,,..,,....^^^^',
      '^^^....,,,,....^^^^^',
      '^^^^..........^^^^^^',
      '^^^^^........^^^^^^^',
      '^^^^^^^.....^^^^^^^^',
      '^^^^^^^^^^^^^^^^^^^^',
    ],
    legend: {
      '^': 'hill',
      '.': 'soil',
      ',': 'grass',
    },
    spawns: {
      overlook: { x: 3, y: 7, facing: 'right' },
    },
    npcs: [],
    objects: [
      { id: 'cloth_roll', x: 5, y: 4, kind: 'cloth', event: 'script:shelterCloth', visibleWhen: { notFlags: ['gotShelterCloth'] } },
      { id: 'reed_bundle', x: 15, y: 10, kind: 'reeds', event: 'script:shelterReeds', visibleWhen: { notFlags: ['gotShelterReeds'] } },
      { id: 'stone_pile', x: 14, y: 4, kind: 'stone_pile', event: 'script:shelterStones', visibleWhen: { notFlags: ['gotShelterStones'] } },
      { id: 'shelter_frame', x: 9, y: 7, kind: 'shelter_frame', event: 'script:shelterFrame', visibleWhen: { minValues: { shelterStep: 1 } } },
      { id: 'leafy_plant', x: 12, y: 6, kind: 'plant', event: 'dialogue:plant_alive', visibleWhen: { allFlags: ['plantGrown'], notFlags: ['wormEvent'] } },
      { id: 'withered_plant', x: 12, y: 6, kind: 'dead_plant', event: 'dialogue:plant_dead', visibleWhen: { allFlags: ['wormEvent'] } },
    ],
    decorations: [
      { id: 'sun_marker', x: 16, y: 2, kind: 'sun_mark' },
      { id: 'city_silhouette', x: 4, y: 1, kind: 'city_far', depthOffset: -20 },
    ],
  },
};

export const COLLISION_TILES = new Set(['water', 'rail', 'mast', 'fish_wall', 'bile', 'rock', 'wall', 'hill']);

export function createInitialFlags(): SaveState['flags'] {
  return {
    heardCall: false,
    fareTokenObtained: false,
    boardedShip: false,
    stormStarted: false,
    cargoSolved: false,
    thrownOverboard: false,
    fishSolved: false,
    fishReleased: false,
    roadPassGranted: false,
    enteredNineveh: false,
    deliveredMessage: false,
    ninevehRepented: false,
    plantGrown: false,
    wormEvent: false,
    endingSeen: false,
    joppaTriviaPassed: false,
    kingTriviaPassed: false,
    fareQuestStep: 0,
    roadQuestStep: 0,
    shelterStep: 0,
    gotShelterCloth: false,
    gotShelterReeds: false,
    gotShelterStones: false,
  };
}

export function createInitialSave(): SaveState {
  return {
    version: 1,
    map: 'JOPPA_DOCKS',
    spawn: 'dock_start',
    player: {
      x: 3,
      y: 13,
      facing: 'up',
    },
    inventory: [],
    flags: createInitialFlags(),
    puzzles: {
      cargo_cleats: [0, 0, 0],
      fish_sigils: [0, 0, 0, 0],
    },
    trivia: {
      answered: {},
      attemptsLeft: {},
    },
  };
}

function hasItemLabel(inventory: string[]): string[] {
  return inventory.map((id) => ITEM_LABELS[id] ?? id);
}

export function getHudState(save: SaveState): HudState {
  return {
    chapter: MAPS[save.map].chapter,
    location: MAPS[save.map].name,
    objective: getCurrentObjective(save),
    inventory: hasItemLabel(save.inventory),
  };
}

export function getCurrentObjective(save: SaveState): string {
  const flags = save.flags;

  switch (save.map) {
    case 'JOPPA_DOCKS':
      if (!flags.heardCall) return 'Hear the word of the LORD at the docks.';
      if (!flags.fareTokenObtained) {
        if (Number(flags.fareQuestStep) <= 0) return 'Find a way to pay fare for Tarshish.';
        if (Number(flags.fareQuestStep) === 1) return 'Carry the merchant’s manifest to the sailor.';
        return 'Return the sailor’s receipt to the merchant.';
      }
      if (!flags.joppaTriviaPassed) return 'Answer the dockmaster’s question about Jonah’s calling.';
      return 'Board the ship bound for Tarshish.';
    case 'SHIP_DECK':
      if (!flags.cargoSolved) return 'Secure the cargo by setting the cleats in the right pattern.';
      if (!flags.thrownOverboard) return 'Face the crew and confess why the storm has come.';
      return 'The sea has closed over Jonah.';
    case 'FISH_INTERIOR':
      if (!flags.fishSolved) return 'Light the sigils and pray from the belly of the fish.';
      return 'Seek mercy and wait for deliverance.';
    case 'COAST_ROAD':
      if (!flags.roadPassGranted) {
        if (Number(flags.roadQuestStep) <= 0) return 'Help the traveler who has collapsed on the road.';
        return 'Bring fresh water back from the spring.';
      }
      return 'Follow the road toward Nineveh.';
    case 'NINEVEH_GATE':
      if (!flags.enteredNineveh) return 'Speak the warning and gain entry through the gate.';
      return 'Pass through the gate into the great city.';
    case 'NINEVEH_CENTER':
      if (!flags.deliveredMessage) return 'Carry the warning from street to throne.';
      if (!flags.ninevehRepented) return 'Stand before the king and witness Nineveh’s response.';
      return 'Leave the city and watch what the LORD will do.';
    case 'EAST_OF_CITY':
      if (Number(flags.shelterStep) < 3) return 'Gather what Jonah needs to build a shelter east of the city.';
      if (!flags.plantGrown) return 'Rest beneath the shelter and wait.';
      if (!flags.wormEvent) return 'Watch the plant that rose to shade Jonah.';
      if (!flags.endingSeen) return 'Listen for the LORD’s final question.';
      return 'The story closes in silence.';
    default:
      return 'Walk on.';
  }
}

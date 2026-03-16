import type { HudState, MapDefinition, ObjectiveTarget, SaveState } from '../types';
import { ITEM_LABELS } from './items';

export const MAPS: Record<string, MapDefinition> = {
  JOPPA_DOCKS: {
    id: 'JOPPA_DOCKS',
    name: 'Joppa Docks',
    chapter: 'Jonah 1',
    theme: 'harbor',
    onEnterEvent: 'script:onEnterJoppa',
    tiles: [
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~........~~~~~~',
      '~~~~...........~~~~~',
      '~~~..==========..~~~',
      '~~...=........=...~~',
      '#####=........=.....',
      '#+++#=........=.....',
      '#+++#=........=.....',
      '##=##====..====.....',
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
      '#': 'wall',
      '+': 'stone',
    },
    spawns: {
      dock_start: { x: 3, y: 13, facing: 'up' },
      merchant_side: { x: 14, y: 8, facing: 'left' },
      office_return: { x: 2, y: 9, facing: 'up' },
    },
    npcs: [
      { id: 'messenger', name: 'Messenger', sprite: 'messenger', x: 3, y: 12, facing: 'down', event: 'script:messenger' },
      { id: 'merchant', name: 'Merchant', sprite: 'merchant', x: 15, y: 6, facing: 'left', event: 'script:merchant' },
      { id: 'sailor', name: 'Sailor', sprite: 'sailor', x: 16, y: 10, facing: 'left', event: 'script:sailor' },
      { id: 'dockmaster', name: 'Dockmaster', sprite: 'dockmaster', x: 9, y: 4, facing: 'down', event: 'script:dockmaster' },
      { id: 'captain', name: 'Captain', sprite: 'captain', x: 12, y: 4, facing: 'down', event: 'script:captain' },
    ],
    objects: [
      {
        id: 'harbor_office_door',
        x: 2,
        y: 8,
        kind: 'door',
        name: 'Harbor Office',
        verb: 'Enter',
        event: 'script:harborOfficeDoor',
        solid: true,
      },
      { id: 'dock_sign', x: 6, y: 9, kind: 'sign', name: 'Dock Sign', verb: 'Read', event: 'dialogue:joppa_sign', solid: true },
    ],
    decorations: [
      { id: 'barrel_a', x: 5, y: 5, kind: 'barrel', solid: true },
      { id: 'barrel_b', x: 6, y: 5, kind: 'barrel', solid: true },
      { id: 'crate_stack', x: 11, y: 10, kind: 'crate_stack', solid: true },
      { id: 'boat_shadow', x: 17, y: 3, kind: 'ship_shadow', scale: 1.25, alpha: 0.55, depthOffset: -8 },
      { id: 'watchers', x: 3, y: 7, kind: 'watcher_pair', alpha: 0.88 },
      { id: 'lantern_quay', x: 10, y: 5, kind: 'lantern', bobAmplitude: 0.5, bobSpeed: 1600, solid: true },
      { id: 'rope_coil', x: 7, y: 10, kind: 'rope_coil' },
      { id: 'net_stack', x: 14, y: 9, kind: 'net_stack' },
      { id: 'sail_roll', x: 16, y: 8, kind: 'sail_roll', alpha: 0.9 },
      { id: 'dock_post_left', x: 1, y: 14, kind: 'dock_post', layer: 'foreground', scale: 1.1, solid: true },
      { id: 'dock_post_right', x: 18, y: 14, kind: 'dock_post', layer: 'foreground', scale: 1.1, solid: true },
    ],
  },
  JOPPA_HARBOR_OFFICE: {
    id: 'JOPPA_HARBOR_OFFICE',
    name: 'Harbor Office',
    chapter: 'Jonah 1',
    theme: 'harbor',
    tiles: [
      '####################',
      '####################',
      '###++++++++++++++###',
      '###++++++++++++++###',
      '###+++++====+++++###',
      '###+++++====+++++###',
      '###+++++====+++++###',
      '###++++......++++###',
      '###++++......++++###',
      '###++++......++++###',
      '###++++......++++###',
      '###++++++++++++++###',
      '###++++++++++++++###',
      '##########==########',
      '####################',
    ],
    legend: {
      '#': 'wall',
      '+': 'stone',
      '.': 'stone',
      '=': 'dock',
    },
    spawns: {
      from_docks: { x: 10, y: 12, facing: 'up' },
    },
    npcs: [],
    objects: [
      {
        id: 'manifest_crate',
        x: 10,
        y: 5,
        kind: 'ledger_table',
        name: 'Tarshish Manifest',
        verb: 'Take',
        event: 'script:manifestCrate',
        solid: true,
      },
      {
        id: 'office_exit',
        x: 10,
        y: 13,
        kind: 'door',
        name: 'Docks',
        verb: 'Leave',
        event: 'script:leaveHarborOffice',
        solid: true,
      },
    ],
    decorations: [
      { id: 'office_lantern_l', x: 6, y: 4, kind: 'lantern', solid: true },
      { id: 'office_lantern_r', x: 14, y: 4, kind: 'lantern', solid: true },
      { id: 'office_crate_l', x: 6, y: 9, kind: 'crate_stack', solid: true, alpha: 0.92 },
      { id: 'office_crate_r', x: 14, y: 9, kind: 'crate_stack', solid: true, alpha: 0.92 },
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
        name: 'Port Cleat',
        verb: 'Toggle',
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
        name: 'Center Cleat',
        verb: 'Toggle',
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
        name: 'Starboard Cleat',
        verb: 'Toggle',
        kindOn: 'cleat_on',
        kindOff: 'cleat_off',
        event: 'script:toggleCargoCleat',
        puzzleId: 'cargo_cleats',
        puzzleIndex: 2,
      },
      { id: 'helm', x: 10, y: 11, kind: 'helm', name: 'Helm', verb: 'Inspect', event: 'dialogue:ship_helm', solid: true },
    ],
    decorations: [
      { id: 'cargo_a', x: 8, y: 4, kind: 'cargo', solid: true },
      { id: 'cargo_b', x: 12, y: 4, kind: 'cargo', solid: true },
      { id: 'hatch', x: 10, y: 9, kind: 'hatch', solid: true },
      { id: 'lantern_port', x: 7, y: 2, kind: 'lantern', bobAmplitude: 0.8, bobSpeed: 1200, solid: true },
      { id: 'lantern_starboard', x: 13, y: 2, kind: 'lantern', bobAmplitude: 0.8, bobSpeed: 1280, solid: true },
      { id: 'rope_port', x: 7, y: 11, kind: 'rope_coil' },
      { id: 'rope_starboard', x: 13, y: 11, kind: 'rope_coil' },
      { id: 'sail_roll', x: 10, y: 2, kind: 'sail_roll', scale: 1.1, alpha: 0.92 },
      { id: 'net_port', x: 6, y: 6, kind: 'net_stack', alpha: 0.78 },
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
        name: 'North Sigil',
        verb: 'Toggle',
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
        name: 'West Sigil',
        verb: 'Toggle',
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
        name: 'East Sigil',
        verb: 'Toggle',
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
        name: 'South Sigil',
        verb: 'Toggle',
        kindOn: 'sigil_on',
        kindOff: 'sigil_off',
        event: 'script:toggleFishSigil',
        puzzleId: 'fish_sigils',
        puzzleIndex: 3,
      },
      { id: 'altar', x: 10, y: 3, kind: 'altar', name: 'Altar of Prayer', verb: 'Pray', event: 'script:fishAltar', solid: true },
    ],
    decorations: [
      { id: 'spore_a', x: 6, y: 5, kind: 'coral' },
      { id: 'spore_b', x: 14, y: 9, kind: 'coral' },
      { id: 'rib_nw', x: 6, y: 4, kind: 'fish_rib', scale: 1.05, alpha: 0.82, solid: true },
      { id: 'rib_ne', x: 14, y: 4, kind: 'fish_rib', scale: 1.05, alpha: 0.82, solid: true },
      { id: 'rib_sw', x: 6, y: 10, kind: 'fish_rib', scale: 1.05, alpha: 0.82, solid: true },
      { id: 'rib_se', x: 14, y: 10, kind: 'fish_rib', scale: 1.05, alpha: 0.82, solid: true },
      { id: 'tendril_north', x: 9, y: 4, kind: 'tendril', bobAmplitude: 1.2, bobSpeed: 1100, alpha: 0.88 },
      { id: 'tendril_south', x: 11, y: 10, kind: 'tendril', bobAmplitude: 0.9, bobSpeed: 1350, alpha: 0.88 },
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
      { id: 'spring', x: 16, y: 4, kind: 'spring', name: 'Spring', verb: 'Draw Water', event: 'script:spring', solid: true },
      { id: 'milestone', x: 12, y: 11, kind: 'milestone', name: 'Milestone', verb: 'Read', event: 'dialogue:road_sign', solid: true },
    ],
    decorations: [
      { id: 'road_cairn', x: 10, y: 3, kind: 'cairn', solid: true },
      { id: 'shrub_a', x: 4, y: 9, kind: 'shrub', alpha: 0.9 },
      { id: 'shrub_b', x: 14, y: 12, kind: 'shrub', alpha: 0.84 },
      { id: 'prayer_stone', x: 7, y: 12, kind: 'prayer_stone', alpha: 0.92, solid: true },
      { id: 'road_watchers', x: 15, y: 8, kind: 'watcher_pair', alpha: 0.65 },
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
      { id: 'city_banner_left', x: 6, y: 4, kind: 'banner', name: 'City Banner', verb: 'Inspect', event: 'dialogue:gate_banner', solid: true },
      { id: 'city_banner_right', x: 13, y: 4, kind: 'banner', name: 'City Banner', verb: 'Inspect', event: 'dialogue:gate_banner', solid: true },
    ],
    decorations: [
      { id: 'column_left', x: 5, y: 4, kind: 'column', scale: 1.05, solid: true },
      { id: 'column_right', x: 14, y: 4, kind: 'column', scale: 1.05, solid: true },
      { id: 'brazier_left', x: 6, y: 8, kind: 'brazier', solid: true },
      { id: 'brazier_right', x: 13, y: 8, kind: 'brazier', solid: true },
      { id: 'gate_watchers', x: 10, y: 11, kind: 'watcher_pair', alpha: 0.82 },
      { id: 'grass_citizens', x: 3, y: 13, kind: 'citizen_group', alpha: 0.66 },
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
      palace_return: { x: 10, y: 2, facing: 'up' },
    },
    npcs: [
      { id: 'herald', name: 'Herald', sprite: 'herald', x: 6, y: 8, facing: 'right', event: 'script:herald' },
      { id: 'official', name: 'Official', sprite: 'official', x: 13, y: 8, facing: 'left', event: 'script:official' },
    ],
    objects: [
      {
        id: 'palace_door',
        x: 10,
        y: 1,
        kind: 'door',
        name: 'Palace Door',
        verb: 'Enter',
        event: 'script:palaceDoor',
        solid: true,
      },
    ],
    decorations: [
      { id: 'banner_l', x: 4, y: 5, kind: 'banner' },
      { id: 'banner_r', x: 15, y: 5, kind: 'banner' },
      { id: 'market_l', x: 5, y: 11, kind: 'market', solid: true },
      { id: 'market_r', x: 14, y: 11, kind: 'market', solid: true },
      { id: 'column_palace_l', x: 8, y: 2, kind: 'column', scale: 1.05, solid: true },
      { id: 'column_palace_r', x: 12, y: 2, kind: 'column', scale: 1.05, solid: true },
      { id: 'brazier_palace_l', x: 8, y: 4, kind: 'brazier', solid: true },
      { id: 'brazier_palace_r', x: 12, y: 4, kind: 'brazier', solid: true },
      { id: 'citizens_l', x: 4, y: 8, kind: 'citizen_group', alpha: 0.8 },
      { id: 'citizens_r', x: 16, y: 9, kind: 'citizen_group', alpha: 0.8 },
      { id: 'awning_l', x: 5, y: 10, kind: 'awning', scale: 1.08, alpha: 0.9, solid: true },
      { id: 'awning_r', x: 15, y: 10, kind: 'awning', scale: 1.08, alpha: 0.9, solid: true },
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
  NINEVEH_PALACE: {
    id: 'NINEVEH_PALACE',
    name: 'Nineveh Palace',
    chapter: 'Jonah 3',
    theme: 'city',
    tiles: [
      '####################',
      '####################',
      '#####............###',
      '#####....;;;;....###',
      '#####...;;..;;...###',
      '#####...;....;...###',
      '#####...;....;...###',
      '#####...;....;...###',
      '#####...;;..;;...###',
      '#####....;;;;....###',
      '#####.....;;.....###',
      '#####....++++....###',
      '#########....#######',
      '#########==#########',
      '####################',
    ],
    legend: {
      '#': 'wall',
      '.': 'stone',
      ';': 'road',
      '+': 'stone',
      '=': 'dock',
    },
    spawns: {
      from_center: { x: 10, y: 12, facing: 'up' },
    },
    npcs: [
      { id: 'king', name: 'King of Nineveh', sprite: 'king', x: 10, y: 4, facing: 'down', event: 'script:king' },
    ],
    objects: [
      { id: 'throne', x: 10, y: 2, kind: 'throne', name: 'Throne', verb: 'Inspect', event: 'dialogue:throne', solid: true },
      { id: 'palace_exit', x: 10, y: 13, kind: 'door', name: 'City Square', verb: 'Leave', event: 'script:leavePalace', solid: true },
    ],
    decorations: [
      { id: 'palace_column_l1', x: 7, y: 4, kind: 'column', solid: true },
      { id: 'palace_column_r1', x: 13, y: 4, kind: 'column', solid: true },
      { id: 'palace_column_l2', x: 7, y: 8, kind: 'column', solid: true },
      { id: 'palace_column_r2', x: 13, y: 8, kind: 'column', solid: true },
      { id: 'palace_brazier_l', x: 8, y: 10, kind: 'brazier', solid: true },
      { id: 'palace_brazier_r', x: 12, y: 10, kind: 'brazier', solid: true },
      { id: 'palace_banner_l', x: 6, y: 3, kind: 'banner' },
      { id: 'palace_banner_r', x: 14, y: 3, kind: 'banner' },
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
      { id: 'cloth_roll', x: 5, y: 4, kind: 'cloth', name: 'Cloth Roll', verb: 'Gather', event: 'script:shelterCloth', solid: true, visibleWhen: { notFlags: ['gotShelterCloth'] } },
      { id: 'reed_bundle', x: 15, y: 10, kind: 'reeds', name: 'Reed Bundle', verb: 'Gather', event: 'script:shelterReeds', solid: true, visibleWhen: { notFlags: ['gotShelterReeds'] } },
      { id: 'stone_pile', x: 14, y: 4, kind: 'stone_pile', name: 'Stone Pile', verb: 'Gather', event: 'script:shelterStones', solid: true, visibleWhen: { notFlags: ['gotShelterStones'] } },
      { id: 'shelter_frame', x: 9, y: 7, kind: 'shelter_frame', name: 'Shelter Frame', verb: 'Rest', event: 'script:shelterFrame', solid: true, visibleWhen: { minValues: { shelterStep: 1 } } },
      { id: 'leafy_plant', x: 12, y: 6, kind: 'plant', name: 'Leafy Plant', verb: 'Inspect', event: 'dialogue:plant_alive', solid: true, visibleWhen: { allFlags: ['plantGrown'], notFlags: ['wormEvent'] } },
      { id: 'withered_plant', x: 12, y: 6, kind: 'dead_plant', name: 'Withered Plant', verb: 'Inspect', event: 'dialogue:plant_dead', solid: true, visibleWhen: { allFlags: ['wormEvent'] } },
    ],
    decorations: [
      { id: 'sun_marker', x: 16, y: 2, kind: 'sun_mark' },
      { id: 'city_silhouette', x: 4, y: 1, kind: 'city_far', depthOffset: -20 },
      { id: 'shrub_hill_a', x: 5, y: 5, kind: 'shrub', alpha: 0.8 },
      { id: 'shrub_hill_b', x: 15, y: 8, kind: 'shrub', alpha: 0.74 },
      { id: 'cairn_hill_a', x: 6, y: 11, kind: 'cairn', solid: true },
      { id: 'cairn_hill_b', x: 13, y: 3, kind: 'cairn', solid: true },
      { id: 'prayer_stone_hill', x: 10, y: 12, kind: 'prayer_stone', alpha: 0.88, solid: true },
    ],
  },
};

export const COLLISION_TILES = new Set(['water', 'rail', 'mast', 'fish_wall', 'bile', 'rock', 'wall', 'hill']);

export function createInitialFlags(): SaveState['flags'] {
  return {
    joppaIntroSeen: false,
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
    heardHerald: false,
    officialAudienceGranted: false,
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
      if (!flags.heardCall) return 'Talk to the Messenger just north of Jonah.';
      if (!flags.fareTokenObtained) {
        if (Number(flags.fareQuestStep) <= 0) return 'Speak to the merchant about passage to Tarshish.';
        if (Number(flags.fareQuestStep) === 1) return 'Enter the harbor office and collect the manifest.';
        if (Number(flags.fareQuestStep) === 2) return 'Carry the manifest down-pier to the sailor.';
        return 'Bring the sailor’s receipt back to the merchant.';
      }
      if (!flags.joppaTriviaPassed) return 'Answer the dockmaster’s question about Jonah’s calling.';
      return 'Board the ship bound for Tarshish.';
    case 'JOPPA_HARBOR_OFFICE':
      if (Number(flags.fareQuestStep) < 1) return 'Leave the office and speak to the merchant on the docks.';
      if (Number(flags.fareQuestStep) === 1) return 'Take the Tarshish manifest from the desk.';
      return 'Leave the office and return to the docks.';
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
      if (!flags.heardHerald) return 'Speak the warning where the herald can hear it.';
      if (!flags.officialAudienceGranted) return 'Bring the warning from the square to the official.';
      if (!flags.deliveredMessage) return 'Enter the palace and stand before the king.';
      if (!flags.ninevehRepented) return 'Stand before the king and witness Nineveh’s response.';
      return 'Leave the city and watch what the LORD will do.';
    case 'NINEVEH_PALACE':
      if (!flags.deliveredMessage) return 'Stand before the king and deliver the warning.';
      if (!flags.ninevehRepented) return 'Watch for the king’s response.';
      return 'Return to the streets of Nineveh.';
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

export function getObjectiveTargets(save: SaveState): ObjectiveTarget[] {
  const flags = save.flags;

  switch (save.map) {
    case 'JOPPA_DOCKS':
      if (!flags.heardCall) return [{ kind: 'actor', id: 'messenger' }];
      if (!flags.fareTokenObtained) {
        if (Number(flags.fareQuestStep) <= 0) return [{ kind: 'actor', id: 'merchant' }];
        if (Number(flags.fareQuestStep) === 1) return [{ kind: 'object', id: 'harbor_office_door' }];
        if (Number(flags.fareQuestStep) === 2) return [{ kind: 'actor', id: 'sailor' }];
        return [{ kind: 'actor', id: 'merchant' }];
      }
      if (!flags.joppaTriviaPassed) return [{ kind: 'actor', id: 'dockmaster' }];
      return [{ kind: 'actor', id: 'captain' }];
    case 'JOPPA_HARBOR_OFFICE':
      if (Number(flags.fareQuestStep) < 1) return [{ kind: 'object', id: 'office_exit' }];
      if (Number(flags.fareQuestStep) === 1) return [{ kind: 'object', id: 'manifest_crate' }];
      return [{ kind: 'object', id: 'office_exit' }];
    case 'SHIP_DECK':
      if (!flags.cargoSolved) {
        return [
          { kind: 'object', id: 'cleat_port' },
          { kind: 'object', id: 'cleat_center' },
          { kind: 'object', id: 'cleat_starboard' },
        ];
      }
      return [{ kind: 'actor', id: 'captain' }];
    case 'FISH_INTERIOR':
      if (!flags.fishSigilsLit) {
        return [
          { kind: 'object', id: 'sigil_north' },
          { kind: 'object', id: 'sigil_west' },
          { kind: 'object', id: 'sigil_east' },
          { kind: 'object', id: 'sigil_south' },
        ];
      }
      return [{ kind: 'object', id: 'altar' }];
    case 'COAST_ROAD':
      if (!flags.roadPassGranted) {
        if (Number(flags.roadQuestStep) <= 0) return [{ kind: 'actor', id: 'traveler' }];
        return [{ kind: 'object', id: 'spring' }];
      }
      return [];
    case 'NINEVEH_GATE':
      if (!flags.enteredNineveh) return [{ kind: 'actor', id: 'gate_guard' }];
      return [];
    case 'NINEVEH_CENTER':
      if (!flags.heardHerald) return [{ kind: 'actor', id: 'herald' }];
      if (!flags.officialAudienceGranted) return [{ kind: 'actor', id: 'official' }];
      if (!flags.deliveredMessage) return [{ kind: 'object', id: 'palace_door' }];
      return [];
    case 'NINEVEH_PALACE':
      if (!flags.deliveredMessage || !flags.ninevehRepented) return [{ kind: 'actor', id: 'king' }];
      return [{ kind: 'object', id: 'palace_exit' }];
    case 'EAST_OF_CITY': {
      const targets: ObjectiveTarget[] = [];
      if (flags.gotShelterCloth !== true) targets.push({ kind: 'object', id: 'cloth_roll' });
      if (flags.gotShelterReeds !== true) targets.push({ kind: 'object', id: 'reed_bundle' });
      if (flags.gotShelterStones !== true) targets.push({ kind: 'object', id: 'stone_pile' });
      if (targets.length > 0) return targets;
      return [{ kind: 'object', id: 'shelter_frame' }];
    }
    default:
      return [];
  }
}

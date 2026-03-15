export type Direction = 'up' | 'down' | 'left' | 'right';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type TextSpeed = 'slow' | 'normal' | 'fast';
export type FlagValue = boolean | number | string;

export interface SettingsState {
  difficulty: Difficulty;
  textSpeed: TextSpeed;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface SaveState {
  version: 1;
  map: string;
  spawn: string;
  player: {
    x: number;
    y: number;
    facing: Direction;
  };
  inventory: string[];
  flags: Record<string, FlagValue>;
  puzzles: Record<string, number[]>;
  trivia: {
    answered: Record<string, boolean>;
    attemptsLeft: Record<string, number>;
  };
}

export interface SpawnPoint {
  x: number;
  y: number;
  facing?: Direction;
}

export interface RequirementSet {
  allFlags?: string[];
  notFlags?: string[];
  hasItems?: string[];
  lacksItems?: string[];
  values?: Record<string, FlagValue>;
  minValues?: Record<string, number>;
}

export interface MapDecoration {
  id: string;
  x: number;
  y: number;
  kind: string;
  layer?: 'background' | 'foreground';
  alpha?: number;
  scale?: number;
  bobAmplitude?: number;
  bobSpeed?: number;
  depthOffset?: number;
  visibleWhen?: RequirementSet;
}

export interface MapActor {
  id: string;
  name: string;
  sprite: string;
  x: number;
  y: number;
  facing: Direction;
  event: string;
  visibleWhen?: RequirementSet;
  solid?: boolean;
}

export interface MapObject {
  id: string;
  x: number;
  y: number;
  kind: string;
  event: string;
  solid?: boolean;
  visibleWhen?: RequirementSet;
  puzzleId?: string;
  puzzleIndex?: number;
  kindOn?: string;
  kindOff?: string;
}

export interface MapTrigger {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  event: string;
  once?: boolean;
  activeWhen?: RequirementSet;
}

export interface MapExit {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMap: string;
  targetSpawn: string;
  activeWhen?: RequirementSet;
}

export interface MapDefinition {
  id: string;
  name: string;
  chapter: string;
  theme: string;
  tiles: string[];
  legend: Record<string, string>;
  spawns: Record<string, SpawnPoint>;
  npcs: MapActor[];
  objects: MapObject[];
  decorations?: MapDecoration[];
  triggers?: MapTrigger[];
  exits?: MapExit[];
  onEnterEvent?: string;
}

export interface DialogueLineNode {
  speaker?: string;
  text: string;
}

export interface DialogueChoiceOption {
  text: string;
  value: string;
}

export interface DialogueChoiceNode {
  choice: {
    prompt: string;
    options: DialogueChoiceOption[];
  };
}

export interface DialogueDefinition {
  id: string;
  lines: Array<DialogueLineNode | DialogueChoiceNode>;
}

export interface TriviaQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: Difficulty;
  tags: string[];
  hint: string;
  verseReference: string;
}

export interface TriviaGate {
  id: string;
  tags: string[];
  questionsRequired: number;
}

export interface PuzzleDefinition {
  id: string;
  label: string;
  targetState: number[];
  labels: string[];
}

export interface HudState {
  chapter: string;
  location: string;
  objective: string;
  inventory: string[];
}

export interface DialogueOutcome {
  choice?: string;
}

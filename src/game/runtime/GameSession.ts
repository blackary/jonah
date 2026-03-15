import { createInitialSave } from '../content/maps';
import type { FlagValue, SaveState, SettingsState } from '../types';

const SAVE_KEY = 'jonah_rpg_save_v1';
const SETTINGS_KEY = 'jonah_rpg_settings_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_SETTINGS: SettingsState = {
  difficulty: 'easy',
  textSpeed: 'normal',
  musicEnabled: true,
  sfxEnabled: true,
};

function browserStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
}

function isSaveState(value: unknown): value is SaveState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SaveState;
  return candidate.version === 1 && typeof candidate.map === 'string' && typeof candidate.spawn === 'string';
}

function isSettingsState(value: unknown): value is SettingsState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SettingsState;
  return (
    ['easy', 'normal', 'hard'].includes(candidate.difficulty) &&
    ['slow', 'normal', 'fast'].includes(candidate.textSpeed) &&
    typeof candidate.musicEnabled === 'boolean' &&
    typeof candidate.sfxEnabled === 'boolean'
  );
}

export class GameSession {
  private readonly storage: StorageLike;

  private save: SaveState | null;

  private settings: SettingsState;

  private readonly listeners = new Set<() => void>();

  constructor(storage: StorageLike = browserStorage()) {
    this.storage = storage;
    this.save = this.loadSave();
    this.settings = this.loadSettings();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSave(): SaveState | null {
    return this.save;
  }

  requireSave(): SaveState {
    if (!this.save) {
      throw new Error('No active save');
    }

    return this.save;
  }

  hasSave(): boolean {
    return this.save !== null;
  }

  getSettings(): SettingsState {
    return this.settings;
  }

  startNewGame(): SaveState {
    this.save = createInitialSave();
    this.persistSave();
    this.emit();
    return this.save;
  }

  clearSave(): void {
    this.save = null;
    this.storage.removeItem(SAVE_KEY);
    this.emit();
  }

  setSettings(nextSettings: SettingsState): void {
    this.settings = nextSettings;
    this.storage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    this.emit();
  }

  updateSave(mutator: (save: SaveState) => void, persist = true): SaveState {
    const save = this.requireSave();
    mutator(save);
    if (persist) {
      this.persistSave();
    }
    this.emit();
    return save;
  }

  saveNow(): void {
    if (!this.save) {
      return;
    }

    this.persistSave();
    this.emit();
  }

  setFlag(key: string, value: FlagValue): void {
    this.updateSave((save) => {
      save.flags[key] = value;
    });
  }

  incrementFlag(key: string, amount = 1): void {
    this.updateSave((save) => {
      save.flags[key] = Number(save.flags[key] ?? 0) + amount;
    });
  }

  getFlag(key: string): FlagValue | undefined {
    return this.requireSave().flags[key];
  }

  hasItem(itemId: string): boolean {
    return this.requireSave().inventory.includes(itemId);
  }

  addItem(itemId: string): void {
    this.updateSave((save) => {
      if (!save.inventory.includes(itemId)) {
        save.inventory.push(itemId);
      }
    });
  }

  removeItem(itemId: string): void {
    this.updateSave((save) => {
      save.inventory = save.inventory.filter((entry) => entry !== itemId);
    });
  }

  setMap(mapId: string, spawnId: string, x?: number, y?: number): void {
    this.updateSave((save) => {
      save.map = mapId;
      save.spawn = spawnId;
      if (typeof x === 'number') {
        save.player.x = x;
      }
      if (typeof y === 'number') {
        save.player.y = y;
      }
    }, false);
  }

  setPlayerPosition(x: number, y: number, facing?: SaveState['player']['facing']): void {
    this.updateSave((save) => {
      save.player.x = x;
      save.player.y = y;
      if (facing) {
        save.player.facing = facing;
      }
    }, false);
  }

  setPlayerFacing(facing: SaveState['player']['facing']): void {
    this.updateSave((save) => {
      save.player.facing = facing;
    }, false);
  }

  getPuzzleState(puzzleId: string): number[] {
    return [...(this.requireSave().puzzles[puzzleId] ?? [])];
  }

  setPuzzleState(puzzleId: string, nextState: number[]): void {
    this.updateSave((save) => {
      save.puzzles[puzzleId] = [...nextState];
    });
  }

  setTriviaAttempt(questionId: string, attemptsLeft: number): void {
    this.updateSave((save) => {
      save.trivia.attemptsLeft[questionId] = attemptsLeft;
    });
  }

  resetTriviaAttempt(questionId: string): void {
    this.setTriviaAttempt(questionId, 3);
  }

  markTriviaAnswered(questionId: string): void {
    this.updateSave((save) => {
      save.trivia.answered[questionId] = true;
      delete save.trivia.attemptsLeft[questionId];
    });
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private loadSave(): SaveState | null {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return isSaveState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private loadSettings(): SettingsState {
    const raw = this.storage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return isSettingsState(parsed) ? parsed : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private persistSave(): void {
    if (!this.save) {
      this.storage.removeItem(SAVE_KEY);
      return;
    }

    this.storage.setItem(SAVE_KEY, JSON.stringify(this.save));
  }
}

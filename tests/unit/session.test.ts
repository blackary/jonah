import { describe, expect, it } from 'vitest';
import { GameSession, type StorageLike } from '../../src/game/runtime/GameSession';

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

describe('GameSession', () => {
  it('creates and persists a new save', () => {
    const storage = createMemoryStorage();
    const session = new GameSession(storage);

    expect(session.hasSave()).toBe(false);
    session.startNewGame();
    session.setFlag('heardCall', true);
    session.addItem('fare_token');
    session.saveNow();

    const reloaded = new GameSession(storage);
    expect(reloaded.hasSave()).toBe(true);
    expect(reloaded.getFlag('heardCall')).toBe(true);
    expect(reloaded.hasItem('fare_token')).toBe(true);
  });

  it('cycles settings independently of save state', () => {
    const storage = createMemoryStorage();
    const session = new GameSession(storage);

    session.setSettings({
      difficulty: 'hard',
      textSpeed: 'fast',
      musicEnabled: false,
      sfxEnabled: true,
    });

    const reloaded = new GameSession(storage);
    expect(reloaded.getSettings().difficulty).toBe('hard');
    expect(reloaded.getSettings().textSpeed).toBe('fast');
    expect(reloaded.getSettings().musicEnabled).toBe(false);
  });
});

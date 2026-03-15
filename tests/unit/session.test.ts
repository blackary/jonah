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

  it('tracks map position, puzzles, and trivia attempts', () => {
    const storage = createMemoryStorage();
    const session = new GameSession(storage);
    session.startNewGame();

    session.setMap('SHIP_DECK', 'gangplank', 10, 10);
    session.setPlayerPosition(11, 9, 'left');
    session.setPuzzleState('cargo_cleats', [1, 0, 1]);
    session.setTriviaAttempt('q-1', 2);
    session.markTriviaAnswered('q-1');
    session.saveNow();

    const detachedPuzzleState = session.getPuzzleState('cargo_cleats');
    detachedPuzzleState[0] = 0;

    expect(session.getSave()?.map).toBe('SHIP_DECK');
    expect(session.getSave()?.spawn).toBe('gangplank');
    expect(session.getSave()?.player).toEqual({ x: 11, y: 9, facing: 'left' });
    expect(session.getPuzzleState('cargo_cleats')).toEqual([1, 0, 1]);
    expect(session.getSave()?.trivia.answered['q-1']).toBe(true);
    expect(session.getSave()?.trivia.attemptsLeft['q-1']).toBeUndefined();

    const reloaded = new GameSession(storage);
    expect(reloaded.getSave()?.map).toBe('SHIP_DECK');
    expect(reloaded.getPuzzleState('cargo_cleats')).toEqual([1, 0, 1]);
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

  it('clears save data without discarding settings', () => {
    const storage = createMemoryStorage();
    const session = new GameSession(storage);
    session.startNewGame();
    session.setSettings({
      difficulty: 'normal',
      textSpeed: 'slow',
      musicEnabled: false,
      sfxEnabled: false,
    });

    session.clearSave();

    const reloaded = new GameSession(storage);
    expect(reloaded.hasSave()).toBe(false);
    expect(reloaded.getSettings()).toEqual({
      difficulty: 'normal',
      textSpeed: 'slow',
      musicEnabled: false,
      sfxEnabled: false,
    });
  });
});

import { describe, expect, it } from 'vitest';
import { MAPS } from '../../src/game/content/maps';
import { TRIVIA_QUESTIONS } from '../../src/game/content/trivia';

describe('content pack', () => {
  it('ships the full map list', () => {
    expect(Object.keys(MAPS)).toEqual([
      'JOPPA_DOCKS',
      'SHIP_DECK',
      'FISH_INTERIOR',
      'COAST_ROAD',
      'NINEVEH_GATE',
      'NINEVEH_CENTER',
      'EAST_OF_CITY',
    ]);
  });

  it('contains the expected 36 trivia questions', () => {
    expect(TRIVIA_QUESTIONS).toHaveLength(36);
  });
});

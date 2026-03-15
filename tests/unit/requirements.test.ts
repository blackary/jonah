import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../../src/game/content/maps';
import { meetsRequirements } from '../../src/game/runtime/requirements';

describe('meetsRequirements', () => {
  it('accepts matching flags, values, and items', () => {
    const save = createInitialSave();
    save.flags.heardCall = true;
    save.flags.fareQuestStep = 2;
    save.inventory.push('fare_token');

    expect(
      meetsRequirements(
        {
          allFlags: ['heardCall'],
          hasItems: ['fare_token'],
          values: { fareQuestStep: 2 },
        },
        save,
      ),
    ).toBe(true);
  });

  it('rejects missing flags or minimum values', () => {
    const save = createInitialSave();
    save.flags.shelterStep = 1;

    expect(
      meetsRequirements(
        {
          allFlags: ['plantGrown'],
          minValues: { shelterStep: 2 },
        },
        save,
      ),
    ).toBe(false);
  });
});

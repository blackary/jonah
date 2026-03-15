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

  it('rejects forbidden flags and inventory items', () => {
    const save = createInitialSave();
    save.flags.enteredNineveh = true;
    save.inventory.push('water_flask');

    expect(
      meetsRequirements(
        {
          notFlags: ['enteredNineveh'],
          lacksItems: ['water_flask'],
        },
        save,
      ),
    ).toBe(false);
  });

  it('rejects mismatched exact values', () => {
    const save = createInitialSave();
    save.flags.fareQuestStep = 3;

    expect(
      meetsRequirements(
        {
          values: { fareQuestStep: 2 },
        },
        save,
      ),
    ).toBe(false);
  });
});

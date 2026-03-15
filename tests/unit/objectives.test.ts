import { describe, expect, it } from 'vitest';
import { createInitialSave, getCurrentObjective, getHudState } from '../../src/game/content/maps';

describe('objective resolver', () => {
  it('maps chapter progress to the expected objective text', () => {
    const cases = [
      {
        label: 'initial joppa intro',
        configure: () => createInitialSave(),
        expected: 'Hear the word of the LORD at the docks.',
      },
      {
        label: 'joppa manifest step',
        configure: () => {
          const save = createInitialSave();
          save.flags.heardCall = true;
          save.flags.fareQuestStep = 1;
          return save;
        },
        expected: 'Carry the merchant’s manifest to the sailor.',
      },
      {
        label: 'ship deck confession',
        configure: () => {
          const save = createInitialSave();
          save.map = 'SHIP_DECK';
          save.flags.cargoSolved = true;
          return save;
        },
        expected: 'Face the crew and confess why the storm has come.',
      },
      {
        label: 'coast road water quest',
        configure: () => {
          const save = createInitialSave();
          save.map = 'COAST_ROAD';
          save.flags.roadQuestStep = 1;
          return save;
        },
        expected: 'Bring fresh water back from the spring.',
      },
      {
        label: 'nineveh city warning',
        configure: () => {
          const save = createInitialSave();
          save.map = 'NINEVEH_CENTER';
          return save;
        },
        expected: 'Carry the warning from street to throne.',
      },
      {
        label: 'east city final question',
        configure: () => {
          const save = createInitialSave();
          save.map = 'EAST_OF_CITY';
          save.flags.shelterStep = 3;
          save.flags.plantGrown = true;
          save.flags.wormEvent = true;
          return save;
        },
        expected: 'Listen for the LORD’s final question.',
      },
    ];

    cases.forEach(({ label, configure, expected }) => {
      expect(getCurrentObjective(configure()), label).toBe(expected);
    });
  });

  it('builds hud state with mapped inventory labels', () => {
    const save = createInitialSave();
    save.inventory = ['fare_token', 'water_flask'];

    expect(getHudState(save)).toEqual({
      chapter: 'Jonah 1',
      location: 'Joppa Docks',
      objective: 'Hear the word of the LORD at the docks.',
      inventory: ['Ship Fare', 'Water Flask'],
    });
  });
});

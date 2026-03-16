import { describe, expect, it } from 'vitest';
import { createInitialSave, getCurrentObjective, getHudState } from '../../src/game/content/maps';

describe('objective resolver', () => {
  it('maps chapter progress to the expected objective text', () => {
    const cases = [
      {
        label: 'initial joppa intro',
        configure: () => createInitialSave(),
        expected: 'Talk to the Messenger just north of Jonah.',
      },
      {
        label: 'joppa manifest step',
        configure: () => {
          const save = createInitialSave();
          save.flags.heardCall = true;
          save.flags.fareQuestStep = 1;
          return save;
        },
        expected: 'Enter the harbor office and collect the manifest.',
      },
      {
        label: 'harbor office retrieval',
        configure: () => {
          const save = createInitialSave();
          save.map = 'JOPPA_HARBOR_OFFICE';
          save.flags.heardCall = true;
          save.flags.fareQuestStep = 1;
          return save;
        },
        expected: 'Take the Tarshish manifest from the desk.',
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
          save.flags.heardHerald = true;
          save.flags.officialAudienceGranted = true;
          return save;
        },
        expected: 'Enter the palace and stand before the king.',
      },
      {
        label: 'nineveh palace audience',
        configure: () => {
          const save = createInitialSave();
          save.map = 'NINEVEH_PALACE';
          save.flags.heardHerald = true;
          save.flags.officialAudienceGranted = true;
          return save;
        },
        expected: 'Stand before the king and deliver the warning.',
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
      objective: 'Talk to the Messenger just north of Jonah.',
      inventory: ['Ship Fare', 'Water Flask'],
    });
  });
});

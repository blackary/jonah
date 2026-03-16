import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DIALOGUES } from '../../src/game/content/dialogue';
import { COLLISION_TILES, createInitialSave, getObjectiveTargets, MAPS } from '../../src/game/content/maps';
import { PUZZLES, TRIVIA_GATES } from '../../src/game/content/puzzles';
import { TRIVIA_QUESTIONS } from '../../src/game/content/trivia';

function assertInBounds(
  mapId: string,
  width: number,
  height: number,
  x: number,
  y: number,
  label: string,
): void {
  expect(x, `${label} x out of bounds in ${mapId}`).toBeGreaterThanOrEqual(0);
  expect(x, `${label} x out of bounds in ${mapId}`).toBeLessThan(width);
  expect(y, `${label} y out of bounds in ${mapId}`).toBeGreaterThanOrEqual(0);
  expect(y, `${label} y out of bounds in ${mapId}`).toBeLessThan(height);
}

function collectEvents(): string[] {
  return Object.values(MAPS).flatMap((map) => [
    ...(map.onEnterEvent ? [map.onEnterEvent] : []),
    ...map.npcs.map((npc) => npc.event),
    ...map.objects.map((object) => object.event),
    ...(map.triggers?.map((trigger) => trigger.event) ?? []),
  ]);
}

describe('content integrity', () => {
  it('keeps map geometry, entities, and exits internally consistent', () => {
    Object.values(MAPS).forEach((map) => {
      expect(map.tiles.length, `${map.id} should have tile rows`).toBeGreaterThan(0);
      const width = map.tiles[0].length;
      const height = map.tiles.length;

      map.tiles.forEach((row) => {
        expect(row.length, `${map.id} rows should share width`).toBe(width);
      });

      Object.entries(map.spawns).forEach(([spawnId, spawn]) => {
        assertInBounds(map.id, width, height, spawn.x, spawn.y, `spawn ${spawnId}`);
        const tileKind = map.legend[map.tiles[spawn.y][spawn.x]];
        expect(COLLISION_TILES.has(tileKind), `${map.id} spawn ${spawnId} is blocked`).toBe(false);
      });

      map.npcs.forEach((npc) => {
        assertInBounds(map.id, width, height, npc.x, npc.y, `npc ${npc.id}`);
      });

      map.objects.forEach((object) => {
        assertInBounds(map.id, width, height, object.x, object.y, `object ${object.id}`);
      });

      map.decorations?.forEach((decoration) => {
        assertInBounds(map.id, width, height, decoration.x, decoration.y, `decoration ${decoration.id}`);
      });

      map.triggers?.forEach((trigger) => {
        assertInBounds(map.id, width, height, trigger.x, trigger.y, `trigger ${trigger.id}`);
      });

      map.exits?.forEach((exit) => {
        assertInBounds(map.id, width, height, exit.x, exit.y, `exit ${exit.id}`);
        expect(MAPS[exit.targetMap], `unknown exit target map: ${exit.targetMap}`).toBeDefined();
        expect(
          MAPS[exit.targetMap].spawns[exit.targetSpawn],
          `unknown exit target spawn: ${exit.targetMap}.${exit.targetSpawn}`,
        ).toBeDefined();
      });
    });
  });

  it('only references dialogue and scripts that exist in the runtime', () => {
    const gameAppSource = readFileSync(new URL('../../src/game/GameApp.ts', import.meta.url), 'utf8');
    const knownScripts = new Set(
      [...gameAppSource.matchAll(/case '([^']+)': \{/g)].map(([, scriptId]) => scriptId),
    );

    collectEvents().forEach((event) => {
      if (event.startsWith('dialogue:')) {
        const dialogueId = event.slice('dialogue:'.length);
        expect(DIALOGUES[dialogueId], `missing dialogue: ${dialogueId}`).toBeDefined();
        return;
      }

      if (event.startsWith('script:')) {
        const scriptId = event.slice('script:'.length);
        expect(knownScripts.has(scriptId), `missing script handler: ${scriptId}`).toBe(true);
        return;
      }

      throw new Error(`Unknown event reference: ${event}`);
    });
  });

  it('keeps puzzles, trivia gates, and questions valid', () => {
    const questionIds = new Set<string>();

    TRIVIA_QUESTIONS.forEach((question) => {
      expect(questionIds.has(question.id), `duplicate trivia id: ${question.id}`).toBe(false);
      questionIds.add(question.id);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.choices.length);
      expect(question.choices.length, `${question.id} should have answer choices`).toBeGreaterThanOrEqual(2);
      expect(question.tags.length, `${question.id} should have at least one tag`).toBeGreaterThan(0);
    });

    Object.values(TRIVIA_GATES).forEach((gate) => {
      const matchingQuestions = TRIVIA_QUESTIONS.filter((question) =>
        question.tags.some((tag) => gate.tags.includes(tag)),
      );
      expect(
        matchingQuestions.length,
        `${gate.id} should have enough matching questions`,
      ).toBeGreaterThanOrEqual(gate.questionsRequired);
    });

    Object.values(MAPS).forEach((map) => {
      map.objects.forEach((object) => {
        if (!object.puzzleId) {
          return;
        }

        const puzzle = PUZZLES[object.puzzleId];
        expect(puzzle, `missing puzzle ${object.puzzleId} for ${object.id}`).toBeDefined();
        expect(object.puzzleIndex, `${object.id} is missing a puzzle index`).toBeTypeOf('number');
        expect((object.puzzleIndex as number) < puzzle.targetState.length).toBe(true);
      });
    });
  });

  it('keeps objective targets aligned with authored actors and objects', () => {
    const scenarios = [
      createInitialSave(),
      {
        ...createInitialSave(),
        flags: {
          ...createInitialSave().flags,
          heardCall: true,
          fareQuestStep: 1,
        },
      },
      {
        ...createInitialSave(),
        map: 'JOPPA_HARBOR_OFFICE',
        flags: {
          ...createInitialSave().flags,
          heardCall: true,
          fareQuestStep: 1,
        },
      },
      {
        ...createInitialSave(),
        map: 'NINEVEH_CENTER',
        flags: {
          ...createInitialSave().flags,
          heardHerald: true,
          officialAudienceGranted: true,
        },
      },
      {
        ...createInitialSave(),
        map: 'NINEVEH_PALACE',
        flags: {
          ...createInitialSave().flags,
          heardHerald: true,
          officialAudienceGranted: true,
        },
      },
    ];

    scenarios.forEach((save) => {
      getObjectiveTargets(save).forEach((target) => {
        if (target.kind === 'actor') {
          expect(
            MAPS[save.map].npcs.some((npc) => npc.id === target.id),
            `missing actor objective target ${save.map}.${target.id}`,
          ).toBe(true);
          return;
        }

        expect(
          MAPS[save.map].objects.some((object) => object.id === target.id),
          `missing object objective target ${save.map}.${target.id}`,
        ).toBe(true);
      });
    });
  });
});

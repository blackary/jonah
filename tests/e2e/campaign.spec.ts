import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type Snapshot = {
  mode: 'title' | 'world';
  overlayDepth: number;
  save: {
    map: string;
    player: { x: number; y: number };
    flags: Record<string, boolean | number | string>;
  } | null;
};

const questions = JSON.parse(
  readFileSync(new URL('../../src/game/content/trivia/questions.json', import.meta.url), 'utf8'),
) as Array<{
  prompt: string;
  choices: string[];
  answerIndex: number;
}>;

const answers = new Map(questions.map((question) => [question.prompt, question.choices[question.answerIndex]]));

async function getSnapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => window.__JONAH__?.getSnapshot() as Snapshot);
}

async function waitForMap(page: Page, mapId: string): Promise<void> {
  await page.waitForFunction(
    (expectedMap) => window.__JONAH__?.getSnapshot().save?.map === expectedMap,
    mapId,
  );
}

async function waitForFlag(
  page: Page,
  flag: string,
  expected: boolean | number | string,
): Promise<void> {
  await page.waitForFunction(
    ({ nextFlag, nextExpected }) =>
      window.__JONAH__?.getSnapshot().save?.flags?.[nextFlag] === nextExpected,
    { nextFlag: flag, nextExpected: expected },
  );
}

async function resolveOverlays(page: Page, pendingChoices: string[] = []): Promise<void> {
  for (let safety = 0; safety < 160; safety += 1) {
    const dialogue = page.getByTestId('dialogue-panel');
    const trivia = page.getByTestId('trivia-panel');
    const modal = page.getByTestId('modal');

    if (await dialogue.isVisible()) {
      if (pendingChoices.length > 0) {
        const choice = page.getByRole('button', { name: pendingChoices[0] });
        if (await choice.isVisible().catch(() => false)) {
          await choice.click();
          pendingChoices.shift();
          continue;
        }
      }
      await page.getByTestId('dialogue-next').click();
      continue;
    }

    if (await trivia.isVisible()) {
      const prompt = (await page.getByTestId('trivia-prompt').textContent())?.trim() ?? '';
      const answer = answers.get(prompt);
      expect(answer, `missing answer for prompt: ${prompt}`).toBeTruthy();
      await page.getByRole('button', { name: answer! }).click();
      continue;
    }

    if (await modal.isVisible()) {
      await page.locator('.modal-actions button').first().click();
      continue;
    }

    const snapshot = await getSnapshot(page);
    if (snapshot.overlayDepth > 0) {
      await page.waitForTimeout(100);
      continue;
    }

    break;
  }
}

async function runScript(
  page: Page,
  scriptId: string,
  source: { kind: 'actor' | 'object' | 'trigger' | 'map'; actorId?: string; objectId?: string } = { kind: 'map' },
  pendingChoices: string[] = [],
): Promise<void> {
  await page.evaluate(
    ([nextScriptId, nextSource]) => {
      void window.__JONAH__?.debugRunScript(nextScriptId, nextSource);
    },
    [scriptId, source] as const,
  );
  await page
    .waitForFunction(() => {
      const snapshot = window.__JONAH__?.getSnapshot() as Snapshot | undefined;
      return Boolean(snapshot && snapshot.overlayDepth > 0);
    }, { timeout: 2_000 })
    .catch(() => undefined);
  await resolveOverlays(page, pendingChoices);
  await page
    .waitForFunction(
      () => {
        const snapshot = window.__JONAH__?.getSnapshot() as Snapshot | undefined;
        return Boolean(snapshot && snapshot.overlayDepth === 0);
      },
      { timeout: 10_000 },
    )
    .catch(() => undefined);
}

async function runQuietScript(
  page: Page,
  scriptId: string,
  source: { kind: 'actor' | 'object' | 'trigger' | 'map'; actorId?: string; objectId?: string } = { kind: 'map' },
): Promise<void> {
  await page.evaluate(
    ([nextScriptId, nextSource]) => window.__JONAH__?.debugRunScript(nextScriptId, nextSource),
    [scriptId, source] as const,
  );
}

test('plays from title through the fish release and onto the coast road', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('title-new').click();
  await page.getByTestId('hud').waitFor();

  await runScript(page, 'messenger', { kind: 'actor', actorId: 'messenger' }, ['Flee toward Tarshish']);
  let snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.heardCall).toBe(true);

  await runScript(page, 'merchant', { kind: 'actor', actorId: 'merchant' });
  await runScript(page, 'manifestCrate', { kind: 'object', objectId: 'manifest_crate' });
  await runScript(page, 'sailor', { kind: 'actor', actorId: 'sailor' });
  await runScript(page, 'merchant', { kind: 'actor', actorId: 'merchant' });
  snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.fareTokenObtained).toBe(true);

  await runScript(page, 'dockmaster', { kind: 'actor', actorId: 'dockmaster' });
  snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.joppaTriviaPassed).toBe(true);

  await runScript(page, 'captain', { kind: 'actor', actorId: 'captain' });
  await waitForMap(page, 'SHIP_DECK');
  await resolveOverlays(page);

  await runQuietScript(page, 'toggleCargoCleat', { kind: 'object', objectId: 'cleat_port' });
  await runQuietScript(page, 'toggleCargoCleat', { kind: 'object', objectId: 'cleat_starboard' });
  snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.cargoSolved).toBe(true);

  await runScript(page, 'shipCaptain', { kind: 'actor', actorId: 'captain' });
  await waitForFlag(page, 'thrownOverboard', true);
  await waitForMap(page, 'FISH_INTERIOR');
  await resolveOverlays(page);

  await runQuietScript(page, 'toggleFishSigil', { kind: 'object', objectId: 'sigil_north' });
  await runQuietScript(page, 'toggleFishSigil', { kind: 'object', objectId: 'sigil_west' });
  await runScript(page, 'toggleFishSigil', { kind: 'object', objectId: 'sigil_south' });
  snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.fishSigilsLit).toBe(true);
  await runScript(page, 'fishAltar', { kind: 'object', objectId: 'altar' });
  await waitForFlag(page, 'fishReleased', true);
  await waitForMap(page, 'COAST_ROAD');
  await resolveOverlays(page);
  snapshot = await getSnapshot(page);
  expect(snapshot.save?.map).toBe('COAST_ROAD');
  expect(snapshot.save?.flags.fishReleased).toBe(true);
});

test('shows desktop guidance and keeps touch controls hidden in desktop browsers', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('title-screen').waitFor();
  await expect(page.getByTestId('desktop-legend')).toBeVisible();
  await expect(page.getByTestId('mobile-controls')).toBeHidden();
  await page.getByTestId('title-new').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().mode === 'world');
});

import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

export type Snapshot = {
  mode: 'title' | 'world';
  overlayDepth: number;
  save: {
    map: string;
    player: { x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' };
    flags: Record<string, boolean | number | string>;
  } | null;
  settings: {
    difficulty: string;
    textSpeed: string;
    musicEnabled: boolean;
    sfxEnabled: boolean;
  };
};

type QuestionRecord = {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
};

const questions = JSON.parse(
  readFileSync(new URL('../../src/game/content/trivia/questions.json', import.meta.url), 'utf8'),
) as QuestionRecord[];

const questionsByPrompt = new Map(questions.map((question) => [question.prompt, question]));

export async function getSnapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => window.__JONAH__?.getSnapshot() as Snapshot);
}

export async function waitForMap(page: Page, mapId: string): Promise<void> {
  await page.waitForFunction(
    (expectedMap) => window.__JONAH__?.getSnapshot().save?.map === expectedMap,
    mapId,
  );
}

export async function waitForFlag(
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

export function getQuestionForPrompt(prompt: string): QuestionRecord {
  const question = questionsByPrompt.get(prompt);
  expect(question, `missing question for prompt: ${prompt}`).toBeTruthy();
  return question as QuestionRecord;
}

export function getCorrectAnswer(prompt: string): string {
  const question = getQuestionForPrompt(prompt);
  return question.choices[question.answerIndex];
}

export function getWrongAnswer(prompt: string): string {
  const question = getQuestionForPrompt(prompt);
  const wrongChoice = question.choices.find((_choice, index) => index !== question.answerIndex);
  expect(wrongChoice, `missing wrong answer for prompt: ${prompt}`).toBeTruthy();
  return wrongChoice as string;
}

export async function resolveOverlays(page: Page, pendingChoices: string[] = []): Promise<void> {
  for (let safety = 0; safety < 180; safety += 1) {
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
      await page.getByRole('button', { name: getCorrectAnswer(prompt) }).click();
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

export async function runScript(
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

export async function runQuietScript(
  page: Page,
  scriptId: string,
  source: { kind: 'actor' | 'object' | 'trigger' | 'map'; actorId?: string; objectId?: string } = { kind: 'map' },
): Promise<void> {
  await page.evaluate(
    ([nextScriptId, nextSource]) => window.__JONAH__?.debugRunScript(nextScriptId, nextSource),
    [scriptId, source] as const,
  );
}

export async function advanceToTrivia(page: Page): Promise<string> {
  for (let safety = 0; safety < 80; safety += 1) {
    if (await page.getByTestId('trivia-panel').isVisible()) {
      return (await page.getByTestId('trivia-prompt').textContent())?.trim() ?? '';
    }

    if (await page.getByTestId('dialogue-panel').isVisible()) {
      await page.getByTestId('dialogue-next').click();
      continue;
    }

    if (await page.getByTestId('modal').isVisible()) {
      await page.locator('.modal-actions button').first().click();
      continue;
    }

    await page.waitForTimeout(100);
  }

  throw new Error('Trivia panel did not appear.');
}

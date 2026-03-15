import { expect, test } from '@playwright/test';
import {
  advanceToTrivia,
  getCorrectAnswer,
  getQuestionForPrompt,
  getSnapshot,
  getWrongAnswer,
  resolveOverlays,
  runScript,
} from './support';

test('supports desktop keyboard play, pause settings, save, and continue', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('title-screen').waitFor();
  await page.evaluate(() => window.__JONAH__?.debugStartNewGame());
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().mode === 'world');
  await page.getByTestId('hud').waitFor();

  await page.evaluate(() => {
    const app = window.__JONAH__;
    app?.session.setPlayerPosition(4, 13, 'right');
    app?.session.saveNow();
  });

  let snapshot = await getSnapshot(page);
  expect(snapshot.save?.map).toBe('JOPPA_DOCKS');
  expect(snapshot.save?.player.x).toBe(4);
  expect(snapshot.save?.player.y).toBe(13);

  await page.getByTestId('hud-pause').click();
  await expect(page.getByTestId('modal-title')).toHaveText('Pause');
  await page.getByTestId('pause-settings').click();
  await expect(page.getByTestId('modal-title')).toHaveText('Settings');

  await page.getByRole('button', { name: /Difficulty: Easy/ }).click();
  await expect(page.getByRole('button', { name: /Difficulty: Normal/ })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('modal-title')).toHaveText('Pause');
  await page.getByTestId('pause-title').click();

  await page.getByTestId('title-screen').waitFor();
  await expect(page.getByTestId('title-meta')).toContainText('Difficulty: Normal');
  await expect(page.getByTestId('title-continue')).toBeEnabled();

  await page.reload();
  await page.getByTestId('title-screen').waitFor();
  await expect(page.getByTestId('title-meta')).toContainText('Difficulty: Normal');
  await expect(page.getByTestId('title-continue')).toBeEnabled();

  await page.getByTestId('title-continue').click();
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().mode === 'world');

  snapshot = await getSnapshot(page);
  expect(snapshot.settings.difficulty).toBe('normal');
  expect(snapshot.save?.map).toBe('JOPPA_DOCKS');
  expect(snapshot.save?.player.x).toBe(4);
  expect(snapshot.save?.player.y).toBe(13);
});

test('retries trivia with a hint after repeated wrong answers', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('title-new').click();
  await page.getByTestId('hud').waitFor();

  await page.evaluate(() => {
    window.__JONAH__?.session.addItem('fare_token');
    window.__JONAH__?.debugSetFlag('heardCall', true);
  });

  await page.evaluate(() => {
    void window.__JONAH__?.debugRunScript('dockmaster', { kind: 'actor', actorId: 'dockmaster' });
  });

  const prompt = await advanceToTrivia(page);
  const wrongAnswer = getWrongAnswer(prompt);
  const correctAnswer = getCorrectAnswer(prompt);
  const question = getQuestionForPrompt(prompt);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.getByRole('button', { name: wrongAnswer }).click();
    await expect(page.getByTestId('modal-title')).toHaveText('Not Yet');
    await page.getByRole('button', { name: 'Again' }).click();
    await expect(page.getByTestId('trivia-panel')).toBeVisible();
  }

  await page.getByRole('button', { name: wrongAnswer }).click();
  await expect(page.getByTestId('modal-title')).toHaveText('Hint');
  await page.getByRole('button', { name: 'Try Again' }).click();
  await expect(page.getByTestId('trivia-meta')).toContainText('Hint:');

  await page.getByRole('button', { name: correctAnswer }).click();
  await resolveOverlays(page);

  const snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.joppaTriviaPassed).toBe(true);

  const triviaState = await page.evaluate(() => window.__JONAH__?.session.requireSave().trivia);
  expect(triviaState?.answered[question.id]).toBe(true);
  expect(triviaState?.attemptsLeft[question.id]).toBeUndefined();
});

test('plays through the east-of-city finale and returns to title', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('title-screen').waitFor();
  await page.evaluate(() => window.__JONAH__?.debugStartNewGame());
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().mode === 'world');

  await page.evaluate(() => {
    const app = window.__JONAH__;
    app?.debugSetFlag('ninevehRepented', true);
    app?.debugSetFlag('shelterStep', 3);
    app?.debugSetFlag('gotShelterCloth', true);
    app?.debugSetFlag('gotShelterReeds', true);
    app?.debugSetFlag('gotShelterStones', true);
  });

  let snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.shelterStep).toBe(3);
  expect(snapshot.save?.flags.gotShelterCloth).toBe(true);
  expect(snapshot.save?.flags.gotShelterReeds).toBe(true);
  expect(snapshot.save?.flags.gotShelterStones).toBe(true);

  await runScript(page, 'shelterFrame', { kind: 'object', objectId: 'shelter_frame' });
  snapshot = await getSnapshot(page);
  expect(snapshot.save?.flags.plantGrown).toBe(true);

  await runScript(page, 'shelterFrame', { kind: 'object', objectId: 'shelter_frame' });
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().mode === 'title');

  snapshot = await getSnapshot(page);
  expect(snapshot.mode).toBe('title');
  expect(snapshot.save?.flags.wormEvent).toBe(true);
  expect(snapshot.save?.flags.endingSeen).toBe(true);
});

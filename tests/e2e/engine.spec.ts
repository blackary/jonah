import { expect, test } from '@playwright/test';
import {
  advanceToTrivia,
  continueSavedGame,
  getCorrectAnswer,
  getQuestionForPrompt,
  getSnapshot,
  getWrongAnswer,
  resolveOverlays,
  runScript,
  startNewGame,
} from './support';

test('supports desktop keyboard play, pause settings, save, and continue', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('title-screen').waitFor();
  await startNewGame(page);

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

  await continueSavedGame(page);

  snapshot = await getSnapshot(page);
  expect(snapshot.settings.difficulty).toBe('normal');
  expect(snapshot.save?.map).toBe('JOPPA_DOCKS');
  expect(snapshot.save?.player.x).toBe(4);
  expect(snapshot.save?.player.y).toBe(13);
});

test('space advances focused dialogue actions', async ({ page }) => {
  await page.goto('/');
  await startNewGame(page);

  await page.evaluate(() => {
    void window.__JONAH__?.debugRunScript('messenger', { kind: 'actor', actorId: 'messenger' });
  });

  await expect(page.getByTestId('dialogue-text')).toHaveText('Jonah son of Amittai, hear the word of the LORD.');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('dialogue-text')).toHaveText(
    'Arise. Go to Nineveh, that great city, and call out against it, for its evil has come up before Him.',
  );
  await page.keyboard.press('Space');
  await expect(page.getByTestId('dialogue-text')).toHaveText('What will Jonah do?');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('dialogue-text')).toContainText(
    'That would have been wisdom. Yet Jonah in this story turns toward the western sea.',
  );
});

test('retries trivia with a hint after repeated wrong answers', async ({ page }) => {
  await page.goto('/');
  await startNewGame(page);

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

test('uses contextual guidance and supports interior room transitions', async ({ page }) => {
  await page.goto('/');
  await startNewGame(page);

  await expect(page.getByTestId('hud-context')).toContainText('Talk: Messenger');

  await runScript(page, 'messenger', { kind: 'actor', actorId: 'messenger' }, ['Flee toward Tarshish']);
  await runScript(page, 'merchant', { kind: 'actor', actorId: 'merchant' });

  await runScript(page, 'harborOfficeDoor', { kind: 'object', objectId: 'harbor_office_door' });
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().save?.map === 'JOPPA_HARBOR_OFFICE');
  await expect(page.getByTestId('hud-context')).toContainText('Next: Take Tarshish Manifest');

  await page.evaluate(async () => {
    const app = window.__JONAH__;
    app?.debugSetFlag('ninevehIntroSeen', true);
    await app?.debugTransition('NINEVEH_CENTER', 'west_entry');
    app?.debugSetFlag('heardHerald', true);
    app?.debugSetFlag('officialAudienceGranted', true);
  });

  await runScript(page, 'palaceDoor', { kind: 'object', objectId: 'palace_door' });
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().save?.map === 'NINEVEH_PALACE');
  await expect(page.getByTestId('hud-context')).toContainText('Next: Talk to King of Nineveh');
});

test('plays through the east-of-city finale and returns to title', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('title-screen').waitFor();
  await startNewGame(page);

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

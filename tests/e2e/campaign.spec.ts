import { expect, test } from '@playwright/test';
import {
  getSnapshot,
  resolveOverlays,
  runQuietScript,
  runScript,
  waitForFlag,
  waitForMap,
} from './support';

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
  await page.getByTestId('title-new').click();
  await page.waitForFunction(() => window.__JONAH__?.getSnapshot().mode === 'world');
});

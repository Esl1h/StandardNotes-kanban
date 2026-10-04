import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { openHost, hostLogs } from './snHost.js';

const BOARD = fs.readFileSync('examples/Kanban.txt', 'utf8');
const LANES = (BOARD.match(/^# /gm) ?? []).length;

test('the example board renders all its lanes', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const plugin = await openHost(page, { text: BOARD });

  await expect(plugin.locator('.kbn-lane')).toHaveCount(LANES);
  expect(pageErrors).toEqual([]);
});

test('opening a note does not save it', async ({ page }) => {
  const plugin = await openHost(page, { text: BOARD });
  await expect(plugin.locator('.kbn-lane')).toHaveCount(LANES);

  // The relay coalesces saves for 350 ms; wait past that before asserting.
  await page.waitForTimeout(800);

  expect(await hostLogs(page, 'save-items')).toHaveLength(0);
});

test('moving a card with Alt+ArrowRight saves once', async ({ page }) => {
  const plugin = await openHost(page, { text: BOARD });
  const firstLane = plugin.locator('.kbn-lane').first();
  const card = firstLane.locator('.kbn-card').first();
  await expect(card).toBeVisible();
  const title = await card.locator('.kbn-card-title').innerText();

  // Clicking opens the detail modal, which suspends the shortcut; the card
  // stays the focused one once the modal is closed.
  await card.click();
  await expect(plugin.locator('.ReactModal__Content')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(plugin.locator('.ReactModal__Content')).toHaveCount(0);
  await page.keyboard.press('Alt+ArrowRight');

  await expect
    .poll(async () => (await hostLogs(page, 'save-items')).length)
    .toBe(1);
  await expect(plugin.locator('.kbn-lane').nth(1)).toContainText(title);
  await expect(firstLane).not.toContainText(title);
  // The relay coalesces saves for 350 ms; no second one may follow.
  await page.waitForTimeout(800);
  expect(await hostLogs(page, 'save-items')).toHaveLength(1);
});

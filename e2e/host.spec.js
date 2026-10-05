import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { openHost, hostLogs } from './snHost.js';
import { BOARD, VISIBLE_LANES } from './board.js';

test('the example board renders its lanes, the done one hidden', async ({
  page,
}) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const plugin = await openHost(page, { text: BOARD });

  await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);
  expect(pageErrors).toEqual([]);
});

test('opening a note does not save it', async ({ page }) => {
  const plugin = await openHost(page, { text: BOARD });
  await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);

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

test.describe('matrix sections on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 }, isMobile: true });

  test('a section folds away and opens again', async ({ page }) => {
    const plugin = await openHost(page, { text: BOARD });
    await plugin.getByRole('button', { name: 'Matrix' }).click();
    const doSection = plugin.getByRole('region', { name: 'Do', exact: true });
    const cards = doSection.locator('.kbn-cards');
    await expect(cards).toBeVisible();

    await doSection.getByRole('button', { name: 'Collapse Do' }).click();
    await expect(cards).toBeHidden();
    // The heading, with the count, stays.
    await expect(doSection.locator('.kbn-lane-count')).toBeVisible();

    await doSection.getByRole('button', { name: 'Expand Do' }).click();
    await expect(cards).toBeVisible();
  });
});

test('matrix sections have no fold button on a wide screen', async ({
  page,
}) => {
  const plugin = await openHost(page, { text: BOARD });
  await plugin.getByRole('button', { name: 'Matrix' }).click();

  await expect(
    plugin
      .getByRole('region', { name: 'Do', exact: true })
      .locator('.kbn-quadrant-heading')
  ).toBeVisible();
  await expect(
    plugin.getByRole('button', { name: 'Collapse Do' })
  ).toBeHidden();
});

test('a label filter keeps only the cards with that label', async ({
  page,
}) => {
  const plugin = await openHost(page, { text: BOARD });
  const cards = plugin.locator('.kbn-card');
  await expect(cards.first()).toBeVisible();
  const all = await cards.count();

  await plugin
    .getByRole('group', { name: 'Filters' })
    .getByRole('button', { name: 'green', exact: true })
    .click();

  await expect(plugin.getByLabel('Search cards')).toHaveValue('label:green');
  const kept = await cards.count();
  expect(kept).toBeGreaterThan(0);
  expect(kept).toBeLessThan(all);
  for (const card of await cards.all()) {
    await expect(
      card.locator('.kbn-card-chip', { hasText: 'green' })
    ).toHaveCount(1);
  }
});

test('the board can be downloaded as CSV', async ({ page }) => {
  const plugin = await openHost(page, { text: BOARD });
  await expect(plugin.locator('.kbn-lane').first()).toBeVisible();

  await plugin.getByRole('button', { name: 'Export' }).click();
  const downloading = page.waitForEvent('download');
  await plugin.getByRole('menuitem', { name: 'Download CSV' }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toBe('kanban-board.csv');
  const csv = fs.readFileSync(await download.path(), 'utf8');
  const lines = csv.trimEnd().split('\n');
  expect(lines[0]).toBe('lane,card,label,due,quadrant,checklist');
  // One row per card of the example, the done lane included.
  expect(lines.length - 1).toBe(BOARD.match(/^\* /gm).length);
  expect(csv).toContain('BACKLOG,checklists on cards,green,,,2/3');
});

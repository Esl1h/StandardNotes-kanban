import { test, expect } from '@playwright/test';
import { openHost } from './snHost.js';
import { BOARD, VISIBLE_LANES } from './board.js';

// The mobile app runs its web UI from a local file inside a WebView, so the
// host origin is "null". An opaque-origin page may not load localhost, where
// the plugin is served in tests; in the app it comes from a public host.
test.use({
  launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks'] },
});

test('loads the note when the host origin is opaque, as in the mobile app', async ({
  page,
}) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const plugin = await openHost(page, { text: BOARD, opaqueOrigin: true });

  await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);
  expect(pageErrors).toEqual([]);
});

test.describe('a slow (throttled) mobile CPU', () => {
  // The registration message is sent once; a lost race means the note never
  // loads, so repeat to catch intermittent failures.
  for (let run = 1; run <= 10; run++) {
    test(`registers before the iframe load event, run ${run}`, async ({
      page,
    }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      const plugin = await openHost(page, { text: BOARD, throttle: 30 });

      await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);
      expect(pageErrors).toEqual([]);
    });
  }
});

test('the Matrix view survives reopening without localStorage', async ({
  page,
}) => {
  // The opaque origin also blocks localStorage, as in the app's sandbox.
  const plugin = await openHost(page, { text: BOARD, opaqueOrigin: true });
  await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);
  await plugin.getByRole('button', { name: 'Matrix' }).click();
  await expect(plugin.getByRole('button', { name: 'Matrix' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const saved = await page.evaluate(() => window.componentData);

  const reopened = await openHost(page, {
    text: BOARD,
    opaqueOrigin: true,
    componentData: saved,
  });

  await expect(
    reopened.getByRole('button', { name: 'Matrix' })
  ).toHaveAttribute('aria-pressed', 'true');
});

test('a collapsed lane stays collapsed after reopening without localStorage', async ({
  page,
}) => {
  // The opaque origin also blocks localStorage, as in the app's sandbox.
  const plugin = await openHost(page, { text: BOARD, opaqueOrigin: true });
  await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);
  await plugin
    .getByRole('button', { name: 'Collapse lane BACKLOG', exact: true })
    .click();
  await expect(
    plugin.getByRole('button', { name: 'Expand lane BACKLOG', exact: true })
  ).toBeVisible();
  const saved = await page.evaluate(() => window.componentData);

  const reopened = await openHost(page, {
    text: BOARD,
    opaqueOrigin: true,
    componentData: saved,
  });

  await expect(
    reopened.getByRole('button', { name: 'Expand lane BACKLOG', exact: true })
  ).toBeVisible();
  await expect(
    reopened.getByRole('button', { name: 'Collapse lane BACKLOG', exact: true })
  ).toHaveCount(0);
});

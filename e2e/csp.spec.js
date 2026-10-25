import { test, expect } from '@playwright/test';
import { openHost } from './snHost.js';
import { BOARD, VISIBLE_LANES } from './board.js';

// See mobile-origin.spec.js: the opaque host may not load localhost.
test.use({
  launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks'] },
});

// The built page carries a Content Security Policy; loading a board must
// not trip it, in the web host or in the opaque-origin mobile one.
for (const opaqueOrigin of [false, true]) {
  test(`the page loads without a CSP violation${opaqueOrigin ? ', opaque origin' : ''}`, async ({
    page,
  }) => {
    const violations = [];
    page.on('console', (message) => {
      if (/Content Security Policy/.test(message.text())) violations.push(message.text());
    });

    const plugin = await openHost(page, { text: BOARD, opaqueOrigin });

    await expect(plugin.locator('.kbn-lane')).toHaveCount(VISIBLE_LANES);
    await expect(plugin.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
    await plugin
      .locator('.kbn-card')
      .first()
      .click({ position: { x: 6, y: 6 } });
    await expect(plugin.locator('.ReactModal__Content')).toBeVisible();
    expect(violations).toEqual([]);
  });
}

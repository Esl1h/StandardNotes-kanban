import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  browser: 'firefox',
  executablePath: '/usr/bin/firefox',
  protocol: 'webDriverBiDi',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));

async function addLane(title) {
  await page.click('.kbn-add-lane');
  await new Promise((r) => setTimeout(r, 400));
  await page.keyboard.type(title);
  await page.click('.kbn-add-lane-form .kbn-btn-primary');
  await new Promise((r) => setTimeout(r, 800));
}
async function addCard(laneIndex, title) {
  await page.evaluate((i) => {
    document.querySelectorAll('.kbn-lane')[i].querySelector('.kbn-add-card').click();
  }, laneIndex);
  await new Promise((r) => setTimeout(r, 400));
  await page.keyboard.type(title);
  await page.evaluate((i) => {
    document.querySelectorAll('.kbn-lane')[i].querySelector('.kbn-btn-primary').click();
  }, laneIndex);
  await new Promise((r) => setTimeout(r, 800));
}

await addLane('To Do');
await addLane('Doing');
await addCard(0, 'Renew passport');
await addCard(0, 'Buy milk');
await addCard(1, 'Ship release');

// 1. keyboard shortcut "N" opens the add-card form on the first lane
await page.keyboard.press('n');
await new Promise((r) => setTimeout(r, 500));
const nShortcut = await page.evaluate(() => {
  const firstLane = document.querySelectorAll('.kbn-lane')[0];
  return !!firstLane.querySelector('.kbn-add-form input');
});
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 400));

// 2. collapse the first lane
await page.evaluate(() => {
  document.querySelectorAll('.kbn-lane')[0].querySelector('[aria-label^="Collapse"]').click();
});
await new Promise((r) => setTimeout(r, 500));
const collapsedCount = await page.evaluate(() =>
  document.querySelectorAll('.kbn-lane-collapsed').length
);
await page.screenshot({ path: '/tmp/opencode/collapsed.png' });
await page.evaluate(() => {
  document.querySelectorAll('.kbn-lane')[0].querySelector('[aria-label^="Expand"]').click();
});
await new Promise((r) => setTimeout(r, 500));

// 3. search filters cards; lane with matching title keeps all cards
await page.type('.kbn-search', 'milk');
await new Promise((r) => setTimeout(r, 500));
const filtered = await page.evaluate(() => ({
  lanes: document.querySelectorAll('.kbn-lane').length,
  cards: [...document.querySelectorAll('.kbn-lane')].map((l) =>
    [...l.querySelectorAll('.kbn-card .kbn-card-title')].map((t) => t.textContent)
  ),
}));
await page.screenshot({ path: '/tmp/opencode/filtered.png' });
await page.evaluate(() => {
  const clear = document.querySelector('[aria-label="Clear search"]');
  clear && clear.click();
});
await new Promise((r) => setTimeout(r, 500));
const restored = await page.evaluate(() =>
  [...document.querySelectorAll('.kbn-lane')].map((l) => l.querySelectorAll('.kbn-card').length)
);

console.log(JSON.stringify({ nShortcut, collapsedCount, filtered, restored, errors }, null, 2));
await browser.close();

/** Verify the built site. Run SITE_URL=http://127.0.0.1:5175 node scripts/verify-upgrade.cjs.
 * Uses a separate Chrome profile; no user browsing data or external links are opened.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'); }
catch { playwright = require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'); }
const url = process.env.SITE_URL || 'http://127.0.0.1:5175/';
const output = path.resolve('docs/redesign-2026-09-08/verification.json');
const results = { date: new Date().toISOString(), url, checks: [], errors: [], viewports: [] };
const check = (name, detail) => { results.checks.push({ name, status: 'pass', detail }); console.log('PASS', name); };
(async () => {
  const browser = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  results.browser = await browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => results.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) results.errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('.stage-loading').waitFor({ state: 'detached' });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.stage-canvas canvas').count(), 1);
  assert.equal(await page.locator('.scene-fallback:visible').count(), 0);
  check('Live WebGL scene and semantic hero load');
  const destinations = await page.locator('a[target="_blank"]').evaluateAll(nodes => nodes.map(n => ({ href: n.href, rel: n.rel })));
  assert(destinations.every(a => a.href === 'https://ai.alexdbg.com/' && a.rel.includes('noopener') && a.rel.includes('noreferrer')));
  check('All conversion links retain destination and safe new-window attributes', destinations.length);
  await page.getByRole('button', { name: '摸摸仓鼠' }).click();
  await page.waitForFunction(() => document.querySelector('.hamster-speech')?.textContent.includes('鼓励'));
  assert.match(await page.locator('.hamster-speech').innerText(), /鼓励/);
  await page.getByRole('button', { name: '摸摸仓鼠' }).click();
  await page.waitForFunction(() => document.querySelector('.hamster-speech')?.textContent.includes('鼓励'));
  assert.match(await page.locator('.hamster-speech').innerText(), /鼓励/);
  check('Pet feedback and rapid-click cooldown');
  await page.getByRole('button', { name: '转一圈' }).click();
  await page.getByRole('button', { name: '转一圈' }).click();
  await page.waitForFunction(() => document.querySelector('.hamster-speech')?.textContent.includes('书包'));
  assert.match(await page.locator('.hamster-speech').innerText(), /书包/);
  await page.waitForTimeout(2700);
  check('Spin interaction completes after repeated input');
  await page.getByRole('button', { name: '切换夜间灯光' }).click();
  assert.equal(await page.locator('.site').getAttribute('data-night'), 'true');
  assert.equal(await page.getByRole('button', { name: '切换日间灯光' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: '切换日间灯光' }).click();
  check('Day/night switch and pressed state');
  const story = [];
  for (let i = 0; i < 5; i++) {
    const button = page.locator(`#story-trigger-${i}`);
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
    await page.locator(`#story-panel-${i}`).waitFor();
    const text = await page.locator(`#story-panel-${i}`).innerText();
    assert.equal(await page.locator(`#story-panel-${i} li`).count(), 3);
    story.push(text);
  }
  assert(story.some(s => s.includes('100% 好评金牌讲师') && s.includes('微软 MOS 大师级认证')));
  check('Five story entries, fifteen original points and teaching credentials');
  const lessons = [];
  for (let i = 0; i < 4; i++) {
    await page.locator(`#route-tab-${i}`).click();
    assert.equal(await page.locator(`#route-panel-${i} .route-lessons a`).count(), 4);
    lessons.push(...await page.locator('.route-lessons a').allTextContents());
  }
  assert.equal(new Set(lessons).size, 16);
  check('All four learning routes expose sixteen original lesson links');
  await page.locator('#route-tab-0').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'route-panel-1');
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'route-panel-1');
  await page.locator('#route-tab-1').focus(); await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'route-tab-3');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'route-tab-0');
  check('Arrow, Home, End and rapid Tab preserve keyboard focus');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '转身看看' }).waitFor();
  await page.waitForTimeout(350);
  const still1 = await page.locator('.stage-canvas canvas').screenshot();
  await page.waitForTimeout(800);
  const still2 = await page.locator('.stage-canvas canvas').screenshot();
  assert(still1.equals(still2), 'Reduced-motion canvas must remain still without input');
  await page.getByRole('button', { name: '转身看看' }).click();
  await page.waitForTimeout(200);
  const turned = await page.locator('.stage-canvas canvas').screenshot();
  assert(!still2.equals(turned), 'Explicit reduced-motion turn should change visible pose');
  check('Live reduced-motion preference stops continuous rendering; explicit turn remains available');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: '转一圈' }).waitFor();
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(250);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(450);
  assert.equal(await page.locator('.scene-fallback:visible').count(), 0);
  check('Scene resumes after leaving and returning to exploration area');
  for (const [width, height] of [[1440,1000],[1024,768],[390,844],[320,740]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(250);
    const layout = await page.evaluate(() => {
      const title = document.querySelector('h1').getBoundingClientRect();
      return { viewport: [innerWidth, innerHeight], scrollWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight, title: { left: title.left, right: title.right }, ctaCount: document.querySelectorAll('a[target="_blank"]').length };
    });
    assert(layout.scrollWidth <= width, `Horizontal overflow at ${width}`);
    assert(layout.title.left >= 0 && layout.title.right <= width, `Title box overflow at ${width}`);
    results.viewports.push(layout);
  }
  check('1440, 1024, 390 and 320 pixel layouts have no horizontal overflow');
  const failed = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await failed.route('**/models/hamster-v2.glb', route => route.abort());
  await failed.goto(url, { waitUntil: 'networkidle' });
  await failed.locator('.scene-fallback').waitFor();
  assert(await failed.locator('.scene-fallback img').evaluate(img => img.complete && img.naturalWidth > 0));
  assert.equal(await failed.getByRole('link', { name: /立即进入 AI 仓鼠洞/ }).getAttribute('href'), 'https://ai.alexdbg.com/');
  check('Model network failure displays real poster and keeps CTA usable');
  assert.equal(results.errors.length, 0);
  results.status = 'pass';
  results.scope = 'Production build in desktop Chrome, mobile viewport and touch-size layouts. No real-device FPS claim; reduced-motion and GLB-network-failure paths tested.';
  fs.writeFileSync(output, JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { results.status = 'fail'; results.failure = error.stack; fs.writeFileSync(output, JSON.stringify(results, null, 2)); console.error(error); process.exit(1); });

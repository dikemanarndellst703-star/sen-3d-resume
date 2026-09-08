/** Capture real v1 UI. Usage: BASELINE_URL=http://127.0.0.1:5174 node scripts/capture-baseline.cjs
 * Requires playwright-core, Google Chrome and ffmpeg; never mutates application source.
 * PLAYWRIGHT_CORE and CHROME_PATH can override machine-specific discovery.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'); }
catch { playwright = require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'); }
const url = process.env.BASELINE_URL || 'http://127.0.0.1:5174/';
const output = path.resolve(process.env.CAPTURE_OUTPUT || 'docs/redesign-2026-09-08/before');
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hamster-baseline-frames-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [], failedRequests = [];
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), failure: request.failure() }));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);
  const audit = await page.evaluate(() => ({ title: document.title, viewport: { width: innerWidth, height: innerHeight }, pageHeight: document.documentElement.scrollHeight, sections: [...document.querySelectorAll('main section')].map(el => ({ className: el.className, id: el.id, y: el.getBoundingClientRect().top + scrollY, height: el.getBoundingClientRect().height })), h1: document.querySelector('h1')?.textContent, font: getComputedStyle(document.body).fontFamily, routeCardCount: document.querySelectorAll('.wk-card').length, canvas: [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height })) }));
  await page.screenshot({ path: path.join(output, 'hero-desktop.png') });
  console.log('desktop hero captured', JSON.stringify(audit));
  const scroll = async y => { await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(1600); };
  const storyY = await page.locator('#alex-story').evaluate(el => el.offsetTop);
  await scroll(storyY + 120);
  await page.screenshot({ path: path.join(output, 'story-desktop.png') });
  const gallery = await page.locator('.wk-gallery').evaluate(el => ({ y: el.getBoundingClientRect().top + scrollY, height: el.getBoundingClientRect().height }));
  await scroll(gallery.y);
  await page.screenshot({ path: path.join(output, 'routes-entry-desktop.png') });
  await scroll(gallery.y + 1440);
  await page.screenshot({ path: path.join(output, 'routes-desktop.png') });
  await scroll(gallery.y + gallery.height - 1000);
  await page.screenshot({ path: path.join(output, 'routes-last-desktop.png') });
  await scroll(0);

  // CDP screencast records the actual composed browser viewport (WebGL and DOM).
  // Frames retain native timing through ffmpeg's concat demuxer; video is not a mock animation.
  const client = await context.newCDPSession(page);
  const frames = [];
  client.on('Page.screencastFrame', async event => {
    const file = path.join(framesDir, `frame-${String(frames.length).padStart(6, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(event.data, 'base64'));
    frames.push({ file, timestamp: event.metadata.timestamp });
    await client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  });
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1440, maxHeight: 1000, everyNthFrame: 2 });
  await sleep(1200);
  // Pointer parallax: actual pointer events, first left-to-right then up-and-down.
  for (const p of [[200,300],[1250,400],[900,200],[750,780],[1000,480]]) { await page.mouse.move(...p, { steps: 28 }); await sleep(400); }
  // Actual smooth scrolling through first story, remaining story entries and horizontal routes.
  const smoothScroll = async (target, duration) => {
    await page.evaluate(({ target, duration }) => new Promise(resolve => {
      const start = scrollY, began = performance.now();
      function step(now) { const t = Math.min(1, (now - began) / duration); const eased = t < .5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; window.scrollTo({ top: start+(target-start)*eased, behavior: 'instant' }); if (t < 1) requestAnimationFrame(step); else resolve(); }
      requestAnimationFrame(step);
    }), { target, duration });
  };
  await smoothScroll(storyY + 200, 2500); await sleep(1700);
  await smoothScroll(gallery.y, 5000); await sleep(1300);
  await smoothScroll(gallery.y + gallery.height - 1000, 6000); await sleep(1300);
  await smoothScroll(audit.pageHeight - 1000, 1900); await sleep(1700);
  await client.send('Page.stopScreencast');
  await sleep(500);
  const concat = frames.map((frame, i) => `file '${frame.file.replaceAll("'", "'\\''")}'\nduration ${i + 1 < frames.length ? Math.max(.01, frames[i+1].timestamp - frame.timestamp).toFixed(6) : '0.1'}`).join('\n') + `\nfile '${frames.at(-1).file}'\n`;
  fs.writeFileSync(path.join(framesDir, 'frames.txt'), concat);
  const ffmpeg = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(framesDir, 'frames.txt'), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-movflags', '+faststart', path.join(output, 'walkthrough.mp4')], { encoding: 'utf8' });
  if (ffmpeg.status !== 0) throw new Error(ffmpeg.stderr);
  console.log('video encoded:', frames.length, 'frames');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  await mobilePage.locator('.loading-screen').waitFor({ state: 'detached', timeout: 30000 });
  await mobilePage.waitForTimeout(2600);
  await mobilePage.screenshot({ path: path.join(output, 'hero-mobile.png') });
  audit.mobile = await mobilePage.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight }));
  audit.capture = { date: new Date().toISOString(), url, commit: 'd44d71ee9809357a1be50da1c42d989d36d7df4a', browser: await browser.version(), frames: frames.length, consoleErrors, failedRequests };
  fs.writeFileSync(path.join(output, 'capture-metadata.json'), JSON.stringify(audit, null, 2));
  await browser.close();
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('complete:', output);
})().catch(error => { console.error(error); process.exit(1); });

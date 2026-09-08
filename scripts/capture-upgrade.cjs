/** Capture v2 production preview without modifying application source.
 * Usage: UPGRADE_URL=http://127.0.0.1:5175 node scripts/capture-upgrade.cjs
 * Requires playwright-core, Chrome and ffmpeg. Optional env overrides:
 * PLAYWRIGHT_CORE, CHROME_PATH, FFMPEG_PATH, CAPTURE_OUTPUT.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'); }
catch { playwright = require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'); }
const url = process.env.UPGRADE_URL || 'http://127.0.0.1:5175/';
const output = path.resolve(process.env.CAPTURE_OUTPUT || 'docs/redesign-2026-09-08/after');
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hamster-upgrade-frames-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [], consoleErrors = [], failedRequests = [], badResponses = [], screenshots = [], actionLog = [];
  const attachLogs = (page, viewport) => {
    page.on('pageerror', error => pageErrors.push({ viewport, message: error.message }));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ viewport, message: message.text() }); });
    page.on('requestfailed', request => failedRequests.push({ viewport, url: request.url(), failure: request.failure() }));
    page.on('response', response => { if (response.status() >= 400) badResponses.push({ viewport, url: response.url(), status: response.status() }); });
  };
  attachLogs(page, 'desktop');
  const ready = async page => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('.stage-loading').waitFor({ state: 'detached', timeout: 30000 });
    await page.locator('.stage-canvas canvas').waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(2400);
    const fallbackVisible = await page.locator('.scene-fallback').evaluateAll(els => els.some(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }));
    if (fallbackVisible) throw new Error('3D model fell back during capture; screenshots would not represent the intended scene.');
  };
  await ready(page);
  const audit = await page.evaluate(() => ({ title: document.title, viewport: { width: innerWidth, height: innerHeight }, pageHeight: document.documentElement.scrollHeight, sections: [...document.querySelectorAll('main section')].map(el => ({ className: el.className, id: el.id, y: el.getBoundingClientRect().top + scrollY, height: el.getBoundingClientRect().height })), canvas: [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height })), scripts: [...document.scripts].map(s => s.src).filter(Boolean) }));
  const screenshot = async (page, name, note) => {
    await page.screenshot({ path: path.join(output, name) });
    screenshots.push(await page.evaluate(({ name, note }) => ({ name, note, viewport: { width: innerWidth, height: innerHeight }, scrollY, night: document.querySelector('.site')?.getAttribute('data-night'), selectedRoute: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent }), { name, note }));
    console.log('captured', name);
  };
  const scroll = async (page, selector, offset = 0) => {
    await page.evaluate(({selector, offset}) => { const el = document.querySelector(selector); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: 'instant' }); }, {selector, offset});
    await page.waitForTimeout(1600);
  };
  await screenshot(page, 'hero-desktop.png', 'Default daytime hero, 1440 × 1000.');
  await scroll(page, '#alex-story');
  await screenshot(page, 'story-desktop.png', 'Story section anchored to its actual document position, first item expanded.');
  await scroll(page, '#learning-map');
  await screenshot(page, 'routes-desktop.png', 'Learning route section anchored to actual section top, initial route selected.');
  audit.routesBounds = await page.locator('#learning-map').evaluate(el => ({ top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height, panel: (()=>{const r=el.querySelector('[role="tabpanel"]').getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}})() }));
  await scroll(page, '.closing-cta');
  await screenshot(page, 'closing-desktop.png', 'Closing CTA, with native end-of-page scroll clamping.');
  await scroll(page, '#top');
  await page.getByRole('button', { name: '切换夜间灯光' }).click();
  await page.waitForTimeout(2000);
  await screenshot(page, 'night-desktop.png', 'Actual night toggle, after lighting transition settled.');
  await page.getByRole('button', { name: '切换日间灯光' }).click();
  await page.waitForTimeout(2000);
  await page.mouse.move(720, 500);

  // Record the real composed viewport through Chrome CDP, with native frame timing.
  const client = await context.newCDPSession(page);
  const frames = [];
  client.on('Page.screencastFrame', async event => {
    const file = path.join(framesDir, `frame-${String(frames.length).padStart(6, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(event.data, 'base64'));
    frames.push({ file, timestamp: event.metadata.timestamp });
    await client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  });
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1440, maxHeight: 1000, everyNthFrame: 2 });
  const began = Date.now();
  const log = action => actionLog.push({ atSeconds: Number(((Date.now() - began) / 1000).toFixed(2)), action });
  const smoothScrollTo = async (selector, duration) => {
    await page.evaluate(({ selector, duration }) => new Promise(resolve => {
      const el = document.querySelector(selector); const target = Math.min(document.documentElement.scrollHeight-innerHeight, el.getBoundingClientRect().top+scrollY);
      const start = scrollY, began = performance.now();
      function step(now) { const t=Math.min(1,(now-began)/duration); const e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; window.scrollTo({top:start+(target-start)*e,behavior:'instant'}); if(t<1) requestAnimationFrame(step); else resolve(); }
      requestAnimationFrame(step);
    }), { selector, duration });
  };
  log('Daytime hero, natural idle and blink'); await sleep(1300);
  log('Pointer movement across character and scene');
  for (const xy of [[1150,350],[850,590],[1220,520],[1010,360]]) { await page.mouse.move(...xy, { steps: 25 }); await sleep(300); }
  log('Click pet button, wait for full hop and arm response');
  await page.getByRole('button', { name: '摸摸仓鼠', exact: true }).click(); await sleep(1850);
  log('Click full-turn button, wait until spin completes');
  await page.getByRole('button', { name: '转一圈', exact: true }).click(); await sleep(2850);
  log('Switch to night, allow lighting transition');
  await page.getByRole('button', { name: '切换夜间灯光' }).click(); await sleep(1700);
  log('Return to daytime');
  await page.getByRole('button', { name: '切换日间灯光' }).click(); await sleep(1000);
  log('Scroll to Alex story'); await smoothScrollTo('#alex-story', 1900); await sleep(850);
  log('Expand teaching credentials'); await page.locator('#story-trigger-3').click(); await sleep(1700);
  log('Scroll to learning routes'); await smoothScrollTo('#learning-map', 1900); await sleep(750);
  for (let i=0;i<4;i++) { log(`Select route ${i+1}`); await page.locator(`#route-tab-${i}`).click(); await sleep(850); }
  log('Scroll to final CTA without opening external destination'); await smoothScrollTo('.closing-cta', 1600); await sleep(1700);
  const recordingStoppedAt = Date.now() / 1000;
  await client.send('Page.stopScreencast'); await sleep(500);
  if (!frames.length) throw new Error('Chrome returned no screencast frames.');
  const concat = frames.map((frame,i)=>`file '${frame.file.replaceAll("'", "'\\''")}'\nduration ${i+1<frames.length?Math.max(.01,frames[i+1].timestamp-frame.timestamp).toFixed(6):Math.max(.01,recordingStoppedAt-frame.timestamp).toFixed(6)}`).join('\n')+`\nfile '${frames.at(-1).file}'\n`;
  fs.writeFileSync(path.join(framesDir,'frames.txt'),concat);
  const ffmpeg=spawnSync(process.env.FFMPEG_PATH||'ffmpeg',['-y','-f','concat','-safe','0','-i',path.join(framesDir,'frames.txt'),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','medium','-crf','21','-movflags','+faststart','-t',String(recordingStoppedAt-frames[0].timestamp),path.join(output,'walkthrough.mp4')],{encoding:'utf8'});
  if(ffmpeg.status!==0)throw new Error(ffmpeg.stderr);
  console.log('video encoded', frames.length, 'source frames');
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const mobilePage=await mobile.newPage();attachLogs(mobilePage,'mobile');await ready(mobilePage);
  await screenshot(mobilePage,'hero-mobile.png','Actual 390 × 844 mobile hero, top of page.');
  await scroll(mobilePage,'.stage-shell',-25);
  await screenshot(mobilePage,'mobile-stage.png','Mobile interaction area, at its actual position with control buttons visible.');
  audit.mobile=await mobilePage.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,controls:[...document.querySelectorAll('.play-controls button')].map(el=>{const r=el.getBoundingClientRect();return {label:el.textContent,top:r.top,bottom:r.bottom,height:r.height}})}));
  const modelPath=path.resolve('web/public/models/hamster-v2.glb');
  audit.model={file:'web/public/models/hamster-v2.glb',bytes:fs.statSync(modelPath).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(modelPath)).digest('hex')};
  audit.capture={date:new Date().toISOString(),url,browser:await browser.version(),sourceFrames:frames.length,videoNativeDurationSeconds:recordingStoppedAt-frames[0].timestamp,lastStaticHoldSeconds:recordingStoppedAt-frames.at(-1).timestamp,pageErrors,consoleErrors,failedRequests,badResponses};
  audit.screenshots=screenshots;audit.videoActions=actionLog;
  fs.writeFileSync(path.join(output,'capture-metadata.json'),JSON.stringify(audit,null,2)+'\n');
  await browser.close();fs.rmSync(framesDir,{recursive:true,force:true});
  console.log('complete',JSON.stringify(audit.capture));
})().catch(error=>{console.error(error);process.exit(1)});

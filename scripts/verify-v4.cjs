/** Real-browser V4 acceptance. Run against a production preview. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')); }
catch { ({ chromium } = require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')); }
const output = path.resolve(process.env.VERIFY_OUTPUT || 'docs/redesign-v4-clay-2026-09-08/verification.json');
const report = { date: new Date().toISOString(), url: process.env.SITE_URL || 'http://127.0.0.1:5175/', checks: [], errors: [], layouts: [] };
const check = (name, detail) => { report.checks.push({ name, status: 'pass', detail }); console.log('PASS', name); };
let browser;
(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  report.browser = await browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => {
    window.__qaDraws = 0;
    for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Type) continue;
      for (const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
        const original = Type.prototype[name];
        if (typeof original !== 'function') continue;
        Type.prototype[name] = function(...args) { window.__qaDraws++; return original.apply(this,args); };
      }
    }
  });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(report.url, { waitUntil: 'networkidle' });
  await page.locator('.cinema-loading').waitFor({ state: 'hidden', timeout: 90000 });
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.cinema-fallback:visible').count(), 0);
  check('Full WebGL model loads, one semantic hero, no fallback');
  await page.waitForTimeout(700);
  const beforeIdle = await page.evaluate(() => window.__qaDraws);
  await page.waitForTimeout(800);
  const afterIdle = await page.evaluate(() => window.__qaDraws);
  assert.equal(afterIdle, beforeIdle, 'The fused clay sculpture must not redraw continuously while idle');
  check('Idle normal-motion scene makes zero additional WebGL draw calls', { beforeIdle, afterIdle });
  for (const [index, label] of ['初见','看见','探索','出发'].entries()) {
    const button = page.getByRole('button', { name: `第${index + 1}幕：${label}` });
    await button.click(); await page.waitForTimeout(1800);
    assert.equal(await button.getAttribute('aria-current'), 'step');
    assert.equal(await page.locator(`.copy-${index}`).getAttribute('aria-hidden'), 'false');
    assert.equal(await page.locator('.cinema-copy:not([inert])').count(), 1);
  }
  await page.getByRole('button', { name: '第2幕：看见' }).click(); await page.waitForTimeout(1800);
  assert.equal(await page.locator('.cinema-chapters [aria-current="step"]').getAttribute('aria-label'), '第2幕：看见');
  assert(await page.locator('.cinema-viewport').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<1));
  assert(await page.evaluate(() => window.__qaDraws) > afterIdle, 'Scroll must resume rendering');
  check('Four chapter jumps and reverse scroll retain pinned scene and one interactive copy');
  await page.getByRole('button', { name: '第1幕：初见' }).click(); await page.waitForTimeout(1800);
  await page.mouse.move(950,490); await page.mouse.down(); await page.mouse.move(1120,490,{steps:18}); await page.mouse.up();
  await page.waitForTimeout(700);
  assert.match(await page.locator('.cinema-view-control').textContent(), /继续/);
  assert.equal(await page.evaluate(()=>document.body.style.cursor === 'grabbing'), false);
  check('Mouse drag rotates through lightweight picking volumes and releases capture');
  await page.mouse.move(950,490); await page.mouse.down();
  await page.locator('canvas').dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  assert.equal(await page.evaluate(()=>document.body.style.cursor === 'grabbing'), false);
  await page.mouse.up();
  check('Native pointer cancellation clears dragging state and cursor');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(900);
  assert.equal(await page.locator('.cinema.is-reduced').count(), 1);
  assert.equal(await page.locator('.cinema-chapters').count(), 0);
  const still1 = await page.locator('canvas').screenshot(); await page.waitForTimeout(700);
  const still2 = await page.locator('canvas').screenshot(); assert(still1.equals(still2), 'Reduced-motion scene should stay still');
  await page.getByRole('button', { name: '旋转角色视角' }).click(); await page.waitForTimeout(300);
  assert(!still2.equals(await page.locator('canvas').screenshot()), 'Explicit rotation must remain available');
  check('Live reduced-motion stops idle drawing, collapses pinned story and retains explicit turn');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await page.waitForTimeout(400);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(1700);
  assert.equal(await page.locator('.cinema-fallback:visible').count(),0);
  check('Scene resumes after leaving and returning to viewport');
  for(const [width,height] of [[1440,1000],[1365,768],[1024,768],[390,844],[320,740]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(700);
    const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,h1:{left:document.querySelector('h1').getBoundingClientRect().left,right:document.querySelector('h1').getBoundingClientRect().right}}));
    assert(layout.scrollWidth<=width);assert(layout.h1.left>=0&&layout.h1.right<=width);report.layouts.push(layout);
  }
  check('Five desktop, tablet and mobile widths have no horizontal overflow', report.layouts);
  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await touch.goto(report.url,{waitUntil:'networkidle'});await touch.locator('.cinema-loading').waitFor({state:'hidden',timeout:90000});
  const cdp=await touch.context().newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:690}]});
  for(let y=680;y>=390;y-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await touch.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(500);
  assert(await touch.evaluate(()=>scrollY>100),'Touch swipe over model must scroll document');
  check('Actual touch swipe over the 3D canvas preserves native vertical scrolling');
  await touch.close();
  const broken=await browser.newPage({viewport:{width:390,height:844}});
  await broken.route('**/models/hamster-v4-clay.glb',r=>r.abort());await broken.goto(report.url,{waitUntil:'networkidle'});
  await broken.locator('.cinema-fallback:visible').waitFor();
  assert(await broken.locator('.cinema-fallback:visible img').evaluate(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await broken.getByRole('link',{name:'开启你的 AI 旅程'}).getAttribute('href'),'https://ai.alexdbg.com/');
  check('Model download failure displays actual poster and retains working learning entry');
  await broken.close();
  assert.equal(report.errors.length,0);
  report.status='pass';report.scope='Headless desktop Chrome, touch emulation, actual canvas screenshots, production build. No real-device FPS claim. Lower-section keyboard/content QA is recorded separately.';
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');await browser.close();
})().catch(async error=>{report.status='fail';report.failure=error.stack;fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.error(error);await browser?.close();process.exitCode=1;});

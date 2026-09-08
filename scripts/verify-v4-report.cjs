/** Verify shareable V4 report in Chrome, including file:// offline use. */
const {chromium}=require(process.env.PLAYWRIGHT_CORE || '/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const result={date:new Date().toISOString(),checks:[]};
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const local='file://'+path.resolve('docs/redesign-v4-clay-2026-09-08/index.html');
 for(const [mode,url] of [['production',(process.env.SITE_URL||'http://127.0.0.1:5175/')+'update-report-v4/'],['offline',local]]){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('img').evaluateAll(xs=>xs.forEach(x=>x.loading='eager'));
  await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
  await page.locator('#evidence').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
  const imgs=await page.locator('img').evaluateAll(xs=>xs.map(x=>({src:x.getAttribute('src'),loaded:x.complete&&x.naturalWidth>0})));
  assert(imgs.every(x=>x.loaded),JSON.stringify(imgs));
  assert.equal(await page.locator('.is-missing').count(),0);
  assert(!/待核验|模板|预留|目标百万面/.test(await page.locator('main').textContent()));
  const range=page.getByRole('slider');await range.focus();await range.press('ArrowRight');
  assert.equal(await range.inputValue(),'51');assert.match(await range.getAttribute('aria-valuetext'),/51%|51％|51%/);
  const videos=page.locator('video');assert.equal(await videos.count(),2);
  for(let i=0;i<2;i++){
   await videos.nth(i).evaluate(v=>v.load());
   await page.waitForFunction(i=>{const v=document.querySelectorAll('video')[i];return v.readyState>=1&&Number.isFinite(v.duration)},i);
   assert(await videos.nth(i).evaluate(v=>v.duration>10));
  }
  const links=await page.locator('[data-final-glb], [data-final-blend]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));
  assert(links.every(x=>mode==='production'?x.includes('/blob/v4.0.0/') : x.startsWith('../../')));
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(errors.length,0,JSON.stringify(errors));
  result.checks.push({mode,status:'pass',images:imgs.length,videos:2,checks:'Images, completed delivery language, keyboard comparison, playable media, versioned source links, mobile overflow, no script errors'});
  if(mode==='production'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'docs/redesign-v4-clay-2026-09-08/report-mobile.png'});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'docs/redesign-v4-clay-2026-09-08/report-desktop.png'});}
  await page.close();
 }
 result.status='pass';fs.writeFileSync('docs/redesign-v4-clay-2026-09-08/report-qa.json',JSON.stringify(result,null,2)+'\n');await browser.close();console.log(result);
})().catch(e=>{console.error(e);process.exitCode=1});

/** Verify the four route artworks really loop independently of scrolling. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require(process.env.PLAYWRIGHT_CORE||'/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const output=path.resolve(process.env.ROUTE_MOTION_OUTPUT||'docs/redesign-v4-clay-2026-09-08/route-motion-qa.json');
const result={date:new Date().toISOString(),url:process.env.SITE_URL||'http://127.0.0.1:5175/',checks:[],errors:[]};
const pass=(name,detail)=>{result.checks.push({name,status:'pass',detail});console.log('PASS',name)};
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto(result.url,{waitUntil:'networkidle'});
 const navigate=async i=>{await page.evaluate(i=>{const e=document.querySelector('#learning-map');scrollTo({top:e.offsetTop+i/3*(e.offsetHeight-innerHeight),behavior:'instant'})},i);await page.waitForTimeout(450);};
 const state=async art=>art.evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('route-')).map(a=>({name:a.animationName,state:a.playState,time:a.currentTime,iterations:a.effect.getTiming().iterations===Infinity?'Infinity':a.effect.getTiming().iterations,transform:getComputedStyle(a.effect.target).transform,opacity:getComputedStyle(a.effect.target).opacity})));
 for(let i=0;i<4;i++){
  await navigate(i);const art=page.locator('.art-'+i);await page.waitForFunction(i=>document.querySelector('.art-'+i).dataset.looping==='true',i);
  const before=await state(art);await page.waitForTimeout(720);const after=await state(art);
  assert(before.length>0);assert(before.every(x=>x.iterations==='Infinity'));
  assert(after.some((x,j)=>x.transform!==before[j].transform||x.opacity!==before[j].opacity),`Route ${i} must visibly change while scroll is still`);
  assert.equal(await page.locator('.flagship-route-art[data-looping="true"]').count(),1);
  pass(`Artwork ${i+1} loops without scrolling, with infinite transform/opacity animations`,{animations:after.map(x=>x.name)});
 }
 const control=page.locator('.flagship-loop-toggle');await control.click();await page.waitForTimeout(180);
 assert.equal(await control.getAttribute('aria-pressed'),'true');
 const art=page.locator('.art-3'),paused1=await state(art);await page.waitForTimeout(500);const paused2=await state(art);
 assert(paused1.length>0&&paused2.every(x=>x.state==='paused'));
 assert(paused2.every((x,i)=>Math.abs(x.time-paused1[i].time)<2));
 pass('User pause freezes all route animations without resetting their phase');
 await control.click();await page.waitForTimeout(300);assert((await state(art)).some((x,i)=>x.time>paused2[i].time+100));pass('User play resumes from the paused phase');
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(250);
 assert.equal(await page.locator('.flagship-route-art[data-looping="true"]').count(),0);
 const off1=await state(art);await page.waitForTimeout(350);const off2=await state(art);assert(off2.every((x,i)=>Math.abs(x.time-off1[i].time)<2));
 pass('Offscreen artworks stop advancing their timelines');
 await navigate(3);await page.waitForFunction(()=>document.querySelector('.art-3').dataset.looping==='true');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(180);
 assert.equal(await page.locator('.flagship-route-art[data-looping="true"]').count(),0);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>document.querySelector('.art-3').dataset.looping==='true');
 pass('Visibility-change handler pauses and resumes loops',{scope:'Browser document.hidden and visibilitychange simulated in the page'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.art-0').scrollIntoViewIfNeeded();await page.waitForTimeout(350);
 for(let i=0;i<4;i++){assert.equal(await page.locator('.art-'+i).getAttribute('data-looping'),'false');assert.equal((await state(page.locator('.art-'+i))).length,0);}
 pass('Live reduced-motion preference removes all four decorative loops');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>result.errors.push(e.message));await mobile.goto(result.url,{waitUntil:'networkidle'});
 for(let i=0;i<4;i++){const a=mobile.locator('.art-'+i);await a.scrollIntoViewIfNeeded();await mobile.waitForFunction(i=>document.querySelector('.art-'+i).dataset.looping==='true',i);const before=await state(a);await mobile.waitForTimeout(350);const after=await state(a);assert(after.some((x,j)=>x.transform!==before[j].transform||x.opacity!==before[j].opacity));}
 assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await mobile.locator('.flagship-route-links a').count(),16);
 pass('All four mobile artworks loop in natural vertical layout; 16 course links and width remain intact');
 assert.equal(result.errors.length,0);result.status='pass';result.browser=await browser.version();fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');await browser.close();
})().catch(async e=>{result.status='fail';result.failure=e.stack;fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.error(e);await browser?.close();process.exitCode=1});

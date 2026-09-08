/** Capture the real V4 production page, preserving native video timing.
 * SITE_URL, CAPTURE_OUTPUT, PLAYWRIGHT_CORE, CHROME_PATH, FFMPEG_PATH are optional overrides.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')); }
catch { ({ chromium } = require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')); }
const url = process.env.SITE_URL || 'http://127.0.0.1:5175/';
const output = path.resolve(process.env.CAPTURE_OUTPUT || 'docs/redesign-v4-clay-2026-09-08/after');
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hamster-v4-frames-'));
const meta = { date: new Date().toISOString(), url, errors: [], screenshots: [], actions: [] };
(async () => {
  fs.mkdirSync(output,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page = await context.newPage();
  page.on('pageerror',e=>meta.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)meta.errors.push(`${r.status()} ${r.url()}`)});
  const ready=async page=>{await page.goto(url,{waitUntil:'networkidle'});await page.locator('.cinema-loading').waitFor({state:'hidden',timeout:90000});await page.waitForTimeout(1800);if(await page.locator('.cinema-fallback:visible').count())throw new Error('WebGL fallback is visible; this is not a valid 3D capture.');};
  const shot=async(page,name,note)=>{await page.screenshot({path:path.join(output,name)});meta.screenshots.push(await page.evaluate(({name,note})=>({name,note,viewport:[innerWidth,innerHeight],scrollY,chapter:document.querySelector('.cinema-chapters [aria-current]')?.getAttribute('aria-label')}),{name,note}));console.log('CAPTURE',name)};
  const toChapter=async(p,duration=0)=>{await page.evaluate(({p,duration})=>new Promise(resolve=>{const el=document.querySelector('.cinema'),target=el.getBoundingClientRect().top+scrollY+p*(el.offsetHeight-innerHeight);if(!duration){scrollTo({top:target,behavior:'instant'});resolve();return;}const start=scrollY,began=performance.now();function tick(now){const t=Math.min(1,(now-began)/duration),e=t*t*(3-2*t);scrollTo({top:start+(target-start)*e,behavior:'instant'});if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);}),{p,duration});};
  await ready(page);
  meta.browser=await browser.version();
  meta.frameCadence=await page.evaluate(()=>new Promise(resolve=>{const deltas=[];let last=performance.now(),began=last;function sample(now){deltas.push(now-last);last=now;if(now-began<3000){requestAnimationFrame(sample);return;}const sorted=deltas.slice(1).sort((a,b)=>a-b);resolve({scope:'Browser requestAnimationFrame cadence; clay scene is drawn on demand, so this does not measure model draw rate or device FPS.',samples:sorted.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over33ms:sorted.filter(x=>x>33.4).length});}requestAnimationFrame(sample)}));
  for(const [name,p] of [['hero',0],['face',.30],['back',.57],['final',.85]]){await toChapter(p);await page.waitForTimeout(1600);await shot(page,`${name}-desktop.png`,'Real full-precision WebGL viewport');}
  await toChapter(0);await page.waitForTimeout(1800);
  await page.mouse.move(700,860);
  const cdp=await context.newCDPSession(page);const frames=[];
  cdp.on('Page.screencastFrame',async event=>{const file=path.join(framesDir,`frame-${String(frames.length).padStart(6,'0')}.jpg`);fs.writeFileSync(file,Buffer.from(event.data,'base64'));frames.push({file,timestamp:event.metadata.timestamp});await cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:1000,everyNthFrame:2});
  const began=Date.now();const log=action=>meta.actions.push({atSeconds:+((Date.now()-began)/1000).toFixed(2),action});
  const scrollToSelector=async(selector,duration=2500,progress=0)=>{await page.evaluate(({selector,duration,progress})=>new Promise(resolve=>{const el=document.querySelector(selector),target=Math.min(document.documentElement.scrollHeight-innerHeight,el.getBoundingClientRect().top+scrollY+progress*(el.offsetHeight-innerHeight)),start=scrollY,began=performance.now();function tick(now){const t=Math.min(1,(now-began)/duration),e=t*t*(3-2*t);scrollTo({top:start+(target-start)*e,behavior:'instant'});if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);}),{selector,duration,progress});};
  log('Light studio hero, static clay sculpture');await page.waitForTimeout(1300);
  log('Drag character to inspect angle');await page.mouse.move(1000,520);await page.mouse.down();await page.mouse.move(1090,520,{steps:40});await page.mouse.up();await page.mouse.move(700,860);await page.waitForTimeout(1100);
  for(const [p,action] of [[.30,'Scroll into graphite face macro'],[.57,'Orbit into backpack detail'],[.85,'Return to wide closing composition']]){log(action);await toChapter(p,4400);await page.waitForTimeout(1100);}
  log('Reverse scroll along the same camera path');await toChapter(.30,4300);await page.waitForTimeout(800);
  log('Continue to learning routes');await scrollToSelector('#learning-map',4800);await page.waitForTimeout(900);
  for(const p of [1/3,2/3,1]){log(`Native scroll reveals learning scene ${Math.round(p*3)+1}`);await scrollToSelector('#learning-map',2200,p);await page.waitForTimeout(800);}
  log('Read Alex credentials');await scrollToSelector('#alex-story',2200);await page.waitForTimeout(1800);
  log('Reach final learning entry');await scrollToSelector('.flagship-invitation',2500);await page.waitForTimeout(1200);
  const stopped=Date.now()/1000;await cdp.send('Page.stopScreencast');await page.waitForTimeout(400);
  if(!frames.length)throw new Error('No native browser frames were captured.');
  const concat=frames.map((f,i)=>`file '${f.file}'\nduration ${Math.max(.01,(frames[i+1]?.timestamp||stopped)-f.timestamp).toFixed(6)}`).join('\n')+`\nfile '${frames.at(-1).file}'\n`;
  fs.writeFileSync(path.join(framesDir,'frames.txt'),concat);
  const ffmpeg=spawnSync(process.env.FFMPEG_PATH||'/opt/homebrew/bin/ffmpeg',['-y','-f','concat','-safe','0','-i',path.join(framesDir,'frames.txt'),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','medium','-crf','21','-movflags','+faststart','-t',String(stopped-frames[0].timestamp),path.join(output,'walkthrough.mp4')],{encoding:'utf8'});
  if(ffmpeg.status!==0)throw new Error(ffmpeg.stderr);
  meta.video={sourceFrames:frames.length,nativeDurationSeconds:stopped-frames[0].timestamp,encodedFps:30,method:'Chrome CDP screencast with native timestamps, no time compression'};
  await context.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});await ready(mobile);
  await shot(mobile,'hero-mobile.png','Real 390 × 844 touch viewport');
  await mobile.evaluate(()=>scrollTo({top:.30*(document.querySelector('.cinema').offsetHeight-innerHeight),behavior:'instant'}));await mobile.waitForTimeout(1700);await shot(mobile,'face-mobile.png','Mobile macro composition');
  const buffer=fs.readFileSync('web/public/models/hamster-v4-clay.glb');meta.model={file:'web/public/models/hamster-v4-clay.glb',bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')};
  fs.writeFileSync(path.join(output,'capture-metadata.json'),JSON.stringify(meta,null,2)+'\n');await browser.close();fs.rmSync(framesDir,{recursive:true,force:true});
  if(meta.errors.length)throw new Error(JSON.stringify(meta.errors));console.log('COMPLETE',JSON.stringify(meta.video));
})().catch(e=>{console.error(e);process.exit(1)});

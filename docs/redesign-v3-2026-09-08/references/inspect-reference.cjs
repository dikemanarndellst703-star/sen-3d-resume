const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const folder=__dirname;
const site=process.argv[2]||'xiaomi';
const urls={xiaomi:'https://www.mi.com/global/product/xiaomi-15-ultra/',nanfu:'https://www.nanfu.global/',nanfucn:'https://www.nanfu.com/'};
(async()=>{
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(urls[site],{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(7000);
for(const label of ['Accept All','Accept all','Reject optional cookies','Reject all','拒绝全部']){const el=page.getByRole('button',{name:label,exact:true});if(await el.count()){await el.first().click({timeout:1500}).catch(()=>{});}}
const inspect=()=>page.evaluate(()=>({url:location.href,title:document.title,scrollY,pageHeight:document.documentElement.scrollHeight,elements:[...document.querySelectorAll('[class*=pin-spacer], .kvs-slide, .sample-slide, [class*=banner], .batteryCv')].map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,class:el.className,id:el.id,top:Math.round(r.top+scrollY),height:Math.round(r.height),position:s.position,transform:s.transform,text:el.innerText?.slice(0,80),src:el.currentSrc}}).filter(x=>x.height>20).slice(0,180)}));
const states=[];states.push(await inspect());await page.screenshot({path:path.join(folder,site+'-01-hero.png')});
const scrolls=site==='xiaomi'?[700,1500,2300,3200,4500,6000,7600,9500,12000]:site==='nanfu'?[600,1300,2200,3400,5000,7000]:[900,1900,3000];
for(const y of scrolls){await page.mouse.wheel(0,y-(await page.evaluate(()=>scrollY)));await page.waitForTimeout(1600);states.push(await inspect());}
fs.writeFileSync(path.join(folder,site+'-observed-states.json'),JSON.stringify({capturedAt:new Date().toISOString(),viewport:{width:1440,height:960},browser:await browser.version(),states,errorsCount:errors.length,errors:[...new Set(errors)]},null,2));
console.log(JSON.stringify({site,samples:states.map(s=>({scrollY:s.scrollY,pageHeight:s.pageHeight})),errorsCount:errors.length,errors:[...new Set(errors)]},null,2));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

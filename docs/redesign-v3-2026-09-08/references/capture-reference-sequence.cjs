const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('/Users/lingze/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const site=process.argv[2]||'xiaomi',folder=__dirname;
const url=site==='xiaomi'?'https://www.mi.com/global/product/xiaomi-15-ultra/':'https://www.nanfu.global/';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(7000);
 const actions=[];const state=()=>page.evaluate(()=>({scrollY,pageHeight:document.documentElement.scrollHeight,visible:[...document.querySelectorAll('h1,h2,h3,[class*=pin-spacer],canvas,.banner,.kvs-slide')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,class:el.className,top:Math.round(r.top),height:Math.round(r.height),text:el.innerText?.slice(0,80),position:s.position,transform:s.transform,opacity:s.opacity,currentTime:el.currentTime,paused:el.paused}}).filter(x=>x.top<960&&x.top+x.height>0)}));
 actions.push({action:'initial',state:await state()});
 const points=site==='xiaomi'?[{y:2300,file:'xiaomi-02-pinned-scroll.png'},{y:3200},{y:5320},{y:7460,file:'xiaomi-03-material-details.png'}]:[{y:624},{y:1296,file:'nanfu-02-product-pullback.png'},{y:1920},{y:2400},{y:3408,file:'nanfu-03-brand-scale.png'}];
 for(const p of points){
   const before=await page.evaluate(()=>scrollY);
   if(site==='nanfu'){
    for(let i=0;i<100;i++){const y=await page.evaluate(()=>scrollY);if(y>=p.y-24)break;await page.mouse.wheel(0,120);await page.waitForTimeout(50);}
   }else await page.mouse.wheel(0,p.y-before);
   await page.waitForTimeout(1800);const s=await state();
   if(p.file){await page.screenshot({path:path.join(folder,p.file)});console.log('captured '+p.file+' y='+s.scrollY);}
   actions.push({action:'native wheel forward',target:p.y,from:before,file:p.file,state:s});
 }
 fs.writeFileSync(path.join(folder,site+'-sequence-evidence.json'),JSON.stringify({date:new Date().toISOString(),url,browser:await browser.version(),viewport:{width:1440,height:960},actions,errorsCount:errors.length,errors:[...new Set(errors)]},null,2));
 console.log(JSON.stringify({site,actions:actions.map(x=>({file:x.file,y:x.state.scrollY})),errorsCount:errors.length,errors:[...new Set(errors)]},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

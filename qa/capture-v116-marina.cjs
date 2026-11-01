'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const url=process.env.V116_URL||'http://127.0.0.1:8765/preview/v116-marina/?v116QA=1&pilotQA=1';
const output=process.env.V116_EVIDENCE||path.resolve('site/preview/v116-marina/evidence');
const cases=[{key:'portrait',w:390,h:844,z:.82},{key:'landscape',w:844,h:390,z:1.04}];
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={url,disclaimer:'Chromium Android-sized simulation, not a physical Android phone',cases:[]};
 for(const c of cases){
  const page=await browser.newPage({viewport:{width:c.w,height:c.h},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!(window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V116_MARINA),{timeout:45000});
  const entry=await page.evaluate(()=>{
    const api=window.HARBOR.seamlessCampusV115;
    const possible=[[5150,3720],[4980,3710],[5340,3720],[4790,3720],[5600,3730]];
    for(const [x,y] of possible){if(!api.test.blocked(x,y) && api.openAt(x,y,1))return {x,y};}
    const samples=[];for(let y=3650;y<=3760;y+=30)for(let x=4480;x<=5700;x+=80)if(!api.test.blocked(x,y))samples.push([x,y]);
    if(samples.length){const [x,y]=samples[0];if(api.openAt(x,y,1))return {x,y,sampled:true};}
    return {error:'no clear promenade entry',samples:samples.slice(0,15)};
  });
  if(entry.error||!Number.isFinite(entry.x))throw Error('Cannot enter connected marina: '+JSON.stringify(entry));
  await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.isOpen()&&window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:30000});
  await page.evaluate(({z})=>{
    if(!window.HARBOR.seamlessCampusV115.qaCamera(5180,3880,z))throw Error('QA camera blocked');
    document.body.classList.add('v116-play-mode');
  },{z:c.z});
  const canvas=page.locator('#v115CampusCanvas');
  const sampledFps=()=>page.evaluate(()=>new Promise(resolve=>{
    let first=null,last=null,count=0;
    function step(t){if(first===null)first=t;last=t;count++;
      if(t-first<1100)requestAnimationFrame(step);
      else resolve(Math.round(1000*(count-1)/(last-first)*10)/10);
    }requestAnimationFrame(step);
  }));
  await page.evaluate(()=>window.ROOKIE_V116_MARINA.setTestEnabled(false));
  await page.waitForTimeout(450);
  const fpsBefore=await sampledFps();
  await canvas.screenshot({path:path.join(output,c.key+'-before.png')});
  const b0=await page.evaluate(()=>window.ROOKIE_V116_MARINA.metrics());
  await page.evaluate(()=>window.ROOKIE_V116_MARINA.setTestEnabled(true));
  await page.waitForTimeout(900);
  const fpsAfter=await sampledFps();
  await canvas.screenshot({path:path.join(output,c.key+'-after.png')});
  await page.screenshot({path:path.join(output,c.key+'-gameplay.png')});
  const runtime=await page.evaluate(()=>{
    const api=window.HARBOR.seamlessCampusV115,m=window.ROOKIE_V116_MARINA;
    return {snapshot:api.snapshot(),position:api.test.position(),metrics:m.metrics(),
    dockWalkable:!api.test.blocked(5145,3940),openWaterBlocked:api.test.blocked(5010,3940),
    pathWalkable:!api.test.blocked(5150,3710),
    uiHidden:getComputedStyle(document.querySelector('#v115CampusNote')).display==='none',
    sourceAssets:!!document.querySelector('#v116MarinaLaunch')};
  });
  if(!runtime.dockWalkable||!runtime.openWaterBlocked||!runtime.pathWalkable)throw Error('Dock/shore collision regression: '+JSON.stringify(runtime));
  if(runtime.uiHidden!==true)throw Error('Mobile debug panel still visible');
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  report.cases.push({entry,fpsBefore,fpsAfter,name:c.key,viewport:[c.w,c.h],zoom:c.z,errors,before:b0,after:runtime});
  console.log('PASS V116 real game canvas',c.key,JSON.stringify({decoded:runtime.metrics.decoded,fpsBefore,fpsAfter,p95PaintMs:runtime.metrics.p95PaintMs,chunkCache:runtime.metrics.chunkCacheCount}));
  await page.close();
 }
 fs.writeFileSync(path.join(output,'metrics.json'),JSON.stringify(report,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
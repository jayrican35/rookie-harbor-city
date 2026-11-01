'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:8765/preview/',old=process.env.V126_BEFORE_URL||base+'v125-mobile/?v116QA=0&pilotQA=1',next=process.env.V126_AFTER_URL||base+'v126-polish/?v116QA=0&pilotQA=1';
const dest=process.env.V126_EVIDENCE||path.resolve('site/preview/v126-polish/evidence');
(async()=>{
 fs.mkdirSync(dest,{recursive:true});const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const out=[];
 for(const [version,url] of [['before',old],['after',next]]){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V116_MARINA&&window.ROOKIE_JAY,{timeout:40000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(5150,3925,1.15)),'Pier center must be walkable');
  await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(5150,3915,1.15));
  await page.waitForFunction(()=>window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:35000});
  await page.waitForTimeout(950);
  await page.screenshot({path:path.join(dest,version+'-pier.png')});
  const state0=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  await page.keyboard.down('Shift');await page.keyboard.down('ArrowUp');await page.waitForTimeout(360);
  await page.screenshot({path:path.join(dest,version+'-running-1.png')});
  const pose1=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
  await page.waitForTimeout(160);
  await page.screenshot({path:path.join(dest,version+'-running-2.png')});
  const pose2=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
  await page.keyboard.up('ArrowUp');await page.keyboard.up('Shift');
  await page.waitForTimeout(160);
  const state1=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  assert(state1.y<state0.y-30,'Real keyboard sprint should traverse wooden dock');
  assert(pose1.mode==='run'&&pose2.mode==='run','Leg animation must show real run gait while moving');
  assert(pose2.phase>pose1.phase,'Sprite frames must advance with traveled distance');
  const materials=await page.evaluate(()=>window.ROOKIE_V120_ART?.metrics?.());
  assert(materials?.dockTiles>0,'Real premium dock renderer loaded');
  if(version==='after'){
   const v=await page.evaluate(async()=>{
    const imgs=['./assets/v126-dock/dock-wood.png','./assets/v126-jay/jay-run-clean.png'];
    return Promise.all(imgs.map(src=>new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok([i.naturalWidth,i.naturalHeight]);i.onerror=()=>bad(new Error('Missing '+src));i.src=src;})));
   });
   assert.deepEqual(v,[[90,320],[1024,512]],'Unique full-length dock and cleaned 4x8 running atlas decoded in browser');
  }
  if(errors.length)throw Error(version+' errors '+errors.join('|'));
  out.push({version,start:state0,finish:state1,phaseFirst:pose1.phase,phaseSecond:pose2.phase,mode:pose2.mode,materials,errors});
  console.log('PASS V126 actual '+version+' connected-city running dock','delta',state0.y-state1.y,'sprite phase',pose1.phase,pose2.phase);
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(dest,'metrics.json'),JSON.stringify({about:'Real Canvas gameplay at same physical world coordinates. Not a concept image or Android FPS test.',runs:out},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

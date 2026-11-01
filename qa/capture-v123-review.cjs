'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.V123_BEFORE_URL||'http://127.0.0.1:8765/preview/v122-pier/?v116QA=1&pilotQA=1';
const after=process.env.V123_AFTER_URL||'http://127.0.0.1:8765/preview/v123-collision/?v116QA=1&pilotQA=1';
const out=process.env.V123_EVIDENCE||path.resolve('site/preview/v123-collision/evidence');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const result={note:'Actual running game at Android-sized Chromium 390x844. Real video bug reproduced; not device FPS.',samples:[]};
 for(const [name,url] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.HARBOR?.seamlessCampusV115&&!!window.ROOKIE_V116_MARINA,{timeout:35000});
  await page.evaluate(()=>{
   const game=window.HARBOR.seamlessCampusV115;
   if(!game.openAt(5200,3740,1.06))throw Error('Safe promenade spawn blocked');
   if(!game.qaCamera(5200,3726,1.06))throw Error('Unable to set the same camera position');
  });
  await page.waitForFunction(()=>window.ROOKIE_V116_WALK?.ready()&&window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:35000});
  await page.waitForTimeout(1100);
  const metrics=await page.evaluate(()=>{
   const game=window.HARBOR.seamlessCampusV115,m=window.ROOKIE_V116_MARINA;
   return {
    source:window.ROOKIE_V116_WALK.ready(),
    bin:game.test.blocked(4510,3768),
    bench:game.test.blocked(4565,3710),
    flower:game.test.blocked(4530,3744),
    pierPost:game.test.blocked(5108,3838),
    centralPier:game.test.blocked(5150,3920),
    harborWater:game.test.blocked(5000,3920),
    fence:game.test.blocked(4620,3624),
    cafeGate:game.test.blocked(4506,3624),
    npcBody:game.test.blocked(m.actors.find(a=>a.id==='v116:visitor').x,m.actors.find(a=>a.id==='v116:visitor').y),
    player:game.snapshot(),marina:m.metrics()
   };
  });
  if(name==='after'){
   for(const k of ['bin','bench','flower','pierPost','fence','npcBody','harborWater'])assert.equal(metrics[k],true,k+' must be solid');
   for(const k of ['centralPier','cafeGate'])assert.equal(metrics[k],false,k+' must stay walkable');
   assert.equal(metrics.marina.postColliders,18);
   assert(metrics.marina.sceneryColliders>50);
  }
  if(errors.length)throw Error('Browser errors '+errors.join(' / '));
  await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,name+'-canvas.png')});
  await page.screenshot({path:path.join(out,name+'-gameplay.png')});
  result.samples.push({name,metrics,errors});
  console.log('PASS V123 actual playable game',name,'physical bin',metrics.bin,'pier post',metrics.pierPost,'npc atlas ready',metrics.source);
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(result,null,2));
 console.log('PASS V123 actual-game collision and clean sprite comparison with original gameplay/camera intact');
})().catch(e=>{console.error(e);process.exit(1)});

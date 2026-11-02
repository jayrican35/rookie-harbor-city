'use strict';
// Exactly matched real game frames at the user's Bayview/Marina approach.
// BEFORE is the last published V128; AFTER is isolated Bayview expansion.
// Both use the same Canvas, HUD, controls, zoom and world coordinates.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.BAYVIEW_BEFORE_URL||'http://127.0.0.1:8765/preview/v128-world-quality/?v116QA=0&pilotQA=1';
const after=process.env.BAYVIEW_AFTER_URL||'http://127.0.0.1:8765/preview/v129-bayview/?v116QA=0&pilotQA=1';
const folder=process.env.BAYVIEW_EVIDENCE||path.resolve('site/preview/v129-bayview/evidence');
const scenes=[
 {name:'recorded-bayview-road-mouth',x:4050,y:3744,zoom:.95},
 {name:'southbay-road-approach',x:4050,y:3550,zoom:.95},
 {name:'bayview-south-terrace',x:3970,y:3868,zoom:.95},
 {name:'bayview-west-promenade',x:3390,y:3870,zoom:.95},
 {name:'bayview-marina-seam',x:4330,y:3815,zoom:.95},
 {name:'original-marina-protected',x:5200,y:3758,zoom:.95}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const [version,url] of [['before',before],['after',after]]){
   const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V127_CITY&&window.ROOKIE_V116_MARINA,
    {timeout:45000});
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(5200,3758,.95)),
    version+': original Marina must open without swapping maps');
   await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&window.ROOKIE_V127_CITY.metrics().atlasReady,
    {timeout:30000});
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(4050,3744)),
    version+': original Bayview road is physically walkable');
   const photos=[];
   for(const scene of scenes){
    assert(await page.evaluate(s=>window.HARBOR.seamlessCampusV115.qaCamera(s.x,s.y,s.zoom),scene));
    await page.waitForTimeout(240);
    await page.screenshot({path:path.join(folder,scene.name+'-'+version+'.png')});
    photos.push(scene.name);
   }
   const validation=await page.evaluate(()=>{
    const c=window.ROOKIE_V127_CITY,api=window.HARBOR.seamlessCampusV115;
    return {roadFree:!api.test.blocked(4050,3744,12),
     bayviewSurface:c.bayviewPromenadeAt?{
      onRoad:c.bayviewPromenadeAt(4050,3744),belowRoad:c.bayviewPromenadeAt(4050,3850),
      insideMarina:c.bayviewPromenadeAt(4400,3850)}:null,
     waterOriginal:!c.waterBlocked(5100,3950),cameraWorld:api.snapshot().worldId,
     art:c.metrics(),cars:api.metrics().streetCars};
   });
   assert(validation.roadFree,'Bayview original horizontal roadway must be walkable');
   assert(validation.waterOriginal,'Do not modify existing Marina water physics');
   assert.equal(validation.cameraWorld,'harbor-main');
   assert.equal(validation.cars,18,'Preserve living city vehicle pilot');
   if(version==='after'){
    assert.deepEqual(validation.bayviewSurface,{onRoad:false,belowRoad:true,insideMarina:false},
      'Bayview road cannot be repainted and Marina cannot be overwritten');
   }
   assert.equal(errors.length,0,'Browser JS errors: '+JSON.stringify(errors));
   results.push({version,validation,photos,errors});
   await page.close();
  }
  fs.writeFileSync(path.join(folder,'bayview-comparison.json'),JSON.stringify({scenes,results},null,2));
  console.log('PASS Six real mobile-frame comparisons, original street clear, restored road paving, west-expanded premium coastal art, protected Marina');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

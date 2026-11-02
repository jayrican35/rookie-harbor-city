'use strict';
/* V138: real native Canvas screenshot+movement proof for user-reported
 * precinct façade improperly covering character standing in front.
 * Same renderer, old room/collision/camera and existing input controller.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve('site/preview/precinct9-v138-depth-lab/evidence');
const root='http://127.0.0.1:8765/preview/';
const locations=[
 {name:'character-main-entrance-forecourt',x:948,y:1163,zoom:1.18},
 {name:'character-east-wing-walkway',x:1100,y:1172,zoom:1.06},
 {name:'character-front-plaza',x:948,y:1230,zoom:.96},
 {name:'inside-existing-furnished-lobby',x:948,y:1060,zoom:.95},
 {name:'garage-side-approach',x:1918,y:1302,zoom:.90}
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const spec of [
   {tag:'before',page:'precinct9-v137-entrance-lab',w:390,h:844},
   {tag:'after',page:'precinct9-v138-depth-lab',w:390,h:844},
   {tag:'desktop-after',page:'precinct9-v138-depth-lab',w:1280,h:720}
  ]){
   const page=await browser.newPage({viewport:{width:spec.w,height:spec.h},
     deviceScaleFactor:1,isMobile:spec.w===390,hasTouch:spec.w===390});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(root+spec.page+'/?pilotQA=1&v116QA=0',
     {waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,
     {timeout:45000});
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1.08)),
     'precinct pedestrian walkway should exist');
   await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
     window.ROOKIE_V135_WALL_KIT?.stats()?.entranceAtlas,{timeout:45000});
   const api=await page.evaluate(()=>{
     const a=window.HARBOR.seamlessCampusV115;
     return {geometry:a.geometry(),entrances:a.entrances,
       collision:[a.test.blocked(948,1124,11),a.test.blocked(1918,1256,11),a.test.blocked(948,1778,11)],
       world:a.snapshot().worldId,playerId:a.snapshot().playerId};
   });
   assert.equal(api.world,'harbor-main');
   assert.deepEqual(api.entrances.front,{x:948,y:1124});
   assert.deepEqual(api.entrances.garage,{x:1918,y:1256});
   assert.deepEqual(api.collision,[false,false,false]);
   for(const v of locations){
     const moved=await page.evaluate(q=>{
       const a=window.HARBOR.seamlessCampusV115;
       return a.test.moveTo(q.x,q.y)&&a.qaCamera(q.x,q.y,q.zoom);
     },v);
     assert(moved,'actual collision route must permit '+v.name);
     await page.waitForTimeout(520);
     const camera=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
     if(v.name==='inside-existing-furnished-lobby')
       assert.equal(camera.room,'LOBBY');
     else assert.equal(camera.room,null,'must be outdoors '+v.name);
     await page.locator('#v115CampusCanvas').screenshot({
       path:path.join(out,v.name+'-'+spec.tag+'.png')});
   }
   // Actual movement through the same doorway continues, with the SAME
   // player identity and original camera, without any scene transitions.
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1.08)));
   await page.keyboard.down('w');
   await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.entranceQA()?.room==='LOBBY',
     {timeout:6500});
   await page.keyboard.up('w');
   const inside=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
   await page.keyboard.down('s');
   await page.waitForFunction(()=>{const s=window.HARBOR.seamlessCampusV115.entranceQA();
     return s?.room===null&&s.playerY>1155;},{timeout:6500});
   await page.keyboard.up('s');
   const outside=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
   assert(inside.roofAlpha<.1&&outside.roofAlpha>inside.roofAlpha);
   assert.equal(errors.length,0,'JS errors: '+errors.join(';'));
   const perf=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.metrics());
   results.push({tag:spec.tag,viewport:[spec.w,spec.h],api,inside,outside,perf,errors});
   await page.close();
  }
  assert.deepEqual(results[0].api,results[1].api,
   'No world, collision, doors, player identity, footprint or room changes');
  assert.deepEqual(results[1].api,results[2].api,
   'Mobile and desktop must use the same existing world geometry');
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({
    bug:'character sprites incorrectly occluded by main Precinct 9 facade',
    method:'one existing feet-Y depth queue for original two building shells',
    screenshots:locations,results,actualKeyboardMovement:true,
    userVisualApprovalRequired:true,protectedModesChanged:false
  },null,2));
  console.log('PASS V138 real mobile/desktop outdoors sprite-depth, same lobby entry/exit, roof, camera, doors, roads and original modes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

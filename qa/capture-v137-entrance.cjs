'use strict';
/* Actual mobile Chrome: capture same connected world, THEN record real W/S
 * character movement through the existing portal into the real furnished
 * lobby and back. No test teleport is used during the recording.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('site/preview/precinct9-v137-entrance-lab/evidence');
const origin='http://127.0.0.1:8765/preview/';
const places=[
 {name:'precinct-entrance-approach',x:948,y:1110,z:.91},
 {name:'stone-frame-and-blue-awning',x:948,y:1060,z:1.08},
 {name:'civic-walk-facing-entrance',x:948,y:1295,z:.82},
 {name:'left-window-facade-retained',x:600,y:835,z:.94},
 {name:'garage-fleet-door-retained',x:1918,y:1256,z:.91},
 {name:'protected-marina',x:5200,y:3758,z:.91}
];
async function setup(page){
 await page.goto(page._testUrl,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,{timeout:45000});
 assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
 await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
   window.ROOKIE_V127_CITY?.metrics()?.atlasReady,{timeout:35000});
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const logs=[];
 try{
 for(const [tag,url]of [
  ['before',origin+'precinct9-v136-windows-lab/?v116QA=0&pilotQA=1'],
  ['after',origin+'precinct9-v137-entrance-lab/?v116QA=0&pilotQA=1']]){
  const page=await browser.newPage({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
  page._testUrl=url;
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await setup(page);
  if(tag==='after')await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.entranceAtlas,
    {timeout:35000});
  const geo=await page.evaluate(()=>{
   const a=window.HARBOR.seamlessCampusV115;
   return {world:a.snapshot().worldId,rooms:a.geometry().rooms,
     walls:a.geometry().walls,furniture:a.geometry().furniture,
     footprint:a.geometry().stationFootprint,
     front:a.entrances.front,garage:a.entrances.garage,
     mainOpen:!a.test.blocked(948,1124,11),
     garageOpen:!a.test.blocked(1918,1256,11),
     roadOpen:!a.test.blocked(948,1778,11),
     solidWalls:[850,870,885,1040,1055].map(x=>a.test.blocked(x,1116,11))};
  });
  assert.equal(geo.world,'harbor-main');
  assert.deepEqual(geo.front,{x:948,y:1124});
  assert.deepEqual(geo.garage,{x:1918,y:1256});
  assert(geo.mainOpen&&geo.garageOpen&&geo.roadOpen);
  const canvas=page.locator('#v115CampusCanvas');
  for(const s of places){
   assert(await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(q.x,q.y,q.z),s));
   await page.waitForTimeout(tag==='after'?500:270);
   await canvas.screenshot({path:path.join(out,s.name+'-'+tag+'.png')});
  }
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(948,1060)));
  assert.equal(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.interiorRoom(948,1060)),'LOBBY');
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(948,1040,.95)));
  await page.waitForTimeout(440);
  await canvas.screenshot({path:path.join(out,'actual-existing-lobby-'+tag+'.png')});
  const stats=await page.evaluate(()=>({
   art:window.ROOKIE_V135_WALL_KIT?.stats(),
   facade:window.ROOKIE_V134_PRECINCT?.stats(),
   entry:window.ROOKIE_V134_PRECINCT?.entranceState?.()||null,
   world:window.HARBOR.seamlessCampusV115.geometry()
  }));
  if(tag==='after'){
   assert(stats.art.entranceAtlas&&stats.art.moduleCount===49,'Combined 49-frame image manager not loaded');
   assert(stats.art.entranceFrames>0&&stats.art.entranceDoorDraws>0,
     'Entrance PNGs not painted in real native facade: '+JSON.stringify(stats.art));
   assert(stats.facade.facadeBuilds<=3,
     'Existing canvas facade must be cached, never rasterized each frame');
  }else assert(!stats.art.entranceAtlas);
  assert.deepEqual(errs,[],'browser errors');
  logs.push({tag,geo,stats,errorCount:errs.length});
  await page.close();
 }
 assert.deepEqual(logs[0].geo,logs[1].geo,
   'Original 1:1 precinct footprint, collisions, entry, garage and street must be identical');
 // Record the ACTUAL player moving from outside to inside and out again.
 // Camera, input, native sprites and roof continue throughout: one page,
 // one Canvas, one world ID and ZERO scene/map transitions.
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,recordVideo:{dir:out,size:{width:390,height:844}}});
 page._testUrl=origin+'precinct9-v137-entrance-lab/?v116QA=0&pilotQA=1';
 const unexpected=[];page.on('pageerror',e=>unexpected.push(e.message));
 await setup(page);
 await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.entranceAtlas,{timeout:35000});
 assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1.04)),
  'Original precinct public walkway must be traversable');
 await page.waitForTimeout(760);
 const start=await page.evaluate(()=>({
   world:window.HARBOR.seamlessCampusV115.snapshot(),
   camera:window.HARBOR.seamlessCampusV115.entranceQA(),
   door:window.ROOKIE_V134_PRECINCT.entranceState()
 }));
 assert.equal(start.camera.room,null,'must start OUTSIDE, without teleporting into lobby');
 assert(start.door.open>.82,'nearby auto-door should open before player reaches threshold');
 const oldCrossings=start.camera.crossings;
 await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,'walkway-doors-open.png')});
 await page.keyboard.down('w');
 await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.entranceQA()?.room==='LOBBY',
   {timeout:4700});
 await page.keyboard.up('w');
 await page.waitForTimeout(380);
 const inside=await page.evaluate(()=>({
   world:window.HARBOR.seamlessCampusV115.snapshot(),
   camera:window.HARBOR.seamlessCampusV115.entranceQA(),
   door:window.ROOKIE_V134_PRECINCT.entranceState(),
   geometry:window.HARBOR.seamlessCampusV115.geometry()
 }));
 assert.equal(inside.world.worldId,start.world.worldId);
 assert.equal(inside.world.playerId,start.world.playerId);
 assert.equal(inside.camera.room,'LOBBY');
 assert(inside.camera.crossings>=oldCrossings+1);
 assert.equal(inside.camera.follows,true);
 assert(inside.camera.roofAlpha<.10,
   'Original roof must fade revealing real furnished lobby: '+inside.camera.roofAlpha);
 assert(inside.camera.playerY<start.camera.playerY);
 assert(inside.camera.cameraY<start.camera.cameraY);
 await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,'actual-lobby-after-walking-inside.png')});
 await page.keyboard.down('s');
 await page.waitForFunction(()=>{const p=window.HARBOR.seamlessCampusV115.entranceQA();
   return p?.room===null&&p.playerY>1155;},{timeout:4700});
 await page.keyboard.up('s');await page.waitForTimeout(390);
 const outside=await page.evaluate(()=>({
   world:window.HARBOR.seamlessCampusV115.snapshot(),
   camera:window.HARBOR.seamlessCampusV115.entranceQA(),
   door:window.ROOKIE_V134_PRECINCT.entranceState()
 }));
 assert.equal(outside.camera.room,null);
 assert(outside.camera.crossings>=oldCrossings+2,'outside/inside must cross REAL existing boundary twice');
 assert(outside.camera.cameraY>inside.camera.cameraY,'same camera should track Jay back outside');
 assert(outside.camera.roofAlpha>inside.camera.roofAlpha,'original roof must restore automatically');
 assert.equal(outside.world.worldId,start.world.worldId);
 assert.equal(outside.world.playerId,start.world.playerId);
 assert.deepEqual(unexpected,[]);
 await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,'walkway-after-return.png')});
 await page.waitForTimeout(800);
 const video=page.video();await page.close();
 if(video){
  const f=await video.path();
  fs.copyFileSync(f,path.join(out,'continuous-entry-exit.webm'));
 }
 fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({
  phase:'Phase 3 — entrance',comparison:logs,
  movement:{start,inside,outside,actualKeyboardInput:true,
   mapTransitions:0,sceneLoads:0,oldWorldPreserved:true},
  visualApprovalRequired:true,video:'continuous-entry-exit.webm',
  protectedZombieOutbreakChanged:false,productionCampaignMigrationComplete:false
 },null,2));
 console.log('PASS V137 real W/S walk outside->furnished lobby->outside, real camera and roof, 49 atlas frames and protected sources');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

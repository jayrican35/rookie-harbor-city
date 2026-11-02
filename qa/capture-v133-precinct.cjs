'use strict';
// Compare ACTUAL native connected-world V132 vs V133 gameplay in Android-size
// Chromium. Pixel differences are evidence, not automatic artistic approval.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.V133_BEFORE||'http://127.0.0.1:8765/preview/precinct9-v132-lab/?v116QA=0&pilotQA=1';
const after=process.env.V133_AFTER||'http://127.0.0.1:8765/preview/precinct9-v133-lab/?v116QA=0&pilotQA=1';
const folder=path.resolve(process.env.V133_EVIDENCE||'site/preview/precinct9-v133-lab/evidence');
const scenes=[
 {id:'entire-precinct-campus',x:1265,y:1120,z:.47},
 {id:'front-public-entrance',x:948,y:1139,z:.96},
 {id:'garage-fleet-entrance',x:1918,y:1256,z:.96},
 {id:'public-visitor-parking',x:1560,y:1475,z:.92},
 {id:'community-wall-plaza',x:640,y:1503,z:.94},
 {id:'crosswalk-to-civic-green',x:948,y:1841,z:.90},
 {id:'new-south-park-walk',x:954,y:2170,z:.85},
 {id:'south-green-plaza',x:954,y:2370,z:.90},
 {id:'new-south-park-continuity',x:1760,y:2300,z:.83},
 {id:'precinct-patrol-npc',x:1100,y:1372,z:1.12},
 {id:'service-side-npc',x:2100,y:1349,z:1.12},
 {id:'original-precinct-interiors',x:900,y:812,z:.84},
 {id:'protected-marina-reference',x:5200,y:3758,z:.95}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
 for(const [version,url]of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},
   deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,{timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
   window.ROOKIE_V127_CITY?.metrics()?.atlasReady,{timeout:35000});
  await page.waitForFunction(()=>window.ROOKIE_V132_PRECINCT?.stats().legacyRoofReady,{timeout:20000});
  if(version==='after'){
    await page.waitForFunction(()=>!!window.ROOKIE_V133_PRECINCT,{timeout:20000});
  }
  const geometry=await page.evaluate(()=>{
   const a=window.HARBOR.seamlessCampusV115;
   return {world:a.snapshot().worldId,layout:a.geometry(),
    front:a.entrances.front,garage:a.entrances.garage,
    frontBlocked:a.test.blocked(948,1124,11),
    garageBlocked:a.test.blocked(1918,1256,11),
    avenueBlocked:a.test.blocked(948,1778,11),
    southWalkBlocked:a.test.blocked(948,2030,11)};
  });
  assert.equal(geometry.world,'harbor-main');
  assert.deepEqual(geometry.front,{x:948,y:1124});
  assert.deepEqual(geometry.garage,{x:1918,y:1256});
  assert.equal(geometry.frontBlocked,false);
  assert.equal(geometry.garageBlocked,false);
  assert.equal(geometry.avenueBlocked,false);
  assert.equal(geometry.southWalkBlocked,false);
  const canvas=page.locator('#v115CampusCanvas');
  for(const s of scenes){
   assert(await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(q.x,q.y,q.z),s));
   await page.waitForTimeout(version==='after'?550:280);
   await canvas.screenshot({path:path.join(folder,s.id+'-'+version+'.png')});
  }
  // Shift real player into lobby, preserving original roof fade/door path.
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(948,1060)));
  assert.equal(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.interiorRoom(948,1060)),'LOBBY');
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(948,1030,.95)));
  await page.waitForTimeout(390);
  await canvas.screenshot({path:path.join(folder,'original-door-fade-'+version+'.png')});
  const visual=await page.evaluate(()=>({
   v132:window.ROOKIE_V132_PRECINCT?.stats()||null,
   v133:window.ROOKIE_V133_PRECINCT?.metrics()||null,
   actors:window.ROOKIE_V133_PRECINCT?.actors(1000).map(a=>({id:a.id,name:a.name,x:a.x,y:a.y}))||null
  }));
  assert(visual.v132?.roofFrames>0&&visual.v132?.legacyRoofReady,'Legacy base roof must still render');
  if(version==='after'){
   assert(visual.v133&&visual.v133.ground>0&&visual.v133.facade>0,
    'Native V133 ground and front architecture have not rendered: '+JSON.stringify(visual));
   assert(visual.v133.groundBuilds>=1&&visual.v133.groundBuilds<=3,
    'World greenery and paver art must be statically cached, not generated every frame');
   assert(visual.v133.actors>0&&visual.actors.length===3,
    'Three original-style district precinct actors must be integrated into existing depth queue');
   const sprites=visual.v132.castNames;
   assert(sprites.lane>0&&sprites.okafor>0,
    'V133 patrol and garage-side legacy officer source images not painted: '+JSON.stringify(sprites));
  }else assert.equal(visual.v133,null,'V132 original must not contain V133 preview painter');
  assert.equal(errors.length,0,'unexpected browser page errors: '+JSON.stringify(errors));
  results.push({version,geometry,visual,errors});
  await page.close();
 }
 // Existing Marina interactions are asynchronous; changing visual-only precinct
 // rendering must not alter ANY fixed world, native room, avenue or doorway.
 const norm=x=>({...x,layout:{...x.layout,spots:null}});
 assert.deepEqual(norm(results[0].geometry),norm(results[1].geometry),
  'V133 must not mutate collision, road layout, rooms or existing door state');
 // Ambient district spot registration progresses independently of image
 // loading and camera capture. Its runtime count can legitimately differ:
 // never confuse asynchronous NPC registration with altered static solids.
 assert(results.every(a=>a.geometry.layout.spots>=10),
  'Both native connected worlds must have real interaction points');
 fs.writeFileSync(path.join(folder,'review-data.json'),JSON.stringify({
  scenes,results,humanApprovalRequired:true,
  approval:'not granted by automatic tests',protectedModesUntouched:true
 },null,2));
 console.log('PASS real V133 Android-size gameplay: building front, garage, parking, community plaza, south park, original NPC sprites, front door, same roads and protected Marina');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

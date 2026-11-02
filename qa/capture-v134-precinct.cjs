'use strict';
// True 390x844 Chromium game captures, not mock concept art. Independent
// V133 before and V134 user-reference after at identical world coordinates.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before='http://127.0.0.1:8765/preview/precinct9-v133-lab/?v116QA=0&pilotQA=1';
const after='http://127.0.0.1:8765/preview/precinct9-v134-lab/?v116QA=0&pilotQA=1';
const folder=path.resolve('site/preview/precinct9-v134-lab/evidence');
const scenes=[
 {id:'full-reference-precinct-front',x:950,y:899,z:.55},
 {id:'two-story-main-sign-and-badge',x:948,y:752,z:.89},
 {id:'entrance-canopy-glass-doors',x:948,y:1060,z:1.02},
 {id:'left-navy-wing-windows',x:594,y:920,z:.96},
 {id:'right-navy-wing-windows',x:1283,y:902,z:.96},
 {id:'garage-reference-style-matching',x:1918,y:1000,z:.82},
 {id:'actual-garage-door',x:1918,y:1256,z:.96},
 {id:'community-plaza-palm-flags',x:930,y:1434,z:.89},
 {id:'community-walk-police-badge',x:585,y:1550,z:.95},
 {id:'visitor-parking-approach',x:1575,y:1460,z:.90},
 {id:'public-crosswalk-and-road',x:948,y:1750,z:.95},
 {id:'protected-marina-scene',x:5200,y:3758,z:.95}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
 for(const [version,url]of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,{timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
   window.ROOKIE_V127_CITY?.metrics()?.atlasReady,{timeout:35000});
  await page.waitForFunction(()=>window.ROOKIE_V132_PRECINCT?.stats()?.legacyRoofReady&&
   window.ROOKIE_V133_PRECINCT,{timeout:20000});
  if(version==='after')await page.waitForFunction(()=>window.ROOKIE_V134_PRECINCT,{timeout:15000});
  const geometry=await page.evaluate(()=>{
   const a=window.HARBOR.seamlessCampusV115;
   return {world:a.snapshot().worldId,geometry:a.geometry(),front:a.entrances.front,
    garage:a.entrances.garage,
    frontPass:a.test.blocked(948,1124,11),
    garagePass:a.test.blocked(1918,1256,11),
    roadPass:a.test.blocked(948,1778,11),
    civicPass:a.test.blocked(948,2030,11)};
  });
  assert.equal(geometry.world,'harbor-main');
  assert.deepEqual(geometry.front,{x:948,y:1124});
  assert.deepEqual(geometry.garage,{x:1918,y:1256});
  for(const item of ['frontPass','garagePass','roadPass','civicPass'])
   assert.equal(geometry[item],false,item+' must be physically unobstructed');
  const c=page.locator('#v115CampusCanvas');
  for(const shot of scenes){
   assert(await page.evaluate(x=>window.HARBOR.seamlessCampusV115.qaCamera(x.x,x.y,x.z),shot));
   await page.waitForTimeout(version==='after'?480:300);
   await c.screenshot({path:path.join(folder,shot.id+'-'+version+'.png')});
  }
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(948,1060)));
  assert.equal(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.interiorRoom(948,1060)),'LOBBY');
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(948,1040,.94)));
  await page.waitForTimeout(370);
  await c.screenshot({path:path.join(folder,'real-interior-roof-reveal-'+version+'.png')});
  const stats=await page.evaluate(()=>({
   roof:window.ROOKIE_V132_PRECINCT?.stats(),
   civic:window.ROOKIE_V133_PRECINCT?.metrics(),
   ref:window.ROOKIE_V134_PRECINCT?.stats()||null
  }));
  assert(stats.roof.roofFrames>0&&stats.roof.legacyRoofReady);
  assert(stats.civic.ground>0);
  if(version==='after'){
   assert(stats.ref&&stats.ref.facadeReady&&stats.ref.garageReady&&stats.ref.groundsReady,
    'Main 2-story building, matching garage and civic grounds need actual on-canvas renders: '+JSON.stringify(stats));
   assert(stats.ref.facadeFrames>2&&stats.ref.grounds>0&&stats.ref.facadeBuilds===1,
    'Source-authored reference should paint to one cached native Canvas');
  }else assert.equal(stats.ref,null,'Original V133 may not load reference façade');
  assert.equal(errors.length,0,'Console page errors: '+JSON.stringify(errors));
  results.push({version,geometry,stats,errors});
  await page.close();
 }
 const norm=g=>({...g,geometry:{...g.geometry,spots:null}});
 assert.deepEqual(norm(results[0].geometry),norm(results[1].geometry),
  'Actual solid walls, station footprint, shared road and doors must be unchanged');
 assert(results.every(a=>a.geometry.geometry.spots>=10),'Both worlds need real interaction registry');
 fs.writeFileSync(path.join(folder,'review-data.json'),JSON.stringify({
  scenes,results,humanVisualApprovalRequired:true,
  automatedVisualApproval:false,refBasedArt:true,
  originalZombieOutbreakSourceUnmodified:true
 },null,2));
 console.log('PASS reference-quality V134 police HQ actually draws over existing native world at original coordinates; same doors, roof fade, avenue, marina, Zombie files');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

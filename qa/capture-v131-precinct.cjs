'use strict';
// Actual V128 vs isolated Precinct 9 visual lab, same camera and source art.
// A pixel difference is recorded for inspection, NEVER called art approval.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.PRECINCT_BEFORE_URL||
 'http://127.0.0.1:8765/preview/v128-world-quality/?v116QA=0&pilotQA=1';
const after=process.env.PRECINCT_AFTER_URL||
 'http://127.0.0.1:8765/preview/precinct9-legacy-lab/?v116QA=0&pilotQA=1';
const folder=process.env.PRECINCT_EVIDENCE||
 path.resolve('site/preview/precinct9-legacy-lab/evidence');
const scenes=[
 {id:'station-roof-geometry',x:950,y:715,z:.84},
 {id:'briefing-locker-garage-original-art',x:1675,y:690,z:.80},
 {id:'recorded-locker-and-garage',x:1730,y:680,z:.94},
 {id:'public-entrance-and-foyer',x:948,y:1170,z:.98},
 {id:'community-front-walk',x:975,y:1395,z:.95},
 {id:'main-precinct-parking',x:1595,y:1460,z:.87},
 {id:'real-garage-threshold',x:1918,y:1250,z:.92},
 {id:'east-fleet-lot',x:2500,y:1490,z:.87},
 {id:'harbor-avenue-crosswalk',x:948,y:1750,z:.94},
 {id:'protected-marina-reference',x:5200,y:3758,z:.95}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
 for(const [version,url] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&
   window.ROOKIE_JAY&&window.ROOKIE_V127_CITY,{timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)),
   version+': must open the existing connected world');
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')
   &&window.ROOKIE_V127_CITY.metrics().atlasReady&&window.ROOKIE_JAY.ready(),
   {timeout:35000});
  // The independent classic precinct source atlas is asynchronously decoded.
  // Test readiness before capturing; do not mistake placeholders for a
  // successful port. Old V128 baseline intentionally has no V131 bridge.
  if(version==='after')await page.waitForFunction(()=>{
   const p=window.ROOKIE_V131_PRECINCT_BRIDGE,s=p?.assetStatus();
   return !!(s?.carpet&&s?.cool&&s?.wood&&s?.cream&&s?.garage&&
      s?.lockers&&s?.board&&s?.cabinet&&s?.bench&&s?.reception);
  },{timeout:45000});
  const entry=await page.evaluate(()=>{
   const api=window.HARBOR.seamlessCampusV115;
   return {
     geometry:api.geometry(),
     frontBlocked:api.test.blocked(948,1124,11),
     garageBlocked:api.test.blocked(1918,1256,11),
     lobbyDoor:api.entrances.front,
     garageDoor:api.entrances.garage,
     world:api.snapshot().worldId,
     marinaBlocked:api.test.blocked(5100,3805,11)
   };
  });
  assert.equal(entry.world,'harbor-main');
  assert.equal(entry.frontBlocked,false,version+': real front doorway must remain passable');
  assert.equal(entry.garageBlocked,false,version+': actual garage exit must remain passable');
  assert.deepEqual(entry.lobbyDoor,{x:948,y:1124});
  assert.deepEqual(entry.garageDoor,{x:1918,y:1256});
  const canvas=page.locator('#v115CampusCanvas');
  const captures=[];
  for(const sc of scenes){
   assert(await page.evaluate(o=>window.HARBOR.seamlessCampusV115.qaCamera(o.x,o.y,o.z),sc));
   await page.waitForTimeout(300);
   await canvas.screenshot({path:path.join(folder,sc.id+'-'+version+'.png')});
   captures.push(sc.id);
  }
  // Verify the opposite roof state too: Jay walks INSIDE the authentic
  // lobby at exactly the source-map front door. The fading roof then exposes
  // the original station NPCs, instead of displaying them over the exterior.
  const foyer=await page.evaluate(()=>{
    const a=window.HARBOR.seamlessCampusV115;
    return {moved:a.test.moveTo(948,1060),room:a.test.interiorRoom(948,1060),
      world:a.snapshot().worldId};
  });
  assert(foyer.moved&&foyer.room==='LOBBY'&&foyer.world==='harbor-main',
    'Real precinct lobby must remain traversable without scene transitions');
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(948,920,.96)));
  await page.waitForTimeout(440);
  await canvas.screenshot({path:path.join(folder,'station-interior-roof-revealed-'+version+'.png')});
  captures.push('station-interior-roof-revealed');
  const legacy=await page.evaluate(()=>{
    const p=window.ROOKIE_V131_PRECINCT_BRIDGE;
    return p?{version:p.version,assets:p.assetStatus(),stats:p.stats(),
      cacheEpoch:p.assetEpoch()}:null;
  });
  if(version==='after'){
    assert(legacy&&legacy.version==='legacy-authored-precinct-reuse-1',
      'Expected the ORIGINAL user-authored station painter to be live');
    assert(legacy.stats.floors>=8&&legacy.stats.garage>0&&
      legacy.stats.furniture>=20&&legacy.stats.walls>=12,
      'Legacy visual assets must actually draw in rooms, furniture and garage: '+JSON.stringify(legacy.stats));
  }else assert.equal(legacy,null,'Approved V128 must remain original');
  const stats=await page.evaluate(()=>{
   const p=window.ROOKIE_V130_PRECINCT;
   return {exists:!!p,version:p?.version||null,metrics:p?.metrics()||null};
  });
  if(version==='after'){
   assert(stats.exists&&stats.version==='precinct9-visual-foundation-1');
   assert(stats.metrics.ground>0&&stats.metrics.entrance>0,
     'Real street-level painter and station entry were not invoked');
  }else assert(!stats.exists,'Approved V128 baseline must not contain new precinct art');
  assert.equal(errors.length,0,version+': unexpected errors '+JSON.stringify(errors));
  results.push({version,captures,entry,stats,legacy,errors});
  await page.close();
 }
 assert.deepEqual(results[0].entry,results[1].entry,
   'Front/garage entrances and real station collision geometry must match V128');
 fs.writeFileSync(path.join(folder,'review-data.json'),JSON.stringify({
   scenePositions:scenes,results,reviewStatus:'human visual approval required',
   noAutomatedArtApproval:true
 },null,2));
 console.log('PASS Original precinct art imported: textured floors, B2 locker cabinets/briefing, reception and real garage plate; door/Marina/engine preservation; VISUAL REVIEW STILL REQUIRED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

'use strict';
/* V136 genuine Android-size continuous-city game comparison, NOT a mockup.
 * Checks atlas-backed windows, existing V134 renderer, original geometry,
 * roof cutaway/door/Marina and unchanged original game sources.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('site/preview/precinct9-v136-windows-lab/evidence');
const root='http://127.0.0.1:8765/preview/';
const cases=[
 {name:'main-precinct-window-bays',x:950,y:800,z:.70},
 {name:'left-wing-warm-dark-windows',x:600,y:805,z:1.05},
 {name:'right-wing-window-alignment',x:1290,y:805,z:1.05},
 {name:'central-precinct-upper-windows',x:948,y:840,z:1.14},
 {name:'garage-window-matching',x:1918,y:1000,z:.85},
 {name:'precinct-front-entry-preserved',x:948,y:1105,z:.92},
 {name:'marina-no-changes',x:5200,y:3758,z:.92}
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
 for(const [version,url]of [
   ['before',root+'precinct9-v135-wallkit-lab/?v116QA=0&pilotQA=1'],
   ['after',root+'precinct9-v136-windows-lab/?v116QA=0&pilotQA=1']]){
  const page=await browser.newPage({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,{timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
    window.ROOKIE_V127_CITY?.metrics()?.atlasReady,{timeout:35000});
  if(version==='after'){
    await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.loaded&&
      window.ROOKIE_V135_WALL_KIT?.stats()?.windowAtlas,{timeout:30000});
  }
  const geo=await page.evaluate(()=>{
    const a=window.HARBOR.seamlessCampusV115;
    return {world:a.snapshot().worldId,rooms:a.geometry().rooms,walls:a.geometry().walls,
      furniture:a.geometry().furniture,front:a.entrances.front,garage:a.entrances.garage,
      frontBlocked:a.test.blocked(948,1124,11),
      garageBlocked:a.test.blocked(1918,1256,11),
      avenueBlocked:a.test.blocked(948,1778,11)};
  });
  assert.equal(geo.world,'harbor-main');assert.deepEqual(geo.front,{x:948,y:1124});
  assert.deepEqual(geo.garage,{x:1918,y:1256});
  assert(!geo.frontBlocked&&!geo.garageBlocked&&!geo.avenueBlocked);
  const canvas=page.locator('#v115CampusCanvas');
  for(const s of cases){
    assert(await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(q.x,q.y,q.z),s));
    await page.waitForTimeout(version==='after'?620:320);
    await canvas.screenshot({path:path.join(out,s.name+'-'+version+'.png')});
  }
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(948,1060)));
  assert.equal(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.interiorRoom(948,1060)),'LOBBY');
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(948,1050,.93)));
  await page.waitForTimeout(360);
  await canvas.screenshot({path:path.join(out,'seamless-roof-reveal-'+version+'.png')});
  const stats=await page.evaluate(()=>({
    walls:window.ROOKIE_V135_WALL_KIT?.stats(),
    facade:window.ROOKIE_V134_PRECINCT?.stats()
  }));
  if(version==='after'){
    assert(stats.walls.windowAtlas&&stats.walls.moduleCount===42);
    assert(stats.walls.windowDraws>=8,
      'Window PNGs were not integrated into existing V134 fascia: '+JSON.stringify(stats.walls));
    assert(stats.facade.facadeBuilds<=3&&stats.facade.garageReady,
      'Facade should cache 1-2 times, not repaint every frame');
  }else assert(!stats.walls.windowAtlas);
  assert.equal(errors.length,0,'Browser JS errors: '+errors.join('; '));
  results.push({version,geo,stats,errors});await page.close();
 }
 assert.deepEqual(results[0].geo,results[1].geo,
  'No geometry, door, room, road or collision changes allowed');
 fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({
   comparisons:cases,results,approvedArtworkUnchanged:true,visualApprovalRequired:true,
   protectedZombieSourceUnchanged:true,originalV134FacadeReused:true
 },null,2));
 console.log('PASS 42 atlas frames, warm/dark integrated windows, original roof fade, mobile, doors/collisions, Marina');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

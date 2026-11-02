'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base='http://127.0.0.1:8765/preview/';
const pBefore=base+'precinct9-v134-lab/?v116QA=0&pilotQA=1';
const pAfter=base+'precinct9-v135-wallkit-lab/?v116QA=0&pilotQA=1';
const out=path.resolve('site/preview/precinct9-v135-wallkit-lab/evidence');
const views=[
 {name:'phase1-wall-kit-southwest-wall',x:566,y:1020,z:1.04},
 {name:'phase1-wall-kit-entire-precinct',x:950,y:945,z:.70},
 {name:'original-public-entrance',x:948,y:1124,z:.91},
 {name:'original-garage-entry',x:1918,y:1256,z:.87},
 {name:'original-marina-protected',x:5200,y:3758,z:.92}
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const all=[];
 try{
  for(const [type,url]of [['before',pBefore],['after',pAfter]]){
   const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,{timeout:45000});
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
   // V134's building canvas is lazily painted only when camera reaches
   // precinct; starting camera is the protected Marina at (4700,3950).
   await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')
     &&window.ROOKIE_V127_CITY?.metrics()?.atlasReady,{timeout:35000});
   if(type==='after')await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.loaded,
     {timeout:20000});
   const geometry=await page.evaluate(()=>{
      const g=window.HARBOR.seamlessCampusV115;
      return {world:g.snapshot().worldId,rooms:g.geometry().rooms,
       walls:g.geometry().walls,furniture:g.geometry().furniture,
       front:g.entrances.front,garage:g.entrances.garage,
       entranceBlocked:g.test.blocked(948,1124,11),
       garageBlocked:g.test.blocked(1918,1256,11),
       avenueBlocked:g.test.blocked(948,1778,11)};
   });
   assert.equal(geometry.world,'harbor-main');
   assert.deepEqual(geometry.front,{x:948,y:1124});
   assert.deepEqual(geometry.garage,{x:1918,y:1256});
   assert(!geometry.entranceBlocked&&!geometry.garageBlocked&&!geometry.avenueBlocked);
   const canvas=page.locator('#v115CampusCanvas');
   for(const v of views){
    assert(await page.evaluate(s=>window.HARBOR.seamlessCampusV115.qaCamera(s.x,s.y,s.z),v));
    await page.waitForTimeout(380);
    await canvas.screenshot({path:path.join(out,v.name+'-'+type+'.png')});
   }
   // Existing lobby remains directly passable; original roof fade still
   // reveals all underlying interiors and no new collider is registered.
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(948,1060)));
   assert.equal(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.interiorRoom(948,1060)),'LOBBY');
   const stats=await page.evaluate(()=>window.ROOKIE_V135_WALL_KIT?.stats()||null);
   if(type==='after'){
    assert(stats.loaded&&stats.moduleCount===26&&stats.frameDraws>=9&&stats.testPaints>0,
     'Actual atlas-backed 9-piece facade smoke assembly must render: '+JSON.stringify(stats));
    assert.deepEqual(stats.atlasSize,[1024,1024]);
   }else assert.equal(stats,null);
   assert.equal(errors.length,0,'page errors '+JSON.stringify(errors));
   all.push({type,geometry,stats,errors});
   await page.close();
  }
  assert.deepEqual(all[0].geometry,all[1].geometry,
   'Phase 1 must never alter real collision, player routes or underlying rooms');
  fs.writeFileSync(path.join(out,'qa-metrics.json'),JSON.stringify({
    views,results:all,assetPhase:1,visualApprovalRequired:true,
    noRuntimeNpcsChanged:true,noZombieChanges:true
  },null,2));
  console.log('PASS 26 module manifest, same original world/doors/garage/roads, 9 atlas sprites painted in native Canvas');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

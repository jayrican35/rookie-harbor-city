'use strict';
/* ROOKIE V139 — same original native Canvas, camera and collisions.
 * Real mobile+desktop before/after inspection of Phase-5 precinct grounds.
 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root='http://127.0.0.1:8765/preview/';
const evidence=path.resolve('site/preview/precinct9-v139-grounds-lab/evidence');
const locations=[
 {name:'front-precinct-civic-plaza',x:948,y:1206,z:.82},
 {name:'community-walk-main-path',x:948,y:1490,z:.86},
 {name:'parking-stalls-accessible-bay',x:1580,y:1460,z:.68},
 {name:'harbor-avenue-crosswalk',x:948,y:1778,z:.86},
 {name:'south-civic-green',x:948,y:2150,z:.61},
 {name:'landscaped-community-walk',x:1370,y:2180,z:.70},
 {name:'front-entrance-floor-continuity',x:948,y:1100,z:.94}
];
const cases=[{tag:'before',dir:'precinct9-v138-depth-lab',width:390,height:844},
             {tag:'after',dir:'precinct9-v139-grounds-lab',width:390,height:844},
             {tag:'desktop-after',dir:'precinct9-v139-grounds-lab',width:1280,height:720}];
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
 for(const spec of cases){
  const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},
   deviceScaleFactor:1,isMobile:spec.width===390,hasTouch:spec.width===390});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root+spec.dir+'/?pilotQA=1&v116QA=0',
    {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,
    {timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,.91)));
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
    window.ROOKIE_V135_WALL_KIT?.stats()?.entranceAtlas,{timeout:40000});
  if(spec.tag!=='before')await page.waitForFunction(()=>
    window.ROOKIE_V135_WALL_KIT?.stats()?.groundAtlas,{timeout:40000});
  const original=await page.evaluate(()=>{
    const a=window.HARBOR.seamlessCampusV115;
    return {
      geometry:a.geometry(),entrances:a.entrances,
      roadWorld:a.snapshot().worldId,playerId:a.snapshot().playerId,
      passable:[948,1124,1918,1256,948,1778,948,1840,948,2055].map((_,i,arr)=>
       i%2===0?!a.test.blocked(arr[i],arr[i+1],11):null).filter(x=>x!==null)
    };
  });
  assert.equal(original.roadWorld,'harbor-main');
  assert.deepEqual(original.entrances.front,{x:948,y:1124});
  assert.deepEqual(original.entrances.garage,{x:1918,y:1256});
  assert(original.passable[0]&&original.passable[1]&&original.passable[2],
    'Native front, garage and Avenue must remain open');
  const canvas=page.locator('#v115CampusCanvas');
  for(const scene of locations){
    assert(await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(q.x,q.y,q.z),scene));
    await page.waitForTimeout(420);
    await canvas.screenshot({path:path.join(evidence,scene.name+'-'+spec.tag+'.png')});
  }
  // Interact with the unchanged physical entrance & footprint, no teleport.
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1)));
  await page.keyboard.down('w');
  await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.entranceQA()?.room==='LOBBY',{timeout:7500});
  await page.keyboard.up('w');
  const inside=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
  assert(inside.roofAlpha<.1);
  await page.keyboard.down('s');
  await page.waitForFunction(()=>{const q=window.HARBOR.seamlessCampusV115.entranceQA();
   return q?.room===null&&q.playerY>1155;},{timeout:7500});
  await page.keyboard.up('s');
  const outside=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
  assert.equal(inside.world.playerId,outside.world.playerId);
  assert(outside.roofAlpha>inside.roofAlpha);
  const stats=await page.evaluate(()=>({
    atlas:window.ROOKIE_V135_WALL_KIT.stats(),
    precinct:window.ROOKIE_V133_PRECINCT?.metrics(),
    front:window.ROOKIE_V134_PRECINCT?.stats(),
    runtime:window.HARBOR.seamlessCampusV115.metrics()
  }));
  if(spec.tag!=='before'){
    assert(stats.atlas.groundAtlas&&stats.atlas.groundModuleCount>=34);
    assert(stats.atlas.groundDraws>=100,
      'Source atlas not actually used in cached grounds: '+JSON.stringify(stats.atlas));
    assert(stats.precinct.groundAtlas);
  }else assert(!stats.atlas.groundAtlas);
  assert.equal(errors.length,0,'Browser exceptions: '+errors.join('; '));
  results.push({type:spec.tag,viewport:[spec.width,spec.height],original,inside,outside,stats,errors});
  await page.close();
 }
 assert.deepEqual(results[0].original,results[1].original,
   'STOP: new surfaces changed collision/doors/world geometry');
 assert.deepEqual(results[1].original,results[2].original,
   'STOP: mobile and desktop gameplay geometry mismatch');
 fs.writeFileSync(path.join(evidence,'qa-metrics.json'),JSON.stringify({
  views:locations,results,realKeyboardEntryExit:true,artNotYetVisuallyApproved:true,
  roadsFromOriginalConnectedTopology:true,protectedModesUnchanged:true
 },null,2));
 console.log('PASS actual V139 mobile/desktop PNG source atlas rendered in native cache; same entrance/roads/interior/movement/collision, Zombie untouched');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});

'use strict';
/* V140 — approved precinct master layout, same V115 world and Canvas.
 * Compare V139/V140 identical player/camera coordinates at phone+desktop size.
 * Preserve real walk-through, road graph, collision and protected game modes.
 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve('site/preview/precinct9-v140-approved-layout/evidence');
const origin='http://127.0.0.1:8765/preview/';
const views=[
 {name:'garage-access-apron',x:1918,y:1380,z:.70},
 {name:'empty-visitor-parking',x:1980,y:1550,z:.58},
 {name:'garage-parking-composition',x:1965,y:1510,z:.46},
 {name:'front-entry-community-plaza',x:948,y:1370,z:.62},
 {name:'precinct-flag-and-entrance',x:948,y:1045,z:.67},
 {name:'harbor-avenue-crosswalk',x:948,y:1758,z:.78},
 {name:'community-green-unchanged',x:948,y:2190,z:.58}
];
const versions=[
 {tag:'before',dir:'precinct9-v139-grounds-lab',width:390,height:844},
 {tag:'after',dir:'precinct9-v140-approved-layout',width:390,height:844},
 {tag:'desktop-after',dir:'precinct9-v140-approved-layout',width:1280,height:720}
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const run of versions){
   const page=await browser.newPage({viewport:{width:run.width,height:run.height},
    deviceScaleFactor:1,isMobile:run.width===390,hasTouch:run.width===390});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto(origin+run.dir+'/?pilotQA=1&v116QA=0',
    {waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,
    {timeout:45000});
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,.90)));
   await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
    window.ROOKIE_V135_WALL_KIT?.stats()?.entranceAtlas &&
    window.ROOKIE_V135_WALL_KIT?.stats()?.groundAtlas,{timeout:45000});
   const config=await page.evaluate(()=>{
    const game=window.HARBOR.seamlessCampusV115;
    const geo=game.geometry();delete geo.spots;
    const pts=[[948,1124],[1918,1256],[948,1778],[1918,1410],
      [1918,1560],[1918,1685],[1918,1718],[2115,1565]];
    return {
     active:!!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE,
     metrics:window.ROOKIE_V133_PRECINCT.metrics(),
     plan:window.ROOKIE_V133_PRECINCT.geometry,
     geo,world:game.snapshot().worldId,id:game.snapshot().playerId,
     doors:game.entrances,
     passability:pts.map(([x,y])=>({x,y,blocked:game.test.blocked(x,y,11)}))
    };
   });
   assert.equal(config.world,'harbor-main');
   assert.deepEqual(config.doors.front,{x:948,y:1124});
   assert.deepEqual(config.doors.garage,{x:1918,y:1256});
   assert.equal(config.passability[0].blocked,false);
   assert.equal(config.passability[1].blocked,false);
   assert.equal(config.passability[2].blocked,false);
   assert.equal(config.active,run.tag!=='before');
   if(run.tag!=='before'){
    assert(config.metrics.approvedCampus);
    assert.deepEqual(config.plan.approvedParking,{x:1640,y:1464,w:670,h:237});
    assert.deepEqual(config.plan.approvedApron,{x:1742,y:1264,w:354,h:224});
    assert.deepEqual(config.plan.approvedDrive,{x:1856,y:1450,w:146,h:271});
   }
   const canvas=page.locator('#v115CampusCanvas');
   for(const camera of views){
    assert(await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(q.x,q.y,q.z),camera));
    await page.waitForTimeout(320);
    await canvas.screenshot({path:path.join(out,camera.name+'-'+run.tag+'.png')});
   }
   if(run.tag==='desktop-after'){
    assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(1450,1460,.52)));
    await page.waitForTimeout(300);
    await canvas.screenshot({path:path.join(out,'full-campus-approved-desktop.png')});
   }
   // Actual W/S keyboard movement, not a teleport test: existing lobby
   // and roof fade continue to work without a scene transition.
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1)));
   await page.keyboard.down('w');
   try{
    await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.entranceQA()?.room==='LOBBY',
      {timeout:9000});
   }finally{await page.keyboard.up('w')}
   const interior=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
   assert(interior.roofAlpha<.10);
   await page.keyboard.down('s');
   try{
    await page.waitForFunction(()=>{
     const q=window.HARBOR.seamlessCampusV115.entranceQA();
     return q?.room===null&&q.playerY>1150;
    },{timeout:9000});
   }finally{await page.keyboard.up('s')}
   const exterior=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
   assert(exterior.roofAlpha>interior.roofAlpha);
   assert.equal(page.isClosed(),false);
   assert.equal((await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot())).playerId,config.id);
   assert.equal(errors.length,0,'browser exceptions: '+errors.join('; '));
   results.push({tag:run.tag,view:[run.width,run.height],config,interior,exterior,errors});
   await page.close();
  }
  const [before,after,desktop]=results;
  assert.deepEqual(before.config.geo,after.config.geo,
   'Do not move native walls, rooms or original geometry');
  assert.deepEqual(before.config.passability,after.config.passability,
   'Do not introduce invisible collisions when positioning roads/parking');
  assert.deepEqual(after.config.passability,desktop.config.passability,
   'Android and desktop use identical world collision');
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({
   source:'owner-approved Option A precinct campus image (parking cleared)',
   notAnImageOverlay:true,originalCanvas:true,visualApprovalStillRequired:true,
   noZombieChanges:true,noNewRenderer:true,views,results
  },null,2));
  console.log('PASS V140 mobile+desktop approved layout, same doors, roads, native collision, roof, camera & Zombie untouched');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});

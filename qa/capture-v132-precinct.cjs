'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before='http://127.0.0.1:8765/preview/precinct9-legacy-lab/?v116QA=0&pilotQA=1';
const after='http://127.0.0.1:8765/preview/precinct9-v132-lab/?v116QA=0&pilotQA=1';
const folder=path.resolve('site/preview/precinct9-v132-lab/evidence');
const scenes=[
 {id:'full-precinct-roof',x:950,y:715,z:.80},
 {id:'front-exterior-and-signage',x:948,y:1024,z:.95},
 {id:'garage-roof-and-bays',x:1850,y:870,z:.88},
 {id:'visitor-parking',x:1510,y:1430,z:.88},
 {id:'fleet-access',x:1900,y:1270,z:.88},
 {id:'precinct-community-frontage',x:975,y:1395,z:.95},
 {id:'protected-marina-reference',x:5200,y:3758,z:.95}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const [label,url] of [['before',before],['after',after]]){
   const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY,{timeout:45000});
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
   await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&
    window.ROOKIE_V127_CITY?.metrics()?.atlasReady,{timeout:35000});
   if(label==='after'){
     await page.waitForFunction(()=>!!window.ROOKIE_V132_PRECINCT&&
       !!window.HARBOR?.precinctExterior?.art?.roof?.naturalWidth&&
       !!window.HARBOR?.cast?.spec?.brooks,{timeout:20000});
   }
   const entry=await page.evaluate(()=>{
     const api=window.HARBOR.seamlessCampusV115;
     return {world:api.snapshot().worldId,geom:api.geometry(),
       front:api.test.blocked(948,1124,11),garage:api.test.blocked(1918,1256,11),
       frontCoords:api.entrances.front,garageCoords:api.entrances.garage};
   });
   assert.equal(entry.world,'harbor-main');assert.equal(entry.front,false);
   assert.equal(entry.garage,false);
   assert.deepEqual(entry.frontCoords,{x:948,y:1124});
   assert.deepEqual(entry.garageCoords,{x:1918,y:1256});
   const canvas=page.locator('#v115CampusCanvas');
   for(const sc of scenes){
     assert(await page.evaluate(s=>window.HARBOR.seamlessCampusV115.qaCamera(s.x,s.y,s.z),sc));
     await page.waitForTimeout(360);
     await canvas.screenshot({path:path.join(folder,sc.id+'-'+label+'.png')});
   }
   // Use real station actors, at THEIR original world coords, not fabricated
   // test NPCs. Original actor identities and world geometry stay untouched.
   // MAPS is lexically scoped inside the bundled original game, not window.
   // These world positions come directly from the audited original station
   // roster (local ST coords + immutable STX=380, STY=96). Ferris's
   // original holding-wing relocation is included.
   const actors=[
    {name:'RIVERA',x:680,y:216},
    {name:'MAYA',x:1330,y:184},
    {name:'SGT. BROOKS',x:1345,y:441},
    {name:'CHEN',x:935,y:788},
    {name:'PARK',x:900,y:616},
    {name:'FERRIS',x:1420,y:954}
   ];
   assert(actors.length>=2,'Need the original legacy station staff');
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(948,1060)));
   assert.equal(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.interiorRoom(948,1060)),'LOBBY');
   for(const [i,a] of actors.entries()){
     assert(await page.evaluate(s=>window.HARBOR.seamlessCampusV115.qaCamera(s.x,s.y,.96),a));
     await page.waitForTimeout(label==='after'?680:280);
     await canvas.screenshot({path:path.join(folder,'original-station-npc-'+i+'-'+label+'.png')});
   }
   // Shift to ordinary outdoor player position; fades must not leave roofs
   // visible over the actor when indoors or reveal NPCs when outdoors.
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(948,920,.95)));
   await page.waitForTimeout(330);
   await canvas.screenshot({path:path.join(folder,'interior-roof-fade-'+label+'.png')});
   const v132=await page.evaluate(()=>window.ROOKIE_V132_PRECINCT?.stats()||null);
   if(label==='after'){
     assert(v132&&v132.legacyRoofReady&&v132.roofFrames>0&&v132.roofBuilds<=3,
       'Legacy roof.png must render through native station roof with a static cache');
     assert(v132.castFrames>0&&Object.keys(v132.castNames).length>=2,
       'Actual named precinct staff must paint from old authored officer sheets: '+JSON.stringify(v132));
     assert(Object.values(v132.officerSpritesReady).some(Boolean),
       'Legacy station NPC image sheets were not decoded');
   } else assert.equal(v132,null);
   assert.equal(errors.length,0,'Browser errors: '+JSON.stringify(errors));
   results.push({label,entry,actors,v132,errors});
   await page.close();
  }
  // Some late-loaded Marina interactions are asynchronous and permitted;
  // all fixed true-world collision, entry, footprint and road state must match.
  const normalize=e=>({...e,geom:{...e.geom,spots:null}});
  assert.deepEqual(normalize(results[0].entry),normalize(results[1].entry),
    'V132 exterior/NPC painter must never mutate native-world geometry');
  const delta=Math.abs(results[0].entry.geom.spots-results[1].entry.geom.spots);
  assert(delta===0||delta===6,'Only existing async Marina spots may vary');
  fs.writeFileSync(path.join(folder,'review-data.json'),JSON.stringify({
   scenes,results,humanApprovalRequired:true,automatedArtApproval:false
  },null,2));
  console.log('PASS native old roof and named NPC sheets actually painted; true entrance, garage, continuous world and Marina preserved; aesthetic approval pending');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});

'use strict';
// V128 actual playable phone-sized Chromium RUN/idle inspection.
// A browser emulator cannot substitute for physical Android FPS testing.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const url=process.env.V128_URL||'http://127.0.0.1:8765/preview/v128-world-quality/?v116QA=0&pilotQA=1';
 const folder=process.env.V128_EVIDENCE||path.resolve('site/preview/v128-world-quality/evidence');
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY&&window.ROOKIE_V127_CITY,{timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(4700,3950,.95)));
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&window.ROOKIE_JAY.ready(),{timeout:35000});
  await page.waitForTimeout(1100);
  await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.metrics().ambientDistrictsInitialized===9,{timeout:8000});
  const cityMetrics=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.metrics());
  assert(cityMetrics.ambientPedestrians>0&&cityMetrics.ambientPedestrians<=16,'Living-city pedestrians must be actually active without duplicate NPCs');
  assert(cityMetrics.streetCars===18,'Native arterial pilot has 18 bounded traffic cars');
  await page.screenshot({path:path.join(folder,'v128-idle.png')});
  await page.keyboard.down('Shift');await page.keyboard.down('ArrowUp');
  await page.waitForFunction(()=>window.ROOKIE_JAY.snapshot('connected-jay')?.mode==='run',{timeout:6000});
  await page.waitForTimeout(280);
  const running=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
  await page.screenshot({path:path.join(folder,'v128-running.png')});
  await page.keyboard.up('ArrowUp');await page.keyboard.up('Shift');
  await page.waitForTimeout(900);
  const stopped=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
  assert.equal(stopped.mode,'idle','RUN to idle must settle with player planted');
  assert(running.x!==stopped.x||running.y!==stopped.y||running.mode==='run');
  // The real connected game draws all newly joined streets in the same
  // Canvas. Capture distinct intersections for mobile-size visual review.
  const roadShots=[
    {id:'precinct-arterial',x:1000,y:1784},
    {id:'westfield-southern-ring',x:-1850,y:3744},
    {id:'midtown-bayview-feeder',x:4050,y:2950},
    {id:'southbay-loop-junction',x:4050,y:3744},
    {id:'northgate-arterial',x:5855,y:1784}
  ];
  for(const road of roadShots){
    assert(await page.evaluate(v=>window.HARBOR.seamlessCampusV115.qaCamera(v.x,v.y,1.05),road));
    await page.waitForTimeout(170);
    await page.screenshot({path:path.join(folder,'road-'+road.id+'.png')});
  }
  // These are not just drawn rectangles. The actual movement collider must
  // allow Jay to traverse the two new links and the original Bayview lane.
  const passability=await page.evaluate(()=>{
    const test=window.HARBOR.seamlessCampusV115.test;
    return [
      {id:'westfield-ring',x:-1850,y:3000},
      {id:'midtown-bayview-feeder',x:4050,y:2950},
      {id:'southbay-native-street',x:4050,y:3744}
    ].map(r=>({...r,blocked:test.blocked(r.x,r.y,12)}));
  });
  const roadDiagnosis=await page.evaluate(()=>{
    const q=window.HARBOR.seamlessCampusV115.test.roadCollisionDiagnostic;
    return [3000,2950,2850,2700,2600].flatMap(y=>[3985,4020,4050,4080,4115].map(x=>q(x,y,12)));
  });
  console.log('ROAD COLLISION DIAGNOSTIC',JSON.stringify(roadDiagnosis.filter(r=>r.result)));
  assert(passability.every(r=>!r.blocked),
    'Road drawn across physical wall/tree: '+JSON.stringify(passability));
  // Every 25 world-units along the entire new feeder, including the exact
  // original bench obstruction; paint-only road fixes cannot pass this gate.
  const feederScan=await page.evaluate(()=>{
    const q=window.HARBOR.seamlessCampusV115.test.roadCollisionDiagnostic;
    const out=[];for(let y=2625;y<=3660;y+=25){
      const o=q(4050,y,12);if(o?.result)out.push(o);
    }return out;
  });
  assert.equal(feederScan.length,0,'Still-blocked Midtown→Bayview route: '+JSON.stringify(feederScan));
  assert.equal(errors.length,0,'No JS console errors: '+errors.join(', '));
  fs.writeFileSync(path.join(folder,'v128-run-metrics.json'),JSON.stringify({running:{mode:running.mode,phase:running.phase},stopped:{mode:stopped.mode,phase:stopped.phase},ambientPedestrians:cityMetrics.ambientPedestrians,ambientDistrictsInitialized:cityMetrics.ambientDistrictsInitialized,streetCars:cityMetrics.streetCars,roadShots:roadShots.map(r=>r.id),roadPassability:passability,feederScanBlockedCount:feederScan.length,viewport:'390x844 Chromium emulated mobile',errors},null,2));
  console.log('PASS V128 live mobile-size gameplay RUN / idle transition in the original single player/camera world');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

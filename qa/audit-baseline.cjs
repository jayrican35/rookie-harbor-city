/* Read-only runtime audit of the existing V140 candidate. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const review=process.argv.includes('--review');
const server=require('node:http').createServer((req,res)=>{
 const root=path.resolve('site'),file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp'};
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(8766,'127.0.0.1',resolve));
 const out=review?'review-evidence':'audit-evidence';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=process.argv.includes('--protected-only')?JSON.parse(fs.readFileSync(`${out}/runtime.json`,'utf8')):[];
 try{
  for(const variant of process.argv.includes('--protected-only')?[]:review?['before','after']:['after']){
  const target=variant==='before'?'precinct9-audit-before':'precinct9-v140-approved-layout';
  const shots=review?`${out}/${variant}`:out;fs.mkdirSync(shots,{recursive:true});
  for(const [width,height] of [[390,844],[1280,720]]){
   const page=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390,
    ...(review&&width===1280?{recordVideo:{dir:`${shots}/videos`,size:{width,height}}}:{})});
   const errors=[],failed=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),url:r.url()})});
   await page.goto(`http://127.0.0.1:8766/preview/${target}/?pilotQA=1&v116QA=0`);
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY);
   await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(1980,1550,.9));
   await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.groundAtlas);
   if(variant==='after'){
    await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.communityAtlas);
    await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.roadAtlas&&window.ROOKIE_V135_WALL_KIT.roadwayPlan());
    const road=await page.evaluate(()=>({source:window.HARBOR.worldV115.roadNetwork(),plan:window.ROOKIE_V135_WALL_KIT.roadwayPlan()}));
    fs.writeFileSync(`${shots}/${width}-road-plan.json`,JSON.stringify(road,null,2));
    assert.equal(road.source.segments.length,18);
    for(const s of road.source.segments){
     for(let t=0;t<=1;t+=.05){
      const x=s.w>s.h?s.x+s.w*t:s.x+s.w/2,y=s.w>s.h?s.y+s.h/2:s.y+s.h*t;
      assert(road.plan.roads.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h),'Road finish must cover original centerline: '+s.id);
     }
    }
    assert(road.plan.roads.some(r=>r.axis==='v'&&r.x<4932&&r.x+r.w>4932&&r.y<1721&&r.y+r.h>=1721),'Native north leg of Midtown junction must remain open');
    for(const c of road.plan.crossings){
     const w=(c.axis==='h'?31:40)*c.scale,h=(c.axis==='h'?40:31)*c.scale;
     for(const x of [c.x-w/2,c.x+w/2])for(const y of [c.y-h/2,c.y+h/2])
      assert(road.plan.roads.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h),'Crosswalk extends beyond its road: '+c.id);
    }
    const props=await page.evaluate(()=>window.ROOKIE_V134_PRECINCT.communityLayout);
    assert(props.length>25,'Use the supplied landscaping and furniture categories');
    const lawn=await page.evaluate(()=>window.ROOKIE_V133_PRECINCT.geometry.communityLawn);
    assert.equal(lawn.w,lawn.h,'Community lawn must be square');
    const benches=props.filter(p=>p.sprite.startsWith('bench'));
    assert(benches.length===2&&benches.every(p=>p.y===1340),'Both benches belong on the horizontal front paved band');
    assert(1721-(lawn.y+lawn.h+12)>=48,'Leave a continuous street-side sidewalk below the lawn');
    for(const p of props){
     if(p.underfoot)continue;
     const left=p.x-p.w/2,right=p.x+p.w/2;
     assert(right<=860||left>=1035,'Furniture must leave the central walk clear');
     assert(right<1640,'Furniture must stay west of garage/parking');
    }
   }
   if(variant==='after'){
    for(const [name,x,y,z] of [['precinct-road',948,1784,.8],['precinct-road-east-seam',2068,1784,.8],['maple-junction',-578,1784,.65],['midtown-four-way',4932,1784,.65],['northgate-junction',5855,1784,.65],['midtown-lower-junction',4050,2540,.65],['westfield-south-junction',-1850,3744,.65],['southbay-junction',4050,3744,.65]]){
     await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(...q),[x,y,z]);await page.waitForTimeout(220);
     await page.screenshot({path:`${shots}/${width}-${name}.png`});
    }
   }
   for(const [name,x,y,z] of [['overview',1450,1460,.52],['cleared-plaza',900,1430,1],['parking',1980,1550,.75],['entrance',948,1195,1]]){
    await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(...q),[x,y,z]);
    await page.waitForTimeout(500);
    await page.screenshot({path:`${shots}/${width}-${name}.png`});
   }
   await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1));
   await page.keyboard.down('w');
   try{await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.entranceQA()?.room==='LOBBY',null,{timeout:9000})}
   finally{await page.keyboard.up('w')}
   const inside=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
   assert(inside.roofAlpha<.1);
   await page.screenshot({path:`${shots}/${width}-interior.png`});
   await page.keyboard.down('s');
    try{await page.waitForFunction(()=>{const q=window.HARBOR.seamlessCampusV115.entranceQA();return q?.room===null&&q.playerY>1150},null,{timeout:9000})}
   finally{await page.keyboard.up('s')}
   const outside=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());
   assert(outside.roofAlpha>inside.roofAlpha);
   if(review){
    // Continuous movement from the lobby, across the plaza, through the
    // parking aisle and into/out of the garage. Only the initial placement
    // above uses the existing QA hook; every route segment uses real keys.
    for(const [key,axis,value,greater] of [['s','playerY',1680,true],['d','playerX',1918,true],['w','playerY',1245,false],['s','playerY',1390,true]]){
     await page.keyboard.down(key);
     try{await page.waitForFunction(q=>{const s=window.HARBOR.seamlessCampusV115.entranceQA();return q.greater?s[q.axis]>=q.value:s[q.axis]<=q.value},{axis,value,greater},{timeout:18000})}
     finally{await page.keyboard.up(key)}
    }
    await page.screenshot({path:`${shots}/${width}-garage-route.png`});
   }
   await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(1980,1550,.9));
   await page.waitForTimeout(1200);
   await page.screenshot({path:`${shots}/${width}-exterior-gameplay.png`});
   let touch=null;
   if(review&&width===390){
    const initial=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
    const pad=await page.locator('#v115CampusPad').boundingBox();assert(pad);
    const cdp=await page.context().newCDPSession(page);
    const x=Math.round(pad.x+pad.width*.5),y=Math.round(pad.y+pad.height*.5);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+36,y}]});
    await page.waitForTimeout(500);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const end=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
    touch={dx:end.x-initial.x,dy:end.y-initial.y};assert(touch.dx>10,'Touch joystick must move Jay');
    await cdp.detach();
   }
   const runtime=await page.evaluate(()=>({snapshot:window.HARBOR.seamlessCampusV115.snapshot(),geometry:window.HARBOR.seamlessCampusV115.geometry(),metrics:window.ROOKIE_V133_PRECINCT.metrics(),atlas:window.ROOKIE_V135_WALL_KIT.stats(),passability:Array.from({length:8},(_,i)=>({x:1675+i*75,y:1560,blocked:window.HARBOR.seamlessCampusV115.test.blocked(1675+i*75,1560,11)}))}));
   assert.equal(errors.length,0);assert(runtime.passability.every(p=>!p.blocked));
   results.push({variant,width,height,inside,outside,touch,errors,failed,runtime});
   await page.close();
  }
  }
  fs.writeFileSync(`${out}/runtime.json`,JSON.stringify(results,null,2));
  const protectedRuns=[];
  if(review){
   for(const variant of ['before','after']){
    const dir=variant==='before'?'precinct9-audit-before':'precinct9-v140-approved-layout';
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto(`http://127.0.0.1:8766/preview/${dir}/?pilotQA=1`);
    await page.waitForFunction(()=>window.HARBOR?.outbreak&&window.HARBOR?.academy);
    await page.locator('#familySelect .family-card').filter({hasText:'Jay'}).click();
    const run=await page.evaluate(()=>{
     const H=window.HARBOR;H.dismissTransient();H.outbreak.seed(9012026);
     const started=H.academy.begin('zombie','explorer');
     const status=H.outbreak.status();
     const map=H.outbreakMap.build();
     const refused=H.seamlessCampusV115.openAt(948,1195,1)===false;
     const communityAtlasLoaded=!!window.ROOKIE_V135_WALL_KIT?.stats()?.communityAtlas;
     const roadAtlasLoaded=!!window.ROOKIE_V135_WALL_KIT?.stats()?.roadAtlas;
     return {started,refused,communityAtlasLoaded,roadAtlasLoaded,status:status&&{seed:status.seed,map:status.map,stage:status.stage,cap:status.cap},map};
    });
    assert(run.started&&run.refused&&run.status,'Zombie must start and exclude campus');
    assert.equal(run.communityAtlasLoaded,false,'Community art must not load in protected mode');
    assert.equal(run.roadAtlasLoaded,false,'Road art must not load in protected mode');
    assert(await page.evaluate(()=>window.HARBOR.armory.inspect('rifle')),'Native armory inspection');
    await page.locator('#armoryPanel .armory-equip').click();
    await page.waitForTimeout(900);
    await page.screenshot({path:`${out}/${variant}/zombie.png`});
    const armory=await page.evaluate(()=>({armory:window.HARBOR.armory.status(),weapon:window.HARBOR.training.status().weaponId}));
    assert.equal(armory.weapon,'rifle');
    // The old playthrough helper bypasses required armory preparation.
    // Do not misreport it as a complete gameplay regression test.
    protectedRuns.push({variant,...run,armory,fullObjectiveRun:false});await page.close();
    fs.writeFileSync(`${out}/protected-mode.json`,JSON.stringify(protectedRuns,null,2));
   }
   assert.deepEqual(protectedRuns[0].map,protectedRuns[1].map,'Protected map and assets must remain identical');
   assert.deepEqual(protectedRuns[0].status,protectedRuns[1].status);
   assert.deepEqual(protectedRuns[0].armory,protectedRuns[1].armory);
   for(const width of [390,1280]){
    const pair=results.filter(r=>r.width===width);
    for(const r of pair)delete r.runtime.geometry.spots;
    assert.deepEqual(pair[0].runtime.geometry,pair[1].runtime.geometry,'Walls, rooms and roads unchanged');
    assert.deepEqual(pair[0].runtime.passability,pair[1].runtime.passability);
   }
  }
  fs.writeFileSync(`${out}/runtime.json`,JSON.stringify(results,null,2));
  if(review)fs.writeFileSync(`${out}/protected-mode.json`,JSON.stringify(protectedRuns,null,2));
  console.log(JSON.stringify({runs:results.map(r=>({variant:r.variant,width:r.width,touch:r.touch,errors:r.errors,missingAssets:r.failed.length})),protected:protectedRuns.map(r=>({variant:r.variant,status:r.status,weapon:r.armory.weapon,fullObjectiveRun:r.fullObjectiveRun}))},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{server.close();console.error(e);process.exitCode=1});

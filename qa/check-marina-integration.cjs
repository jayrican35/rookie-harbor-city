'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
const out='marina-integration-evidence';
fs.mkdirSync(out,{recursive:true});
async function axis(page,key,axis,target,greater){
 await page.keyboard.down(key);
 try{await page.waitForFunction(q=>{const s=window.HARBOR.seamlessCampusV115.snapshot();return q.greater?s[q.axis]>=q.target:s[q.axis]<=q.target;},{axis,target,greater},{timeout:14000,polling:'raf'});}
 catch(e){throw Error(`${key} route failed: ${JSON.stringify(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot()))}: ${e.message}`)}
 finally{await page.keyboard.up(key)}
}
async function open(page,x,y,z=1){
 assert(await page.evaluate(v=>window.HARBOR.seamlessCampusV115.openAt(...v),[x,y,z]),`Blocked starting position ${x},${y}`);
}
async function performanceSample(page){
 await page.waitForTimeout(500);
 return page.evaluate(()=>new Promise(resolve=>{
  const values=[];let last=0,start=0;
  function tick(t){if(!start)start=t;if(last)values.push(t-last);last=t;if(t-start<1800)return requestAnimationFrame(tick);
   const sorted=values.slice().sort((a,b)=>a-b);resolve({frames:values.length,fps:Math.round(values.length*10000/(t-start))/10,frameP95Ms:sorted[Math.floor(sorted.length*.95)],marina:window.ROOKIE_V116_MARINA.metrics(),world:window.HARBOR.seamlessCampusV115.metrics()});}
  requestAnimationFrame(tick);
 }));
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const runs=[];
 try{
  for(const tag of ['before','updated'])for(const [width,height] of [[1280,800],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:width===390,hasTouch:width===390,recordVideo:tag==='updated'&&width===1280?{dir:out+'/video',size:{width,height}}:undefined});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:8767/preview/marina-${tag}/?pilotQA=1`);
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY?.ready()&&window.ROOKIE_V120_ART?.ready());
   if(tag==='updated')await page.waitForFunction(()=>window.ROOKIE_V116_MARINA.metrics().decoded===window.ROOKIE_V116_MARINA.metrics().assets);
   await open(page,3700,4108,.7);
   fs.mkdirSync(`${out}/${tag}`,{recursive:true});
   const scenes=width===1280?[['bayview',3930,3990,.7],['shop-exterior',3500,4000,1.4],['connection',4370,3990,.8],['docks',5150,3880,.7]]:[['bayview',3500,4060,.65],['connection',4370,3990,.65],['docks',5150,3880,.65]];
   for(const [name,x,y,z] of scenes){await page.evaluate(v=>window.HARBOR.seamlessCampusV115.qaCamera(...v),[x,y,z]);await page.waitForTimeout(400);await page.screenshot({path:`${out}/${tag}/${width}-${name}.png`});}
   await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(3930,3990,.7));
   const performance=await performanceSample(page),routes=[];
   if(tag==='updated'&&width===1280){
    // One ordinary-input route connects Bayview's southern promenade to Marina.
    await open(page,3700,4108,.8);
    await axis(page,'d','x',4365,true);await axis(page,'w','y',3758,false);await axis(page,'d','x',4450,true);
    routes.push({name:'Bayview to Marina promenade',end:await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot())});
    await open(page,3590,4108,1.1);await axis(page,'s','y',4236,true);await axis(page,'d','x',3606,true);await axis(page,'s','y',4280,true);
    routes.push({name:'Bayview pier to end',end:await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot())});
    for(const px of [4655,5105,5555]){
     await open(page,px+61,3754,1);await axis(page,'s','y',4070,true);await axis(page,'w','y',3754,false);
     routes.push({name:`Native pier ${px} return`,end:await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot())});
    }
    // Allow the slow customer to clear the real doorway before Jay enters.
    await page.waitForFunction(()=>{const a=window.ROOKIE_V116_MARINA.actors.find(a=>a.id==='v116:bait-customer');return a.x<3510&&a.y<4035;},null,{timeout:30000});
    await open(page,3530,4098,1.4);
    await axis(page,'w','y',3990,false);await page.waitForTimeout(450);
    let interior=await page.evaluate(()=>{const a=window.HARBOR.seamlessCampusV115,b=window.ROOKIE_V116_MARINA.interiors.find(b=>b.kind==='bait');return {state:a.snapshot(),camera:a.entranceQA(),inside:b.inside,roof:b.roof,geometry:a.geometry()}});
    assert(interior.inside&&interior.roof<.02&&interior.camera.follows);assert.equal(interior.geometry.separateSceneLoads,0);
    await page.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(3500,3980,1.8));
    await page.screenshot({path:`${out}/updated/1280-shop-interior.png`});
    await page.keyboard.press('e');assert(await page.locator('#v116Dialogue').isVisible(),'Furniture/shop interaction responds');
    await axis(page,'s','y',4105,true);await page.waitForTimeout(500);
    const exit=await page.evaluate(()=>{const b=window.ROOKIE_V116_MARINA.interiors.find(b=>b.kind==='bait');return {state:window.HARBOR.seamlessCampusV115.snapshot(),inside:b.inside,roof:b.roof}});
    assert(!exit.inside&&exit.roof>.98);assert.equal(interior.state.worldId,exit.state.worldId);assert.equal(interior.state.instanceId,exit.state.instanceId);
    routes.push({name:'Seamless bait shop entry and exit',interior,exit});
   }
   if(tag==='updated'&&width===390){
    await open(page,3700,4108,.8);
    const pos=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
    const box=await page.locator('#v115CampusPad').boundingBox();assert(box);
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2);
    await page.waitForTimeout(250);await page.mouse.up();
    const moved=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());assert(moved.x>pos.x+8,'Mobile pointer joystick moves Jay');
    routes.push({name:'Mobile pointer joystick',before:pos,after:moved});
   }
   const state=await page.evaluate(()=>{
    const a=window.HARBOR.seamlessCampusV115,m=window.ROOKIE_V116_MARINA;
    return {world:a.snapshot(),metrics:m.metrics(),actors:m.actors.map(p=>({id:p.id,blocked:m.blocksScenery(p.x,p.y,8)})),water:m.blocksScenery(3100,4300,12),pier:!m.blocksScenery(3590,4230,12)};
   });
   if(tag==='updated'){assert(state.water&&state.pier);assert(state.actors.every(a=>!a.blocked),'NPCs stay clear of scenery');}
   assert.equal(errors.length,0);runs.push({tag,width,height,errors,performance,routes,state});
   await context.close();console.log('PASS Marina gameplay',tag,width);
  }
  fs.writeFileSync(out+'/results.json',JSON.stringify({deviceNote:'Chrome headless; mobile dimensions and pointer emulation, not a physical phone',runs},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

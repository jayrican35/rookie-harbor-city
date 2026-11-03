'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const out='civilian-evidence';
async function start(p,x,y,z=1){assert(await p.evaluate(v=>window.HARBOR.seamlessCampusV115.openAt(...v),[x,y,z]),`Blocked start ${x},${y}`)}
async function move(p,key,axis,target,greater){await p.keyboard.down(key);try{await p.waitForFunction(q=>{const s=window.HARBOR.seamlessCampusV115.snapshot();return q.greater?s[q.axis]>=q.target:s[q.axis]<=q.target},{axis,target,greater},{timeout:16000,polling:'raf'})}finally{await p.keyboard.up(key)}}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),runs=[];
 try{for(const tag of ['before','updated'])for(const [width,height] of [[1280,800],[390,844]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:8767/preview/${tag==='updated'?(process.env.CIVILIAN_AFTER_PREVIEW||'civilian-updated'):'civilian-before'}/?pilotQA=1`);
  await p.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY?.ready());
  await start(p,3750,4136,.8);await p.waitForFunction(()=>window.HARBOR.seamlessCampusV115.metrics().ambientDistrictsInitialized===9);
  fs.mkdirSync(`${out}/${tag}`,{recursive:true});
  for(const [name,x,y,z] of [['waterfront',4130,3980,.95],['marina',5150,3720,1.4],['precinct',950,1160,.8],['downtown',5650,1800,.9],['midtown',4350,1780,.9]]){
   await p.evaluate(v=>window.HARBOR.seamlessCampusV115.qaCamera(...v),[x,y,z]);await p.waitForTimeout(350);
   if(tag==='updated')await p.waitForFunction(()=>{const m=window.ROOKIE_CIVILIANS.metrics();return m.requested===m.loaded});
   await p.screenshot({path:`${out}/${tag}/${width}-${name}.png`});
  }
  await p.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(5150,3720,1.2));await p.waitForTimeout(500);
  const performance=await p.evaluate(()=>new Promise(resolve=>{let first=0,last=0;const times=[];function tick(t){if(!first)first=t;if(last)times.push(t-last);last=t;if(t-first<1800)return requestAnimationFrame(tick);times.sort((a,b)=>a-b);resolve({fps:Math.round(times.length*10000/(t-first))/10,frameP95Ms:times[Math.floor(times.length*.95)],world:window.HARBOR.seamlessCampusV115.metrics()})}requestAnimationFrame(tick)}));
  const state=await p.evaluate(()=>({actors:window.HARBOR.seamlessCampusV115.civilianQA(),art:window.ROOKIE_CIVILIANS?.metrics()||null}));
  const behavior={actors:state.actors.actors.map(a=>({id:a.id,name:a.name,speed:a.speed,route:a.route})),interactions:state.actors.interactions,geometry:state.actors.geometry};
  if(tag==='updated'){
   assert.equal(state.art.errors,0);assert(state.art.draws>0);assert(state.art.requested<=30);
   assert(state.actors.actors.filter(a=>a.protected).every(a=>!state.art.actorRoles[a.id]),'Protected cast never reaches civilian sprites');
   assert(state.actors.actors.filter(a=>a.id.startsWith('ambient:')).every(a=>a.role),'Every ambient civilian gets a stable role');
   assert.equal(state.actors.actors.find(a=>a.id==='v116:cafe-staff').role,'barista');
   if(width===1280){
    await start(p,3590,4136,1);await move(p,'s','y',4274,true);await move(p,'w','y',4136,false);
    await start(p,5150,3750,1);await move(p,'s','y',4070,true);await move(p,'w','y',3750,false);
    await start(p,4000,4118,1.4);await move(p,'w','y',3945,false);await p.waitForTimeout(500);
    assert(await p.evaluate(()=>window.ROOKIE_V116_MARINA.interiors.find(b=>b.kind==='bait').inside));
    await p.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(3950,3920,1.8));await p.waitForTimeout(300);
    await p.screenshot({path:`${out}/updated/shop-interior.png`});await move(p,'s','y',4118,true);
   }else{
    await start(p,4000,4136,.9);const before=await p.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());const b=await p.locator('#v115CampusPad').boundingBox();
    await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2+35,b.y+b.height/2);await p.waitForTimeout(300);await p.mouse.up();
    assert((await p.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot())).x>before.x+10);
   }
  }
  assert.equal(errors.length,0);runs.push({tag,width,height,errors,performance,behavior,art:state.art,classification:state.actors.actors.map(a=>({id:a.id,name:a.name,role:a.role,protected:a.protected}))});
  await p.close();console.log('PASS civilian artwork',tag,width);
 }
 for(const width of [1280,390])assert.deepEqual(runs.find(r=>r.tag==='before'&&r.width===width).behavior,runs.find(r=>r.tag==='updated'&&r.width===width).behavior,'Actor identities/routes/dialogue/geometry must remain identical');
 // Neither campaign nor Zombie uses the preview adapter or requests its atlases.
 const isolation=[];
 for(const tag of ['before','updated']){
  const p=await browser.newPage(),requests=[];p.on('request',r=>{if(r.url().includes('/assets/civilian-corrected/'))requests.push(r.url())});
  await p.goto(`http://127.0.0.1:8767/preview/${tag==='updated'?(process.env.CIVILIAN_AFTER_PREVIEW||'civilian-updated'):'civilian-before'}/?pilotQA=1`);await p.waitForFunction(()=>window.HARBOR?.outbreak);
  await p.locator('#familySelect .family-card').filter({hasText:'Jay'}).click();
  const s=await p.evaluate(()=>{const h=window.HARBOR;h.dismissTransient();h.outbreak.seed(9012026);return {started:h.academy.begin('zombie','explorer'),map:h.outbreakMap.build(),refused:h.seamlessCampusV115.openAt(3750,4136,1)===false,metrics:window.ROOKIE_CIVILIANS?.metrics()||null}});
  assert(s.started&&s.refused);assert.equal(requests.length,0);if(s.metrics)assert.equal(s.metrics.requested,0);isolation.push({tag,...s,requests});await p.close();
 }
 assert.deepEqual(isolation[0].map,isolation[1].map);fs.writeFileSync(out+'/results.json',JSON.stringify({runs,isolation},null,2));
 console.log('PASS unchanged behaviors, protected cast, movement, mobile input and Zombie isolation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

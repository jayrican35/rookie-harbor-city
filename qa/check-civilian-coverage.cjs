'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:1280,height:800}});
 await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1');await p.waitForFunction(()=>window.ROOKIE_CIVILIANS&&window.ROOKIE_JAY?.ready());
 await p.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(3750,4136,.8));await p.waitForFunction(()=>window.HARBOR.seamlessCampusV115.metrics().ambientDistrictsInitialized===9);
 const actors=await p.evaluate(()=>window.HARBOR.seamlessCampusV115.civilianQA().actors);
 for(const a of actors.filter(a=>!a.protected)){
  await p.evaluate(actor=>{
   const c=window.HARBOR.seamlessCampusV115,m=window.ROOKIE_V116_MARINA,body=m.actors.find(n=>n.id===actor.id),room=body?.building&&m.interiors.find(b=>b.id===body.building);
   if(room){const f=room.floor;let placed=false;for(let y=f.y+22;y<f.y+f.h-16&&!placed;y+=20)for(let x=f.x+20;x<f.x+f.w-16;x+=20)if(!c.test.blocked(x,y)&&m.interiorAt(x,y)===room&&c.openAt(x,y,1)){placed=true;break}}
   c.qaCamera(actor.x,actor.y,.9);
  },a);
  await p.waitForTimeout(180);await p.waitForFunction(()=>{const m=window.ROOKIE_CIVILIANS.metrics();return m.loaded===m.requested});
 }
 const result=await p.evaluate(()=>({metrics:window.ROOKIE_CIVILIANS.metrics(),actors:window.HARBOR.seamlessCampusV115.civilianQA().actors}));
 const civilians=result.actors.filter(a=>!a.protected);assert(civilians.every(a=>result.metrics.actorRoles[a.id]===a.role),'Every existing civilian must render its assigned outfit');
 assert(result.actors.filter(a=>a.protected).every(a=>!result.metrics.actorRoles[a.id]));assert.equal(result.metrics.errors,0);
 fs.writeFileSync('civilian-evidence/coverage.json',JSON.stringify(result,null,2));console.log('PASS all',civilians.length,'existing civilians rendered; protected',result.actors.length-civilians.length,'actors excluded; decoded',result.metrics.loaded,'role atlases');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

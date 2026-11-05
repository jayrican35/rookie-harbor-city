'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='docs/parking-encounter';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={errors:[]};try{
 const p=await b.newPage({viewport:{width:1280,height:850}});p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1&encounterPilot=1');await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());
 await p.evaluate(()=>{HARBOR.profiles.choose('jay');HARBOR.dismissTransient();HARBOR.comicDialogue.close();HARBOR.speech.setSpeed(0);HARBOR.seamlessCampusV115.openAt(900,1250,1.25)});await p.waitForFunction(()=>ROOKIE_PARKING_ENCOUNTER.qa().age>=1);
 assert(!await p.evaluate(()=>ROOKIE_PARKING_ENCOUNTER.locked()),'Never starts on initial loading');
 await p.keyboard.down('a');await p.waitForFunction(()=>HARBOR.seamlessCampusV115.snapshot().x<800);await p.keyboard.up('a');await p.keyboard.down('s');await p.waitForFunction(()=>ROOKIE_PARKING_ENCOUNTER.locked());await p.keyboard.up('s');
 const stopped=await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot()),cam=await p.evaluate(()=>HARBOR.seamlessCampusV115.entranceQA());await p.waitForTimeout(300);const mid=await p.evaluate(()=>HARBOR.seamlessCampusV115.entranceQA());assert(Math.hypot(cam.cameraX-mid.cameraX,cam.cameraY-mid.cameraY)>3);
 await p.waitForFunction(()=>ROOKIE_PARKING_ENCOUNTER.qa().phase==='dialogue');assert.equal(await p.evaluate(()=>HARBOR.speech.current().speaker),'Chicken');await p.screenshot({path:out+'/prototype.png'});
 const lines=[];while(await p.evaluate(()=>ROOKIE_PARKING_ENCOUNTER.qa().phase==='dialogue')){lines.push(await p.evaluate(()=>HARBOR.speech.current().full));await p.evaluate(()=>ROOKIE_COMIC.advance());await p.waitForTimeout(80);}
 assert.equal(lines.length,2);await p.waitForFunction(()=>!ROOKIE_PARKING_ENCOUNTER.locked());assert.equal((await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot())).x,stopped.x);assert.equal((await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot())).y,stopped.y);assert.equal((await p.evaluate(()=>HARBOR.seamlessCampusV115.entranceQA())).zoom,1.25);
 assert(await p.evaluate(()=>ROOKIE_PARKING_ENCOUNTER.qa().completed));const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem(HARBOR.profiles.key('jay'))));assert.equal(saved.connectedEvents.precinctParkingEncounter,true);
 await p.keyboard.down('d');await p.waitForTimeout(180);await p.keyboard.up('d');assert((await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot())).x>stopped.x);
 await p.reload();await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());assert(await p.evaluate(()=>ROOKIE_PARKING_ENCOUNTER.qa().completed));
 report.prototype={nativeTrigger:true,smoothPan:true,lines,playerPositionPreserved:true,cameraRestored:true,controlsRestored:true,persistedReload:true};assert.deepEqual(report.errors,[]);fs.writeFileSync(out+'/prototype-results.json',JSON.stringify(report,null,2));console.log('PASS prototype: actual on-foot trigger, native camera pan, two native speech bubbles, restoration and per-profile save/reload');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

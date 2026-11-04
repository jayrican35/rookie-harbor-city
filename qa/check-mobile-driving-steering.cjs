'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1');await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());
 await p.evaluate(()=>{const h=window.HARBOR;h.profiles.choose('jay');const data=JSON.parse(localStorage.getItem(h.profiles.key('jay')));data.connectedCruiser={id:'precinct-unit-9',x:1920,y:1380,angle:0,lightMode:'off'};h.importSave(data);h.dismissTransient();h.seamlessCampusV115.openAt(1920,1310,.9)});await p.locator('#v115CampusInteract').click();
 const cdp=await p.context().newCDPSession(p),point=async role=>{const b=await p.locator('[data-car="'+role+'"]').boundingBox();assert(b.x>=0&&b.x+b.width<=390);return {x:b.x+b.width/2,y:b.y+b.height/2};};
 const gas=await point('up'),right=await point('right');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...gas,id:1},{...right,id:2}]});await p.waitForTimeout(800);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const turning=await p.evaluate(()=>window.HARBOR.seamlessCampusV115.cruiserQA().snapshot());assert(turning.driving&&turning.speed>40&&turning.angle>.1,'Real simultaneous GAS and steering touches turn the moving cruiser');
 const stop=await point('brake');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...stop,id:3}]});await p.waitForTimeout(800);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const stopped=await p.evaluate(()=>({car:window.HARBOR.seamlessCampusV115.cruiserQA().snapshot(),camera:window.HARBOR.seamlessCampusV115.entranceQA()}));assert(Math.abs(stopped.car.speed)<.1&&stopped.camera.follows);assert.equal(errors.length,0);await p.screenshot({path:'docs/driving-repair/mobile-driving.png'});await p.locator('#v115CampusInteract').click();assert(!await p.evaluate(()=>window.HARBOR.seamlessCampusV115.cruiserQA().active()));
 fs.writeFileSync('docs/driving-repair/mobile-steering.json',JSON.stringify({turning,stopped,errors,realMultiTouch:true,physicalHandset:false},null,2));console.log('PASS 390x844 simultaneous native GAS/steer touches, STOP, camera and exit');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

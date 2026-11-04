'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='cruiser-turning-evidence';fs.mkdirSync(out,{recursive:true});
let p;const held=new Set();
const sample=()=>p.evaluate(()=>window.HARBOR.seamlessCampusV115.cruiserQA().snapshot());
async function keys(list){const wanted=new Set(list.filter(Boolean));for(const k of held)if(!wanted.has(k)){await p.keyboard.up(k);held.delete(k);}for(const k of wanted)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}}
async function stop(){await keys(['Space']);await p.waitForFunction(()=>Math.abs(window.HARBOR.seamlessCampusV115.cruiserQA().snapshot().speed)<.8,{},{timeout:6000});await keys([]);}
async function fixture(x,y,angle=0){
 await keys([]);await p.evaluate(v=>{const h=window.HARBOR,c=h.seamlessCampusV115;c.close();const data=JSON.parse(localStorage.getItem(h.profiles.key('jay')));data.connectedCruiser={id:'precinct-unit-9',x:v.x,y:v.y,angle:v.angle,lightMode:'off'};h.importSave(data);h.dismissTransient();if(!c.openAt(v.x+Math.sin(v.angle)*70,v.y-Math.cos(v.angle)*70,1.5))throw Error('Blocked fixture approach');}, {x,y,angle});
 await p.waitForFunction(()=>window.ROOKIE_CRUISER_VISUAL.status().status==='ready');await p.waitForTimeout(100);
 const s=await sample();assert(!await p.evaluate(v=>window.HARBOR.seamlessCampusV115.cruiserQA().collisionAt(v.x,v.y,v.angle),s),'Fixture is an actual clear physical position');
 await p.keyboard.press('e');assert((await sample()).driving);
 await p.waitForFunction(()=>window.HARBOR.seamlessCampusV115.cruiserQA().snapshot().visual.draws>0);
}
async function circle(label,steer,reverse=false){
 await fixture(1920,steer==='a'?1445:1380);const before=await sample(),seen=new Set(),screens=new Set(),wanted=new Set([1,3,10,14]);
 const start=Date.now();while(Date.now()-start<9000){
  const s=await sample();seen.add(s.visual.index);await keys([steer,Math.abs(s.speed)<72?(reverse?'s':'w'):Math.abs(s.speed)>94?'Space':null]);
  if(label==='clockwise'&&wanted.has(s.visual.index)&&!screens.has(s.visual.index)){await p.screenshot({path:`${out}/game-angle-${s.visual.index}.png`});screens.add(s.visual.index);}
  await p.waitForTimeout(40);
 }
 await stop();const after=await sample();assert.equal(seen.size,16,label+' visits every pose through real steering');assert(after.visual.frameChanges>=16);assert(after.visual.draws>0);assert(Math.abs(after.angle-before.angle)>Math.PI*2);
 return {label,reverse,seen:[...seen].sort((a,b)=>a-b),before,after};
}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),results={};try{
 p=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8767/evidence/cruiser-turning/');await p.waitForFunction(()=>window.cruiserInspector?.sample().assets.status==='ready');
 for(let i=0;i<16;i++){await p.selectOption('#direction',String(i));await p.waitForFunction(i=>window.cruiserInspector.sample().visual.index===i,i,{timeout:4000});assert.equal((await p.evaluate(()=>window.cruiserInspector.sample())).visual.index,i);}
 await p.selectOption('#lights','alternating');await p.selectOption('#direction','15');await p.screenshot({path:out+'/viewer-desktop.png'});
 await p.locator('#speed').focus();await p.keyboard.press('End');await p.locator('#cw').click();await p.waitForTimeout(2300);assert(!(await p.evaluate(()=>window.cruiserInspector.sample())).paused);
 await p.locator('#ccw').click();assert.equal((await p.evaluate(()=>window.cruiserInspector.sample())).sign,-1);await p.locator('#pause').click();assert((await p.evaluate(()=>window.cruiserInspector.sample())).paused);
 results.viewer={allDirections:true,cw:true,ccw:true,pause:true,lights:true};
 await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1&cruiserCandidate=1');await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());await p.evaluate(()=>window.HARBOR.profiles.choose('jay'));
 results.clockwise=await circle('clockwise','d');results.counterclockwise=await circle('counterclockwise','a');results.reverse=await circle('reverse','d',true);
 await fixture(1760,1650,Math.PI/2);await keys(['s']);await p.waitForFunction(()=>window.HARBOR.seamlessCampusV115.cruiserQA().snapshot().y<1590,{},{timeout:7000});await stop();results.reverseParking=await sample();assert(Math.abs(results.reverseParking.x-1760)<1);assert(results.reverseParking.y>=1561&&results.reverseParking.y<=1574,'Entire 96-unit footprint fits between the marked bay ends');assert.equal(results.reverseParking.visual.index,4,'Reversing never flips the nose to the travel direction');await p.screenshot({path:out+'/reverse-parking.png'});
 await fixture(1000,2800);await keys(['w','d']);await p.waitForFunction(()=>window.HARBOR.seamlessCampusV115.cruiserQA().snapshot().speed>180,{},{timeout:6000});await keys(['Space','d']);await p.waitForTimeout(180);results.handbrake=await sample();assert(results.handbrake.visual.effectCount>0);await p.screenshot({path:out+'/handbrake-cosmetics.png'});await stop();
 for(const [name,x,y,a] of [['downtown-corner',5829,1640,-Math.PI/2],['marina-road',3700,3744,0]]){
  await fixture(x,y,a);await keys(['w']);await p.waitForTimeout(500);await keys(['w','d']);await p.waitForTimeout(450);await stop();const s=await sample();assert(Math.hypot(s.x-x,s.y-y)>15);assert(s.visual.draws>0);results[name]=s;await p.screenshot({path:out+'/'+name+'.png'});
 }
 await p.keyboard.press('l');await p.waitForTimeout(400);assert.equal((await sample()).lightMode,'alternating');await p.keyboard.press('l');assert.equal((await sample()).lightMode,'red');await p.keyboard.press('l');assert.equal((await sample()).lightMode,'blue');await p.keyboard.press('l');assert.equal((await sample()).lightMode,'off');
 await p.keyboard.press('e');assert(!(await sample()).driving);await p.keyboard.press('e');assert((await sample()).driving);
 assert.equal(errors.length,0);results.errors=errors;await p.close();
 p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1&cruiserCandidate=1');await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());await p.evaluate(()=>window.HARBOR.profiles.choose('jay'));await fixture(1920,1380);await p.locator('#connectedCruiserLight').click();assert.equal((await sample()).lightMode,'alternating');await p.screenshot({path:out+'/game-mobile.png'});results.mobile=await sample();
 fs.writeFileSync(out+'/gameplay.json',JSON.stringify(results,null,2));console.log('PASS actual-game all 16 poses in CW/CCW/reverse circles, handbrake cosmetics, downtown corner, marina road, four light modes, entry/exit and mobile renderer');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

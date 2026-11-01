'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
// Reuse the real connected-world input/RAF harness, loading authentic waterfront
// geometry plus its original solid finalizer before the existing campus module.
let harness=fs.readFileSync(path.join(__dirname,'check-v115-campus.cjs'),'utf8');
harness=harness.slice(0,harness.indexOf("assert(api,'No campus API');"));
harness=harness.replace('const geoms=',`for(const id of ['waterfront','southbay']){const start=sourceEngine.indexOf('MAPS.'+id+' = {'),end=sourceEngine.indexOf('\\n};',start)+3;vm.runInNewContext(sourceEngine.slice(start,end),mapContext);}
const finalStart=sourceEngine.indexOf('Object.keys(MAPS).forEach(function(id){'),finalEnd=sourceEngine.indexOf('/* ==================== PEDESTRIANS',finalStart);vm.runInNewContext(sourceEngine.slice(finalStart,finalEnd),mapContext);
const geoms=`);
harness=harness.replace('vm.runInContext(src,sandbox',`sandbox.Image=function(){return {complete:true,naturalWidth:1254,naturalHeight:1254};};sandbox.performance={now:()=>0};sandbox.location={search:''};ctx.clip=()=>{};ctx.rotate=()=>{};
vm.runInContext(fs.readFileSync(path.join(directory,'v116-marina.js'),'utf8'),sandbox);
vm.runInContext(src,sandbox`);
const extra=`
const marina=window.ROOKIE_V116_MARINA;
assert.equal(marina.interiors.length,4);
const b=marina.interiors[0],door=b.door;
const tick=(time,n)=>{for(let i=0;i<n;i++){const id=queue.keys().next().value;assert(id);const fn=queue.get(id);queue.delete(id);fn(time+i*1000/60);}};
const key=(key,pressed)=>window.events[(pressed?'keydown':'keyup')+'_capture']({key,preventDefault(){},stopImmediatePropagation(){}});
let offscreenStationPaints=0;sandbox.drawRoom=()=>offscreenStationPaints++;
assert(api.openAt(door.x,3744,2));
const mapBefore=sandbox.state.map;key('w',true);
const positions=[];for(let i=0;i<132;i++){tick(100+i*1000/60,1);positions.push(api.test.position());}
key('w',false);tick(2400,20);
assert.equal(offscreenStationPaints,0,'Do not bake offscreen precinct rooms while exploring marina');
assert.equal(api.isOpen(),true);assert.equal(sandbox.state.map,mapBefore);
assert(marina.interiorAt(api.test.position().x,api.test.position().y)?.id===b.id,'Jay must walk from promenade into café');
assert(b.roof<.01,'Roof must reveal the furnished café');
for(let i=1;i<positions.length;i++)assert(Math.hypot(positions[i].x-positions[i-1].x,positions[i].y-positions[i-1].y)<11,'No teleport at the doorway');
assert(b.furniture.filter(f=>f.type==='table').length===2);
assert(marina.actors.some(a=>a.building===b.id));
for(const f of b.furniture.filter(f=>f.solid))assert(api.test.blocked(f.x+f.w/2,f.y+f.h/2),'Furniture must be physical: '+f.id);
for(const wall of b.walls)assert(api.test.blocked(wall.x+wall.w/2,wall.y+wall.h/2));
for(let y=door.y-28;y<door.y+35;y+=2)assert(!api.test.blocked(door.x,y),'No collision seam at door '+y);
const indoor=marina.interactions.find(s=>s.building===b.id);assert(marina.interactionAvailable(indoor,door.x,door.y-25));assert(!marina.interactionAvailable(indoor,door.x,door.y+60));
// Go back outside with the same held-key path, without recreating the scene.
key('s',true);tick(3000,132);key('s',false);tick(5300,40);
assert(api.test.position().y>door.y+40);assert(b.roof>.99);assert.equal(api.isOpen(),true);assert.equal(sandbox.state.map,mapBefore);
assert.equal(marina.interiorFurniture({x:0,y:0,w:10,h:10}).length,0,'Cull offscreen interiors');
assert.equal(api.snapshot().worldId,'harbor-main');assert.equal(api.snapshot().committedToSave,false);
api.close();
// Reuse exactly the same held-key doorway test for every existing footprint.
for(const other of marina.interiors.slice(1)){
 const d=other.door;assert(api.openAt(d.x,3744,1.3));key('w',true);
 const steps=Math.ceil((3744-d.y+36)/(210/60));tick(6000,steps);key('w',false);tick(9000,30);
 assert(marina.interiorAt(api.test.position().x,api.test.position().y)?.id===other.id,'Seamless entry '+other.id);assert(other.roof<.01);
 for(const wall of other.walls)assert(api.test.blocked(wall.x+wall.w/2,wall.y+wall.h/2));
 for(const f of other.furniture.filter(f=>f.solid))assert(api.test.blocked(f.x+f.w/2,f.y+f.h/2));
 assert(marina.actors.some(a=>a.building===other.id));
 key('s',true);tick(10000,steps);key('s',false);tick(13000,35);assert(api.test.position().y>d.y+40);assert(other.roof>.99);api.close();
}
sandbox.state.map='training';api.open();assert(!api.isOpen());
console.log('PASS seamless café: continuous promenade→door→furnished floor→outside, physical furniture/walls, smooth roof restore, same world/state/canvas, culled rooms, protected modes excluded');
`;
vm.runInNewContext(harness+extra,{require,__dirname,console,process},{filename:'reused-campus-interior-harness.cjs'});

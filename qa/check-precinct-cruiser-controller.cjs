'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const engine=fs.readFileSync('published-game-capture/game.js','utf8'),compiled=fs.readFileSync('site/preview/civilian-updated/precinct-cruiser.compiled.js','utf8');
const start=engine.indexOf('var carReboundTime=0;'),end=engine.indexOf('function updateDriveUI()',start),canonical=engine.slice(start,end);
assert(compiled.includes(canonical),'Reuse the exact original controller source');
assert(!/requestAnimationFrame|setInterval|setTimeout/.test(compiled),'One existing simulation clock');
const expression=compiled.match(/const controllerFactory=([\s\S]*?);\r?\nfunction valid/)[1];
const factory=Function('carCorners','return ('+expression+')')(()=>[]);
for(const hz of [30,60,120]){
 const car={x:0,y:0,angle:0,speed:0,engine:true},keys={up:true},proxy={__carSpace:false};let hits=0,rebounded=false;
 const update=factory(car,keys,proxy,x=>x>110,()=>{},()=>hits++);
 for(let i=0;i<3*hz;i++){update(1/hz,i/hz);assert(car.x<=110,'Collision stops forward penetration');if(car.speed<0)rebounded=true}
 assert(hits>0&&rebounded,'Canonical collision feedback and rebound retained');
 keys.up=false;proxy.__carSpace=true;for(let i=0;i<hz;i++)update(1/hz,i/hz);assert.equal(car.speed,0,'Parking stop clamps forward/reverse speed to zero');
 proxy.__carSpace=false;keys.down=true;for(let i=0;i<hz;i++)update(1/hz,i/hz);assert(car.speed<0&&car.speed>=-92,'Canonical brake/reverse retained');
 keys.down=false;keys.left=true;const a=car.angle;for(let i=0;i<hz/4;i++)update(1/hz,i/hz);assert(car.angle>a,'Steering reverses correctly while backing');
}
console.log('PASS exact canonical controller binding, collision/rebound, STOP, reverse and reverse steering at 30/60/120 Hz; no extra simulation loop');

'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const compiled=fs.readFileSync('site/preview/civilian-updated/precinct-cruiser.compiled.js','utf8'),original=fs.readFileSync('published-game-capture/game.js','utf8');
const factory=Function('carCorners','return ('+compiled.match(/const controllerFactory=([\s\S]*?);\r?\nfunction valid/)[1]+')')(()=>[]);
const impact=original.slice(original.indexOf('      /* Stage C:'),original.indexOf('  syncPlayerToCar();',original.indexOf('      /* Stage C:')));
assert(compiled.includes(impact),'Original Wild Arcade impact/rebound and escape pipeline retained');
const results=[];
for(const hz of [30,60,120]){
 const car={x:0,y:0,speed:0,angle:0,engine:true},keys={left:true},proxy={__carSpace:false};
 const update=factory(car,keys,proxy,()=>false,()=>{},()=>{});
 const step=(seconds)=>{for(let i=0;i<seconds*hz;i++)update(1/hz,i/hz)};
 step(1);assert.equal(car.angle,0,'No stationary rotation');keys.left=false;keys.up=true;step(1);assert(car.speed>150&&car.speed<190);const one=car.speed;step(1);assert(car.speed>one&&car.speed<=265);
 keys.up=false;const before=car.speed;step(.5);assert(Math.abs(car.speed-before+18)<1e-8,'Predictable coast');
 car.speed=265;keys.right=true;const a=car.angle;step(1);const highYaw=car.angle-a;assert(highYaw>.7&&highYaw<1.15,'High-speed steering bounded');
 keys.right=false;proxy.__carSpace=true;keys.up=true;step(1);assert.equal(car.speed,0,'STOP overrides gas, never becomes reverse');
 proxy.__carSpace=false;keys.up=false;keys.down=true;step(1);assert(car.speed<0&&car.speed>=-92);keys.right=true;const r=car.angle;step(.5);assert(car.angle<r,'Reverse steering uses signed velocity');
 keys.down=false;keys.right=false;proxy.__carSpace=true;step(1);assert.equal(car.speed,0);
 let hits=0;const c={x:0,y:0,speed:0,angle:0,engine:true},k={up:true};const impactUpdate=factory(c,k,{},x=>x>110,()=>{},()=>hits++);let rebound=false;
 for(let i=0;i<3*hz;i++){impactUpdate(1/hz,i/hz);assert(c.x<=110);if(c.speed<0)rebound=true}assert(hits&&rebound);
 results.push({hz,oneSecondSpeed:one,highYaw});
}
assert(Math.max(...results.map(r=>r.oneSecondSpeed))-Math.min(...results.map(r=>r.oneSecondSpeed))<.001,'Exponential acceleration independent of frame rate');
assert(Math.max(...results.map(r=>r.highYaw))-Math.min(...results.map(r=>r.highYaw))<.03,'Steering response consistent at 30/60/120 Hz');
fs.mkdirSync('docs/driving-repair',{recursive:true});fs.writeFileSync('docs/driving-repair/handling.json',JSON.stringify(results,null,2));console.log('PASS handling, brake priority, coast, reverse, stationary heading, original impacts and 30/60/120 Hz',results);

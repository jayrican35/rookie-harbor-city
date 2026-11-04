'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};vm.runInNewContext(fs.readFileSync('published-game-capture/connected-traffic.js','utf8'),{window,Math,Map,Set});
const T=window.ROOKIE_CITY_TRAFFIC;
const roads=[{x:-700,y:-78,w:2100,h:156},{x:-78,y:-700,w:156,h:1400},{x:622,y:-700,w:156,h:1400}];
const fleet=T.create({roads,blocked:()=>false,districtAt:()=> 'downtown',count:10});assert.equal(fleet.cars.length,10);assert(fleet.graph.live.size>=10);
let checks=0,maxStep=0;const seen=new Set();
for(let tick=0;tick<18000;tick++){
 const before=fleet.cars.map(c=>({x:c.x,y:c.y}));fleet.step(1/30);
 for(let i=0;i<fleet.cars.length;i++){const c=fleet.cars[i],moved=Math.hypot(c.x-before[i].x,c.y-before[i].y);maxStep=Math.max(maxStep,moved);assert(moved<5,'No visible teleport');seen.add(c.leg);for(const p of T.corners(c,c.length,38))assert(fleet.graph.inside(p.x,p.y),'Full body on road');}
 if(tick%10===0)for(let i=0;i<fleet.cars.length;i++)for(let j=i+1;j<fleet.cars.length;j++){checks++;assert(!T.overlap(fleet.cars[i],fleet.cars[j]),'Traffic bodies must not overlap');}
}
const m=fleet.metrics();assert(m.turnKinds.includes('left')&&m.turnKinds.includes('right'));assert(m.distinctTransitions>=8);assert(m.maxWait<30,'No permanent frozen queues');
const pedestrians=[];const yieldFleet=T.create({roads,blocked:()=>false,districtAt:()=> 'residential',count:1,actors:()=>pedestrians});
const visitor=yieldFleet.cars[0];pedestrians.push({x:visitor.x+Math.cos(visitor.angle)*110,y:visitor.y+Math.sin(visitor.angle)*110});
for(let i=0;i<90;i++){yieldFleet.step(1/30);assert(Math.hypot(visitor.x-pedestrians[0].x,visitor.y-pedestrians[0].y)>visitor.length/2+10,'Yield before reaching a pedestrian');}
const stopped={x:visitor.x,y:visitor.y};pedestrians.length=0;for(let i=0;i<180;i++)yieldFleet.step(1/30);assert(Math.hypot(visitor.x-stopped.x,visitor.y-stopped.y)>30,'Resume when the pedestrian clears');
const report={threeRoads:true,intersections:2,seconds:600,bodyChecks:checks,maxStep,visitedLegs:seen.size,...m};
fs.mkdirSync('docs/driving-repair',{recursive:true});fs.writeFileSync('docs/driving-repair/three-road-test.json',JSON.stringify(report,null,2));console.log('PASS three-road traffic',report);

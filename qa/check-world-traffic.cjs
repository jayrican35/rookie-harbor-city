'use strict';
// Test the actual bounded traffic functions from the compiled V115 world
// before any browser/GitHub Pages deployment.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../published-game-capture');
const src=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const road=fs.readFileSync(path.join(root,'v115-world.js'),'utf8');
const graph=road.match(/segments:Object\.freeze\(\[([\s\S]*?)\]\.map\(r=>Object\.freeze\(r\)\)\)/);
assert(graph);const links=Function('return ['+graph[1]+']')();
const begin=src.indexOf('  const streetTraffic=[];'),end=src.indexOf('  const campus={open:false,',begin);
assert(begin>=0&&end>begin,'Native engine must own the street traffic pilot');
const code=src.slice(begin,end);
assert(!/requestAnimationFrame|setInterval|setTimeout|localStorage|fetch\s*\(|Audio|Image\(/.test(code),
 'Traffic may not create a parallel driving engine, assets, network calls or new timers');
const player={x:0,y:4000,zoom:1};
const browser={};
const simulator=new Function('links','campus','Math','window','cruiser',code+'\nreturn {streetTraffic,initializeStreetTraffic,stepStreetTraffic,streetPose,trafficBlocked,drawStreetTraffic};');
const {streetTraffic,initializeStreetTraffic,stepStreetTraffic,streetPose,trafficBlocked,drawStreetTraffic}=simulator(links,player,Math,browser,null);
const parked={active:()=>false,yields:()=>false,overlapsTraffic:c=>Math.abs(c.x+2850)<110&&Math.abs(c.y-1754)<50};
const reserved=simulator(links,{x:0,y:4500,zoom:1},Math,browser,parked);reserved.initializeStreetTraffic();
assert(reserved.streetTraffic.every(c=>!parked.overlapsTraffic(c)),'Ambient spawn never overlaps a saved cruiser');
initializeStreetTraffic();initializeStreetTraffic();
assert.equal(streetTraffic.length,18,'Exactly one bounded fleet, never duplicate spawns');
assert(streetTraffic.some(x=>x.kind==='patrol'));
assert(streetTraffic.some(x=>x.kind==='delivery'));
assert(streetTraffic.some(x=>x.kind==='civilian'));
const inRoad=(p)=>links.some(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);
for(const c of streetTraffic){assert(inRoad(c),'Traffic spawn leaves connected authored asphalt: '+c.id);assert(c.x>=-2850&&c.x<=9380);}
for(let i=0;i<100;i++)stepStreetTraffic(.035);
for(const c of streetTraffic)assert(inRoad(c),'Moving traffic left the authored road '+c.id);
const car=streetTraffic[0],original=car.progress;
player.x=car.x;player.y=car.y;stepStreetTraffic(.05);
assert.equal(car.progress,original,'Traffic should yield safely near Jay');
assert(trafficBlocked(car.x,car.y,12),'Cars participate in existing player collision');
assert(!trafficBlocked(0,5000,12),'No phantom car collision outside the arterial');
player.y=4500;stepStreetTraffic(.05);assert(car.progress>original,'Car resumes once Jay is clear');
// Long enough for the original faster cars to catch and overlap slower cars.
player.x=0;player.y=4500;
let minimumGap=Infinity,pairChecks=0;
const body=c=>{const h=c.dir==='left'||c.dir==='right',len=c.kind==='delivery'?104:86;return {x:c.x-(h?len:38)/2,y:c.y-(h?38:len)/2,w:h?len:38,h:h?38:len}};
for(let frame=0;frame<72000;frame++){
 stepStreetTraffic(.05);
 if(frame%20===0){
  const sorted=streetTraffic.slice().sort((a,b)=>a.progress-b.progress),loop=2*(9380+2850)+2*(1815-1754);
  sorted.forEach((a,i)=>{const b=sorted[(i+1)%sorted.length],gap=(b.progress-a.progress+loop)%loop;minimumGap=Math.min(minimumGap,gap);assert(gap>=141.99,'Following gap survives catching, queueing and loop wrap');});
  for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){const a=body(sorted[i]),b=body(sorted[j]);pairChecks++;assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'Actual traffic bodies never overlap, including turns');}
 }
}
// A stopped pedestrian creates a real queue; followers never occupy its leader.
player.x=streetTraffic[0].x;player.y=streetTraffic[0].y;
for(let i=0;i<600;i++)stepStreetTraffic(.05);
const queued=streetTraffic.slice().sort((a,b)=>a.progress-b.progress),loop=2*(9380+2850)+122;
queued.forEach((a,i)=>assert((queued[(i+1)%queued.length].progress-a.progress+loop)%loop>=141.99));
let draws=0;
const g={save(){},restore(){},translate(){},rotate(){},fillRect(){draws++},
 beginPath(){},ellipse(){},fill(){},set fillStyle(v){this.color=v;}};
for(const c of streetTraffic)drawStreetTraffic(g,c);
assert(draws>100,'18 real styled vehicles draw through the existing Canvas');
let delegated=0;const beforeDraws=draws;
browser.ROOKIE_V135_WALL_KIT={drawPilotVehicle(context,vehicle){assert.equal(context,g);assert(vehicle.id);delegated++;return true;}};
for(const c of streetTraffic)drawStreetTraffic(g,c);
assert.equal(delegated,18,'Existing traffic painter delegates artwork to the guarded pilot hook');
assert.equal(draws,beforeDraws,'Do not draw old and new vehicle bodies twice');
assert(src.includes('stepStreetTraffic(dt);'),'Single native simulation owns movement');
assert(src.includes('trafficBlocked(x,y,r)'),'Same player collider sees vehicle bodies');
assert(src.includes('entries.push({y:car.y,trafficCar:car})'),'Traffic sorted with all characters and props');
assert(!src.includes('createStreetTrafficLoop('));
if(fs.existsSync('cruiser-evidence'))fs.writeFileSync('cruiser-evidence/traffic.json',JSON.stringify({cars:18,simulatedSeconds:3600,queuedSeconds:30,minimumGap,pairChecks,bodyOverlaps:0,savedCruiserSpawnClear:true},null,2));
console.log('PASS Harbor City living roads: 18 persistent ambient cars on one contiguous artery, yield/collision/depth with no engine duplication');

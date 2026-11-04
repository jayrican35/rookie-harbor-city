'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('published-game-capture/cruiser-visuals.js','utf8');
const manifest=JSON.parse(fs.readFileSync('published-game-capture/assets/police-driving/turning/manifest.json','utf8'));
assert(!/requestAnimationFrame|setInterval|setTimeout|localStorage|Math\.random/.test(source),'Visual adapter owns no clock, saves or randomness');
assert.equal(new Set(manifest.frames.map(f=>f.sha256)).size,16);
assert.equal(manifest.pixelBodyRotationsInExport,0);assert.equal(manifest.bodyMirrorsInExport,0);
manifest.frames.forEach((f,i)=>{assert.equal(f.angleDegrees,i*22.5);assert.deepEqual(f.anchor,[128,168]);assert.equal(f.visualHeadingOffset,0);for(const lens of Object.values(f.lighting))assert(lens.polygon.length>=3);});
let fetches=0;const window={};class FakeImage{set src(v){this.naturalWidth=this.naturalHeight=1024;this.complete=true;queueMicrotask(()=>this.onload());}}
vm.runInNewContext(source,{window,Image:FakeImage,fetch:async()=>{fetches++;return {ok:true,json:async()=>manifest};},Math,Number,Promise,Object,Error});
const V=window.ROOKIE_CRUISER_VISUAL;
const calls=[];const g=new Proxy({drawImage(...args){calls.push(args);}}, {get:(o,k)=>o[k]||(()=>{})});
const pose=(angle,lightMode='off',speed=0)=>Object.freeze({x:120.25,y:80.75,angle,speed,lightMode});
(async()=>{
 const p=V.load();assert.equal(V.load(),p);await p;assert.equal(fetches,1);
 for(let i=0;i<16;i++){
  const v=V.create(),car=pose(i*Math.PI/8);V.update(v,car,1/60);calls.length=0;
  assert(V.draw(g,v,car,{candidate:true}));const s=V.inspect(v);
  assert.equal(s.index,i);assert.equal(calls.length,1,'One opaque body draw, no silhouette crossfade');
  assert.deepEqual(Array.from(calls[0].slice(1,5)),manifest.frames[i].rect);
  assert.deepEqual(Array.from(s.lastDraw.anchor),[car.x,car.y]);
  assert.deepEqual(Array.from(s.lastDraw.shadow.center),[car.x+2,car.y+4]);
  assert.deepEqual(Array.from(s.lastDraw.shadow.radii),[49,25]);
  assert.equal(s.lastDraw.activeLight,'off');assert.equal(car.angle,i*Math.PI/8);
 }
 // A very small boundary wobble must not alternate between adjacent images.
 const v=V.create();V.update(v,pose(0),.05);
 for(let i=0;i<200;i++)V.update(v,pose((11.2+(i%2?.3:-.3))*Math.PI/180),1/60);
 assert.equal(V.inspect(v).index,0);
 for(let i=0;i<30;i++)V.update(v,pose(13*Math.PI/180),1/60);assert.equal(V.inspect(v).index,1);
 for(let i=0;i<200;i++)V.update(v,pose((11.2+(i%2?.3:-.3))*Math.PI/180),1/60);
 assert.equal(V.inspect(v).index,1,'Tolerance is stable on both sides of the boundary');
 for(const sign of [1,-1]){
  const s=V.create(),seen=new Set();let previous=null;
  for(let i=0;i<900;i++){
   const car=pose(sign*i*Math.PI/180,'off',-60);V.update(s,car,1/60);V.draw(g,s,car,{candidate:true});
   const t=V.inspect(s);seen.add(t.index);if(previous!==null)assert([0,1,15].includes((t.index-previous+16)%16),'Seam selects only adjacent poses');
   assert(Math.abs(t.lastDraw.residual)<=.0384);previous=t.index;
  }assert.equal(seen.size,16,'CW, CCW and reverse motion visit all poses');
 }
 const lit=V.create(),colors=new Set();
 for(let i=0;i<80;i++){const car=pose(0,'alternating');V.update(lit,car,.02);V.draw(g,lit,car,{candidate:true});colors.add(V.inspect(lit).lastDraw.activeLight);}
 assert(colors.has('red')&&colors.has('blue'));
 for(const mode of ['off','red','blue'])for(let i=0;i<40;i++){const car=pose(0,mode);V.update(lit,car,.02);V.draw(g,lit,car,{candidate:true});assert.equal(V.inspect(lit).lastDraw.activeLight,mode);}
 const fx=V.create();for(let i=0;i<120;i++)V.update(fx,pose(i*.03,'off',190),1/60,{brake:i>10});assert(V.inspect(fx).effectCount>0&&V.inspect(fx).effectCount<=48);
 for(let i=0;i<240;i++)V.update(fx,pose(0),1/60);assert.equal(V.inspect(fx).effectCount,0,'Cosmetic effects expire and stay bounded');
 assert.equal(V.draw(g,V.create(),pose(0),{legacy:true,candidate:true}),false,'Reversible legacy branch remains available');
 const bad=JSON.parse(JSON.stringify(manifest));bad.frames[0].rect[2]=128;const other={};vm.runInNewContext(source,{window:other,Image:FakeImage,fetch:async()=>({ok:true,json:async()=>bad}),Math,Number,Promise,Object,Error});assert.equal(await other.ROOKIE_CRUISER_VISUAL.load(),false);assert.equal(other.ROOKIE_CRUISER_VISUAL.status().status,'fallback','A malformed atlas falls back instead of slicing the car incorrectly');
 console.log('PASS 16 distinct poses, constant anchors/shadows, no body crossfade, jitter tolerance, CW/CCW/wrap/reverse, four light states, bounded cosmetics and unchanged frozen vehicles');
})().catch(e=>{console.error(e);process.exitCode=1});

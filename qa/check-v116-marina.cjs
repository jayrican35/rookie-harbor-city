'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'published-game-capture');
const s=fs.readFileSync(path.join(dir,'v116-marina.js'),'utf8');
const campus=fs.readFileSync(path.join(dir,'v115-campus.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'v116-marina.css'),'utf8');
assert(!/(localStorage\.|state\.map\s*=|MAPS\.|\boutbreak\s*=|\.saveGame\s*\(|fetch\s*\()/g.test(s),'Unsafe main-mode changes');
assert(s.includes("const WORLD='harbor-main'")&&s.includes('PIER_X=Object.freeze([4655,5105,5555])'));
assert(campus.includes('marina.background(g,{zoom:campus.zoom,view},t)'));
assert(campus.includes('marina.stepNPCs(dt)'));
assert(campus.includes('marina.blocksProp(x,y,r)'));
assert(css.includes('v116-play-mode')&&css.includes('.v115-campus-note'));
for(const name of ['marina-tiles','marina-cafe','bait-and-tackle','marina-office','boat-service','marina-kiosk','boat-motor','boat-sail','boat-fishing','marina-people','marina-gulls']){
 const f=path.join(dir,'assets/v116-marina',name+'.png');assert(fs.statSync(f).size>250,name);
}
const proto={complete:true,naturalWidth:256};
const mock={window:{},Image:function(){return {...proto}},document:{readyState:'loading',addEventListener(){}},performance:{now:()=>0},location:{search:''},Math,Map,Set,Object,Number,Array,JSON,console};
vm.runInNewContext(s,mock,{filename:'v116-marina.js'});
const m=mock.window.ROOKIE_V116_MARINA;assert(m,'V116 module not exposed');
assert.equal(m.worldId,'harbor-main');assert.equal(m.actors.length,9);assert(m.interactions.length>=9);assert.equal(m.interiors.length,4);
assert.equal(m.blocksProp(5150,3710,12),false,'Promenade must be walkable');
assert.equal(m.blocksProp(4470,3290,12),true,'Shop wall must be solid while its doorway stays open');
assert.equal(m.blocksProp(5145,3920,12),false,'Existing pier must remain walkable');
assert.equal(m.blocksProp(5000,3920,12),true,'Open water must block movement');
assert.equal(m.blocksProp(3000,4400,12),false,'World outside marina unchanged');
assert.equal(m.setTestEnabled(false),false,'No release runtime debug toggle');
assert.equal(m.metrics().multiplayerTransport,'none');
console.log('PASS V116: original marina pier coordinates, 11 raster sprites, integrated actors, world collision and scope-safe renderer');
// Render regressions: delayed atlas decoding, exact native pier coverage and
// water animation must agree with the same world geometry at every zoom.
const draws=[],waves=[],pendingImages=[];
let pen=null;
const paint={save(){},restore(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){pen=null;},rect(){},clip(){},ellipse(){},fill(){},
 drawImage(...args){draws.push(args);},moveTo(x,y){pen=[x,y];},lineTo(x,y){if(pen)waves.push([...pen,x,y]);},stroke(){}};
const renderMock={...mock,window:{},Image:function(){const im={complete:false,naturalWidth:0};pendingImages.push(im);return im;},
 document:{...mock.document,createElement(){return {getContext:()=>({...paint,drawImage(){}})};}}};
vm.runInNewContext(s,renderMock);
const renderer=renderMock.window.ROOKIE_V116_MARINA;
const view={x:4352,y:3220,w:1792,h:1436};
renderer.background(paint,{zoom:1.1,view},0);
assert.equal(renderer.metrics().chunkCacheCount,0,'Undecoded atlas must not create permanent blank chunks');
for(const im of pendingImages){im.complete=true;im.naturalWidth=256;}
for(const zoom of [.35,.82,1.04,1.8]){
 draws.length=0;waves.length=0;
 renderer.background(paint,{zoom,view},12345);
 assert(renderer.metrics().chunkCacheCount>0,'Terrain must recover after decode without reload');
 assert(renderer.metrics().chunkCacheCount<=40,'Fixed memory budget must hold');
 for(const px of renderer.piers){
  const wood=draws.filter(d=>d.length===9&&d[0].src.endsWith('marina-detail-tiles.png')&&d[5]>=px&&d[5]<px+90&&d[6]>=3800);
  assert.equal(wood.reduce((area,d)=>area+d[7]*d[8],0),90*300,'Wood must cover the entire native pier: '+px);
  assert(wood.every(d=>d[5]+d[7]<=px+90&&d[6]+d[8]<=4100),'Wood cannot spill into blocked water');
  assert(!waves.some(([x,y,x2])=>y>=3800&&y<4100&&x<px+90&&x2>px),'Water sparkles cannot be painted over dock planks');
 }
}

// V123: preserve authentic MAPS checks; the former unobstructed 1500px promenade route now correctly contains solid benches/planters/bins, so test a clear pier-approach corridor instead.
// Use authentic MAPS and the original finalizer for continuous foot-route checks.
const engine=fs.readFileSync(path.join(dir,'game.js'),'utf8'),geo={MAPS:{}};
for(const id of ['waterfront','southbay']){
 const start=engine.indexOf('MAPS.'+id+' = {'),end=engine.indexOf('\n};',start)+3;
 assert(start>=0&&end>start);vm.runInNewContext(engine.slice(start,end),geo);
}
const finalStart=engine.indexOf('Object.keys(MAPS).forEach(function(id){');
const finalEnd=engine.indexOf('/* ==================== PEDESTRIANS',finalStart);
vm.runInNewContext(engine.slice(finalStart,finalEnd),geo);
function blockedInWorld(x,y,r=12){
 if(m.blocksProp(x,y,r))return true;
 for(const [id,ox,oy] of [['waterfront',4400,3220],['southbay',2800,3220]]){
  for(const b of geo.MAPS[id].pedSolids){
   const dx=x-Math.max(b.x+ox,Math.min(x,b.x+ox+b.w)),dy=y-Math.max(b.y+oy,Math.min(y,b.y+oy+b.h));
   if(dx*dx+dy*dy<r*r&&!m.ownsSolid({x:b.x+ox,y:b.y+oy,w:b.w,h:b.h}))return true;
  }
 }
 return false;
}
function walk(a,b){const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
 for(let i=0;i<=Math.ceil(length/3);i++){const f=i/Math.max(1,Math.ceil(length/3)),x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
  assert(!blockedInWorld(x,y),'Blocked route '+JSON.stringify({a,b,x,y}));}
}
const routes=[[[5100,3764],[5180,3764]],[[5150,3200],[5150,3320]],[[5570,3200],[5570,3320]],
 ...Array.from(m.piers,px=>[[px+45,3750],[px+45,4075]])];
for(const [a,b] of routes){walk(a,b);walk(b,a);}
for(const a of m.actors){
 for(let i=0;i<a.route.length;i++)walk(a.route[i],a.route[(i+1)%a.route.length]);
}
console.log('PASS V116: slow texture recovery, 90×300 pier art, dry docks, bounded cache at four scales, two-way street/pier routes and NPC paths against native solids');

const atlasBoxes=JSON.parse(fs.readFileSync(path.join(dir,'assets/v116-marina/marina-reference-atlas.json')));
assert.equal(Object.keys(atlasBoxes).length,16);
assert(fs.statSync(path.join(dir,'assets/v116-marina/marina-reference-atlas.webp')).size>10000);
for(const box of Object.values(atlasBoxes)){assert(box.every(Number.isFinite));assert(box[0]>=0&&box[1]>=0&&box[2]>0&&box[3]>0&&box[0]+box[2]<=1254&&box[1]+box[3]<=1254);}
console.log('PASS 16 alpha-bound detail sprites fit the reference atlas; lossless asset available');

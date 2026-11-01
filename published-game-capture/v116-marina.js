/* ROOKIE: Harbor City — V116 Southbay Marina, actual connected-world module.
 * Same harbor-main world coordinates and camera as V115. Render layers and
 * actor data only; no classic MAPS/quest/save/vehicle/Zombie mutation.
 * Authored source sprites and native-space dock/shore layout. Mobile-aware.
 */
(function(){
'use strict';
const BASE='./assets/v116-marina/';
const WORLD='harbor-main';
const TERRAIN={x:4352,y:3504,w:1792,h:1152,cell:32,chunk:256};
const PIER_X=Object.freeze([4590,4850,5140,5420,5660,5920]);
const images=Object.create(null),imageFiles=[
 'marina-tiles.png','marina-cafe.png','bait-and-tackle.png','marina-office.png',
 'boat-service.png','marina-kiosk.png','boat-motor.png','boat-sail.png',
 'boat-fishing.png','marina-people.png','marina-gulls.png'];
const sourceFiles=['shade_tree','palm','bench','lamp','flower_planter','trash_bin','bollard'];
for(const file of imageFiles){const im=new Image();im.decoding='async';images[file]=im;im.src=BASE+file;}
for(const file of sourceFiles){const im=new Image();im.decoding='async';images[file+'.webp']=im;im.src='./assets/exterior/'+file+'.webp';}
const img=(key)=>{const im=images[key];return im&&im.complete&&im.naturalWidth>0?im:null;};
let enabled=true,ready=false,cacheDraws=0,waterFrames=0,objectsDrawn=0,prepass=0;
const cached=new Map(),CAP=18; // 18 * 256² * 4 = 4.5 MB maximum terrain cache
const objects=Object.freeze([
 {id:'marina:cafe',type:'building',image:'marina-cafe.png',x:4408,y:3518,w:228,h:166,solid:true},
 {id:'marina:bait',type:'building',image:'bait-and-tackle.png',x:4702,y:3514,w:228,h:166,solid:true},
 {id:'marina:office',type:'building',image:'marina-office.png',x:5000,y:3505,w:230,h:168,solid:true},
 {id:'marina:service',type:'building',image:'boat-service.png',x:5336,y:3516,w:228,h:166,solid:true},
 {id:'marina:information',type:'kiosk',image:'marina-kiosk.png',x:5520,y:3830,w:96,h:112,solid:true},
 {id:'marina:shade-a',type:'tree',image:'shade_tree.webp',x:4460,y:3774,w:90,h:99},
 {id:'marina:shade-b',type:'tree',image:'shade_tree.webp',x:5202,y:3780,w:90,h:99},
 {id:'marina:palm-a',type:'palm',image:'palm.webp',x:4560,y:4084,w:92,h:90},
 {id:'marina:palm-b',type:'palm',image:'palm.webp',x:4944,y:4080,w:92,h:90},
 {id:'marina:palm-c',type:'palm',image:'palm.webp',x:5372,y:4074,w:92,h:90},
 {id:'marina:palm-d',type:'palm',image:'palm.webp',x:5812,y:4059,w:92,h:90},
 {id:'marina:bench-a',type:'bench',image:'bench.webp',x:4648,y:4060,w:82,h:29},
 {id:'marina:bench-b',type:'bench',image:'bench.webp',x:5154,y:4050,w:82,h:29},
 {id:'marina:bench-c',type:'bench',image:'bench.webp',x:5618,y:4049,w:82,h:29},
 {id:'marina:flowers-a',type:'garden',image:'flower_planter.webp',x:4478,y:4020,w:90,h:45},
 {id:'marina:flowers-b',type:'garden',image:'flower_planter.webp',x:4861,y:4028,w:90,h:45},
 {id:'marina:flowers-c',type:'garden',image:'flower_planter.webp',x:5267,y:4024,w:90,h:45},
 {id:'marina:flowers-d',type:'garden',image:'flower_planter.webp',x:5710,y:4020,w:90,h:45},
 ...[4500,4770,5025,5290,5540,5890].map((x,i)=>({id:'marina:lamp-'+i,type:'lamp',image:'lamp.webp',x,y:4136,w:27,h:87})),
 ...[4710,5090,5490,5830].map((x,i)=>({id:'marina:bin-'+i,type:'trash',image:'trash_bin.webp',x,y:4101,w:24,h:30}))
]);
// Collision for *new* opaque structures only: old source solids remain in V115.
// Preserve broad pedestrian promenade 3900..4220 and pier approaches.
const solidBoxes=Object.freeze(objects.filter(o=>o.solid).map(o=>Object.freeze({id:o.id,x:o.x+12,y:o.y+19,w:o.w-24,h:o.h-38})));
const actors=[
 {id:'v116:fisher',name:'Fisherman',npcStyle:1,x:4875,y:4308,route:[[4875,4308],[4878,4380]],speed:11,phase:0,dialogue:'I almost caught a legendary fish. It was THIS big! ...Maybe.'},
 {id:'v116:worker',name:'Marina worker',npcStyle:2,x:5465,y:3912,route:[[5465,3912],[5345,3904],[5310,3994],[5465,3912]],speed:27,phase:1,dialogue:'The gulls stole another sandwich. I think they have a schedule.'},
 {id:'v116:visitor',name:'Visitor',npcStyle:3,x:5070,y:3972,route:[[5070,3972],[5127,3964],[5070,3972]],speed:15,phase:2,dialogue:'I have photographed the same boat eleven times. Art is patience.'},
 {id:'v116:customer',name:'Café customer',npcStyle:4,x:4605,y:3780,route:[[4605,3780]],speed:0,phase:0,dialogue:'Coffee and sea air. Best shift break ever.'},
 {id:'v116:stroller',name:'Pedestrian',npcStyle:0,x:5580,y:3988,route:[[5580,3988],[5690,3992],[5770,3940],[5580,3988]],speed:30,phase:3,dialogue:'Watch out for the seagull. It has a suspicious résumé.'}
].map(a=>({...a,step:0,routeClock:a.phase*2}));
const interactions=[
 {id:'v116:cafe',label:'Marina Café',x:4528,y:3758,text:'The café smells like cinnamon and sea salt. Someone named a muffin “The Great Wave.”'},
 {id:'v116:bait',label:'Harbor Bait & Tackle',x:4812,y:3748,text:'A sign reads: NO REFUNDS ON FISH STORIES.'},
 {id:'v116:office',label:'Southbay Marina Office',x:5113,y:3750,text:'The harbor notice board shows tides, weather, and a missing fishing hat.'},
 {id:'v116:kiosk',label:'Waterfront information',x:5570,y:3975,text:'Southbay Marina: docks, café, boat service, and exceptionally confident seagulls.'},
 ...actors.map(a=>({id:a.id,label:a.name,x:a.x,y:a.y,text:a.dialogue}))
];
const visible=(r,view,p=75)=>!view||(r.x<view.x+view.w+p&&r.x+(r.w||0)>view.x-p&&r.y<view.y+view.h+p&&r.y+(r.h||0)>view.y-p);
function hash(x,y,s){let a=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);a=(a^(a>>>13));a=Math.imul(a,1274126177);return (a^(a>>>16))>>>0;}
function tileIndex(x,y){
 // Keep native streets readable at the northern edge; use only existing
 // waterfront grounds, promenades, seawall, and pier world coordinates.
 if(y>=4210){const n=hash(x,y,3)%4;return [8,9,10,25][n];}
 if(y>=4152)return ((x+y)%7===0)?27:((x+y)%5===0?2:1);
 if(y>=3890){const n=hash(x,y,4)%5;return [0,1,2,3,20][n];}
 if(y>=3780&&x<5710)return hash(x,y,5)%6===0?21:4;
 return hash(x,y,7)%5===0?5:4;
}
function buildChunk(cx,cy){
 const off=document.createElement('canvas');off.width=off.height=256;
 const c=off.getContext('2d');c.imageSmoothingEnabled=false;
 const atlas=img('marina-tiles.png');if(!atlas)return off;
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=cx+col*32,y=cy+row*32,tid=tileIndex(x,y);
  // An existing north-south street joins the marina here: preserve its road art.
  if(x>=5712&&x<5888&&y<3900)continue;
  c.drawImage(atlas,(tid%8)*32,Math.floor(tid/8)*32,32,32,col*32,row*32,32,32);
 }
 return off;
}
function chunkAt(cx,cy){
 const key=cx+':'+cy;
 if(!cached.has(key)){
  cached.set(key,buildChunk(cx,cy));
  if(cached.size>CAP)cached.delete(cached.keys().next().value);
 }
 return cached.get(key);
}
let animMs=0,frameCount=0,frameCost=0,maxCost=0,samples=[];
function measure(ms){frameCount++;frameCost+=ms;maxCost=Math.max(maxCost,ms);if(samples.length<240)samples.push(ms);else samples[frameCount%samples.length]=ms;}
function begin(g,opt,t){
 if(!enabled||!opt||opt.zoom<.095)return;
 const a=performance.now(),view=opt.view;
 const region={x:TERRAIN.x,y:TERRAIN.y,w:TERRAIN.w,h:TERRAIN.h};
 if(!visible(region,view,0))return;
 const x0=Math.max(TERRAIN.x,TERRAIN.x+Math.floor((Math.max(TERRAIN.x,view.x)-TERRAIN.x)/256)*256);
 const y0=Math.max(TERRAIN.y,TERRAIN.y+Math.floor((Math.max(TERRAIN.y,view.y)-TERRAIN.y)/256)*256);
 for(let y=y0;y<TERRAIN.y+TERRAIN.h&&y<=view.y+view.h+256;y+=256){
  for(let x=x0;x<TERRAIN.x+TERRAIN.w&&x<=view.x+view.w+256;x+=256){
   const tile=chunkAt(x,y);g.save();g.imageSmoothingEnabled=false;g.drawImage(tile,x,y);g.restore();cacheDraws++;
  }
 }
 // Seawall: anchored to the same y=4200 shoreline as the V115 premium marina.
 g.fillStyle='#4f5c58';g.fillRect(4385,4170,1705,13);
 g.fillStyle='#d6bea1';g.fillRect(4385,4170,1705,4);
 // Keep pre-existing piers in their source positions, upgrade surface only.
 for(const px of PIER_X){
  if(!visible({x:px-5,y:4180,w:70,h:402},view,0))continue;
  for(let y=4188;y<4570;y+=32){
   const a=hash(px,y,11)%4,b=[12,13,14,15][a],atlas=img('marina-tiles.png');
   if(atlas){g.drawImage(atlas,b%8*32,Math.floor(b/8)*32,32,32,px,y,32,32);g.drawImage(atlas,b%8*32,Math.floor(b/8)*32,32,32,px+32,y,32,32);}
  }
 }
 // Approved ROOKIE bollard sprites mark the piers at water level.
  const bollard=img('bollard.webp');
  if(bollard)for(const px of PIER_X)for(const py of [4255,4425,4550]){
    if(!visible({x:px-17,y:py-26,w:96,h:54},view,0))continue;
    g.drawImage(bollard,px-14,py-26,23,37);
    g.drawImage(bollard,px+55,py-26,23,37);
  }
 // Static shoreline and shop sprites, with world-locked shadows.
 for(const o of objects){
  if(!visible(o,view,0))continue;
  const sprite=img(o.image);if(!sprite)continue;
  if(o.type==='building'||o.type==='kiosk'){
   g.fillStyle='rgba(14,32,42,.25)';g.fillRect(o.x+7,o.y+10,o.w,o.h);
  }
  if(o.type==='palm'||o.type==='tree')continue; // foreground layer sway below
  if(o.type==='lamp')continue; // foreground highlights
  g.imageSmoothingEnabled=false;g.drawImage(sprite,o.x,o.y,o.w,o.h);objectsDrawn++;
 }
 const boats=[
  {id:'boat-motor.png',x:4680,y:4334,w:66,h:125,p:0},
  {id:'boat-fishing.png',x:4980,y:4410,w:76,h:140,p:1.7},
  {id:'boat-sail.png',x:5280,y:4314,w:82,h:150,p:2.4},
  {id:'boat-motor.png',x:5520,y:4397,w:66,h:120,p:3.1},
  {id:'boat-sail.png',x:5780,y:4334,w:82,h:150,p:5}
 ];
 for(const o of boats){if(!visible(o,view))continue;const sprite=img(o.id);if(!sprite)continue;
  const dy=Math.sin(t*.00145+o.p)*3;
  g.fillStyle='rgba(6,38,64,.24)';g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h/2+11,o.w*.34,11,0,0,Math.PI*2);g.fill();
  g.drawImage(sprite,o.x,o.y+dy,o.w,o.h);objectsDrawn++;
 }
 // Water motion: capped number of strokes; no per-pixel pixel data or particles.
 const tphase=Math.floor(t/155),bounds={x:4410,y:4260,w:1660,h:390};
 if(visible(bounds,view)){waterFrames++;
  const sx=Math.max(4410,Math.floor(view.x/90)*90);
  const ex=Math.min(6070,view.x+view.w+100);
  for(let x=sx;x<ex;x+=90)for(let y=4260;y<4650;y+=68){
   const z=hash(x,y,18);let drift=(tphase+z)%54;
   g.globalAlpha=.26+(z%5)*.065;g.strokeStyle=z%2?'#b5eadf':'#55c6da';g.lineWidth=2;
   g.beginPath();g.moveTo(x+drift,y+(z%15));g.lineTo(x+drift+15+(z%8),y+(z%15));g.stroke();
  }
  g.globalAlpha=1;
 }
 measure(performance.now()-a);
}
function drawNpc(g,a,t){
 const im=img('marina-people.png');if(!im)return;
 const p=a.npcStyle||0,cx=a.x-15,cy=a.y-38;
 g.fillStyle='rgba(15,32,44,.22)';g.beginPath();g.ellipse(a.x,a.y+8,12,5,0,0,Math.PI*2);g.fill();
 g.drawImage(im,p*32,0,32,48,cx,cy+Math.sin(t*.006+a.phase)*.7,32,48);
}
function foreground(g,opt,t){
 if(!enabled||!opt||opt.zoom<.14)return;
 const view=opt.view,a=performance.now();
 for(const o of objects){if(!visible(o,view,40))continue;
  if(o.type!=='palm'&&o.type!=='tree'&&o.type!=='lamp')continue;
  const sprite=img(o.image);if(!sprite)continue;
  if(o.type==='lamp'){
   g.drawImage(sprite,o.x,o.y,o.w,o.h);
   // Tiny amber light flicker; no full-screen shadows.
   if(opt.zoom>.38){g.globalAlpha=.13+.05*Math.sin(t*.002+o.x);
     g.fillStyle='#ffe2a3';g.beginPath();g.arc(o.x+o.w/2,o.y+18,30,0,Math.PI*2);g.fill();g.globalAlpha=1;}
   continue;
  }
  const phase=o.x*.007+o.y*.009;
  const sway=Math.sin(t*.00065+phase)*(o.type==='palm'?2.0:1.15);
  g.save();g.translate(o.x+o.w/2,o.y+o.h);g.rotate(sway*.0038);g.imageSmoothingEnabled=false;
  g.drawImage(sprite,-o.w/2,-o.h,o.w,o.h);g.restore();objectsDrawn++;
 }
 const bird=img('marina-gulls.png');if(bird){
  const gulls=[[4590,4191],[5058,4246],[5597,4194],[5873,4240]];
  for(let i=0;i<gulls.length;i++){
   const [x,y]=gulls[i];if(!visible({x,y,w:36,h:32},view))continue;
   const frame=Math.floor(t/600+i*2)%2;
   g.drawImage(bird,frame*32,0,32,28,x,y+Math.sin(t*.0015+i)*1.5,32,28);
  }
 }
 measure(performance.now()-a);
}
function waterBlocked(x,y,r=12){
 if(!enabled||x<4385||x>6090||y<4222||y>4645)return false;
 // Original pier-world coordinates remain the only walkable routes on water.
 const onPier=PIER_X.some(px=>x>px-r&&x<px+65+r&&y<=4558);
 return !onPier;
}
function blocksProp(x,y,r){
 if(!enabled)return false;
 for(const b of solidBoxes){const ax=Math.max(b.x,Math.min(x,b.x+b.w));const ay=Math.max(b.y,Math.min(y,b.y+b.h));if((x-ax)**2+(y-ay)**2<r*r)return true;}
 return waterBlocked(x,y,r);
}
function stepNPCs(dt){
 if(!enabled)return;
 for(const a of actors){if(!a.speed||a.route.length===1)continue;
  const next=a.route[(a.step+1)%a.route.length];const dx=next[0]-a.x,dy=next[1]-a.y,len=Math.hypot(dx,dy);
  if(len<2){a.step=(a.step+1)%a.route.length;continue;}
  const step=Math.min(len,a.speed*Math.min(.05,dt));a.x+=dx/len*step;a.y+=dy/len*step;
 }
 for(const s of interactions){if(!s.id.startsWith('v116:'))continue;
  const a=actors.find(p=>p.id===s.id);if(a){s.x=a.x;s.y=a.y;}
 }
}
function metrics(){const sorted=samples.slice().sort((a,b)=>a-b);return Object.freeze({version:'116-marina-1',worldId:WORLD,
 enabled,assets:imageFiles.length+sourceFiles.length,decoded:Object.values(images).filter(im=>im.complete&&im.naturalWidth>0).length,
 actorCount:actors.length,solidCount:solidBoxes.length,chunkCacheCount:cached.size,chunkBudgetBytes:CAP*256*256*4,
 renderSamples:frameCount,avgPaintMs:frameCount?+(frameCost/frameCount).toFixed(3):0,
 p95PaintMs:sorted.length?+sorted[Math.floor((sorted.length-1)*.95)].toFixed(3):0,
 maxPaintMs:+maxCost.toFixed(3),drawnChunks:cacheDraws,drawnObjects:objectsDrawn,waterFrames,
 campaignEngineModified:false,zombieOutbreakModified:false,multiplayerTransport:'none'});}
const api={inMarina:(x,y)=>enabled&&x>4352&&x<6144&&y>3504&&y<4656,version:'116-marina-1',worldId:WORLD,region:Object.freeze(TERRAIN),piers:PIER_X,objects,actors,interactions,
 background:begin,foreground,stepNPCs,drawNpc,blocksProp,metrics,
 active:()=>enabled,
 // Only enabled for browser evidence, never a production interaction.
 setTestEnabled:(bool)=>{if(!/[?&]v116QA=1(?:&|$)/.test(location.search))return false;enabled=!!bool;cached.clear();return true;}};
window.ROOKIE_V116_MARINA=Object.freeze(api);
const onReady=()=>{
 if(!window.HARBOR||!window.HARBOR.seamlessCampusV115)return;
 const campus=window.HARBOR.seamlessCampusV115;
 const toolbar=document.querySelector('#mapOverlay .maptools');
 if(toolbar&&!document.getElementById('v116MarinaLaunch')){
  const button=document.createElement('button');button.id='v116MarinaLaunch';button.type='button';
  button.textContent='PLAY SOUTHBAY MARINA · V116';button.title='Walk the real connected-world Southbay Marina (no loading screen)';
  button.addEventListener('click',()=>{for(const [x,y] of [[5190,3970],[5130,3940],[5270,3880],[5490,3910],[4610,3920],[5560,4020]])if(campus.openAt(x,y,1.1))return;});toolbar.appendChild(button);
 }
 if(/[?&]v116QA=1(?:&|$)/.test(location.search)){
  document.documentElement.dataset.v116Qa='1';
 }
 ready=true;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
})();
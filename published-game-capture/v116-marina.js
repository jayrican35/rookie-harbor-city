/* ROOKIE: Harbor City — V116 Southbay Marina, actual connected-world module.
 * Same harbor-main world coordinates and camera as V115. Render layers and
 * actor data only; no classic MAPS/quest/save/vehicle/Zombie mutation.
 * Authored source sprites and native-space dock/shore layout. Mobile-aware.
 */
(function(){
'use strict';
const BASE='./assets/v116-marina/';
const WORLD='harbor-main';
const TERRAIN={x:4352,y:3220,w:1792,h:1436,cell:32,chunk:256};
const PIER_X=Object.freeze([4655,5105,5555]);
const images=Object.create(null),imageFiles=[
 'marina-tiles.png','marina-cafe.png','bait-and-tackle.png','marina-office.png',
 'boat-service.png','marina-kiosk.png','boat-motor.png','boat-sail.png',
 'boat-fishing.png','marina-people.png','marina-gulls.png'];
const sourceFiles=['shade_tree','palm','bench','lamp','flower_planter','trash_bin','bollard','fence_horizontal'];
for(const file of imageFiles){const im=new Image();im.decoding='async';images[file]=im;im.src=BASE+file;}
for(const file of sourceFiles){const im=new Image();im.decoding='async';images[file+'.webp']=im;im.src='./assets/exterior/'+file+'.webp';}
const img=(key)=>{const im=images[key];return im&&im.complete&&im.naturalWidth>0?im:null;};
let enabled=true,ready=false,cacheDraws=0,waterFrames=0,objectsDrawn=0,prepass=0;
const cached=new Map(),CAP=18; // 18 * 256² * 4 = 4.5 MB maximum terrain cache
const objects=Object.freeze([
 // Original Waterfront MAPS: OFFICE x180,y140,w300,h200; SHED B x620,y180,w220,h150.
 {id:'marina:office',type:'building',image:'marina-office.png',x:4580,y:3360,w:300,h:200,solid:false},
 {id:'marina:shed-b',type:'building',image:'boat-service.png',x:5020,y:3400,w:220,h:150,solid:false},
 // Two additional coastal storefronts on existing grass, clear of mission doors.
 {id:'marina:cafe',type:'building',image:'marina-cafe.png',x:4460,y:3227,w:183,h:125,solid:true},
 {id:'marina:bait',type:'building',image:'bait-and-tackle.png',x:5425,y:3348,w:212,h:163,solid:true},
 {id:'marina:information',type:'kiosk',image:'marina-kiosk.png',x:5670,y:3540,w:88,h:96,solid:true},
 {id:'marina:shade-west',type:'tree',image:'shade_tree.webp',x:4400,y:3294,w:100,h:110},
 {id:'marina:shade-mid',type:'tree',image:'shade_tree.webp',x:4900,y:3280,w:92,h:100},
 {id:'marina:shade-east',type:'tree',image:'shade_tree.webp',x:5280,y:3286,w:92,h:100},
 {id:'marina:palm-a',type:'palm',image:'palm.webp',x:4490,y:3615,w:90,h:91},
 {id:'marina:palm-b',type:'palm',image:'palm.webp',x:4805,y:3622,w:90,h:91},
 {id:'marina:palm-c',type:'palm',image:'palm.webp',x:5290,y:3610,w:90,h:91},
 {id:'marina:palm-d',type:'palm',image:'palm.webp',x:5635,y:3617,w:90,h:91},
 {id:'marina:bench-a',type:'bench',image:'bench.webp',x:4520,y:3690,w:90,h:27},
 {id:'marina:bench-b',type:'bench',image:'bench.webp',x:4920,y:3690,w:90,h:27},
 {id:'marina:bench-c',type:'bench',image:'bench.webp',x:5320,y:3690,w:90,h:27},
 ...[[4510,3715],[4880,3715],[5310,3715],[5650,3715]].map(([x,y],i)=>({id:'marina:flowers-'+i,type:'garden',image:'flower_planter.webp',x,y,w:72,h:35})),
 ...[4460,4760,5060,5360,5660].map((x,i)=>({id:'marina:lamp-'+i,type:'lamp',image:'lamp.webp',x,y:3655,w:27,h:85})),
 ...[4500,4900,5290,5680].map((x,i)=>({id:'marina:bin-'+i,type:'trash',image:'trash_bin.webp',x,y:3748,w:20,h:28}))
]);
// Collision for *new* opaque structures only: old source solids remain in V115.
// Preserve broad pedestrian promenade 3900..4220 and pier approaches.
const solidBoxes=Object.freeze(objects.filter(o=>o.solid).map(o=>Object.freeze({id:o.id,x:o.x+12,y:o.y+19,w:o.w-24,h:o.h-38})));
const actors=[
 {id:'v116:fisher',name:'Fisherman',npcStyle:1,x:5142,y:3876,route:[[5142,3876],[5142,3944]],speed:11,phase:0,dialogue:'I almost caught a legendary fish. It was THIS big! ...Maybe.'},
 {id:'v116:worker',name:'Marina worker',npcStyle:2,x:5300,y:3715,route:[[5300,3715],[5400,3690],[5440,3735],[5300,3715]],speed:27,phase:1,dialogue:'The gulls stole another sandwich. I think they have a schedule.'},
 {id:'v116:visitor',name:'Visitor',npcStyle:3,x:4920,y:3735,route:[[4920,3735],[5010,3735],[4920,3735]],speed:15,phase:2,dialogue:'I have photographed the same boat eleven times. Art is patience.'},
 {id:'v116:customer',name:'Café customer',npcStyle:4,x:4558,y:3420,route:[[4558,3420]],speed:0,phase:0,dialogue:'Coffee and sea air. Best shift break ever.'},
 {id:'v116:stroller',name:'Pedestrian',npcStyle:0,x:5570,y:3733,route:[[5570,3733],[5480,3733],[5390,3720],[5570,3733]],speed:30,phase:3,dialogue:'Watch out for the seagull. It has a suspicious résumé.'}
].map(a=>({...a,step:0,routeClock:a.phase*2}));
const interactions=[
 {id:'v116:cafe',label:'Marina Café',x:4551,y:3390,text:'The café smells like cinnamon and sea salt. Someone named a muffin “The Great Wave.”'},
 {id:'v116:bait',label:'Harbor Bait & Tackle',x:5540,y:3540,text:'A sign reads: NO REFUNDS ON FISH STORIES.'},
 {id:'v116:office',label:'Marina Office',x:4730,y:3578,text:'The harbor notice board shows tides, weather, and a missing fishing hat.'},
 {id:'v116:kiosk',label:'Waterfront information',x:5710,y:3670,text:'Southbay Marina: three piers, a café, boat shed, and exceptionally confident seagulls.'},
 ...actors.map(a=>({id:a.id,label:a.name,x:a.x,y:a.y,text:a.dialogue}))
];
const visible=(r,view,p=75)=>!view||(r.x<view.x+view.w+p&&r.x+(r.w||0)>view.x-p&&r.y<view.y+view.h+p&&r.y+(r.h||0)>view.y-p);
function hash(x,y,s){let a=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);a=(a^(a>>>13));a=Math.imul(a,1274126177);return (a^(a>>>16))>>>0;}
function tileIndex(x,y){
 // ORIGINAL native waterfront shoreline: sand at local y430–580 (world y3650–3800),
 // water at local y580–1000 (world y3800–4220), three piers y3800–4100.
 if(y>=3800){const n=hash(x,y,3)%4;return [8,9,10,25][n];}
 if(y>=3755)return ((x+y)%7===0)?27:((x+y)%5===0?2:1);
 if(y>=3650){const n=hash(x,y,4)%5;return [0,1,2,3,20][n];}
 if(y>=3510&&x<5870)return hash(x,y,5)%6===0?21:4;
 return hash(x,y,7)%5===0?5:4;
}
function buildChunk(cx,cy){
 const off=document.createElement('canvas');off.width=off.height=256;
 const c=off.getContext('2d');c.imageSmoothingEnabled=false;
 const atlas=img('marina-tiles.png');if(!atlas)return off;
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=cx+col*32,y=cy+row*32,tid=tileIndex(x,y);
  // An existing north-south street joins the marina here: preserve its road art.
  if(y<3300&&((x>=5056&&x<5248)||(x>=5472&&x<5672)))continue;
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
 g.fillStyle='#4f5c58';g.fillRect(4400,3794,1500,12);
 g.fillStyle='#d6bea1';g.fillRect(4400,3794,1500,4);
 // Keep pre-existing piers in their source positions, upgrade surface only.
 for(const px of PIER_X){
  if(!visible({x:px-5,y:3800,w:95,h:325},view,0))continue;
  for(let y=3804;y<4106;y+=32){
   const a=hash(px,y,11)%4,b=[12,13,14,15][a],atlas=img('marina-tiles.png');
   if(atlas){g.drawImage(atlas,b%8*32,Math.floor(b/8)*32,32,32,px,y,32,32);g.drawImage(atlas,b%8*32,Math.floor(b/8)*32,32,32,px+32,y,32,32);}
  }
 }
 // Approved ROOKIE bollard sprites mark the piers at water level.
  const bollard=img('bollard.webp');
  if(bollard)for(const px of PIER_X)for(const py of [3835,3950,4075]){
    if(!visible({x:px-17,y:py-26,w:96,h:54},view,0))continue;
    g.drawImage(bollard,px-14,py-26,23,37);
    g.drawImage(bollard,px+55,py-26,23,37);
  }
 // Railing segments match native waterfront decors exactly, leaving the native pier mouths open.
 const fence=img('fence_horizontal.webp');
 if(fence){for(const [x,width] of [[4400,255],[4745,360],[5195,360],[5645,255]]){
   if(!visible({x,y:3787,w:width,h:18},view,0))continue;
   for(let xx=x;xx<x+width;xx+=64)g.drawImage(fence,xx,3785,Math.min(64,x+width-xx),16);
 }}
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
  {id:'boat-motor.png',x:4524,y:3935,w:65,h:122,p:0},
  {id:'boat-fishing.png',x:4800,y:3950,w:76,h:140,p:1.7},
  {id:'boat-sail.png',x:5270,y:3890,w:82,h:150,p:2.4},
  {id:'boat-motor.png',x:5445,y:3940,w:65,h:120,p:3.1},
  {id:'boat-sail.png',x:5720,y:3900,w:82,h:150,p:5}
 ];
 for(const o of boats){if(!visible(o,view))continue;const sprite=img(o.id);if(!sprite)continue;
  const dy=Math.sin(t*.00145+o.p)*3;
  g.fillStyle='rgba(6,38,64,.24)';g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h/2+11,o.w*.34,11,0,0,Math.PI*2);g.fill();
  g.drawImage(sprite,o.x,o.y+dy,o.w,o.h);objectsDrawn++;
 }
 // Water motion: capped number of strokes; no per-pixel pixel data or particles.
 const tphase=Math.floor(t/155),bounds={x:4410,y:3830,w:1660,h:700};
 if(visible(bounds,view)){waterFrames++;
  const sx=Math.max(4410,Math.floor(view.x/90)*90);
  const ex=Math.min(6070,view.x+view.w+100);
  for(let x=sx;x<ex;x+=90)for(let y=3830;y<4590;y+=68){
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
  const gulls=[[4660,3833],[5109,3908],[5576,3844],[5818,3805]];
  for(let i=0;i<gulls.length;i++){
   const [x,y]=gulls[i];if(!visible({x,y,w:36,h:32},view))continue;
   const frame=Math.floor(t/600+i*2)%2;
   g.drawImage(bird,frame*32,0,32,28,x,y+Math.sin(t*.0015+i)*1.5,32,28);
  }
 }
 measure(performance.now()-a);
}
function waterBlocked(x,y,r=12){
 if(!enabled||x<4400||x>5900||y<3806||y>4656)return false;
 // Match original native waterfront walkability: all water except 3 native piers,
 // and the last 120px below the piers remain blocked by source geometry.
 const onPier=PIER_X.some(px=>x>=px-r&&x<=px+90+r&&y<=4094);
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
const api={inMarina:(x,y)=>enabled&&x>4400&&x<5900&&y>3220&&y<4220,version:'116-marina-1',worldId:WORLD,region:Object.freeze(TERRAIN),piers:PIER_X,objects,actors,interactions,
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
  button.addEventListener('click',()=>{for(const [x,y] of [[5150,3720],[4980,3710],[5340,3720],[4790,3720],[5600,3730]])if(campus.openAt(x,y,1.1))return;});toolbar.appendChild(button);
 }
 if(/[?&]v116QA=1(?:&|$)/.test(location.search)){
  document.documentElement.dataset.v116Qa='1';
 }
 ready=true;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
})();
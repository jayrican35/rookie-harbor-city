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
 'marina-reference-atlas.webp','marina-tiles.png','marina-detail-tiles.png','marina-cafe.png','bait-and-tackle.png','marina-office.png',
 'boat-service.png','marina-kiosk.png','boat-motor.png','boat-sail.png',
 'boat-fishing.png','marina-people.png','marina-gulls.png'];
const sourceFiles=['shade_tree','palm','bench','lamp','flower_planter','trash_bin','bollard','fence_horizontal'];
for(const file of imageFiles){const im=new Image();im.decoding='async';images[file]=im;im.src=BASE+file;}
for(const file of sourceFiles){const im=new Image();im.decoding='async';images[file+'.webp']=im;im.src='./assets/exterior/'+file+'.webp';}
const img=(key)=>{const im=images[key];return im&&im.complete&&im.naturalWidth>0?im:null;};
// Alpha-bound sprites from the reference-guided atlas; no scene-sized backdrop.
const DETAIL_SPRITES={"marina-office.png": [26, 53, 269, 227], "boat-service.png": [349, 58, 269, 221], "marina-cafe.png": [659, 53, 264, 230], "marina-kiosk.png": [980, 58, 247, 214], "shade_tree.webp": [28, 323, 262, 293], "palm.webp": [353, 329, 260, 285], "flower_planter.webp": [670, 429, 247, 122], "lamp.webp": [1073, 333, 50, 276], "boat-motor.png": [83, 657, 149, 281], "boat-sail.png": [402, 648, 158, 292], "boat-fishing.png": [710, 644, 143, 295], "bench.webp": [976, 759, 243, 142], "hero": [108, 1008, 102, 184], "fisher": [418, 940, 189, 256], "visitor": [736, 1018, 95, 171], "trash_bin.webp": [1059, 1038, 80, 140]};
DETAIL_SPRITES['bait-and-tackle.png']=DETAIL_SPRITES['marina-cafe.png'];
function paintSprite(g,key,x,y,w,h){
 const atlas=img('marina-reference-atlas.webp'),box=DETAIL_SPRITES[key];
 if(atlas&&box){g.imageSmoothingEnabled=false;g.drawImage(atlas,...box,x,y,w,h);return;}
 const fallback=img(key);if(fallback)g.drawImage(fallback,x,y,w,h);
}
let enabled=true,ready=false,cacheDraws=0,waterFrames=0,objectsDrawn=0,prepass=0;
const cached=new Map(),CAP=40; // 40 * 256² * 4 = 10 MiB max; avoids portrait viewport LRU rebuild thrashing
const objects=Object.freeze([
 // Original Waterfront MAPS: OFFICE x180,y140,w300,h200; SHED B x620,y180,w220,h150.
 {id:'marina:office',type:'building',image:'marina-office.png',x:4580,y:3360,w:300,h:200,solid:false},
 {id:'marina:shed-b',type:'building',image:'boat-service.png',x:5020,y:3400,w:220,h:150,solid:false},
 // Two additional coastal storefronts on existing grass, clear of mission doors.
 {id:'marina:cafe',type:'building',image:'marina-cafe.png',x:4460,y:3227,w:183,h:125,solid:true},
 {id:'marina:bait',type:'building',image:'bait-and-tackle.png',x:5425,y:3348,w:212,h:163,solid:true},
 {id:'marina:information',type:'kiosk',image:'marina-kiosk.png',x:5670,y:3540,w:88,h:96,solid:true},
 {id:'marina:shade-west',type:'tree',image:'shade_tree.webp',x:4400,y:3294,w:100,h:110},
 {id:'marina:shade-mid',type:'tree',image:'shade_tree.webp',x:4900,y:3280,w:145,h:154},
 {id:'marina:shade-east',type:'tree',image:'shade_tree.webp',x:5280,y:3286,w:145,h:154},
 ...[[4435,3440],[4840,3415],[5290,3410],[5710,3300],[5800,3410],[5660,3400],[4880,3500],[5320,3295],[4795,3270],[5490,3225],[5580,3227],[5680,3230],[5800,3260]].map(([x,y],i)=>({id:'marina:grove-'+i,type:'tree',image:'shade_tree.webp',x,y,w:142+(i%2)*18,h:150+(i%2)*18})),
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
 {id:'v116:worker',name:'Marina worker',npcStyle:2,x:5400,y:3758,route:[[5400,3758],[5480,3758],[5515,3758],[5400,3758]],speed:27,phase:1,dialogue:'The gulls stole another sandwich. I think they have a schedule.'},
 {id:'v116:visitor',name:'Visitor',npcStyle:3,x:4920,y:3735,route:[[4920,3735],[5010,3735],[4920,3735]],speed:15,phase:2,dialogue:'I have photographed the same boat eleven times. Art is patience.'},
 {id:'v116:customer',name:'Café customer',npcStyle:4,x:4558,y:3420,route:[[4558,3420]],speed:0,phase:0,dialogue:'Coffee and sea air. Best shift break ever.'},
 {id:'v116:stroller',name:'Pedestrian',npcStyle:5,x:5570,y:3758,route:[[5570,3758],[5480,3758],[5390,3758],[5570,3758]],speed:30,phase:3,dialogue:'Watch out for the seagull. It has a suspicious résumé.'}
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
 if(y>=3755)return hash(x,y,21)%3;
 if(y>=3650){const n=hash(x,y,4)%5;return [0,1,2,3,20][n];}
 if(y>=3510&&y<3650&&((x>=4690&&x<4780)||(x>=5080&&x<5180)||(x>=5490&&x<5580)))return hash(x,y,5)%4;
 return hash(x,y,7)%5===0?5:4;
}
function buildChunk(cx,cy){
 const off=document.createElement('canvas');off.width=off.height=256;
 const c=off.getContext('2d');c.imageSmoothingEnabled=false;
 const atlas=img('marina-detail-tiles.png');if(!atlas)return off;
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=cx+col*32,y=cy+row*32,tid=tileIndex(x,y);
  // An existing north-south street joins the marina here: preserve its road art.
  if(y<3300&&((x>=5056&&x<5248)||(x>=5472&&x<5672)))continue;
  c.drawImage(atlas,(tid%8)*32,Math.floor(tid/8)*32,32,32,col*32,row*32,32,32);
 }
 // World-seeded long ripple bands break the 32px tile repetition at chunk boundaries.
 for(let yy=0;yy<256;yy+=7){
  if(cy+yy<3800)continue;
  for(let xx=0;xx<256;xx+=24){const seed=hash(cx+xx,cy+yy,91),w=5+seed%19;
   c.fillStyle=seed%3===0?'#2486b1':'#0b639e';c.fillRect(xx+seed%7,yy,w,1);
   if(seed%5===0){c.fillStyle='#61b5cd';c.fillRect(xx+seed%7+3,yy+1,Math.max(2,w-7),1);}
  }
 }
 return off;
}
function chunkAt(cx,cy){
 // Do not retain transparent placeholders while the asynchronously decoded atlas loads.
 if(!img('marina-detail-tiles.png'))return null;
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
 for(let y=y0;y<TERRAIN.y+TERRAIN.h&&y<view.y+view.h;y+=256){
  for(let x=x0;x<TERRAIN.x+TERRAIN.w&&x<view.x+view.w;x+=256){
   const tile=chunkAt(x,y);if(!tile)continue;g.save();g.imageSmoothingEnabled=false;g.drawImage(tile,x,y);g.restore();cacheDraws++;
  }
 }
 // Foliage casts a small directional shadow onto lawns and paths beneath it.
 for(const o of objects)if((o.type==='tree'||o.type==='palm')&&visible(o,view,0)){
  g.fillStyle='rgba(14,46,24,.20)';g.beginPath();g.ellipse(o.x+o.w*.62,o.y+o.h-3,o.w*.48,o.h*.13,-.15,0,Math.PI*2);g.fill();
 }
 // Dark submerged beams and regularly spaced timber pilings make the quay dimensional.
 g.fillStyle='#062e53';g.fillRect(4400,3800,1500,20);
 for(let x=4408;x<5900;x+=44){
  if(PIER_X.some(px=>x>px-8&&x<px+98))continue;
  g.fillStyle='#3c3028';g.fillRect(x,3801,7,21);
  g.fillStyle='#b8844c';g.fillRect(x+1,3801,3,17);
 }
 // Raised pale granite edging separates planted lawns from the rose paving.
 for(const [x,w] of [[4400,285],[4790,285],[5190,295],[5590,310]]){
  g.fillStyle='#6d7156';g.fillRect(x,3642,w,8);
  g.fillStyle='#e2d5ae';g.fillRect(x,3642,w,3);
  for(let xx=x;xx<x+w;xx+=24){g.fillStyle='#aaa98c';g.fillRect(xx,3643,1,7);}
 }
 // Fine chain-link garden fencing with iron posts and a pale top rail.
 for(const [x,w] of [[4400,285],[4790,285],[5190,295],[5590,310]]){
  if(!visible({x,y:3604,w,h:40},view,0))continue;
  g.fillStyle='#233d3c';g.fillRect(x,3606,w,3);g.fillRect(x,3635,w,3);
  g.fillStyle='#93a98d';g.fillRect(x,3604,w,2);
  g.strokeStyle='rgba(153,182,158,.65)';g.lineWidth=1;
  for(let xx=x;xx<x+w-10;xx+=10){g.beginPath();g.moveTo(xx,3610);g.lineTo(Math.min(xx+19,x+w),3634);g.moveTo(xx,3634);g.lineTo(Math.min(xx+19,x+w),3610);g.stroke();}
  for(let xx=x;xx<=x+w;xx+=62){g.fillStyle='#243c36';g.fillRect(xx,3601,5,39);g.fillStyle='#d7c899';g.fillRect(xx,3601,5,3);}
 }
 // Palm planter foundations sit below foliage and actors.
 for(const o of objects)if(o.type==='palm'){
  const cx=o.x+o.w/2,cy=o.y+o.h-5;
  g.fillStyle='#51463f';g.fillRect(cx-23,cy-7,46,27);
  g.fillStyle='#e3c8a6';g.fillRect(cx-23,cy-8,46,4);
  g.fillStyle='#a49076';g.fillRect(cx-23,cy+15,46,5);
  g.fillStyle='#324e25';g.fillRect(cx-19,cy-4,38,16);
  for(let n=0;n<12;n++){g.fillStyle=n%2?'#ed7095':'#f9c46e';g.fillRect(cx-17+n*3,cy+4+(n%3)*2,3,3);}
 }
 // The native seawall has three 90px openings, matching the walkable piers.
 for(const [x,width] of [[4400,255],[4745,360],[5195,360],[5645,255]]){
  g.fillStyle='#4f5c58';g.fillRect(x,3794,width,12);
  g.fillStyle='#d6bea1';g.fillRect(x,3794,width,4);
 }
 // Cover the full native 90×300px footprint without drawing wood into blocked water.
 const dockAtlas=img('marina-detail-tiles.png');
 if(dockAtlas)for(const px of PIER_X){
  if(!visible({x:px,y:3800,w:90,h:300},view,0))continue;
  for(let y=3800;y<4100;y+=32){
   const tid=[12,13,14,15][hash(px,y,11)%4],h=Math.min(32,4100-y);
   for(let dx=0;dx<90;dx+=32){
    const w=Math.min(32,90-dx);
    g.drawImage(dockAtlas,tid%8*32,Math.floor(tid/8)*32,w,h,px+dx,y,w,h);
   }
  }
 }
 // Timber mooring piles: metal collars, weathered grain, pale caps and tied rope.
 for(const px of PIER_X)for(const py of [3820,3945,4090])for(const xx of [px+3,px+86]){
  if(!visible({x:xx-7,y:py-27,w:14,h:43},view,0))continue;
  g.fillStyle='#092b48';g.fillRect(xx-5,py+4,12,14);
  g.fillStyle='#4e3324';g.fillRect(xx-6,py-21,12,31);
  g.fillStyle='#be874a';g.fillRect(xx-3,py-20,4,29);
  g.fillStyle='#edbd72';g.fillRect(xx-2,py-18,2,24);
  g.fillStyle='#9ea9a6';g.fillRect(xx-6,py-17,12,3);
  g.fillStyle='#e2d6b3';g.beginPath();g.ellipse(xx,py-23,7,4,0,0,Math.PI*2);g.fill();
  g.strokeStyle='#b8a77c';g.lineWidth=2;g.beginPath();g.ellipse(xx,py-9,7,3,0,0,Math.PI*2);g.stroke();
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
  g.imageSmoothingEnabled=false;paintSprite(g,o.image,o.x,o.y,o.w,o.h);objectsDrawn++;
 }
 // Waterfront district placard, placed in the garden behind the walking lane.
 if(visible({x:5370,y:3575,w:240,h:70},view)){
  g.fillStyle='#544132';g.fillRect(5395,3600,9,43);g.fillRect(5576,3600,9,43);
  g.fillStyle='#1b2c3c';g.fillRect(5370,3575,240,37);
  g.strokeStyle='#d6b785';g.lineWidth=3;g.strokeRect(5370,3575,240,37);
  g.fillStyle='#fff0ce';g.font='bold 18px "Barlow Condensed",sans-serif';g.textAlign='center';g.fillText('WATERFRONT & DOCKS',5490,3600);
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
  g.strokeStyle='rgba(116,201,217,.35)';g.lineWidth=1;g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h-6+dy,o.w*.48,9+Math.sin(t*.001+o.p)*2,0,0,Math.PI*2);g.stroke();
  g.fillStyle='rgba(6,38,64,.24)';g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h/2+11,o.w*.34,11,0,0,Math.PI*2);g.fill();
  paintSprite(g,o.id,o.x,o.y+dy,o.w,o.h);objectsDrawn++;
 }
 // Water motion: capped number of strokes; no per-pixel pixel data or particles.
 const tphase=Math.floor(t/155),bounds={x:4410,y:3830,w:1660,h:700};
 if(visible(bounds,view)){waterFrames++;
  const sx=Math.max(4410,Math.floor(view.x/90)*90);
  const ex=Math.min(6070,view.x+view.w+100);
  for(let x=sx;x<ex;x+=90)for(let y=3830;y<4590;y+=68){
   if(y+15<view.y||y>view.y+view.h)continue;
   const z=hash(x,y,18);let drift=(tphase+z)%54;
   const waveX=x+drift,waveY=y+(z%15),waveW=15+(z%8);
   if(waveY<4100&&PIER_X.some(px=>waveX<px+90&&waveX+waveW>px))continue;
   g.globalAlpha=.15+(z%5)*.035;g.strokeStyle=z%2?'#b5eadf':'#55c6da';g.lineWidth=2;
   g.beginPath();g.moveTo(waveX,waveY);g.lineTo(waveX+waveW,waveY);g.stroke();
  }
  g.globalAlpha=1;
 }
 // Broken golden lamp trails on water, with a soft rhythm instead of a flat glow disc.
 if(opt.zoom>.38)for(const lx of [4473,4773,5073,5373,5673]){
  if(lx<view.x-20||lx>view.x+view.w+20)continue;
  for(let k=0;k<12;k++){
   const yy=3820+k*13,xx=lx+Math.sin(t*.0015+k*2)*5;
   if(PIER_X.some(px=>xx>px-12&&xx<px+102))continue;
   g.globalAlpha=(1-k/14)*(.28+.1*Math.sin(t*.002+k));
   g.fillStyle=k%3?'#f6cf6c':'#fff2a9';g.fillRect(xx-(12-k*.6)/2,yy,12-k*.6,2);
  }
  g.globalAlpha=1;
 }
 measure(performance.now()-a);
}
function drawNpc(g,a,t){
 const detail=img('marina-reference-atlas.webp'),p=a.npcStyle||0;
 g.fillStyle='rgba(9,28,40,.26)';g.beginPath();g.ellipse(a.x,a.y+6,13,5,0,0,Math.PI*2);g.fill();
 if(window.ROOKIE_V116_WALK?.draw(g,a))return;
 if(detail){const key=p===0?'hero':p===1||p===2?'fisher':'visitor';
  const bob=a.moving?Math.sin(t*.012)*1.1:0;
  paintSprite(g,key,a.x-20,a.y-48+bob,40,55);return;}
 const im=img('marina-people.png');if(im)g.drawImage(im,p*32,0,32,48,a.x-15,a.y-38,32,48);
}
function foreground(g,opt,t){
 if(!enabled||!opt||opt.zoom<.14)return;
 const view=opt.view,a=performance.now();
 for(const o of objects){if(!visible(o,view,40))continue;
  if(o.type!=='palm'&&o.type!=='tree'&&o.type!=='lamp')continue;
  const sprite=img(o.image);if(!sprite)continue;
  if(o.type==='lamp'){
   paintSprite(g,o.image,o.x,o.y,o.w,o.h);
   // Tiny amber light flicker; no full-screen shadows.
   if(opt.zoom>.38){g.globalAlpha=.13+.05*Math.sin(t*.002+o.x);
     g.fillStyle='#ffe2a3';g.beginPath();g.arc(o.x+o.w/2,o.y+18,30,0,Math.PI*2);g.fill();g.globalAlpha=1;}
   continue;
  }
  const phase=o.x*.007+o.y*.009;
  const sway=Math.sin(t*.00065+phase)*(o.type==='palm'?2.0:1.15);
  g.save();
  if(opt.player&&opt.player.x>o.x-10&&opt.player.x<o.x+o.w+10&&opt.player.y>o.y&&opt.player.y<o.y+o.h+12)g.globalAlpha=.42;
  g.translate(o.x+o.w/2,o.y+o.h);g.rotate(sway*.0038);g.imageSmoothingEnabled=false;
  paintSprite(g,o.image,-o.w/2,-o.h,o.w,o.h);g.restore();objectsDrawn++;
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
 for(const a of actors){a.moving=false;if(!a.speed||a.route.length===1)continue;
  const next=a.route[(a.step+1)%a.route.length];const dx=next[0]-a.x,dy=next[1]-a.y,len=Math.hypot(dx,dy);
  if(len<2){a.step=(a.step+1)%a.route.length;continue;}
  const step=Math.max(0,Math.min(len,a.speed*Math.min(.05,dt)));a.x+=dx/len*step;a.y+=dy/len*step;
  a.moving=step>.001;a.distance=(a.distance||0)+step;a.stepLength=Math.max(4,a.speed*.13);
  if(a.moving)a.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
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
  button.addEventListener('click',()=>{for(const [x,y] of [[5150,3720],[4980,3710],[5340,3720],[4790,3720],[5600,3730]])if(campus.openAt(x,y,window.innerWidth>window.innerHeight?Math.max(.5,Math.min(1.1,window.innerWidth/1688)):.85))return;});toolbar.appendChild(button);
 }
 if(/[?&]v116QA=1(?:&|$)/.test(location.search)){
  document.documentElement.dataset.v116Qa='1';
 }
 ready=true;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
})();
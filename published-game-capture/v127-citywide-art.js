/* ROOKIE V127 — unified 32px citywide materials and depth props.
 * Uses the existing Southbay Marina tile atlas & original exterior sprites.
 * Same 1:1 harbor-main world, native camera, zero new loops. The authored
 * Coast Park plan shares the existing depth queue and blocked() entry point.
 * No direct writes to campaign state, saved data, vehicles or Zombie mode.
 */
(function(){
'use strict';
const H=window.HARBOR;
if(!H?.worldV115||!H?.seamlessCampusV115) {
  // Script may load before V115 campus: the campus module reads this API at
  // draw-time, but initialization requires only the canonical world registry.
}
const WORLD={minX:-3100,maxX:9656,minY:0,maxY:4680};
const CHUNK=256,CAP=112;
const atlas=new Image();atlas.decoding='async';atlas.src='./assets/v116-marina/marina-detail-tiles.png';
const spriteFiles={
 tree:'shade_tree.webp',bigtree:'shade_tree.webp',palm:'palm.webp',
 lamp:'lamp.webp',bench:'bench.webp',planter:'flower_planter.webp',
 flowerbed:'flower_planter.webp',fountain:'fountain.webp',
 mailbox:'bollard.webp'
};
const sprites={};
for(const [type,file] of Object.entries(spriteFiles)){
 if(sprites[type])continue;
 const im=new Image();im.decoding='async';im.src='./assets/exterior/'+file;sprites[type]=im;
}
const spriteReady=type=>!!(sprites[type]?.complete&&sprites[type]?.naturalWidth>0);
const cache=new Map();const metrics={chunks:0,drawn:0,props:0,coast:0,details:0};
let frameZoom=1; // use color LOD only when whole-city overview is zoomed far out
// Invalidate fallback-color chunks as soon as the shared atlas decodes.
// Otherwise first-frame blank tiles could remain cached across the whole city.
atlas.addEventListener('load',()=>cache.clear());
const ocean=new Image();ocean.decoding='async';ocean.src='./assets/v121-marina/water-body.png';
ocean.addEventListener('load',()=>cache.clear());
function hash(a,b,c=0){let x=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,1442695041);x=Math.imul(x^(x>>>13),1274126177);return (x^(x>>>16))>>>0;}
function visible(r,v,p=32){return !v||(r.x<v.x+v.w+p&&r.x+r.w>v.x-p&&r.y<v.y+v.h+p&&r.y+r.h>v.y-p);}
function inRect(x,y,r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;}
const colors={grass:'#639551',brick:'#bda48c',stone:'#bcae97',road:'#3c4853',water:'#11648e',sand:'#b9a777'};
function colorKind(c){
 if(!c||!/^#[\da-f]{6}$/i.test(c))return 'grass';
 const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);
 if(Math.max(r,g,b)-Math.min(r,g,b)<28&&r<120)return 'road';
 if(b>r*1.15&&b>g*.95)return 'water';
 if(g>r*1.13&&g>b*.94)return 'grass';
 if(r>g*1.2&&g>b*.99)return 'sand';
 return r>125?'brick':'stone';
}
function tileChunk(type,cx,cy){
 const key=type+':'+cx+':'+cy;
 if(cache.has(key)){const im=cache.get(key);cache.delete(key);cache.set(key,im);return im;}
 const c=document.createElement('canvas');c.width=c.height=CHUNK;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle=colors[type]||colors.grass;g.fillRect(0,0,CHUNK,CHUNK);
 const ready=atlas.complete&&atlas.naturalWidth>=256&&atlas.naturalHeight>=96;
 if(type==='water'){
   if(ocean.complete&&ocean.naturalWidth)g.drawImage(ocean,0,0,CHUNK,CHUNK);
   if(cache.size>=CAP)cache.delete(cache.keys().next().value);
   cache.set(key,c);return c;
 }
 for(let y=0;y<CHUNK;y+=32)for(let x=0;x<CHUNK;x+=32){
   const wx=cx+x,wy=cy+y,n=hash(wx/32,wy/32,47);
   if(ready&&type!=='road'&&type!=='stone'&&type!=='sand'){
     const ids=type==='grass'?[4,5,6,7]:type==='brick'?[0,1,2,3]:[16,17,18,19];
     const id=ids[n%ids.length];
     g.drawImage(atlas,(id%8)*32,Math.floor(id/8)*32,32,32,x,y,32,32);
   }else if(type==='road'||type==='stone'||type==='sand'){
     g.fillStyle=type==='road'?['#404a53','#3f4953','#414b54'][n%3]:
       type==='stone'?['#adaba0','#b6b1a5','#c1b9ad'][n%3]:
       ['#d4bc87','#d6bd89','#d5bd88'][n%3];
     g.fillRect(x,y,32,32);
   }
   // A restrained, world-seeded 1px pixel texture (never noisy glitter).
   if(type==='grass'){
     g.fillStyle=n%2?'rgba(21,71,40,.28)':'rgba(211,238,135,.26)';
     for(let k=0;k<4;k++){const xx=x+(hash(n,k)%29),yy=y+(hash(k,n)%29);g.fillRect(xx,yy,2,2);}
   }else if(type==='road'||type==='stone'){
     g.fillStyle='rgba(19,38,45,.13)';
     for(let k=0;k<5;k++)g.fillRect(x+hash(n,k)%29,y+hash(n,k+3)%30,2,1);
   }else if(type==='sand'){
     g.fillStyle='rgba(102,80,54,.16)';
     for(let k=0;k<6;k++)g.fillRect(x+hash(k,n)%29,y+hash(n,k+2)%29,2,1);
   }else if(type==='brick'){
     // World-anchored masonry: staggered joins, mortar and occasional edge wear.
     g.fillStyle='rgba(255,228,181,.14)';g.fillRect(x+3,y+4,24,1);
     g.fillStyle='rgba(59,57,53,.18)';g.fillRect(x,y+30,32,2);
     g.fillRect(x+(n%2?15:26),y+5,1,24);
     if(n%7===0){g.fillStyle='rgba(83,89,74,.22)';g.fillRect(x+2,y+27,5,2);}
   }
 }
 if(cache.size>=CAP)cache.delete(cache.keys().next().value);
 cache.set(key,c);metrics.chunks=cache.size;return c;
}
function surface(g,r,type,view){
 if(!visible(r,view)||r.w<=0||r.h<=0)return;
 // High-level atlas/overview: no 900-chunk texture thrashing at tiny zoom.
 if(frameZoom<.16){g.fillStyle=colors[type]||colors.grass;g.fillRect(r.x,r.y,r.w,r.h);return;}
 const left=Math.max(r.x,view?.x??WORLD.minX),right=Math.min(r.x+r.w,(view?.x??WORLD.minX)+(view?.w??(WORLD.maxX-WORLD.minX)));
 const top=Math.max(r.y,view?.y??WORLD.minY),bottom=Math.min(r.y+r.h,(view?.y??WORLD.minY)+(view?.h??WORLD.maxY));
 if(left>=right||top>=bottom)return;
 g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();g.imageSmoothingEnabled=false;
 const x0=Math.floor(left/CHUNK)*CHUNK,y0=Math.floor(top/CHUNK)*CHUNK;
 for(let yy=y0;yy<bottom;yy+=CHUNK)for(let xx=x0;xx<right;xx+=CHUNK){
   g.drawImage(tileChunk(type,xx,yy),xx,yy);metrics.drawn++;
 }
 g.restore();
}
function base(g,opt){
 frameZoom=opt.zoom||1;
 const view=opt.view||{x:WORLD.minX,y:0,w:WORLD.maxX-WORLD.minX,h:WORLD.maxY};
 surface(g,{x:WORLD.minX,y:0,w:WORLD.maxX-WORLD.minX,h:WORLD.maxY},'grass',view);
}
// Subtle art-directed ground dressing follows *existing* district ground layers.
// Nothing new is collidable, interactive, or saved. Chunk-independent coordinates
// ensure no seams as the same camera crosses district boundaries.
function districtGround(g,d,view){
 const m=d.map,ground=m.ground||[];
 surface(g,{x:d.x,y:d.y,w:d.w,h:d.h},colorKind(m.base||'#729763'),view);
 for(const r of ground){
   const abs={x:d.x+r.x,y:d.y+r.y,w:r.w,h:r.h};
   if(!visible(abs,view))continue;
   surface(g,abs,colorKind(r.c),view);
 }
 if(m.connectedParking)midtownParking(g,d,view);
 if(frameZoom<.45||d.id==='waterfront')return; // protected Marina art is authoritative
 const step=92,fromX=Math.max(d.x,Math.floor(view.x/step)*step),
   fromY=Math.max(d.y,Math.floor(view.y/step)*step);
 const maxX=Math.min(d.x+d.w,view.x+view.w+step),
   maxY=Math.min(d.y+d.h,view.y+view.h+step);
 for(let y=fromY;y<maxY;y+=step)for(let x=fromX;x<maxX;x+=step){
   const n=hash(Math.floor(x/step),Math.floor(y/step),String(d.id||'generic').length);
   if(n%4===0)continue;
   const lx=x-d.x+19+(n%37),ly=y-d.y+20+((n>>>5)%37);
   if(lx<8||ly<8||lx>d.w-8||ly>d.h-8)continue;
   let type=colorKind(m.base||'#729763');
   for(const r of ground)if(lx>=r.x&&lx<r.x+r.w&&ly>=r.y&&ly<r.y+r.h)type=colorKind(r.c);
   if(type!=='grass')continue; // never plant tufts onto streets or brick
   const px=d.x+lx,py=d.y+ly;
   // Grass blades, leaf litter and occasional tiny wildflowers (not fake trees).
   g.fillStyle=n%2?'rgba(28,92,46,.42)':'rgba(194,221,114,.46)';
   g.fillRect(px,py-3,2,6);g.fillRect(px-4,py,4,2);g.fillRect(px+3,py-2,3,3);
   if(n%9===0){g.fillStyle='#e7d18a';g.fillRect(px+8,py-4,3,3);
     g.fillStyle='#476a45';g.fillRect(px+9,py-1,1,3);}
   metrics.details++;
 }
 districtFinish(g,d,view);
}
// Ground dressing in the existing district pass. Original depth props and
// parked-car renderers still own every object above this parking surface.
function midtownParking(g,d,view){
 const p=d.map.connectedParking,kit=window.ROOKIE_V135_WALL_KIT;
 kit?.prepareCommunityAssets();
 for(const t of p.terraces||[]){
   const r={...t,x:d.x+t.x,y:d.y+t.y};surface(g,r,'grass',view);
   kit?.drawCommunityBorder(g,{x:r.x+12,y:r.y+12,w:r.w-24,h:r.h-24});
 }
 for(const lot of p.lots){
   const r={...lot,x:d.x+lot.x,y:d.y+lot.y};if(!visible(r,view))continue;
   surface(g,r,'road',view);
   g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();
   if(!kit?.fillGround(g,'asphalt',r.x,r.y,r.w,r.h))surface(g,r,'road',view);
   g.strokeStyle='#b4a895';g.lineWidth=7;g.beginPath();g.roundRect(r.x+4,r.y+4,r.w-8,r.h-8,12);g.stroke();
   g.strokeStyle='#eee0c8';g.lineWidth=2;g.beginPath();g.roundRect(r.x+4,r.y+2,r.w-8,r.h-8,12);g.stroke();
   kit?.drawCommunityBorder(g,{x:r.x+12,y:r.y+12,w:r.w-24,h:r.h-24});
   g.restore();
 }
 // Openings cross the existing paved sidewalk into the real lot aisle.
 for(const e of p.entrances){
   const x=d.x+e.x-5,y=d.y+e.y,w=e.w+10;
   surface(g,{x,y,w,h:e.h},'road',view);kit?.fillGround(g,'asphalt',x,y,w,e.h);
   g.strokeStyle='#d5c8ac';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.moveTo(x,y+e.h);g.lineTo(x+w,y+e.h);g.stroke();
 }
 for(const bay of p.bays){
   const x=d.x+bay.x,y=d.y+bay.y,quarter=Math.abs(Math.sin(bay.angle||0))>.5,w=quarter?bay.h:bay.w,h=quarter?bay.w:bay.h;
   g.save();g.translate(x+bay.w/2,y+bay.h/2);g.rotate(bay.angle||0);
   if(!kit?.drawGroundSprite(g,'parking_stall_top',-w/2,-h/2,w,h)){
     g.strokeStyle='#e2dfca';g.lineWidth=2;g.strokeRect(-w/2,-h/2,w,h);
   }
   kit?.drawGroundSprite(g,'parking_wheelstop',-w/2+8,-h/2+5,w-16,24);g.restore();
 }
 for(const island of p.islands){
   const r={...island,x:d.x+island.x,y:d.y+island.y};
   surface(g,r,'grass',view);g.strokeStyle='#c4b79f';g.lineWidth=4;g.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);
   kit?.drawCommunityBorder(g,{x:r.x+12,y:r.y+12,w:r.w-24,h:r.h-24});
 }
}
function refinesCrossing(c){return !!window.HARBOR?.seamlessCampusV115?.isOpen()&&((c.x>4090&&c.x<5120&&c.y>1620&&c.y<1930)||(c.x>2550&&c.x<2920&&[1784,2540,3744].some(y=>Math.abs(c.y-y)<140)));}
function boundaryGround(g,opt){
 for(const r of [{x:2600,y:1848,w:44,h:1832},{x:2800,y:1848,w:64,h:1832}])surface(g,r,'brick',opt.view);
}
function midtownStreetFinish(g,d,view){
 const p=d?.map?.connectedParking,kit=window.ROOKIE_V135_WALL_KIT;if(!p?.reference||!kit)return;
 for(const cross of p.crossings){
   const x=d.x+cross.x,y=d.y+cross.y;
   if(!visible({x:x-140,y:y-130,w:280,h:260},view))continue;
   for(const yy of [y-94,y+94])kit.drawRoadDecal(g,'crosswalk',x,yy,1,0,[152,34]);
   for(const xx of [x-110,x+110])kit.drawRoadDecal(g,'crosswalk',xx,y,1,Math.PI/2,[111,34]);
   // Ground-only curb returns and tactile pads at the actual street corners.
   for(const sx of [-1,1])for(const sy of [-1,1]){
     const cx=x+sx*84,cy=y+sy*63.5;
     g.save();g.translate(cx,cy);g.scale(sx,sy);
     g.strokeStyle='#b1a28a';g.lineWidth=8;g.beginPath();g.moveTo(0,25);g.lineTo(0,18);g.quadraticCurveTo(0,0,18,0);g.lineTo(25,0);g.stroke();
     g.strokeStyle='#f1dec0';g.lineWidth=3;g.stroke();g.fillStyle='#dcae4a';
     g.fillRect(8,10,13,9);g.fillStyle='#f7d573';for(let i=0;i<3;i++)for(let j=0;j<2;j++)g.fillRect(10+i*4,12+j*4,2,2);g.restore();
   }
 }
 // Three T-junctions on the new west-boundary street. Mark only approaches
 // backed by actual asphalt; no phantom crossing into a closed park edge.
 for(const [y,mode]of [[1784,'south'],[2540,'east'],[3744,'north']]){
   const x=2722;if(!visible({x:x-150,y:y-130,w:300,h:260},view))continue;
   if(mode==='east'){
     for(const yy of [y-94,y+94])kit.drawRoadDecal(g,'crosswalk',x,yy,1,0,[140,30]);
     kit.drawRoadDecal(g,'crosswalk',x+110,y,1,Math.PI/2,[112,30]);
   }else{
     kit.drawRoadDecal(g,'crosswalk',x,y+(mode==='south'?94:-94),1,0,[140,30]);
     for(const xx of [x-110,x+110])kit.drawRoadDecal(g,'crosswalk',xx,y,1,Math.PI/2,[112,30]);
   }
 }
}
// District identity is painted from the real MAPS footprint and authored decor
// positions, not from a fake overview layer. Everything here sits ON the ground:
// the existing collision and depth queues remain the source of physical truth.
const districtThemes=Object.freeze({
 westfield:{stone:'#9a9a79',flora:'#548049',accent:'#d5ad72',step:208},
 residential:{stone:'#b6aa91',flora:'#467b49',accent:'#e1b477',step:192},
 midtown:{stone:'#afa49b',flora:'#537451',accent:'#d2a571',step:176},
 downtown:{stone:'#c4b59d',flora:'#426b56',accent:'#d6b879',step:160},
 eastside:{stone:'#a5b0a6',flora:'#457a61',accent:'#97bec2',step:184},
 industrial:{stone:'#7f8f8d',flora:'#66745d',accent:'#d4b36f',step:200},
 northgate:{stone:'#919888',flora:'#3f654b',accent:'#c9b88d',step:206},
 southbay:{stone:'#b5af90',flora:'#568a64',accent:'#deb882',step:192}
});
function groundTypeAt(d,lx,ly){
 const m=d.map;let type=colorKind(m.base||'#729763');
 for(const r of m.ground||[])if(lx>=r.x&&ly>=r.y&&lx<r.x+r.w&&ly<r.y+r.h)
   type=colorKind(r.c);
 return type;
}
function districtFinish(g,d,view){
 const theme=districtThemes[d.id];
 // The authored waterfront's depth, water and furniture are never overpainted.
 if(!theme||frameZoom<.38||!visible(d,view))return;
 const step=theme.step;
 const left=Math.max(d.x,Math.floor(Math.max(d.x,view.x)/step)*step);
 const top=Math.max(d.y,Math.floor(Math.max(d.y,view.y)/step)*step);
 const right=Math.min(d.x+d.w,view.x+view.w+step);
 const bottom=Math.min(d.y+d.h,view.y+view.h+step);
 const drawGrassFeature=(px,py,n)=>{
   // Restrained color bands suggest groundskeepers, wild patches or foot traffic.
   // Pixel forms remain entirely at ground height and cannot occlude characters.
   if(d.id==='industrial'){
     g.fillStyle='rgba(67,83,74,.18)';g.fillRect(px-33,py-10,66,23);
     g.fillStyle='rgba(200,187,123,.30)';for(let i=0;i<4;i++)g.fillRect(px-27+i*16,py-6,9,3);
   }else if(d.id==='residential'){
     g.fillStyle='rgba(28,89,42,.21)';g.fillRect(px-38,py-17,76,31);
     g.fillStyle=theme.flora;
     for(let i=0;i<6;i++){const h=hash(n,i)%8;g.fillRect(px-33+i*11,py+2-h,7,7+h);}
     if(n%3===0){g.fillStyle=theme.accent;for(let i=0;i<3;i++)g.fillRect(px-24+i*20,py-4,3,3);}
   }else if(d.id==='westfield'||d.id==='northgate'){
     g.fillStyle='rgba(33,76,42,.20)';g.fillRect(px-40,py-13,80,26);
     g.fillStyle=theme.flora;
     for(let i=0;i<7;i++){let dx=hash(n,i)%68-34,dy=hash(i,n)%20-9;g.fillRect(px+dx,py+dy,6,5);}
     if(n%4===0){g.fillStyle=theme.stone;g.fillRect(px+17,py+5,16,5);g.fillRect(px+10,py+3,10,5);}
   }else if(d.id==='southbay'){
     g.fillStyle='rgba(213,194,140,.20)';g.fillRect(px-39,py-12,78,24);
     g.fillStyle=theme.flora;for(let i=0;i<5;i++)g.fillRect(px-29+i*13,py+hash(n,i)%9-5,3,9);
     if(n%5===0){g.fillStyle=theme.accent;g.fillRect(px+18,py-8,10,3);}
   }else {
     g.fillStyle='rgba(36,83,58,.13)';g.fillRect(px-34,py-12,68,24);
     g.fillStyle=theme.flora;for(let i=0;i<5;i++)g.fillRect(px-25+i*12,py+hash(i,n)%7-4,5,7);
     if(n%4===0){g.fillStyle=theme.accent;g.fillRect(px+15,py-10,4,4);}
   }
 };
 for(let y=top;y<bottom;y+=step)for(let x=left;x<right;x+=step){
   // World-seeded placement: no temporal flicker or chunk boundary seams.
   const n=hash(Math.floor(x/step),Math.floor(y/step),theme.step);
   if(n%6===0)continue;
   const px=x+34+n%73,py=y+37+((n>>>7)%73),lx=px-d.x,ly=py-d.y;
   if(lx<60||ly<60||lx>d.w-60||ly>d.h-60)continue;
   if(groundTypeAt(d,lx,ly)!=='grass'||
      groundTypeAt(d,lx-44,ly-27)!=='grass'||
      groundTypeAt(d,lx+44,ly-27)!=='grass'||
      groundTypeAt(d,lx-44,ly+27)!=='grass'||
      groundTypeAt(d,lx+44,ly+27)!=='grass')continue;
   if(!visible({x:px-46,y:py-27,w:92,h:54},view,4))continue;
   drawGrassFeature(px,py,n);metrics.details++;
 }
 // Ground-level entrance treatments are generated from actual building outlines.
 // They visually connect buildings to the paths instead of floating in green.
 // No physical doorway, house bounds or NPC routing are changed.
 if(frameZoom<.52)return;
 for(const o of d.map.decors||[]){
   if(!['bldg','house','shed','mtbldg'].includes(o.t))continue;
   const bx=o.t==='mtbldg'?(o.bx??o.x??0):(o.x||0);
   const by=o.t==='mtbldg'?(o.btop??o.y??0):(o.y||0);
   const bw=o.t==='mtbldg'?(o.bw??o.w??0):(o.w||0);
   const bh=o.t==='mtbldg'?(o.bh??o.h??0):(o.h||0);
   if(bw<60||bh<60)continue;
   const wx=d.x+bx+bw/2,wy=d.y+by+bh;
   if(!visible({x:wx-44,y:wy,w:88,h:32},view,6))continue;
   // Suppress ground treatment when it would land inside water/road.
   const kind=groundTypeAt(d,bx+bw/2,by+bh+12);
   if(kind==='water'||kind==='road')continue;
   const seed=hash(Math.floor(wx),Math.floor(wy),97);
   g.fillStyle='rgba(14,31,37,.18)';g.fillRect(wx-30,wy+1,60,5);
   g.fillStyle=theme.stone;g.fillRect(wx-22,wy+6,44,17);
   g.fillStyle='rgba(242,228,198,.28)';g.fillRect(wx-20,wy+7,40,2);
   g.fillStyle='rgba(61,65,62,.18)';g.fillRect(wx-22,wy+20,44,3);
   if(o.t==='house'||d.id==='residential'){
     for(const side of [-1,1]){
       const px=wx+side*(bw/2-15);
       g.fillStyle='rgba(39,79,45,.34)';g.fillRect(px-13,wy+2,26,14);
       g.fillStyle=theme.flora;
       for(let i=0;i<3;i++)g.fillRect(px-10+i*8,wy+4+(seed+i)%4,6,8);
     }
   }else if(d.id==='industrial'){
     g.fillStyle='rgba(224,186,99,.54)';
     for(let i=0;i<4;i++)g.fillRect(wx-35+i*20,wy+26,9,3);
   }
   metrics.details++;
 }
 // The existing lamp objects cast a small grounded ambient pool;
 // lamp sprites and player shadows continue through the real depth queue.
 for(const o of d.map.decors||[]){
   if(o.t!=='lamp')continue;
   const x=d.x+(o.x||0),y=d.y+(o.y||0);
   if(!visible({x:x-53,y:y-22,w:106,h:44},view))continue;
   g.fillStyle='rgba(250,211,120,.07)';g.beginPath();g.arc(x,y,45,0,Math.PI*2);g.fill();
   g.fillStyle='rgba(254,216,142,.08)';g.beginPath();g.arc(x,y,22,0,Math.PI*2);g.fill();
 }
}

function road(g,r,view){surface(g,r,'road',view);}
// Coast Park uses the same material cache, world depth queue and collision
// entry point as the city. One deterministic scenery plan; no new game loop.
const PARK=Object.freeze({x:200,y:1900,w:2400,h:1750});
const CIVIC=Object.freeze({x:528,y:1900,w:840,h:228,centerX:948,
 monument:{x:948,y:2058,w:280,h:280*315/598},
 flags:[{id:'puerto_rico',x:716,y:2070},{id:'el_salvador',x:1148,y:2070}],
 steps:{x:904,y:2128,w:88,h:40}});
function civicContains(x,y,pad=0){return x>=CIVIC.x-pad&&x<=CIVIC.x+CIVIC.w+pad&&y>=CIVIC.y-pad&&y<=CIVIC.y+CIVIC.h+pad;}
function civicOverlaps(x,y,w,h,pad=12){return x<CIVIC.x+CIVIC.w+pad&&x+w>CIVIC.x-pad&&y<CIVIC.y+CIVIC.h+pad&&y+h>CIVIC.y-pad;}
const parkWaypoints=[
 [[1460,1900],[1440,2680],[1120,2880],[950,2980],[650,3080],[550,3290],[740,3440],[1130,3520],[1460,3470],[1700,3370],[1850,3200],[2020,3010],[1910,2880],[1670,2850],[1440,2930],[1170,2900],[950,2980]],
 [[200,3260],[380,3220],[550,3290]],[[1350,3650],[1380,3560],[1460,3470]],
 [[2600,3480],[2280,3440],[2100,3370],[1700,3370]],
 [[1130,3520],[1220,3390],[1340,3260],[1380,3220]],
 [[2020,3010],[2020,2940],[2060,2918]],
 [[948,2168],[1040,2260],[1260,2310],[1472.5,2277.5]]
];
const parkTrails=parkWaypoints.map(points=>{
 const samples=[];
 for(let i=0;i<points.length-1;i++){
   const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
   for(let k=0;k<12;k++){const t=k/12,t2=t*t,t3=t2*t;
     samples.push([0,1].map(a=>.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t2+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t3)));
   }
 }samples.push(points.at(-1).slice());return samples;
});
const pond={x:930,y:3290,rx:142,ry:86};
let parkPlan=null;const parkImages=new Map([['v121-marina/water-body.png',ocean]]);
function parkImage(file){if(!parkImages.has(file)){const im=new Image();im.decoding='async';im.src='./assets/'+file;parkImages.set(file,im);}return parkImages.get(file);}
function trailDistance(x,y){let best=Infinity;for(const points of parkTrails)for(let i=1;i<points.length;i++){
 const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 best=Math.min(best,Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t));
}return best;}
function pondRadius(a){return 1+.06*Math.sin(a*3)+.025*Math.cos(a*7);}
function parkWater(x,y,pad=0){const dx=(x-pond.x)/(pond.rx+pad),dy=(y-pond.y)/(pond.ry+pad);return Math.hypot(dx,dy)<pondRadius(Math.atan2(dy,dx));}
function pondShape(g,pad=0){g.beginPath();for(let i=0;i<=48;i++){const a=i*Math.PI*2/48,r=pondRadius(a),x=pond.x+Math.cos(a)*(pond.rx+pad)*r,y=pond.y+Math.sin(a)*(pond.ry+pad)*r;g[i?'lineTo':'moveTo'](x,y);}g.closePath();}
function parkInside(x,y,pad=0){return x>=PARK.x-pad&&x<=PARK.x+PARK.w+pad&&y>=PARK.y-pad&&y<=PARK.y+PARK.h+pad;}
function ensurePark(){
 if(parkPlan)return parkPlan;
 const objects=[],cells=new Map(),solidCells=new Map(),cellSize=192;
 function add(file,x,y,w,h,fw=0,fh=12,crop=null,anchor=.5,animation=null,id=null){
   const o={file,x,y,w,h,crop,anchor,animation,id,foot:fw?{x:x-fw/2,y:y-fh,w:fw,h:fh}:null};objects.push(o);parkImage(file);
   const key=Math.floor(x/cellSize)+':'+Math.floor(y/cellSize);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(o);return o;
 }
 const clear=(x,y)=>civicContains(x,y,20)||Math.hypot((x-1380)*.94,y-3220)<172||Math.hypot(x-2110,y-2930)<116||parkWater(x,y,40);
 for(let y=PARK.y+35;y<PARK.y+PARK.h-36;y+=86)for(let x=PARK.x+28;x<PARK.x+PARK.w-24;x+=86){
   const n=hash(x,y,871),px=x+(n%57)-28,py=y+((n>>>8)%51)-25,w=110+(n>>>15)%64+(n%7===0?30:0),h=Math.round(w*96/108);
   if(px>PARK.x+PARK.w-44||n%13===0||clear(px,py)||clear(px,py-h*.4)||civicOverlaps(px-w/2,py-h,w,h)||trailDistance(px,py)<62||trailDistance(px,py-h*.5)<43)continue;
   add('exterior/shade_tree.webp',px,py,w,h,18,12,[2,14,108,96]);
 }
 // Understory in small groups, with the same protected walking corridors.
 for(let y=PARK.y+48;y<PARK.y+PARK.h-30;y+=73)for(let x=PARK.x+40;x<PARK.x+PARK.w-40;x+=81){
   const n=hash(x,y,1321),px=x+n%43-21,py=y+(n>>>6)%41-20;
   if(clear(px,py)||civicOverlaps(px-25,py-39,50,39)||trailDistance(px,py)<49||n%4===0)continue;
   const flowering=n%3===0;
   add(flowering?'community-walk/shrub_flowering.png':'community-walk/shrub.png',px,py,flowering?48:34,flowering?37:32,22,10);
   if(n%2===0)add('community-walk/flower_patch.png',px+24,py+17,62,34);
 }
 for(const [x,y,w]of [[590,2970,84],[1120,3095,72],[1760,3130,90],[1560,3560,86],[2240,3300,70],[400,3490,78]])
   if(trailDistance(x,y)>50)add('southbay-addon/coastal_rocks.webp',x,y,w,w*.51,Math.min(w*.6,52),18,[89,159,1408,713]);
 // Existing small table and wood benches make a quiet picnic rest area.
 add('community-walk/bench.png',2140,2888,96,65,84,14);
 add('precinct-craft-v1/visitorTable.png',2110,2970,88,64,72,26);
 add('community-walk/bench_small.png',2110,3018,90,46,82,14);
 add('community-walk/lamp.png',2015,2880,30,117,10,8);
 for(const [x,y]of [[2036,2860],[2200,2960],[2090,2855],[2180,3030]])add('community-walk/shrub_flowering.png',x,y,50,39,28,10);
 // Natural rocks, flowers and reeds frame the pond; the bank remains passable.
 for(let i=0;i<11;i++){const a=i*Math.PI*2/11,x=pond.x+Math.cos(a)*(pond.rx+26),y=pond.y+Math.sin(a)*(pond.ry+24);
   add(i%3===0?'southbay-addon/coastal_rocks.webp':'community-walk/shrub_flowering.png',x,y,i%3===0?58:42,i%3===0?30:33,18,10,i%3===0?[89,159,1408,713]:null);
 }
 for(const points of parkTrails){if(points===parkTrails[4])continue;for(let i=3;i<points.length;i+=7){
   const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,side=i%2?1:-1,x=b[0]-dy/len*side*44,y=b[1]+dx/len*side*44;
   if(parkInside(x,y,0)&&!civicContains(x,y,20)&&!parkWater(x,y,20))add('community-walk/flower_patch.png',x,y,42,17,0,12,[9,10,48,19]);
 }}
 // Compact civic landing across the existing x=948 Precinct 9 crossing.
 // Original PNGs retain aspect, source frames and bottom anchors.
 const monument=add('civic-monument/monument/harbor_city_monument.png',CIVIC.monument.x,CIVIC.monument.y,CIVIC.monument.w,CIVIC.monument.h,268,28,null,.5,null,'civic:monument');monument.shadow=[130,8];
 for(const f of CIVIC.flags){const h=174,w=h*160/248;
   const flag=add('civic-monument/flags/'+f.id+'/pole_and_flag_sheet.png',f.x,f.y,w,h,30,18,null,.2,{frameW:160,frameH:248,count:6,fps:6},'civic:flag:'+f.id);flag.shadow=[18,5];
 }
 for(const x of [656,1240])for(const y of [2026,2100])add('community-walk/bench.png',x,y,86,86*53/78,78,14,null,.5,null,'civic:bench:'+x+':'+y);
 for(const x of [558,1338])add('community-walk/lamp.png',x,1924,30,117,10,8,null,.5,null,'civic:lamp:'+x);
 for(const x of [878,1018])add('community-walk/lamp.png',x,2148,24,24*117/30,8,7,null,.5,null,'civic:entry-lamp:'+x);
 for(const x of [574,1322]){
   add('community-walk/tree_flowering.png',x,2074,78,78*118/68,34,12,null,.5,null,'civic:tree:'+x);
   for(const y of [1972,2110])add('community-walk/flower_patch.png',x,y,58,26,0,12,[9,10,48,19]);
 }
 for(const [x,y]of [[682,1968],[1212,1968]])add('community-walk/pot_square.png',x,y,32,32*52/45,24,10);
 for(const x of [574,1322])add('community-walk/hedge.png',x,2116,62,62*32/95,54,8);
 // Beach furniture stays outside the continuous 72px promenade and the
 // broad sand walking corridor. Reuse this queue and footprint index.
 for(let x=-2700;x<9600;x+=480){
   if(x>2600&&x<6100)continue;
   const shore=coastY(x);if(shore<4090)continue;
   add('exterior/palm.webp',x,3960,100,140,22,16,null,.5,null,'beach:palm:'+x);
   add('community-walk/bench.png',x+110,3910,86,58,76,14,null,.5,null,'beach:bench:'+x);
   add('midtown/cafe_patio_set.webp',x+300,4070,100,95,68,30,null,.5,null,'beach:shade:'+x);
 }
 parkImage('v121-marina/water-body.png');
 // Collision footprints may span cells (the monument is wider than a tree).
 // Keep this index separate from centre-indexed visibility to avoid duplicate draws.
 for(const o of objects){const b=o.foot;if(!b)continue;
   for(let cy=Math.floor(b.y/cellSize);cy<=Math.floor((b.y+b.h)/cellSize);cy++)for(let cx=Math.floor(b.x/cellSize);cx<=Math.floor((b.x+b.w)/cellSize);cx++){
     const key=cx+':'+cy;if(!solidCells.has(key))solidCells.set(key,[]);solidCells.get(key).push(o);
   }
 }
 parkPlan={objects,cells,solidCells,cellSize};return parkPlan;
}
let civicGroundCache=null,civicGroundStamp='';
function civicGround(g,view){
 if(!visible({...CIVIC,y:1848,h:324},view))return;
 const stats=window.ROOKIE_V135_WALL_KIT?.stats?.()||{},stamp=[!!stats.communityAtlas,!!stats.groundAtlas,atlas.complete&&atlas.naturalWidth>0,frameZoom<.16].join(':');
 if(!civicGroundCache||stamp!==civicGroundStamp){
   if(!civicGroundCache){civicGroundCache=document.createElement('canvas');civicGroundCache.width=CIVIC.w;civicGroundCache.height=324;}
   const ctx=civicGroundCache.getContext('2d');ctx.clearRect(0,0,CIVIC.w,324);ctx.save();ctx.translate(-CIVIC.x,-1848);
   paintCivicGround(ctx,{x:CIVIC.x,y:1848,w:CIVIC.w,h:324});ctx.restore();civicGroundStamp=stamp;
 }
 g.save();g.imageSmoothingEnabled=false;g.drawImage(civicGroundCache,CIVIC.x,1848);g.restore();
}
function paintCivicGround(g,view){
 const kit=window.ROOKIE_V135_WALL_KIT;if(!visible({...CIVIC,y:1848,h:320},view))return;
 surface(g,{x:CIVIC.x,y:1848,w:CIVIC.w,h:CIVIC.h+52},'brick',view);
 kit?.prepareCommunityAssets();kit?.drawCommunityBorder(g,{x:CIVIC.x+12,y:CIVIC.y+12,w:CIVIC.w-24,h:CIVIC.h-24});
 for(const x of [544,1296]){
   const bed={x,y:1940,w:52,h:178};surface(g,bed,'grass',view);
   kit?.drawCommunityBorder(g,{x:x+12,y:1952,w:28,h:154});
 }
 // Shallow stone steps are assembled from the existing paving/curb tiles.
 const s=CIVIC.steps;surface(g,{...s,h:s.h+4},'stone',view);
 kit?.fillGround(g,'paver_stone',s.x,s.y,s.w,s.h);
 for(let y=s.y;y<s.y+s.h;y+=8){kit?.fillCommunityGround(g,'curb_straight',s.x,y,s.w,6);g.fillStyle='rgba(58,53,47,.19)';g.fillRect(s.x,y+6,s.w,2);}
 // Open the south border visually onto the walkable steps and forest path.
 kit?.fillGround(g,'paver_stone',s.x,s.y-8,s.w,8);
}
function parkGround(g,opt){
 const view=opt.view;if(!visible(PARK,view,30))return;ensurePark();
 surface(g,PARK,'grass',view);g.save();g.beginPath();g.rect(PARK.x,PARK.y,PARK.w,PARK.h);g.clip();
 // Soft leaf-litter variation, world anchored; avoid the old flat green box.
 for(let y=Math.max(PARK.y,Math.floor(view.y/96)*96);y<Math.min(PARK.y+PARK.h,view.y+view.h);y+=96)
 for(let x=Math.max(PARK.x,Math.floor(view.x/96)*96);x<Math.min(PARK.x+PARK.w,view.x+view.w);x+=96){
   const n=hash(x,y,81);g.fillStyle=n%2?'rgba(29,70,33,.11)':'rgba(177,185,75,.09)';g.beginPath();g.ellipse(x+40,y+45,52,34,n%5,0,Math.PI*2);g.fill();
 }
 g.lineJoin='round';g.lineCap='round';
 for(const points of parkTrails){
   if(points===parkTrails[4])continue; // quiet clearing stays grass, still walkable
   g.beginPath();points.forEach((p,i)=>g[i?'lineTo':'moveTo'](p[0],p[1]));g.strokeStyle='#7f8650';g.lineWidth=68;g.stroke();g.strokeStyle='#b29b69';g.lineWidth=56;g.stroke();g.strokeStyle='rgba(224,204,148,.24)';g.lineWidth=46;g.stroke();
 }
 // Sand grain and tiny stones follow the actual path, rather than a new texture pack.
 for(const points of parkTrails)for(let j=1;j<points.length;j++){
   if(points===parkTrails[4])continue;
   const a=points[j-1],b=points[j],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/14);
   for(let i=0;i<n;i++){const t=i/n,seed=hash(a[0]+i,a[1],j),x=a[0]+(b[0]-a[0])*t+(seed%31)-15,y=a[1]+(b[1]-a[1])*t+(seed>>>6)%31-15;
     if(!visible({x,y,w:5,h:3},view,1))continue;g.fillStyle=seed%3?'#c4b382':'#958b63';g.fillRect(x,y,2+seed%3,1+(seed>>>4)%2);
   }
 }
 // Break up the trail margins with small grass bites and occasional pebbles.
 for(const points of parkTrails){if(points===parkTrails[4])continue;for(let i=2;i<points.length;i+=2){
   const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,seed=hash(i,b[0],29);
   for(const side of [-1,1]){const off=27+seed%7,x=b[0]-dy/len*off*side,y=b[1]+dx/len*off*side;
     g.fillStyle=side<0?'#659344':'#527d3a';g.fillRect(x,y,3+seed%5,2+(seed>>>4)%4);
   }
 }}
 g.fillStyle='#a39768';g.beginPath();g.ellipse(2110,2955,112,85,0,0,Math.PI*2);g.fill();
 g.fillStyle='#86865a';pondShape(g,12);g.fill();
 g.save();pondShape(g);g.clip();
 const water=parkImage('v121-marina/water-body.png');g.fillStyle='#176879';g.fillRect(pond.x-pond.rx,pond.y-pond.ry,pond.rx*2,pond.ry*2);
 if(water.complete&&water.naturalWidth)g.drawImage(water,pond.x-pond.rx,pond.y-pond.ry,pond.rx*2,pond.ry*2);g.restore();
 g.strokeStyle='rgba(144,211,186,.6)';g.lineWidth=3;pondShape(g,-4);g.stroke();g.restore();
}
function parkObjects(view,margin=190){const p=ensurePark(),items=[],s=p.cellSize;
 for(let cy=Math.floor((view.y-margin)/s);cy<=Math.floor((view.y+view.h+margin)/s);cy++)for(let cx=Math.floor((view.x-margin)/s);cx<=Math.floor((view.x+view.w+margin)/s);cx++)
 for(const o of p.cells.get(cx+':'+cy)||[])if(visible({x:o.x-o.w*(o.anchor??.5),y:o.y-o.h,w:o.w,h:o.h},view,12))items.push(o);
 return items;
}
function parkBlocked(x,y,r){
 if(!parkInside(x,y,48)&&(y<3880||y>4140))return false;if(parkInside(x,y)&&parkWater(x,y,r))return true;
 const p=ensurePark(),s=p.cellSize;
 for(let cy=Math.floor((y-r)/s);cy<=Math.floor((y+r)/s);cy++)for(let cx=Math.floor((x-r)/s);cx<=Math.floor((x+r)/s);cx++)for(const o of p.solidCells.get(cx+':'+cy)||[]){
   const b=o.foot;if(!b)continue;const px=Math.max(b.x,Math.min(x,b.x+b.w)),py=Math.max(b.y,Math.min(y,b.y+b.h));if((x-px)**2+(y-py)**2<r*r)return true;
 }return false;
}
function coastY(x){
 if(x>=4400&&x<5900)return 3800;
 if(x>=3500&&x<4400)return 4200-(x-3500)*400/900;
 if(x>=5900&&x<7050)return 3800+(x-5900)*420/1150;
 return 4220+Math.sin(x*.0018)*25;
}
function coastalWater(x,y){
 if(parkInside(x,y)&&parkWater(x,y))return true;
 if(x>=2800&&x<4400)return false; // Bayview's authored shore and pier are owned by Marina.
 if(x>=4400&&x<5900)return false; // Native V116 coastline / piers own this.
 if(y<3780||y>WORLD.maxY)return false;
 return y>=coastY(x)+18;
}
function coastline(g,opt){
 if(opt.zoom<.16)return; // coast remains readable via original atlas at citywide LOD
 const view=opt.view;
 // Match the original marina shore at both boundaries; extend that shoreline
 // into Southbay/Coast Park without a hard water/grass rectangle.
 const sx=Math.max(WORLD.minX,Math.floor(view.x/32)*32),ex=Math.min(WORLD.maxX,view.x+view.w+32);
 const ey=Math.min(WORLD.maxY,view.y+view.h+32),sy=Math.max(3780,view.y);
 for(let x=sx;x<ex;x+=32){
   if(x>=2800&&x<4400)continue; // No sloping coast across Bayview houses / dock.
   if(x>=4400&&x<5900)continue;
   const shoreline=coastY(x),top=Math.max(sy,Math.floor(shoreline/32)*32);
   if(top>=ey)continue;
   // Narrow natural sand strip supports the premium water material visually.
   surface(g,{x,y:shoreline-16,w:32,h:34},'sand',view);
   surface(g,{x,y:shoreline+18,w:32,h:WORLD.maxY-shoreline-18},'water',view);
   metrics.coast++;
 }
}
function beachGround(g,view,time=0){
 if(view.y+view.h<3808)return;
 for(const [left,right]of [[WORLD.minX,2800],[5900,WORLD.maxX]]){
  const sx=Math.max(left,Math.floor(view.x/32)*32-32),ex=Math.min(right,view.x+view.w+32);if(sx>=ex)continue;
  const points=[];for(let x=sx;x<ex;x+=16)points.push([x,coastY(x)+18]);points.push([ex,coastY(ex)+18]);
  // Clip one continuous beach/ocean polygon, avoiding fractional-zoom
  // seams from painting a separate clipped rectangle every 32 pixels.
  g.save();g.beginPath();g.moveTo(sx,3808);g.lineTo(ex,3808);for(let i=points.length-1;i>=0;i--)g.lineTo(...points[i]);g.closePath();g.clip();
  surface(g,{x:sx,y:3808,w:ex-sx,h:WORLD.maxY-3808},'sand',view);
  g.beginPath();g.moveTo(sx,3808);g.lineTo(ex,3808);for(let i=points.length-1;i>=0;i--)g.lineTo(points[i][0],Math.min(3880,points[i][1]-50));g.closePath();g.clip();
  surface(g,{x:sx,y:3808,w:ex-sx,h:72},'brick',view);g.restore();
  g.save();g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.lineTo(ex,WORLD.maxY);g.lineTo(sx,WORLD.maxY);g.closePath();g.clip();
  surface(g,{x:sx,y:3800,w:ex-sx,h:WORLD.maxY-3800},'water',view);g.restore();
  g.strokeStyle='rgba(215,247,237,.7)';g.lineWidth=2;g.beginPath();for(const [i,p]of points.entries())g[i?'lineTo':'moveTo'](p[0],p[1]+Math.sin(p[0]*.045+time*.0012)*3);g.stroke();
 }
}

const promenades=[
 [-3100,-650],[-506,2800],[2800,3460],[3630,4400],[5900,6556],[6556,8156],[8156,9656]
];
function walkways(g,opt){
 if(opt.zoom<.16)return;
 const v=opt.view;
 // One aligned coastline pedestrian avenue, physically continuous through
 // the same real district coordinate system and original road crossings.
 for(const [x1,x2] of promenades){
  if(x2<=x1)continue;
  const r={x:x1,y:3650,w:x2-x1,h:134};
  surface(g,r,'brick',v);
  if(!visible(r,v))continue;
  const from=Math.max(x1,Math.floor(v.x/64)*64);
  g.save();g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();
  g.fillStyle='rgba(56,61,58,.22)';g.fillRect(x1,3778,x2-x1,6);
  g.fillStyle='rgba(249,217,166,.34)';g.fillRect(x1,3652,x2-x1,3);
  for(let x=from;x<x2&&x<v.x+v.w+64;x+=64){
   const h=hash(x/64,57);
   // Mortar breaks and restrained drainage details replace the flat ribbon.
   g.fillStyle='rgba(62,58,51,.15)';g.fillRect(x,3660,2,111);
   if(h%5===0){g.fillStyle='rgba(32,64,58,.30)';g.fillRect(x+12,3709,6,2);}
   if(h%7===0){
     g.fillStyle='#7b8278';g.fillRect(x+36,3754,18,6);
     g.fillStyle='#3e5360';for(let k=0;k<4;k++)g.fillRect(x+38+k*4,3755,1,4);
   }
  }
  g.restore();
 }
}
function location(x,y){
 if(parkInside(x,y))return 'COAST PARK';
 if(x>=4400&&x<5900&&y>=3220&&y<4220)return 'SOUTHBAY MARINA';
 const area=H?.worldV115?.areas?.().find(a=>x>=a.x&&x<a.x+a.w&&y>=a.y&&y<a.y+a.h);
 // Use exact canonical world origin from worldV115 descriptor, not a
 // guessed worldX/worldY property; overlapping original areas retain order.
 if(area?.name)return String(area.name).toUpperCase();
 if(x<0)return 'WEST HARBOR';
 if(x<2800)return y>2800?'COAST PARK':'PRECINCT DISTRICT';
 if(x<5056)return y>2900?'SOUTHBAY':'MIDTOWN';
 if(x<6556)return y>2900?'HARBORFRONT':'DOWNTOWN';
 if(x<8156)return 'EASTSIDE';
 return 'INDUSTRIAL DISTRICT';
}
// V127 buildings keep the ORIGINAL district footprints/door positions.
// Only the flat-colored fallback is upgraded; recovered Midtown sprites win.
function building(g,b,zoom){
 const x=b.x,y=b.y,w=b.w,h=b.h;
 if(![x,y,w,h].every(Number.isFinite)||w<32||h<35)return false;
 const seed=hash(Math.floor(x),Math.floor(y),31);
 const district=b.district||'',kind=b.kind||'';
 const palettes={
   residential:['#945748','#7d685a','#647b78','#9b6d56'],
   industrial:['#62737a','#677b75','#717780','#715e57'],
   downtown:['#9c5545','#426780','#9b734c','#527b78'],
   northgate:['#786c69','#54747a','#a17150','#6b7777']
 };
 const roofs=palettes[district]||['#a45743','#326982','#b57449','#6c727c','#528177','#995d52'];
 const roof=roofs[seed%roofs.length],face=['#d5b998','#dac8aa','#b6c3bf'][seed%3];
 const roofH=Math.max(26,Math.min(h*.67,h-31));
 g.save();g.imageSmoothingEnabled=false;
 g.fillStyle='rgba(12,26,43,.29)';g.fillRect(x+9,y+10,w,h);
 g.fillStyle='#675344';g.fillRect(x,y+10,w,h-10);
 g.fillStyle=face;g.fillRect(x+4,y+roofH,w-8,h-roofH-6);
 g.fillStyle='#e9d7bc';g.fillRect(x+4,y+roofH,w-8,5);
 // Stepped roofing, light-facing bevel and dark structural fascia.
 g.fillStyle='#453b3e';g.fillRect(x-5,y+6,w+10,roofH+5);
 g.fillStyle=roof;g.fillRect(x-4,y+1,w+8,roofH);
 g.fillStyle='rgba(255,225,166,.36)';g.fillRect(x-4,y+2,w+8,4);
 g.fillStyle='rgba(23,37,52,.26)';g.fillRect(x-4,y+roofH-5,w+8,5);
 for(let yy=y+12;yy<y+roofH-7;yy+=12){
  g.fillStyle='rgba(17,29,43,.21)';g.fillRect(x,yy,w,2);
  g.fillStyle='rgba(252,213,155,.17)';g.fillRect(x+1,yy+3,w-2,1);
  for(let xx=x+12+(yy%2?10:0);xx<x+w-8;xx+=28)
    g.fillRect(xx,yy+2,2,8);
 }
 const wallTop=y+roofH+5;
 if(h-roofH>32){
  const doorX=x+w*.5-11,doorY=y+h-30;
  g.fillStyle='#264452';g.fillRect(doorX,doorY,22,27);
  g.fillStyle='#47717d';g.fillRect(doorX+3,doorY+3,16,20);
  g.fillStyle='#e9d29a';g.fillRect(doorX+16,doorY+15,2,2);
  const available=w/2-30;
  if(available>19){
   for(const wx of [x+16,x+w-34]){
    g.fillStyle='#18384e';g.fillRect(wx,wallTop+8,21,17);
    g.fillStyle='#83b2b5';g.fillRect(wx+3,wallTop+10,15,9);
    g.fillStyle='rgba(246,237,192,.42)';g.fillRect(wx+4,wallTop+11,5,3);
    g.fillStyle='#d6c49e';g.fillRect(wx-2,wallTop+25,25,4);
   }
  }
  g.fillStyle='rgba(31,43,46,.32)';g.fillRect(x+4,y+h-7,w-8,5);
 }
 if(seed%3===0&&w>115){
  const vx=x+w*.72,vy=y+roofH*.37;
  g.fillStyle='#7c929c';g.fillRect(vx,vy,27,17);
  g.fillStyle='#304d5d';g.fillRect(vx+5,vy+4,17,9);
  g.fillStyle='rgba(255,239,196,.48)';g.fillRect(vx+1,vy+1,25,2);
 }
 // Original coordinates, richer structural articulation: vent stacks, roof
 // flashing, bay windows and storefront shade. No replacement asset or collider.
 if(zoom>.26){
   g.fillStyle='rgba(22,36,47,.34)';
   g.fillRect(x+3,y+roofH+3,w-6,3);
   if(w>98&&h>105){
     const ux=x+19+seed%29,uy=y+16+(seed>>>3)%13;
     g.fillStyle='#5c6e72';g.fillRect(ux+3,uy+7,28,21);
     g.fillStyle='#9eb4b2';g.fillRect(ux,uy,28,15);
     g.fillStyle='#3e565b';g.fillRect(ux+5,uy+5,18,7);
     g.fillStyle='rgba(255,238,190,.42)';g.fillRect(ux+2,uy+2,24,2);
   }
   if(kind==='house'||district==='residential'){
     g.fillStyle='#ece1c3';
     for(const wx of [x+11,x+w-22])if(wx>x+5&&wx<x+w-10)
       {g.fillRect(wx,wallTop+6,3,24);g.fillRect(wx+19,wallTop+6,3,24);}
   }else if(w>94&&h-roofH>44){
     const awnY=y+h-37;
     g.fillStyle='#2d4a58';g.fillRect(x+6,awnY+7,w-12,5);
     g.fillStyle=seed%2?'#b76e55':'#638b86';
     g.fillRect(x+6,awnY,w-12,8);
     for(let xx=x+11;xx<x+w-11;xx+=18){
       g.fillStyle='rgba(244,223,181,.5)';g.fillRect(xx,awnY+1,7,6);
     }
   }
 }
 // Distinct building finishes, all within the original physical shell.
 // Preserve source storefront sprites and existing doors/footprints.
 if(zoom>.43){
  if(district==='industrial'){
   // Steel loading door, rails, warning bands and weathered metal roof.
   const loadingW=Math.min(w-22,Math.max(46,w*.55)),lx=x+w/2-loadingW/2;
   const ly=y+h-Math.min(39,h-roofH-9);
   g.fillStyle='#354d5a';g.fillRect(lx-5,ly-5,loadingW+10,37);
   g.fillStyle='#8799a0';g.fillRect(lx,ly,loadingW,28);
   g.fillStyle='#526c79';
   for(let q=4;q<27;q+=6)g.fillRect(lx+2,ly+q,loadingW-4,2);
   g.fillStyle='#d7b26f';g.fillRect(lx-7,ly+28,8,3);g.fillRect(lx+loadingW-1,ly+28,8,3);
   for(let j=0;j<3;j++){
    const px=x+13+j*(w-30)/3,py=y+13+((seed>>>j)%7);
    g.fillStyle='#a5a79a';g.fillRect(px,py,18,9);
    g.fillStyle='#354e56';g.fillRect(px+3,py+3,12,3);
   }
  }else if(district==='residential'||kind==='house'){
   // Door stoop with roof overhang, porch rail, front window planters.
   g.fillStyle='rgba(30,44,51,.39)';g.fillRect(x+8,y+h-14,w-16,5);
   g.fillStyle='#d8cbad';g.fillRect(x+w/2-29,y+h-11,58,6);
   g.fillStyle='#837e72';g.fillRect(x+w/2-26,y+h-5,52,4);
   if(w>96){
    for(const wx of [x+18,x+w-39]){
     g.fillStyle='#777a64';g.fillRect(wx,y+h-27,24,4);
     g.fillStyle='#507749';g.fillRect(wx+2,y+h-34,20,7);
     g.fillStyle=seed%2?'#e1bd86':'#d29282';
     g.fillRect(wx+6,y+h-32,4,3);g.fillRect(wx+15,y+h-33,3,3);
    }
   }
   g.fillStyle='rgba(238,220,178,.50)';g.fillRect(x+6,y+roofH-3,w-12,3);
  }else if(district==='downtown'||district==='midtown'){
   // Commercial street frontage with readable fascia and mullioned glass.
   const fw=w-18,fy=y+h-49;
   if(fw>56){
    g.fillStyle='#394f5a';g.fillRect(x+9,fy,fw,30);
    g.fillStyle='#93b2b5';g.fillRect(x+13,fy+3,fw-8,22);
    g.fillStyle='#365a63';
    for(let wx=x+28;wx<x+w-16;wx+=26)g.fillRect(wx,fy+3,3,23);
    g.fillStyle='#233f4e';g.fillRect(x+10,fy-13,fw-2,10);
    g.fillStyle=seed%2?'#d9aa64':'#d4c692';g.fillRect(x+17,fy-9,Math.min(fw-18,46),3);
   }
  }else if(district==='northgate'||district==='westfield'){
   // Stone pier bases and timber frame trusses for mountain-side buildings.
   g.fillStyle='#8e8975';
   for(const px of [x+8,x+w-19])g.fillRect(px,y+h-30,11,22);
   g.fillStyle='rgba(31,57,56,.4)';g.fillRect(x+8,y+roofH-3,w-16,5);
  }else if(district==='eastside'||district==='southbay'){
   // Coastal facades have cooler lintels, deep sills and sunlit wall accents.
   g.fillStyle='#f2dcb5';g.fillRect(x+5,y+roofH+2,w-10,4);
   g.fillStyle='#607e80';g.fillRect(x+11,y+h-16,w-22,4);
   if(w>128){g.fillStyle='rgba(173,212,198,.65)';g.fillRect(x+21,y+roofH+15,18,7);}
  }
 }
 g.restore();return true;
}
function handlesDecor(o){
 return !!spriteFiles[o?.t]&&spriteReady(o.t);
}
function propGeometry(o,d){
 const x=d.x+(o.x||0),y=d.y+(o.y||0);
 const sizes={
  tree:[110,122,-54,-103],bigtree:[146,158,-72,-134],palm:[90,115,-42,-106],
  lamp:[25,99,-12,-91],bench:[90,45,0,-25],
  planter:[70,35,-35,-23],flowerbed:[Math.max(42,o.w||66),26,0,-12],
  fountain:[92,95,-46,-80],mailbox:[24,32,-12,-25]
 };
 const [w,h,ox,oy]=sizes[o.t]||[60,52,-30,-46];
 return {x:x+ox,y:y+oy,w,h,depthY:o.t==='bench'||o.t==='flowerbed'?y+14:y+4};
}
// Additional authored-feeling grove positions are derived ONCE per native
// district. Trees render in the existing actor depth queue; their narrow trunks
// are solid in the existing movement/collision system. No second scene or save.
const scenicCache=new Map();
function scenicFor(d){
 if(!d||!d.id||d.id==='waterfront'||!d.map?.base||!Array.isArray(d.map.ground))
   return [];
 const existing=scenicCache.get(d.id);
 if(existing&&existing.map===d.map)return existing.trees;
 const trees=[],step=d.id==='industrial'?372:296;
 const roads=H?.worldV115?.roadNetwork?.().segments||[];
 const solids=d.map.pedSolids||d.map.solids||[];
 const features=d.map.decors||[];
 const reserved=d.map.spots||[];
 for(let ly=140;ly<d.h-100;ly+=step)for(let lx=120;lx<d.w-100;lx+=step){
   const seed=hash(Math.floor(lx/step),Math.floor(ly/step),d.id.length*17);
   if(seed%(d.id==='industrial'?4:6)<(d.id==='industrial'?3:1))continue;
   const x=lx+((seed>>>4)%91)-45,y=ly+((seed>>>13)%91)-45;
   if(x<75||y<85||x>d.w-75||y>d.h-85)continue;
   if(groundTypeAt(d,x,y)!=='grass')continue;
   if(groundTypeAt(d,x-44,y-40)!=='grass'||groundTypeAt(d,x+44,y+36)!=='grass')continue;
   const wx=d.x+x,wy=d.y+y;
   // Original road graph, sidewalks, doors and interaction spots stay clear.
   if(roads.some(r=>wx>r.x-66&&wx<r.x+r.w+66&&wy>r.y-66&&wy<r.y+r.h+66))continue;
   if(solids.some(s=>x>s.x-63&&x<s.x+s.w+63&&y>s.y-60&&y<s.y+s.h+67))continue;
   if(features.some(o=>{
     const t=o.t||'';
     if(['tree','bigtree','palm'].includes(t))return Math.hypot(x-(o.x||0),y-(o.y||0))<110;
     if(!['bldg','house','shed','lighthouse','mtbldg'].includes(t))return false;
     const bx=t==='mtbldg'?(o.bx??o.x??0):(o.x||0);
     const by=t==='mtbldg'?(o.btop??o.y??0):(o.y||0);
     const bw=t==='mtbldg'?(o.bw??o.w??0):(o.w||0);
     const bh=t==='mtbldg'?(o.bh??o.h??0):(o.h||0);
     return x>bx-72&&x<bx+bw+72&&y>by-72&&y<by+bh+86;
   }))continue;
   if(reserved.some(o=>Number.isFinite(o.x)&&Number.isFinite(o.y)&&Math.hypot(x-o.x,y-o.y)<115))continue;
   trees.push({t:d.id==='southbay'?'palm':d.id==='industrial'?'tree':seed%7===0?'bigtree':'tree',x,y,generated:true});
 }
 // A compact district-local bucket index avoids scanning every tree twice per
 // movement frame. Keep physical and drawn positions from the SAME tree data.
 const CELL=192,cells=new Map();
 for(const o of trees){
   const key=Math.floor(o.x/CELL)+':'+Math.floor(o.y/CELL);
   if(!cells.has(key))cells.set(key,[]);
   cells.get(key).push(o);
 }
 scenicCache.set(d.id,{map:d.map,trees,cells,cellSize:CELL});return trees;
}
function scenicBlocked(x,y,r=12,districts=[]){
 if(parkBlocked(x,y,r))return true;
 for(const d of districts){
   if(d.id==='waterfront'||x<d.x-24||y<d.y-24||x>d.x+d.w+24||y>d.y+d.h+24)continue;
   scenicFor(d); // lazily build a deterministic index just once per native map
   const index=scenicCache.get(d.id);if(!index||index.map!==d.map)continue;
   const dx=x-d.x,dy=y-d.y,rad=Math.max(0,r)+17;
   const size=index.cellSize;
   const x0=Math.floor((dx-rad)/size),x1=Math.floor((dx+rad)/size);
   const y0=Math.floor((dy-rad)/size),y1=Math.floor((dy+rad)/size);
   for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
     for(const o of index.cells.get(cx+':'+cy)||[]){
       const px=dx-o.x,py=dy-o.y,limit=r+(o.t==='bigtree'?17:12);
       if(px*px+py*py<limit*limit)return true;
     }
   }
 }
 return false;
}

function depthProps(view,districts){
 const entries=[];
 if(frameZoom<.18){
   if(frameZoom>=.08&&visible(PARK,view,190))for(const o of parkObjects(view))if(o.file==='exterior/shade_tree.webp'||o.id==='civic:monument'||o.id?.startsWith('civic:flag:'))entries.push({parkObject:o,depthY:o.y});
   return entries;
 }
 if(!districts)return entries;
 for(const d of districts){
  if(d.id==='waterfront')continue; // V116 has its own authored depth / props.
  if(!visible(d,view,165))continue;
  for(const o of d.map.decors||[]){
   if(window.ROOKIE_V116_MARINA?.ownsDecor?.(d.id,o))continue;
   if(!handlesDecor(o))continue;
   const b=propGeometry(o,d);if(visible(b,view,24))entries.push({object:o,district:d,box:b,depthY:b.depthY});
  }
  // New groves share the same sorted depth queue and exact native sprites.
  // Cull using the same cell index used for player/tree collision.
  scenicFor(d);
  const index=scenicCache.get(d.id);
  if(index?.map===d.map){
    const size=index.cellSize;
    const x0=Math.floor((view.x-d.x-170)/size),x1=Math.floor((view.x+view.w-d.x+170)/size);
    const y0=Math.floor((view.y-d.y-170)/size),y1=Math.floor((view.y+view.h-d.y+170)/size);
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      for(const o of index.cells.get(cx+':'+cy)||[]){
        if(!handlesDecor(o))continue;
        const b=propGeometry(o,d);
        if(visible(b,view,24))entries.push({object:o,district:d,box:b,depthY:b.depthY});
      }
    }
  }
 }
 if(visible(PARK,view,190)||view.y+view.h>3808)for(const o of parkObjects(view))entries.push({parkObject:o,depthY:o.y});
 metrics.props=entries.length;
 return entries;
}
function drawDepthProp(g,entry,timeMs=0){
 if(entry.parkObject){const o=entry.parkObject,im=parkImage(o.file);if(!im.complete||!im.naturalWidth)return;g.save();g.imageSmoothingEnabled=false;
   if(o.shadow){g.fillStyle='rgba(18,30,33,.2)';g.beginPath();g.ellipse(o.x+2,o.y+2,...o.shadow,0,0,Math.PI*2);g.fill();}
   const x=Math.round(o.x-o.w*(o.anchor??.5)),y=Math.round(o.y-o.h),w=Math.round(o.w),h=Math.round(o.h);
   const crop=o.animation?[Math.floor(timeMs*o.animation.fps/1000)%o.animation.count*o.animation.frameW,0,o.animation.frameW,o.animation.frameH]:o.crop;
   if(crop)g.drawImage(im,...crop,x,y,w,h);else g.drawImage(im,x,y,w,h);g.restore();return;
 }
 const o=entry.object,b=entry.box,im=sprites[o.t];
 if(!spriteReady(o.t)||!im)return;
 g.save();g.imageSmoothingEnabled=false;
 g.drawImage(im,b.x,b.y,b.w,b.h);g.restore();
}
function map(g,x,y){
 const w=176,h=112,spanX=1560,spanY=995,left=x-spanX/2,top=y-spanY/2;
 g.save();g.clearRect(0,0,w,h);g.fillStyle='#44744b';g.fillRect(0,0,w,h);
 g.scale(w/spanX,h/spanY);g.translate(-left,-top);
 const view={x:left,y:top,w:spanX,h:spanY};
 const roads=H?.worldV115?.roadNetwork?.().segments||[];
 g.fillStyle='#344958';for(const r of roads)if(visible(r,view))g.fillRect(r.x,r.y,r.w,r.h);
 const areas=H?.worldV115?.areas?.()||[];
 for(const a of areas){
  const bx=a.worldX??a.x,by=a.worldY??a.y;
  if(Number.isFinite(bx)&&Number.isFinite(by)&&visible({x:bx,y:by,w:a.w,h:a.h},view)){
   g.strokeStyle='rgba(238,225,174,.38)';g.lineWidth=8;
   g.strokeRect(bx,by,a.w,a.h);
  }
 }
 // The already-authored marina water is represented with the same geographic
 // footprint, without trying to render a second full game scene in the minimap.
 g.fillStyle='#12688b';g.fillRect(4400,3800,1500,420);
 g.fillRect(2800,4174,1600,506);
 g.fillStyle='#cda26c';g.fillRect(3560,4174,60,120);
 for(let px of [4655,5105,5555].values()){g.fillStyle='#cda26c';g.fillRect(px,3800,90,300);}
 g.restore();
}
window.ROOKIE_V127_CITY=Object.freeze({
 version:'127-citywide-material-continuity',worldId:'harbor-main',
 base,surface,colorKind,districtGround,midtownStreetFinish,refinesCrossing,boundaryGround,road,coastline,beachGround,walkways,parkGround,civicGround,parkBounds:PARK,depthProps,drawDepthProp,
 parkQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?{bounds:{...PARK},trails:parkTrails.map(p=>p.map(x=>x.slice())),pond:{...pond},objects:ensurePark().objects.map(o=>({...o})),images:[...parkImages].map(([file,im])=>({file,ready:im.complete&&im.naturalWidth>0})),indexCells:ensurePark().cells.size}:null,
 civicQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?{plaza:{...CIVIC},objects:ensurePark().objects.filter(o=>o.id?.startsWith('civic:')).map(o=>({...o}))}:null,
 building,handlesDecor,propGeometry,scenicBlocked,spriteImage:type=>spriteReady(type)?sprites[type]:null,waterBlocked:coastalWater,location,map,
 metrics:()=>({...metrics,cacheMax:CAP,atlasReady:atlas.complete&&atlas.naturalWidth>0})
});
})();

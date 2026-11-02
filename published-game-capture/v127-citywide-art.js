/* ROOKIE V127 — unified 32px citywide materials and depth props.
 * Uses the existing Southbay Marina tile atlas & original exterior sprites.
 * VISUAL ADAPTER: same 1:1 harbor-main world, native camera, zero new loops.
 * One explicitly physical coastline extension shares existing blocked() call.
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
 for(let y=0;y<CHUNK;y+=32)for(let x=0;x<CHUNK;x+=32){
   const wx=cx+x,wy=cy+y,n=hash(wx/32,wy/32,47);
   if(ready&&type!=='road'&&type!=='stone'&&type!=='sand'){
     const ids=type==='grass'?[4,5,6,7]:type==='brick'?[0,1,2,3]:[16,17,18,19];
     const id=ids[n%ids.length];
     g.drawImage(atlas,(id%8)*32,Math.floor(id/8)*32,32,32,x,y,32,32);
   }else if(type==='road'||type==='stone'||type==='sand'){
     g.fillStyle=type==='road'?['#404a53','#3f4953','#414b54'][n%3]:
       type==='stone'?['#adaba0','#b6b1a5','#c1b9ad'][n%3]:
       ['#b8a97d','#c5af7d','#b5a475'][n%3];
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
function coastY(x){
 if(x>=4400&&x<5900)return 3800;
 if(x>=3500&&x<4400)return 4200-(x-3500)*400/900;
 if(x>=5900&&x<7050)return 3800+(x-5900)*420/1150;
 return 4220+Math.sin(x*.0018)*25;
}
function coastalWater(x,y){
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
   if(x>=4400&&x<5900)continue;
   const shoreline=coastY(x),top=Math.max(sy,Math.floor(shoreline/32)*32);
   if(top>=ey)continue;
   // Narrow natural sand strip supports the premium water material visually.
   surface(g,{x,y:shoreline-16,w:32,h:34},'sand',view);
   surface(g,{x,y:shoreline+18,w:32,h:WORLD.maxY-shoreline-18},'water',view);
   metrics.coast++;
 }
}
// Avoid the original Southbay waterfront here: its native east/west roadway
// occupies y=3681..3807. An old blanket y=3650..3784 brick overlay hid most
// of that road, creating the abrupt dead-end visible in the mobile recording.
// Bayview has a separate coast-following walkway SOUTH of the intact street.
const promenades=[
 [-3100,-650],[-506,2800],[5900,6556],[6556,8156],[8156,9656]
];
const BAYVIEW={left:2800,right:4352,roadBottom:3808,landscapeTop:3550};
// The original Marina terrain starts at x=4352: paint nothing beyond it.
// Source Southbay road is y=3681..3807; the stone plaza begins at y=3808.
function bayviewPromenadeAt(x,y){
 if(x<BAYVIEW.left||x>=BAYVIEW.right||y<BAYVIEW.roadBottom)return false;
 return y<Math.min(4200,coastY(x)-34);
}
function bayviewFrontage(g,opt){
 if(opt.zoom<.18)return;
 const v=opt.view,area={x:2800,y:3505,w:1552,h:700};
 if(!visible(area,v,5))return;
 const left=Math.max(BAYVIEW.left,Math.floor(Math.max(BAYVIEW.left,v.x)/32)*32);
 const right=Math.min(BAYVIEW.right,v.x+v.w+32);
 // Clip the original 32px Harbor/Marina brick tile to a coast-following edge:
 // there is no water overpaint, and no rectangular stop at the marina.
 g.save();g.beginPath();g.moveTo(BAYVIEW.left,BAYVIEW.roadBottom);
 g.lineTo(BAYVIEW.right,BAYVIEW.roadBottom);
 for(let x=BAYVIEW.right;x>=BAYVIEW.left;x-=24)
   g.lineTo(x,Math.min(4200,coastY(x)-34));
 g.closePath();g.clip();
 surface(g,{x:BAYVIEW.left,y:BAYVIEW.roadBottom,
   w:BAYVIEW.right-BAYVIEW.left,h:420},'brick',v);
 // Harbor promenade visual language: real masonry edge, double trim,
 // staggered inlay, runoff grates and regularly spaced shoreline lights.
 g.fillStyle='#d9c5a2';g.fillRect(BAYVIEW.left,3810,1552,6);
 g.fillStyle='rgba(58,78,78,.55)';g.fillRect(BAYVIEW.left,3816,1552,3);
 const s=Math.max(BAYVIEW.left,Math.floor(v.x/80)*80);
 for(let x=s;x<right;x+=80){
   const n=hash(x/80,33,7);
   g.fillStyle='rgba(250,228,187,.27)';
   g.fillRect(x+9,3844,34,3);g.fillRect(x+43,3850,28,2);
   if(n%3===0){
     g.fillStyle='rgba(41,72,79,.36)';g.fillRect(x+58,3833,18,6);
     g.fillStyle='#a9b5a8';for(let t=0;t<4;t++)g.fillRect(x+60+t*4,3834,1,4);
   }
   const cy=coastY(x)-43;
   if(cy>3890){
     g.fillStyle='rgba(38,64,57,.24)';g.fillRect(x+7,cy-5,69,4);
     g.fillStyle='rgba(235,205,152,.58)';g.fillRect(x+7,cy-8,69,3);
     if(n%5===0){
       g.fillStyle='#a69b7d';g.fillRect(x+38,cy-23,12,14);
       g.fillStyle='#d9b57a';g.fillRect(x+38,cy-23,12,3);
     }
   }
 }
 g.restore();
 // North of the preserved asphalt: extend finished Bayview streetscaping
 // around the actual street-mouth x3937..4165. Never pave the roadway itself.
 const corners=[
  {x:3168,y:3570,w:340,h:84},
  {x:3737,y:3563,w:164,h:92},
  {x:4167,y:3558,w:166,h:99}
 ];
 for(const r of corners){
   if(!visible(r,v))continue;
   surface(g,r,'stone',v);
   g.fillStyle='#d8c39e';g.fillRect(r.x,r.y,r.w,5);
   g.fillStyle='rgba(28,56,54,.23)';g.fillRect(r.x,r.y+r.h-7,r.w,5);
   const cols=Math.max(2,Math.floor(r.w/48));
   for(let i=0;i<cols;i++){
     const x=r.x+14+i*(r.w-28)/cols;
     g.fillStyle='rgba(65,98,73,.32)';g.fillRect(x,r.y+24,27,33);
     g.fillStyle='#476d4e';g.fillRect(x+3,r.y+27,21,25);
     g.fillStyle=i%2?'#dfb66d':'#d78976';
     for(let p=0;p<3;p++)g.fillRect(x+5+p*7,r.y+32+(p%2)*5,3,3);
   }
 }
 metrics.details+=corners.filter(r=>visible(r,v)).length;
}
// Hand-placed source asset geometry, not a randomized decoration layer.
// Every entry is outside the existing shops, roads, crossings, and the
// V116-owned waterfront x>=4352. Native depth order handles occlusion.
const BAYVIEW_FURNISHINGS=Object.freeze([
 {t:'palm',x:3080,y:4000},{t:'palm',x:3350,y:3980},
 {t:'palm',x:3620,y:3960},{t:'palm',x:3890,y:3900},
 {t:'palm',x:4210,y:3834},
 {t:'bench',x:3150,y:3891},{t:'bench',x:3480,y:3889},
 {t:'bench',x:3770,y:3845},
 {t:'lamp',x:2960,y:3865},{t:'lamp',x:3290,y:3859},
 {t:'lamp',x:3605,y:3854},{t:'lamp',x:3880,y:3850},
 {t:'lamp',x:4230,y:3824},
 {t:'planter',x:3070,y:3840},{t:'planter',x:3420,y:3844},
 {t:'planter',x:3690,y:3848},{t:'planter',x:4145,y:3824},
 {t:'flowerbed',x:3220,y:3603,w:94},{t:'flowerbed',x:3780,y:3612,w:76},
 {t:'flowerbed',x:4192,y:3615,w:90}
].map(o=>Object.freeze(o)));

function walkways(g,opt){
 if(opt.zoom<.16)return;
 const v=opt.view;
 bayviewFrontage(g,opt);
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
 if(frameZoom<.18)return entries; // premium props vanish naturally in overview
 if(!districts)return entries;
 for(const d of districts){
  if(d.id==='waterfront')continue; // V116 has its own authored depth / props.
  if(!visible(d,view,165))continue;
  for(const o of d.map.decors||[]){
   if(!handlesDecor(o))continue;
   const b=propGeometry(o,d);if(visible(b,view,24))entries.push({object:o,district:d,box:b,depthY:b.depthY});
  }
  if(d.id==='southbay')for(const item of BAYVIEW_FURNISHINGS){
   // The existing MAPS district's true origin is 2800,3220.
   // Keep the same rendering queue and source sprites used throughout Marina.
   const o={...item,x:item.x-d.x,y:item.y-d.y,bayviewExtension:true};
   if(!handlesDecor(o))continue;
   const b=propGeometry(o,d);
   if(visible(b,view,24))entries.push({object:o,district:d,box:b,depthY:b.depthY});
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
 metrics.props=entries.length;
 return entries;
}
function drawDepthProp(g,entry){
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
 for(let px of [4655,5105,5555].values()){g.fillStyle='#cda26c';g.fillRect(px,3800,90,300);}
 g.restore();
}
window.ROOKIE_V127_CITY=Object.freeze({
 version:'127-citywide-material-continuity',worldId:'harbor-main',
 base,surface,colorKind,districtGround,road,coastline,walkways,bayviewPromenadeAt,depthProps,drawDepthProp,
 building,handlesDecor,scenicBlocked,spriteImage:type=>spriteReady(type)?sprites[type]:null,waterBlocked:coastalWater,location,map,
 metrics:()=>({...metrics,cacheMax:CAP,atlasReady:atlas.complete&&atlas.naturalWidth>0})
});
})();
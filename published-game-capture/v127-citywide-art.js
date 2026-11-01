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
const cache=new Map();const metrics={chunks:0,drawn:0,props:0,coast:0};
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
     g.fillStyle=type==='road'?['#414a53','#3c4851','#45505a'][n%3]:
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
     g.fillStyle='rgba(255,228,181,.09)';
     g.fillRect(x+5,y+4,20,1);
   }
 }
 if(cache.size>=CAP)cache.delete(cache.keys().next().value);
 cache.set(key,c);metrics.chunks=cache.size;return c;
}
function surface(g,r,type,view){
 if(!visible(r,view)||r.w<=0||r.h<=0)return;
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
 const view=opt.view||{x:WORLD.minX,y:0,w:WORLD.maxX-WORLD.minX,h:WORLD.maxY};
 surface(g,{x:WORLD.minX,y:0,w:WORLD.maxX-WORLD.minX,h:WORLD.maxY},'grass',view);
}
function districtGround(g,d,view){
 const m=d.map;
 surface(g,{x:d.x,y:d.y,w:d.w,h:d.h},colorKind(m.base||'#729763'),view);
 for(const r of m.ground||[]){
   const abs={x:d.x+r.x,y:d.y+r.y,w:r.w,h:r.h};
   if(!visible(abs,view))continue;
   surface(g,abs,colorKind(r.c),view);
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
const promenades=[
 [-3100,-650],[-506,2800],[2800,3460],[3630,4400],[5900,6556],[6556,8156],[8156,9656]
];
function walkways(g,opt){
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
  g.fillStyle='rgba(249,217,166,.26)';g.fillRect(x1,3652,x2-x1,3);
  for(let x=from;x<x2&&x<v.x+v.w+64;x+=64){
   const h=hash(x/64,57);
   if(h%5===0){g.fillStyle='rgba(32,64,58,.16)';g.fillRect(x+12,3709,3,2);}
  }
  g.restore();
 }
}
function location(x,y){
 if(x>=4400&&x<5900&&y>=3220&&y<4220)return 'SOUTHBAY MARINA';
 const area=H?.worldV115?.areas?.().find(a=>x>=a.worldX&&x<a.worldX+a.w&&y>=a.worldY&&y<a.worldY+a.h);
 // Area entries expose origin differently across legacy maps; avoid assuming.
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
 const roofs=['#a45743','#326982','#b57449','#6c727c','#528177','#995d52'];
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
function depthProps(view,districts){
 const entries=[];
 if(!districts)return entries;
 for(const d of districts){
  if(d.id==='waterfront')continue; // V116 has its own authored depth / props.
  if(!visible(d,view,165))continue;
  for(const o of d.map.decors||[]){
   if(!handlesDecor(o))continue;
   const b=propGeometry(o,d);if(visible(b,view,24))entries.push({object:o,district:d,box:b,depthY:b.depthY});
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
 base,surface,colorKind,districtGround,road,coastline,walkways,depthProps,drawDepthProp,
 building,handlesDecor,waterBlocked:coastalWater,location,map,
 metrics:()=>({...metrics,cacheMax:CAP,atlasReady:atlas.complete&&atlas.naturalWidth>0})
});
})();
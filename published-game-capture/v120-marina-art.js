/* ROOKIE V121 — art-directed Southbay premium marina material pass.
 * Production atlases are baked OFFLINE by tools/generate_v120_marina_art.py.
 * One existing V116 Canvas, one shared camera, no new frame loop or world.
 */
(function(){
'use strict';
const ROOT='./assets/v121-marina/';
const DOCK_ROOT='./assets/v126-dock/'; // full-length original timber texture; no repeat
const W={x:4400,y:3800,w:1500,h:856},PIERS=[4655,5105,5555];
const tile=512,files=['water-body','water-caustics','water-reef','dock-wood','dock-post','foam-frames','seawall-light','tree-shadows','water-glints'];
const art=Object.create(null);
for(const name of files){
 const im=new Image();im.decoding='async';im.src=(name==='dock-wood'?DOCK_ROOT:ROOT)+name+'.png';art[name]=im;
}
const drawable=(name)=>{const im=art[name];return im&&im.complete&&im.naturalWidth>0?im:null;};
const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const stats={waterFrames:0,materialsDrawn:0,foamDraws:0,reflectionDraws:0,dockTiles:0,postDraws:0,shadows:0,sparkleDraws:0};
const intersects=(a,b)=>!b||a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function atlas(g,name,x,y,w,h){
 const im=drawable(name);if(!im)return false;
 g.imageSmoothingEnabled=false;g.drawImage(im,x,y,w,h);stats.materialsDrawn++;return true;
}
function material(g,name,view,ox=0,oy=0,opacity=1){
 const im=drawable(name);if(!im)return false;
 const xmin=Math.max(W.x,view.x-2),xmax=Math.min(W.x+W.w,view.x+view.w+2);
 const ymin=Math.max(W.y,view.y-2),ymax=Math.min(W.y+W.h,view.y+view.h+2);
 if(xmin>=xmax||ymin>=ymax)return false;
 g.save();g.globalAlpha*=opacity;g.imageSmoothingEnabled=false;
 const bx=W.x+ox,by=W.y+oy;
 const sx=bx+Math.floor((xmin-bx)/tile)*tile,sy=by+Math.floor((ymin-by)/tile)*tile;
 for(let py=sy;py<ymax;py+=tile)for(let px=sx;px<xmax;px+=tile){
  g.drawImage(im,px,py,tile,tile);stats.materialsDrawn++;
 }
 g.restore();return true;
}
function water(g,opt,t){
 if(!opt||!intersects(W,opt.view))return;
 const view=opt.view,time=reduced?0:t;
 stats.waterFrames++;
 g.save();g.beginPath();g.rect(W.x,W.y,W.w,W.h);g.clip();
 // The *texture itself* carries authored wave facets and tonal shape; no
 // separate random horizontal stroke renderer or camera-relative movement.
 g.fillStyle='#063454';g.fillRect(W.x,W.y,W.w,W.h);
 material(g,'water-body',view);
 // Depth material: turquoise near shore, high contrast navy farther out.
 const depth=g.createLinearGradient(0,3800,0,4656);
 depth.addColorStop(0,'rgba(9,211,189,.21)');
 depth.addColorStop(.20,'rgba(11,165,170,.12)');
 depth.addColorStop(.61,'rgba(3,43,93,.12)');
 depth.addColorStop(1,'rgba(2,15,53,.50)');
 g.fillStyle=depth;g.fillRect(W.x,W.y,W.w,W.h);
 // Underwater plants and stones appear through shallows, fading into depth.
 if(drawable('water-reef')){
  g.save();g.beginPath();g.rect(W.x,3800,W.w,360);g.clip();
  material(g,'water-reef',view,0,0,.53);g.restore();
 }
 // Layered looped authored caustic curves; slow optical parallax, never
 // horizontally-scrolling lines. All coordinates anchored to harbor-main.
 const sx=Math.round(Math.sin(time*.0003)*22);
 const sy=Math.round(Math.cos(time*.00024)*15);
 // Sparse refracted sunlight, no hard-edged ice-crack network.
 material(g,'water-caustics',view,sx,sy,.44);
 material(g,'water-caustics',view,-sy*2,-sx*2,.12);
 waterGlints(g,view,time);
 // Stone seawall casts a clear nearshore underwater shade.
 g.fillStyle='rgba(2,24,49,.49)';g.fillRect(4400,3800,1500,21);
 g.restore();
}
// Authored 4-frame sunlight sparkles are camera-culled, stable in world space.
function waterGlints(g,view,t){
 const im=drawable('water-glints');if(!im)return;
 const xa=Math.max(W.x,view.x-100),xb=Math.min(W.x+W.w,view.x+view.w+100);
 const ya=Math.max(W.y,view.y-100),yb=Math.min(W.y+W.h,view.y+view.h+100);
 if(xb<=xa||yb<=ya)return;
 g.save();g.imageSmoothingEnabled=false;
 for(let iy=Math.floor((ya-W.y)/135);W.y+iy*135<yb;iy++){
  for(let ix=Math.floor((xa-W.x)/170);W.x+ix*170<xb;ix++){
   const seed=(Math.imul(ix+71,73856093)^Math.imul(iy+27,19349663))>>>0;
   if(seed%4===0)continue;
   const x=W.x+ix*170+seed%81,y=W.y+iy*135+(seed>>>5)%55;
   const frame=reduced?0:Math.floor(t/230+seed%31)%4;
   g.globalAlpha=.28+.20*Math.max(0,Math.sin(t*.002+seed%17));
   g.drawImage(im,frame*96,0,96,96,x-41,y-40,82,82);
   stats.sparkleDraws++;
  }
 }
 g.restore();
}
function foam(g,x,y,size=63,t=0,alpha=1){
 const im=drawable('foam-frames');if(!im)return;
 const frame=reduced?0:Math.floor(t/260)%4;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 g.drawImage(im,frame*96,0,96,96,x-size/2,y-size/2,size,size);
 g.restore();stats.foamDraws++;
}
function contactWater(g,opt,t){
 if(!opt||!intersects(W,opt.view))return;
 const view=opt.view;
 // Shoreline breaks at the original, physically open 90px pier mouths.
 g.save();g.beginPath();g.rect(W.x,W.y,W.w,W.h);g.clip();
 for(const [a,b] of [[4400,4655],[4745,5105],[5195,5555],[5645,5900]]){
  const start=Math.max(a,view.x),end=Math.min(b,view.x+view.w);
  if(end<start||view.y>3870||view.y+view.h<3800)continue;
  for(let x=a+20;x<b-15;x+=58){
   if(x<start-40||x>end+40)continue;
   foam(g,x,3807,68,t+(x%3)*90,.79);
  }
 }
 // Turbulence around the real original dock piles (not a visual fake).
 for(const px of PIERS)for(const py of [3820,3945,4090])for(const dx of [3,86]){
  const x=px+dx;
  if(!intersects({x:x-45,y:py-50,w:90,h:95},view))continue;
  foam(g,x,py-5,78,t+px+py,.98);
 }
 g.restore();
}
function boat(g,b,t){
 if(!b)return;
 g.save();
 // Water displacement and stylized reflection sit BELOW the actual boat.
 const cx=b.x+b.w/2,cy=b.y+b.h*.74;
 const r=g.createRadialGradient(cx,cy,3,cx,cy,b.w*.91);
 r.addColorStop(0,'rgba(2,24,46,.58)');
 r.addColorStop(.7,'rgba(2,48,65,.18)');
 r.addColorStop(1,'rgba(2,48,65,0)');
 g.fillStyle=r;g.fillRect(b.x-25,b.y+b.h*.25,b.w+50,b.h);
 foam(g,cx,cy,b.w*1.83,t+b.p*150,.91);
 if(drawable('foam-frames'))foam(g,cx,cy+18,b.w*1.45,t+500,.36);
 g.restore();
}
function dock(g,px,view){
 const im=drawable('dock-wood');if(!im)return false;
 const top=3800,deckHeight=300,deckWidth=90;
 if(!intersects({x:px-14,y:top,w:118,h:deckHeight+12},view))return true;
 g.save();g.imageSmoothingEnabled=false;
 // V122: dark *understructure* sits on water OUTSIDE the solid walkable deck,
 // not on top of timber. Tight side shadows and a clear lower face create height.
 g.fillStyle='rgba(2,23,42,.36)';g.fillRect(px-13,top+8,12,deckHeight+3);
 g.fillStyle='rgba(2,19,37,.43)';g.fillRect(px+90,top+8,14,deckHeight+3);
 g.fillStyle='#76503b';g.fillRect(px-4,top+6,4,deckHeight-1);
 g.fillStyle='#513524';g.fillRect(px+90,top+6,4,deckHeight-1);
 // Only the actual deck surface receives the atlas. V121 atlas is 90×192,
 // unlike old 90×128: use intrinsic height to avoid visible repeated cuts.
 g.save();g.beginPath();g.rect(px,top,deckWidth,deckHeight);g.clip();
 const texH=im.naturalHeight||128;
 for(let y=top;y<top+deckHeight;y+=texH){
  const h=Math.min(texH,top+deckHeight-y);
  g.drawImage(im,0,0,90,h,px,y,90,h);stats.dockTiles++;
 }
 // Sunlit edge trim belongs on the actual deck top, not the water.
 g.fillStyle='rgba(255,223,155,.23)';g.fillRect(px+4,top,2,deckHeight);
 g.fillStyle='rgba(37,23,28,.27)';g.fillRect(px+86,top,3,deckHeight);
 g.restore();
 // Raised planked end-cap: clearly visible thickness above the sea.
 g.fillStyle='#754b30';g.fillRect(px,top+deckHeight,90,8);
 g.fillStyle='#e5b574';g.fillRect(px,top+deckHeight-2,90,3);
 g.fillStyle='#3c2c28';g.fillRect(px+1,top+deckHeight+6,88,2);
 g.restore();return true;
}
function post(g,x,y){
 if(atlas(g,'dock-post',x-22,y-46,44,92)){stats.postDraws++;return true;}
 return false;
}
function promenade(g,opt,t){
 if(!opt?.view)return;
 const v=opt.view;
 const img=drawable('tree-shadows');
 if(!img)return;
 g.save();
 // Golden-hour bounce lives on the actual sidewalk underneath actors and props.
 g.beginPath();g.rect(4400,3220,1500,576);g.clip();
 const sun=g.createLinearGradient(4400,3350,5300,3810);
 sun.addColorStop(0,'rgba(255,193,112,.075)');
 sun.addColorStop(.65,'rgba(255,207,147,.14)');
 sun.addColorStop(1,'rgba(252,170,96,.083)');
 g.fillStyle=sun;g.fillRect(4400,3220,1500,576);
 g.imageSmoothingEnabled=false;g.globalAlpha=.95;
 for(const [x,y,w,h] of [[4395,3400,270,185],[4790,3390,300,190],
 [5250,3385,300,190],[5530,3420,300,185],[4560,3600,230,120],
 [5120,3540,260,140],[5580,3530,230,125],
 [4495,3630,275,130],[4830,3570,320,160],[5230,3580,285,155]]){
  if(!intersects({x,y,w,h},v))continue;
  g.drawImage(img,x,y,w,h);stats.shadows++;
 }
 g.restore();
}
function seawall(g,opt,t){
 if(!opt?.view)return;
 const view=opt.view,visible=intersects({x:4400,y:3780,w:1500,h:70},view);
 if(!visible)return;
 const lights=drawable('seawall-light');
 for(const [a,b] of [[4400,4655],[4745,5105],[5195,5555],[5645,5900]]){
  for(let x=a+68;x<b-24;x+=115){
   if(x<view.x-35||x>view.x+view.w+35)continue;
   if(lights)atlas(g,'seawall-light',x-15,3789,30,23);
   if(typeof g.createRadialGradient==='function'){
    const glow=g.createRadialGradient(x,3808,1,x,3808,61);
    glow.addColorStop(0,'rgba(255,222,115,.47)');
    glow.addColorStop(1,'rgba(255,160,64,0)');
    g.fillStyle=glow;g.fillRect(x-61,3790,122,82);
   }
  }
 }
}
function waterReflections(g,opt,t){
 if(!opt||!intersects(W,opt.view))return;
 const view=opt.view,time=reduced?0:t;
 g.save();g.beginPath();g.rect(W.x,W.y,W.w,W.h);g.clip();
 for(const [a,b] of [[4400,4655],[4745,5105],[5195,5555],[5645,5900]]){
  for(let x=a+68;x<b-24;x+=115){
   if(x<view.x-48||x>view.x+view.w+48||view.y>4060)continue;
   // Golden reflections are sparse broken *sparkles*, not horizontal bars.
   // Short points travel with subtle wave displacement beneath their real lamp.
   const flicker=Math.sin(time*.0011+x*.4)*.07;
   for(let k=0;k<14;k++){
    const y=3822+k*15;
    const drift=Math.sin(k*.89+time*.001+x*.03)*(5+k*1.25);
    const seed=(Math.imul((x|0)+k,2654435761)>>>0);
    const xx=Math.round(x+drift+(seed%21-10));
    const brightness=Math.max(.07,.64-k*.034+flicker);
    const size=2+(seed%4);
    g.fillStyle='rgba(255,230,157,'+brightness.toFixed(3)+')';
    g.fillRect(xx,y,size,2);
    if(k%3===0){
     g.fillStyle='rgba(255,252,212,'+Math.min(.86,brightness*.9).toFixed(3)+')';
     g.fillRect(xx+1,y-2,2,6);
    }
    if(k%4===1){
     g.fillStyle='rgba(244,174,72,'+(brightness*.56).toFixed(3)+')';
     g.fillRect(xx-5,y+4,3,2);
    }
    stats.reflectionDraws++;
   }
  }
 }
 g.restore();
}
function ready(){return ['water-body','water-caustics','dock-wood','dock-post','water-glints'].every(k=>!!drawable(k));}
window.ROOKIE_V120_ART=Object.freeze({
 water,contactWater,boat,dock,post,promenade,seawall,waterReflections,ready,
 metrics:()=>Object.freeze({...stats,ready:ready(),decoded:files.filter(f=>drawable(f)).length,
  assets:files.length,changesSaves:false,changesZombieOutbreak:false})
});
})();

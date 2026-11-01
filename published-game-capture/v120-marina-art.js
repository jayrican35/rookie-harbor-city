/* ROOKIE V120 — Southbay premium marina material pass.
 * Production atlases are baked OFFLINE by tools/generate_v120_marina_art.py.
 * One existing V116 Canvas, one shared camera, no new frame loop or world.
 */
(function(){
'use strict';
const ROOT='./assets/v120-marina/';
const W={x:4400,y:3800,w:1500,h:856},PIERS=[4655,5105,5555];
const tile=512,files=['water-body','water-caustics','water-reef','dock-wood','dock-post','foam-frames','seawall-light','tree-shadows'];
const art=Object.create(null);
for(const name of files){
 const im=new Image();im.decoding='async';im.src=ROOT+name+'.png';art[name]=im;
}
const drawable=(name)=>{const im=art[name];return im&&im.complete&&im.naturalWidth>0?im:null;};
const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const stats={waterFrames:0,materialsDrawn:0,foamDraws:0,reflectionDraws:0,dockTiles:0,postDraws:0,shadows:0};
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
 material(g,'water-caustics',view,sx,sy,.70);
 material(g,'water-caustics',view,-sy*2,-sx*2,.28);
 // Stone seawall casts a clear nearshore underwater shade.
 g.fillStyle='rgba(2,24,49,.49)';g.fillRect(4400,3800,1500,21);
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
   foam(g,x,3807,55,t+(x%3)*90,.63);
  }
 }
 // Turbulence around the real original dock piles (not a visual fake).
 for(const px of PIERS)for(const py of [3820,3945,4090])for(const dx of [3,86]){
  const x=px+dx;
  if(!intersects({x:x-45,y:py-50,w:90,h:95},view))continue;
  foam(g,x,py-5,60,t+px+py,.90);
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
 foam(g,cx,cy,b.w*1.75,t+b.p*150,.76);
 if(drawable('foam-frames'))foam(g,cx,cy+18,b.w*1.45,t+500,.36);
 g.restore();
}
function dock(g,px,view){
 const im=drawable('dock-wood');if(!im)return false;
 if(!intersects({x:px,y:3800,w:90,h:300},view))return true;
 g.save();g.imageSmoothingEnabled=false;
 g.fillStyle='rgba(2,25,45,.7)';g.fillRect(px-13,3800,13,300);
 g.fillRect(px+90,3800,17,300);
 for(let y=3800;y<4100;y+=128){
  const h=Math.min(128,4100-y);
  g.drawImage(im,0,0,90,h,px,y,90,h);stats.dockTiles++;
 }
 // Continuous plank edging and dimensional cast shadows on water.
 g.fillStyle='rgba(9,25,34,.32)';g.fillRect(px,3800,4,300);
 g.fillStyle='rgba(255,201,123,.23)';g.fillRect(px+6,3800,2,300);
 g.fillStyle='rgba(3,18,39,.40)';g.fillRect(px+86,3800,4,300);
 g.restore();return true;
}
function post(g,x,y){
 if(atlas(g,'dock-post',x-18,y-39,36,76)){stats.postDraws++;return true;}
 return false;
}
function promenade(g,opt,t){
 if(!opt?.view)return;
 const v=opt.view;
 const img=drawable('tree-shadows');
 if(!img)return;
 g.save();g.imageSmoothingEnabled=false;g.globalAlpha=.80;
 for(const [x,y,w,h] of [[4395,3400,270,185],[4790,3390,300,190],
 [5250,3385,300,190],[5530,3420,300,185],[4560,3600,230,120],
 [5120,3540,260,140],[5580,3530,230,125]]){
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
    glow.addColorStop(0,'rgba(255,222,115,.27)');
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
   const flicker=Math.sin(time*.0011+x*.4)*.07;
   for(let k=0;k<11;k++){
    const y=3822+k*18,xx=x+Math.sin(k*.89+time*.001)*((k+1)*2);
    const width=26*(1-k/15);
    g.fillStyle='rgba(255,210,101,'+Math.max(.05,.40-k*.027+flicker)+')';
    g.fillRect(xx-width/2,y,width,3+(k%3===0?2:0));stats.reflectionDraws++;
   }
  }
 }
 g.restore();
}
function ready(){return ['water-body','water-caustics','dock-wood','dock-post'].every(k=>!!drawable(k));}
window.ROOKIE_V120_ART=Object.freeze({
 water,contactWater,boat,dock,post,promenade,seawall,waterReflections,ready,
 metrics:()=>Object.freeze({...stats,ready:ready(),decoded:files.filter(f=>drawable(f)).length,
  assets:files.length,changesSaves:false,changesZombieOutbreak:false})
});
})();

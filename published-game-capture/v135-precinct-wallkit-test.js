/* ROOKIE — V135 Precinct 9 wall kit: phase-1 smoke assembly ONLY.
 * Reuses the already present V134 architecture draw context and roof fade.
 * Reads the existing asset manifest and atlas; no additional renderer, game
 * loop, collision map, scene, input, story or NPC mutation. Review mode only.
 */
(function(){
'use strict';
if(window.ROOKIE_V135_WALL_KIT)return;
const dir=window.ROOKIE_V137_ENTRANCE_ACTIVE?'./assets/precinct9-entrance-phase3/':
 window.ROOKIE_V136_WINDOW_KIT_ACTIVE?'./assets/precinct9-windows-phase2/':
 './assets/precinct9-wall-kit-phase1/';
let manifest=null,atlas=null,loaded=false,error=null,frameDraws=0,testPaints=0,windowDraws=0,entranceFrames=0,entranceDoorDraws=0;
const im=new Image();im.decoding='async';
fetch(dir+'manifest.json').then(r=>{
 if(!r.ok)throw Error('precinct atlas manifest '+r.status);return r.json();
}).then(m=>new Promise((resolve,reject)=>{
 im.onload=()=>resolve(m);im.onerror=()=>reject(Error('precinct asset atlas unavailable'));
 im.src=dir+m.atlas;
})).then(m=>{
 if(m.tileSize!==32||m.worldPixelsPerAssetPixel!==1)throw Error('wall-kit scale mismatch');
 if(!m.frames?.wall_brick_medium||!m.frames?.pilaster_full)throw Error('missing Phase-1 walls');
 if(window.ROOKIE_V136_WINDOW_KIT_ACTIVE && (!m.frames?.window_single_warm||
   !m.frames?.window_single_dark||Object.keys(m.frames).length!==(window.ROOKIE_V137_ENTRANCE_ACTIVE?49:42)))
     throw Error('Phase-2 window atlas missing or incompatible');
 if(window.ROOKIE_V137_ENTRANCE_ACTIVE && (m.version!=='precinct9-entrance-phase3'||
    !m.frames?.entry_double_glass_open||!m.frames?.entry_stone_portal_frame))
      throw Error('Phase-3 entrance atlas missing/incompatible');
 atlas=im;manifest=m;loaded=true;
 // V134 caches the original façade. Repaint its existing cache ONCE, so
 // windows replace the old authored panes rather than float over them.
 if(window.ROOKIE_V136_WINDOW_KIT_ACTIVE)window.ROOKIE_V134_PRECINCT?.invalidateFacade?.();
}).catch(e=>{error=e.message;console.warn('ROOKIE precinct asset atlas:',e.message);});
function tile(g,id,x,y,w,h){
 const f=manifest?.frames?.[id];if(!f||!atlas||!loaded)return false;
 const {x:sx,y:sy,w:sw,h:sh}=f.atlas;
 g.drawImage(atlas,sx,sy,sw,sh,Math.round(x),Math.round(y),
   Math.round(w||sw),Math.round(h||sh));
 frameDraws++;return true;
}
// V139 Phase 5 uses THIS SAME existing atlas/manifest loader contract for
// additional terrain artwork. No second renderer, map, camera, loop or save.
let groundManifest=null,groundSheet=null,groundLoaded=false,groundError=null,groundDraws=0;
if(window.ROOKIE_V139_GROUND_ACTIVE){
 const base='./assets/precinct9-ground-phase5/';
 fetch(base+'manifest.json').then(r=>{
  if(!r.ok)throw Error('precinct ground manifest '+r.status);
  return r.json();
 }).then(m=>new Promise((resolve,reject)=>{
  const tileImage=new Image();tileImage.decoding='async';
  tileImage.onload=()=>resolve({m,tileImage});
  tileImage.onerror=()=>reject(Error('phase-5 terrain atlas failed to load'));
  tileImage.src=base+m.atlas;
 })).then(({m,tileImage})=>{
  if(m.version!=='precinct9-phase5-ground'||m.tileSize!==32||
      m.worldPixelsPerAssetPixel!==1||!m.frames?.paver_stone||!m.frames?.asphalt||
      !m.frames?.grass)throw Error('phase-5 terrain asset contract mismatch');
  groundSheet=tileImage;groundManifest=m;groundLoaded=true;
 }).catch(e=>{groundError=e.message;console.warn('ROOKIE ground kit:',groundError);});
}
function drawGroundSprite(g,id,x,y,w,h){
 const f=groundManifest?.frames?.[id];
 if(!groundLoaded||!groundSheet||!f)return false;
 const a=f.atlas;
 g.drawImage(groundSheet,a.x,a.y,a.w,a.h,
  Math.round(x),Math.round(y),Math.round(w??a.w),Math.round(h??a.h));
 groundDraws++;return true;
}
function fillGround(g,id,x,y,w,h){
 const f=groundManifest?.frames?.[id];
 if(!groundLoaded||!groundSheet||!f||w<=0||h<=0)return false;
 const a=f.atlas;
 // Repeating the true native-size PNGs — NO resizing — clipped to the
 // EXISTING walk/road/parking rectangles in the original V133 ground cache.
 g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
 // Full surfaces repeat on the global 32-grid; edge/road marking
 // overlays anchor to their requested physical rectangle so a cropped
 // curb cannot accidentally draw its transparent midpoint at the edge.
 const edge=/^(?:curb_|road_|crosswalk_|parking_|stone_border|sidewalk_grass_edge)/.test(id);
 const y0=edge?y:Math.floor(y/a.h)*a.h;
 const x0=edge?x:Math.floor(x/a.w)*a.w;
 for(let yy=y0;yy<y+h;yy+=a.h)
  for(let xx=x0;xx<x+w;xx+=a.w){
   g.drawImage(groundSheet,a.x,a.y,a.w,a.h,xx,yy,a.w,a.h);
   groundDraws++;
  }
 g.restore();return true;
}
function drawTest(g,opts){
 if(!loaded||!g||!opts||!Number.isFinite(opts.x)||!Number.isFinite(opts.y))return false;
 // One deliberately SMALL section of the current V134 SOUTH wall, drawn
 // inside V134's own canvas/roof-alpha branch, not a second building.
 const x=opts.x,y=opts.y;
 g.save();g.imageSmoothingEnabled=false;
 // One 320x128 preview row; repeated 32-grid pieces are world-aligned.
 tile(g,'wall_brick_narrow',x+32,y);
 tile(g,'wall_brick_medium',x+96,y);
 tile(g,'wall_brick_narrow',x+224,y);
 tile(g,'pilaster_divider',x,y);
 tile(g,'pilaster_divider',x+288,y);
 tile(g,'stone_cornice',x+32,y,128,32);
 tile(g,'wall_top_band',x+160,y,128,32);
 tile(g,'stone_base_trim',x+32,y+96,128,32);
 tile(g,'wall_bottom_band',x+160,y+96,128,32);
 // 2-column strip also tests transparency and scale but does NOT complete
 // windows/doors/awning/signage in this Phase 1 deliverable.
 g.restore();testPaints++;
 return true;
}
function drawFacadeWindow(g,x,y,w,h){
 if(!loaded||!['precinct9-windows-phase2','precinct9-entrance-phase3'].includes(manifest.version))return false;
 // Existing V134 architectural bay coordinates are authoritative.
 // Phase-2 PNGs are 1:1 pixels, unscaled, centered inside the bay. No
 // facade overlay or new collision polygons. Only this old window changes.
 const wide=w>=98,unit=wide?96:64;
 const sx=Math.round(x+(w-unit)/2),sy=Math.round(y+(h-96)/2);
 const warm=(Math.round(x/50)+Math.round(y/37))%4!==0;
 const type=wide?(warm?'window_wide_warm':'window_wide_dark'):
   warm?'window_single_warm':'window_single_dark';
 const success=tile(g,type,sx,sy);
 if(success)windowDraws++;
 if(success&&warm&&((Math.round(x/31)%3)===0)){
  g.save();g.globalAlpha=.11;
  g.fillStyle='#edbf76';g.fillRect(sx-3,sy+79,70,7);
  g.restore();
 }
 return success;
}
function drawEntranceStatic(g,centerX=572){
 if(!loaded||manifest.version!=='precinct9-entrance-phase3')return false;
 const x=Math.round(centerX);
 // Reuse original Phase-1 columns and caps, as well as original V134
 // badge and nameplate. The only new static elements are entrance modules.
 // Transparent central aperture matches the EXISTING 72px world opening.
 g.clearRect(x-36,535,72,110);
 const parts=[
  ['entry_stone_portal_frame',x-96,517],
  ['pilaster_divider',x-94,517],
  ['pilaster_divider',x+62,517],
  ['stone_column_cap',x-110,510],
  ['stone_column_cap',x+46,510],
  ['entry_blue_awning_roof',x-128,458],
  ['entry_blue_awning_edge',x-128,510],
  ['entry_main_entrance_sign',x-96,514]
 ];
 for(const [id,px,py]of parts)tile(g,id,px,py);
 entranceFrames++;return true;
}
function drawEntranceDoors(g,centerX,topY,openRatio){
 if(!loaded||manifest.version!=='precinct9-entrance-phase3')return false;
 const v=Math.max(0,Math.min(1,Number(openRatio)||0));
 // Three authentic glass-leaf frames cross-faded in existing Canvas RAF;
 // no second animation loop, no scene transition.
 const stages=v<.5?
  [['entry_double_glass_closed',1-v*2],['entry_double_glass_half',v*2]]:
  [['entry_double_glass_half',2-v*2],['entry_double_glass_open',v*2-1]];
 g.save();
 for(const [id,a]of stages){
  if(a<=.005)continue;
  g.globalAlpha=a;tile(g,id,Math.round(centerX-48),Math.round(topY));
 }
 g.restore();entranceDoorDraws++;return true;
}
let communityManifest=null,communityAtlas=null,communityError=null,communityLoading=false;
function prepareCommunityAssets(){
 if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE||communityLoading||!window.HARBOR?.seamlessCampusV115?.isOpen())return;
 communityLoading=true;
 fetch('./assets/community-walk/manifest.json').then(r=>{
  if(!r.ok)throw Error('Community Walk manifest '+r.status);return r.json();
 }).then(m=>new Promise((resolve,reject)=>{
  const im=new Image();im.decoding='async';im.onload=()=>resolve({m,im});
  im.onerror=()=>reject(Error('Community Walk atlas unavailable'));
  im.src='./assets/community-walk/'+m.atlas;
 })).then(({m,im})=>{communityManifest=m;communityAtlas=im;})
 .catch(e=>{communityError=e.message;console.warn(e.message);});
}
function drawCommunitySprite(g,id,x,y){
 const f=communityManifest?.frames?.[id];if(!f||!communityAtlas)return false;
 g.imageSmoothingEnabled=false;
 g.drawImage(communityAtlas,f.x,f.y,f.w,f.h,Math.round(x-f.w/2),Math.round(y-f.h),f.w,f.h);
 return true;
}
function fillCommunityGround(g,id,x,y,w,h){
 const f=communityManifest?.frames?.[id];if(!f||!communityAtlas)return false;
 g.save();g.imageSmoothingEnabled=false;g.beginPath();g.rect(x,y,w,h);g.clip();
 for(let yy=Math.floor(y/f.h)*f.h;yy<y+h;yy+=f.h)
  for(let xx=Math.floor(x/f.w)*f.w;xx<x+w;xx+=f.w)
   g.drawImage(communityAtlas,f.x,f.y,f.w,f.h,xx,yy,f.w,f.h);
 g.restore();return true;
}
function drawCommunityBorder(g,lawn){
 if(!communityAtlas||!communityManifest?.frames?.curb_corner_bottom)return false;
 const frames=communityManifest.frames,x=lawn.x-12,y=lawn.y-12,w=lawn.w+24,h=lawn.h+24;
 function corner(id,xx,yy,mirror){
  const f=frames[id];g.save();g.translate(xx+(mirror?f.w:0),yy);
  if(mirror)g.scale(-1,1);
  g.drawImage(communityAtlas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);g.restore();
 }
 function strip(id,xx,yy,ww,hh){
  const f=frames[id];g.save();g.beginPath();g.rect(xx,yy,ww,hh);g.clip();
  for(let sy=yy;sy<yy+hh;sy+=f.h)for(let sx=xx;sx<xx+ww;sx+=f.w)
   g.drawImage(communityAtlas,f.x,f.y,f.w,f.h,sx,sy,f.w,f.h);
  g.restore();
 }
 g.save();g.imageSmoothingEnabled=false;
 strip('curb_straight',x+26,y+3,w-52,13);
 strip('curb_straight',x+26,y+h-16,w-52,13);
 strip('curb_vertical',x+3,y+26,8,h-52);
 strip('curb_vertical',x+w-11,y+26,8,h-52);
 corner('curb_corner',x,y,true);corner('curb_corner',x+w-28,y,false);
 corner('curb_corner_bottom',x,y+h-28,true);corner('curb_corner_bottom',x+w-28,y+h-28,false);
 g.restore();return true;
}
// Road materials follow the existing connected-world graph. This is a
// ground painter in the existing frame, never a second simulation or map.
let roadway=null,roadImage=null,roadLoading=false,roadError=null,roadPattern=null,roadPlan=null;
const roadMetrics={segments:0,nativeStreets:0,rectangles:0,junctions:0,draws:0};
function prepareRoadAssets(){
 if(roadLoading||!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE||!window.HARBOR?.seamlessCampusV115?.isOpen())return;
 roadLoading=true;
 fetch('./assets/roadway/manifest.json').then(r=>{if(!r.ok)throw Error('Roadway manifest '+r.status);return r.json();})
 .then(m=>new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';
  im.onload=()=>resolve({m,im});im.onerror=()=>reject(Error('Roadway atlas unavailable'));im.src='./assets/roadway/'+m.atlas;
 })).then(({m,im})=>{roadway=m;roadImage=im;}).catch(e=>{roadError=e.message;console.warn(e.message);});
}
function fillRoadMaterial(g,x,y,w,h){
 if(!roadImage)return false;
 if(!roadPattern){const f=roadway.frames.asphalt,c=document.createElement('canvas');c.width=f.w;c.height=f.h;
  c.getContext('2d').drawImage(roadImage,f.x,f.y,f.w,f.h,0,0,f.w,f.h);roadPattern=g.createPattern(c,'repeat');}
 g.save();g.imageSmoothingEnabled=false;g.fillStyle=roadPattern;g.fillRect(x,y,w,h);g.restore();return true;
}
function drawRoadDecal(g,id,x,y,scale=1,angle=0){
 const f=roadway?.frames?.[id];if(!roadImage||!f)return false;
 g.save();g.imageSmoothingEnabled=false;g.translate(x,y);g.rotate(angle);
 g.drawImage(roadImage,f.x,f.y,f.w,f.h,-f.w*scale/2,-f.h*scale/2,f.w*scale,f.h*scale);g.restore();return true;
}
function roadBand(roads,r,along){
 const horizontal=r.axis==='h';let lo=horizontal?r.y:r.x,hi=lo+(horizontal?r.h:r.w),changed=true;
 while(changed){changed=false;for(const o of roads){
  if(o.axis!==r.axis||along<(horizontal?o.x:o.y)||along>(horizontal?o.x+o.w:o.y+o.h))continue;
  const a=horizontal?o.y:o.x,b=a+(horizontal?o.h:o.w);
  if(a>hi||b<lo)continue;
  const nextLo=Math.min(lo,a),nextHi=Math.max(hi,b);
  if(nextLo!==lo||nextHi!==hi){lo=nextLo;hi=nextHi;changed=true;}
 }}return {lo,hi,center:Math.floor((lo+hi)/2)};
}
function prepareRoadPlan(source,nodes,native=[]){
 const roads=[...source,...native].map(r=>({...r,axis:r.w>r.h?'h':'v',ids:[r.id]}));
 // Merge collinear overlaps on cloned visual rectangles only. Original
 // road IDs, geometry, collision and vehicle navigation never change.
 let changed=true;
 while(changed){changed=false;
  outer:for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){
   const a=roads[i],b=roads[j];if(a.axis!==b.axis)continue;
   const horizontal=a.axis==='h',same=horizontal?a.y===b.y&&a.h===b.h:a.x===b.x&&a.w===b.w;
   const from=horizontal?'x':'y',length=horizontal?'w':'h';
   if(!same||a[from]>b[from]+b[length]||b[from]>a[from]+a[length])continue;
   const end=Math.max(a[from]+a[length],b[from]+b[length]);a[from]=Math.min(a[from],b[from]);a[length]=end-a[from];
   a.ids.push(...b.ids);roads.splice(j,1);changed=true;break outer;
  }
 }
 const crossings=[{id:'community-walk',x:948,y:1784,axis:'h'},...nodes.filter(n=>n.type==='intersection'),...nodes.filter(n=>n.type!=='intersection')];
 const paintCrossings=[];
 for(const n of crossings){let x=n.x,y=n.y;
  const r=roads.find(r=>r.axis===n.axis&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(!r)continue;
  const other=roads.find(o=>o.axis!==r.axis&&(r.axis==='h'?
   x>=o.x&&x<=o.x+o.w&&o.y<=r.y+r.h&&o.y+o.h>=r.y:
   y>=o.y&&y<=o.y+o.h&&o.x<=r.x+r.w&&o.x+o.w>=r.x));
  if(n.type==='intersection'&&other){if(r.axis==='h')x=other.x+other.w+72;else y=other.y+other.h+72;}
  const band=roadBand(roads,r,r.axis==='h'?x:y);
  if(r.axis==='h')y=band.center;else x=band.center;
  if(x<r.x+48||x>r.x+r.w-48||y<r.y+48&&r.axis==='v'||y>r.y+r.h-48&&r.axis==='v')continue;
  if(paintCrossings.some(c=>c.axis===n.axis&&Math.hypot(c.x-x,c.y-y)<150))continue;
  // A crossing near a width transition must fit its entire footprint,
  // not just the road width at its center (Downtown/Waterfront has a jog).
  let fitted=null;
  for(let scale=Math.min(4,Math.floor((band.hi-band.lo-6)/40));scale>=1;scale--){
   const along=r.axis==='h'?x:y,half=31*scale/2;
   const a=roadBand(roads,r,along-half),b=roadBand(roads,r,along+half);
   const lo=Math.max(a.lo,b.lo),hi=Math.min(a.hi,b.hi);
   if(hi-lo<40*scale+4)continue;
   const center=Math.floor((lo+hi)/2),cx=r.axis==='h'?x:center,cy=r.axis==='h'?center:y;
   const w=(r.axis==='h'?31:40)*scale,h=(r.axis==='h'?40:31)*scale;
   if([cx-w/2,cx+w/2].every(xx=>[cy-h/2,cy+h/2].every(yy=>roads.some(o=>xx>=o.x&&xx<=o.x+o.w&&yy>=o.y&&yy<=o.y+o.h)))){
    fitted={...n,x:cx,y:cy,scale};break;
   }
  }
  if(fitted)paintCrossings.push(fitted);
 }
 roadMetrics.segments=source.length;roadMetrics.nativeStreets=native.length;roadMetrics.rectangles=roads.length;
 roadMetrics.junctions=roads.reduce((sum,a,i)=>sum+roads.slice(i+1).filter(b=>a.axis!==b.axis&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y).length,0);
 return {roads,crossings:paintCrossings};
}
function drawRoadNetwork(g,source,nodes,view,native=[]){
 prepareRoadAssets();if(!roadImage)return false;
 if(!roadPlan)roadPlan=prepareRoadPlan(source,nodes,native);
 const {roads,crossings}=roadPlan;
 const visible=r=>r.x<view.x+view.w+16&&r.x+r.w>view.x-16&&r.y<view.y+view.h+16&&r.y+r.h>view.y-16;
 const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function intervals(r,side){
  const horizontal=r.axis==='h',from=horizontal?r.x:r.y,end=from+(horizontal?r.w:r.h);
  const at=horizontal?r.y+(side?r.h:0):r.x+(side?r.w:0);
  let spans=[[from,end]];
  const outside=at+(side?0.5:-0.5);
  const cuts=roads.filter(o=>o!==r&&(horizontal?outside>=o.y&&outside<o.y+o.h:outside>=o.x&&outside<o.x+o.w))
   .map(o=>horizontal?[o.x,o.x+o.w]:[o.y,o.y+o.h]);
  if(horizontal&&r.y===1721){cuts.push([900,996]);if(!side)cuts.push([1856,2002]);}
  for(const [lo,hi]of cuts)spans=spans.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:[[a,Math.max(a,lo)],[Math.min(b,hi),b]].filter(([x,y])=>y>x));
  return {at,spans};
 }
 function curb(id,x,y,w,h){
  const f=roadway.frames[id];g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  const left=Math.max(x,view.x-90),top=Math.max(y,view.y-90),right=Math.min(x+w,view.x+view.w+90),bottom=Math.min(y+h,view.y+view.h+90);
  const vertical=id==='curb_vertical';
  for(let yy=vertical?Math.floor(top/f.h)*f.h:y;yy<bottom;yy+=f.h)for(let xx=vertical?x:Math.floor(left/f.w)*f.w;xx<right;xx+=f.w)
   g.drawImage(roadImage,f.x,f.y,f.w,f.h,xx,yy,f.w,f.h);
  g.restore();
 }
 g.save();g.imageSmoothingEnabled=false;
 // Keep approved Marina materials outside this road finish.
 g.beginPath();g.rect(-4000,-1000,15000,7000);g.rect(4400,3220,1500,1000);g.clip('evenodd');
 for(const r of roads)if(visible(r))fillRoadMaterial(g,Math.max(r.x,view.x-16),Math.max(r.y,view.y-16),Math.min(r.x+r.w,view.x+view.w+16)-Math.max(r.x,view.x-16),Math.min(r.y+r.h,view.y+view.h+16)-Math.max(r.y,view.y-16));
 const paintedDashes=new Set();
 for(const r of roads){if(!visible(r))continue;
  for(const side of [0,1]){const e=intervals(r,side);for(const [a,b]of e.spans){
   if(r.axis==='h')curb(side?'curb_bottom':'curb_top',a,e.at+(side?0:-9),b-a,9);
   else curb('curb_vertical',e.at+(side?0:-9),a,9,b-a);
  }}
  const horizontal=r.axis==='h',start=Math.max(horizontal?r.x:r.y,horizontal?view.x-64:view.y-64),end=Math.min(horizontal?r.x+r.w:r.y+r.h,horizontal?view.x+view.w+64:view.y+view.h+64);
  for(let a=Math.floor(start/42)*42;a<end;a+=42){
   if(a<start)continue; // do not spill a dash before a native segment begins
   const center=roadBand(roads,r,a).center,key=r.axis+':'+a+':'+center;
   if(paintedDashes.has(key))continue;paintedDashes.add(key);
   const box=horizontal?{x:a-22,y:center-3,w:44,h:6}:{x:center-3,y:a-22,w:6,h:44};
   if(roads.some(o=>o.axis!==r.axis&&intersects(r,o)&&(horizontal?
    box.x<o.x+o.w&&box.x+box.w>o.x:box.y<o.y+o.h&&box.y+box.h>o.y)))continue;
   if(crossings.some(c=>c.axis===r.axis&&Math.abs((horizontal?c.y:c.x)-center)<4&&Math.abs((horizontal?c.x:c.y)-a)<70))continue;
   drawRoadDecal(g,'yellow_dashes',horizontal?a:center,horizontal?center:a,1,horizontal?0:Math.PI/2);
  }
 }
 for(const c of crossings)if(visible({x:c.x-80,y:c.y-80,w:160,h:160}))drawRoadDecal(g,'crosswalk',c.x,c.y,c.scale,c.axis==='h'?Math.PI/2:0);
 g.restore();roadMetrics.draws++;return true;
}
window.ROOKIE_V135_WALL_KIT=Object.freeze({
 version:'v135-phase1-wall-kit',
 drawTest,drawFacadeWindow,drawEntranceStatic,drawEntranceDoors,drawGroundSprite,fillGround,drawCommunitySprite,prepareCommunityAssets,fillCommunityGround,drawCommunityBorder,
 drawRoadNetwork,fillRoadMaterial,drawRoadDecal,
 roadwayPlan:()=>roadPlan?JSON.parse(JSON.stringify(roadPlan)):null,
 stats:()=>({loaded,error,frameDraws,testPaints,windowDraws,entranceFrames,entranceDoorDraws,moduleCount:Object.keys(manifest?.frames||{}).length,
  atlasSize:atlas?[atlas.naturalWidth,atlas.naturalHeight]:null,
  windowAtlas:['precinct9-windows-phase2','precinct9-entrance-phase3'].includes(manifest?.version),
  entranceAtlas:manifest?.version==='precinct9-entrance-phase3',
  groundAtlas:groundLoaded,groundError,groundDraws,
  communityAtlas:!!communityAtlas,communityError,
  roadAtlas:!!roadImage,roadError,roads:{...roadMetrics},
  groundModuleCount:Object.keys(groundManifest?.frames||{}).length}),
 scope:'Only 32-grid modular wall kit test on existing V134 precinct facade; no other gameplay change'
});
})();

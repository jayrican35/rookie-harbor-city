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
window.ROOKIE_V135_WALL_KIT=Object.freeze({
 version:'v135-phase1-wall-kit',
 drawTest,drawFacadeWindow,drawEntranceStatic,drawEntranceDoors,
 stats:()=>({loaded,error,frameDraws,testPaints,windowDraws,entranceFrames,entranceDoorDraws,moduleCount:Object.keys(manifest?.frames||{}).length,
  atlasSize:atlas?[atlas.naturalWidth,atlas.naturalHeight]:null,
  windowAtlas:['precinct9-windows-phase2','precinct9-entrance-phase3'].includes(manifest?.version),
  entranceAtlas:manifest?.version==='precinct9-entrance-phase3'}),
 scope:'Only 32-grid modular wall kit test on existing V134 precinct facade; no other gameplay change'
});
})();

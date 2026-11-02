/* ROOKIE — V135 Precinct 9 wall kit: phase-1 smoke assembly ONLY.
 * Reuses the already present V134 architecture draw context and roof fade.
 * Reads the existing asset manifest and atlas; no additional renderer, game
 * loop, collision map, scene, input, story or NPC mutation. Review mode only.
 */
(function(){
'use strict';
if(window.ROOKIE_V135_WALL_KIT)return;
const dir=window.ROOKIE_V136_WINDOW_KIT_ACTIVE ? './assets/precinct9-windows-phase2/' : './assets/precinct9-wall-kit-phase1/';
let manifest=null,atlas=null,loaded=false,error=null,frameDraws=0,testPaints=0,windowDraws=0;
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
   !m.frames?.window_single_dark||Object.keys(m.frames).length!==42))
     throw Error('Phase-2 window atlas missing or incompatible');
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
 if(!loaded||manifest.version!=='precinct9-windows-phase2')return false;
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
window.ROOKIE_V135_WALL_KIT=Object.freeze({
 version:'v135-phase1-wall-kit',
 drawTest,drawFacadeWindow,
 stats:()=>({loaded,error,frameDraws,testPaints,windowDraws,moduleCount:Object.keys(manifest?.frames||{}).length,
  atlasSize:atlas?[atlas.naturalWidth,atlas.naturalHeight]:null,
  windowAtlas:manifest?.version==='precinct9-windows-phase2'}),
 scope:'Only 32-grid modular wall kit test on existing V134 precinct facade; no other gameplay change'
});
})();

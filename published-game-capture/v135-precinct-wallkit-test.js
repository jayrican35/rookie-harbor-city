/* ROOKIE — V135 Precinct 9 wall kit: phase-1 smoke assembly ONLY.
 * Reuses the already present V134 architecture draw context and roof fade.
 * Reads the existing asset manifest and atlas; no additional renderer, game
 * loop, collision map, scene, input, story or NPC mutation. Review mode only.
 */
(function(){
'use strict';
if(window.ROOKIE_V135_WALL_KIT)return;
const dir='./assets/precinct9-wall-kit-phase1/';
let manifest=null,atlas=null,loaded=false,error=null,frameDraws=0,testPaints=0;
const im=new Image();im.decoding='async';
Promise.all([
 fetch(dir+'manifest.json').then(r=>{if(!r.ok)throw Error('manifest '+r.status);return r.json();}),
 new Promise((resolve,reject)=>{
   im.onload=resolve;im.onerror=()=>reject(Error('precinct9 phase-1 atlas unavailable'));
   im.src=dir+'precinct9_wallkit_phase1_atlas.png';
 })
]).then(([m])=>{
 if(m.tileSize!==32||m.worldPixelsPerAssetPixel!==1)throw Error('wall-kit scale mismatch');
 if(!m.frames?.wall_brick_medium||!m.frames?.pilaster_full)throw Error('missing core wall pieces');
 atlas=im;manifest=m;loaded=true;
}).catch(e=>{error=e.message;console.warn('V135 isolated wall-kit preview:',e.message);});
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
window.ROOKIE_V135_WALL_KIT=Object.freeze({
 version:'v135-phase1-wall-kit',
 drawTest,
 stats:()=>({loaded,error,frameDraws,testPaints,moduleCount:Object.keys(manifest?.frames||{}).length,
  atlasSize:atlas?[atlas.naturalWidth,atlas.naturalHeight]:null}),
 scope:'Only 32-grid modular wall kit test on existing V134 precinct facade; no other gameplay change'
});
})();

/* V123: same distance-driven animations; cleaned sprite atlases remove detached colored bar artifacts. No world/save writes. */
(function(){
'use strict';
const keys=['officer','fisher','visitor'],images={};
for(const key of keys){const im=new Image();im.decoding='async';im.src='./assets/v123-marina-npcs/walk-'+key+'.png?v=clean1';images[key]=im;}
const rows=Object.freeze({down:0,left:1,right:2,up:3});
function pose(a){
 const key=a.npcStyle===undefined||a.npcStyle===0?'officer':a.npcStyle===1||a.npcStyle===2?'fisher':'visitor';
 const dir=Object.hasOwn(rows,a.dir)?a.dir:'down';
 const moving=!!a.moving,travel=Number.isFinite(a.distance)?Math.max(0,a.distance):0;
 const step=Number.isFinite(a.stepLength)?Math.max(4,a.stepLength):25;
 return {key,dir,row:rows[dir],frame:moving?Math.floor(travel/step)%4:1,moving};
}
function draw(g,a){
 const p=pose(a),im=images[p.key];if(!im||!im.complete||!im.naturalWidth)return false;
 const fw=im.naturalWidth/4,fh=im.naturalHeight/4;
 // Feet stay anchored; only the authored pose changes, never stretch/slide a still.
 g.imageSmoothingEnabled=false;
 g.drawImage(im,p.frame*fw,p.row*fh,fw,fh,Math.round(a.x-24),Math.round(a.y-57),48,64);
 return true;
}
window.ROOKIE_V116_WALK=Object.freeze({pose,draw,ready:()=>keys.every(k=>images[k].complete&&images[k].naturalWidth>0),frameCount:16,directions:rows});
})();

/* Connected-preview civilian art adapter. One existing world/depth queue.
 * Reads actor identity, direction and travel; never writes NPC/game state.
 */
(function(){
'use strict';
const ROOT='./assets/civilian-approved/';
const rows=Object.freeze({down:0,left:1,right:2,up:3});
const roles=Object.freeze(['resident','student','shopper','vendor','chef','construction','civilian_medic','fisher','tourist','jogger','office_worker','delivery','mail_clerk','gardener','gardener_alt','musician','artist','barista','store_clerk','waiter','librarian','coach','hiker','elder','kid','beachgoer','dock_worker','mechanic','business_citizen','civilian_casual']);
const byId=Object.freeze({
 'v116:bay-visitor':'beachgoer','v116:bay-fisher':'fisher','v116:fisher':'fisher',
 'v116:worker':'dock_worker','v116:visitor':'tourist','v116:customer':'shopper',
 'v116:stroller':'jogger','v116:cafe-staff':'barista','v116:office-staff':'office_worker',
 'v116:bait-staff':'store_clerk','v116:workshop-staff':'mechanic','v116:bait-customer':'shopper'
});
const districtRoles=Object.freeze({westfield:['hiker','gardener_alt'],residential:['resident','elder'],
 midtown:['student','shopper'],downtown:['business_citizen','office_worker'],eastside:['jogger','civilian_casual'],
 industrial:['construction','delivery'],northgate:['coach','librarian'],southbay:['beachgoer','tourist']});
const protectedNames=/\b(?:JAY|ROSA|KALEB|GIGI|LING\s?LING|MAYA|SARITAH?|ELIAS\s+REED|CHICKEN|BANANA)\b/i;
function protectedActor(a){
 if(!a)return true;
 const id=String(a.id||''),name=String(a.name||'');
 return !!(a.isPlayer||a.police||a.npcStyle===0||id==='connected-jay'||
  /^(?:station-npc:|v133-precinct:)/.test(id)||id==='campus-npc:diaz'||
  protectedNames.test(name)||/\b(?:OFCR|OFFICER|POLICE|SGT|SERGEANT|DETECTIVE|CAPTAIN)\b/i.test(name)||
  window.HARBOR?.cast?.identity?.(name,false));
}
function roleFor(a){
 if(protectedActor(a))return null;
 if(roles.includes(a.civilianRole))return a.civilianRole;
 if(byId[a.id])return byId[a.id];
 const parts=String(a.id||'').split(':');
 if(parts[0]==='ambient'&&districtRoles[parts[1]]){const pool=districtRoles[parts[1]];return pool[(Number(parts[2])||0)%pool.length];}
 const n=String(a.name||'').toUpperCase();
 if(/OLD TOM|FISHER|ANGLER/.test(n))return 'fisher';
 if(/BARISTA/.test(n))return 'barista';
 if(/MECHANIC/.test(n))return 'mechanic';
 if(/MARCO|VENDOR/.test(n))return 'vendor';
 if(/ALMEIDA|IBARRA/.test(n))return 'elder';
 if(/CLERK|SHOPKEEPER/.test(n))return 'store_clerk';
 if(/WATCHMAN/.test(n))return 'business_citizen';
 if(/WORKER/.test(n))return 'dock_worker';
 if(/TOURIST|VISITOR/.test(n))return 'tourist';
 if(/CUSTOMER/.test(n))return 'shopper';
 return 'resident';
}
const images=new Map(),seen=new Map();
const stats={draws:0,pendingFallbacks:0,errors:0};
function image(role){
 if(!images.has(role)){
  const im=new Image();im.decoding='async';im.onerror=()=>stats.errors++;
  im.src=ROOT+'atlases/'+role+'_walk_4dir.png';images.set(role,im);
 }
 return images.get(role);
}
function pose(a){
 const role=roleFor(a);if(!role)return null;
 const dir=Object.hasOwn(rows,a.dir)?a.dir:'down';
 const distance=Number.isFinite(a.distance)?Math.max(0,a.distance):0;
 const step=Number.isFinite(a.stepLength)?Math.max(4,a.stepLength):6;
 return {role,dir,row:rows[dir],frame:a.moving?Math.floor(distance/step)%4:0,moving:!!a.moving};
}
function excluded(){return !window.ROOKIE_CONNECTED_CIVILIANS_ACTIVE||!window.HARBOR?.seamlessCampusV115?.isOpen()||window.HARBOR?.outbreak?.active?.()||window.HARBOR?.academy?.active?.();}
function draw(g,a){
 if(excluded())return false;
 const p=pose(a);if(!p)return false;
 const im=image(p.role);
 if(!im.complete||!im.naturalWidth){stats.pendingFallbacks++;return false;}
 const scale=.4; // Supplied (64,153) feet anchor; 51.2 x 64 world frame.
 g.save();g.imageSmoothingEnabled=false;
 g.fillStyle='rgba(9,28,40,.26)';g.beginPath();g.ellipse(a.x,a.y+3,12,4,0,0,Math.PI*2);g.fill();
 g.drawImage(im,p.frame*128,p.row*160,128,160,Math.round(a.x-64*scale),Math.round(a.y-153*scale),128*scale,160*scale);
 g.restore();stats.draws++;seen.set(String(a.id||a.name),p.role);return true;
}
window.ROOKIE_CIVILIANS=Object.freeze({draw,pose,roleFor,protectedActor,roles,
 metrics:()=>({...stats,loaded:[...images.values()].filter(im=>im.complete&&im.naturalWidth>0).length,
  requested:images.size,ownedDecodedBytes:[...images.values()].reduce((n,im)=>n+(im.naturalWidth||0)*(im.naturalHeight||0)*4,0),
  actorRoles:Object.fromEntries(seen),scope:'connected-preview-only',frameSize:[128,160],anchor:[64,153]})});
})();

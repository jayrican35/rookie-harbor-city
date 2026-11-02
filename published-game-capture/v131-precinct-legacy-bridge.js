/* ROOKIE: Harbor City — reuse the ALREADY LOADED classic precinct artwork.
 * The earlier native station scene owns the authentic authored assets.
 * The V115 continuous world previously cached generic room placeholders and
 * missed late-decoded sprites / classic state.map-only texture overrides.
 * This adapter paints those original assets at their ORIGINAL room coordinates.
 * It creates no Images, assets, maps, colliders, saves, or simulation loops.
 */
(function(){
'use strict';
const H=window.HARBOR;
if(!H||window.ROOKIE_V131_PRECINCT_BRIDGE)return;
const stats={floors:0,furniture:0,garage:0,walls:0,lateReloads:0,missing:[]};
const ready=im=>!!(im&&im.complete&&im.naturalWidth>0);
const craft=()=>H.precinctCraft?.art||{};
const cinema=()=>H.precinctCinematic?.art||{};
const garage=()=>window.__GARAGE?.img?.plate;
const source=(key)=>({
  carpet:craft().carpet,cream:craft().cream,cool:craft().cool,wood:craft().wood,
  wall:craft().wall,interview:craft().interview,crate:craft().crate,
  visitorTable:craft().visitorTable,typing:craft().typing,
  reception:H.receptionRoom?.art,plant:H.receptionRoom?.plant,
  bench:window.B2?.bench,changingBench:window.EXT_IMG?.bench,
  garage:garage(),clock:cinema().clock,sconce:cinema().sconce,
  workbench:cinema().workbench,sofa:H.worldFurniture?.art?.sofa
})[key];
const keys=['carpet','cream','cool','wood','wall','interview','crate',
  'visitorTable','reception','plant','bench','changingBench','garage',
  'clock','sconce','workbench','sofa'];
// One integer fingerprint is enough to rebuild the stationary room cache
// only as ORIGINAL legacy sprites decode. No per-frame texture allocation.
function assetEpoch(){
  let fingerprint=0;
  for(let i=0;i<keys.length;i++)if(ready(source(keys[i])))fingerprint+=2**i;
  return fingerprint;
}
function material(r){
  // Original precinct-craft material labels (not a new design or palette).
  const l=r.label;
  if(l==='GARAGE')return null;
  if(l==='LOBBY'||l==='RECORDS'||l==='INTAKE')return 'cream';
  if(l==='OPERATIONS'||l==='SGT. BROOKS — OFFICE')return 'wood';
  if(l==='BRIEFING'||l==='INTERVIEW')return 'carpet';
  return 'cool';
}
function label(g,r){
  g.save();
  g.fillStyle='rgba(16,35,63,.63)';
  g.font="700 15px 'Barlow Condensed', sans-serif";
  g.textAlign='left';g.textBaseline='alphabetic';
  g.fillText(r.label,r.lx,r.ly);
  g.restore();
}
function garageFloor(g,r){
  // This exact older source artwork built the classic garage's physical
  // floor. Copy ONLY its clean 128x128 concrete crop; the complete garage
  // plate has baked walls that would obstruct the real open door.
  const im=source('garage');
  if(!ready(im))return false;
  g.save();
  g.beginPath();g.rect(r.x,r.y,r.w,r.h);g.clip();
  g.imageSmoothingEnabled=false;
  for(let y=r.y;y<r.y+r.h;y+=64)for(let x=r.x;x<r.x+r.w;x+=64){
    const w=Math.min(64,r.x+r.w-x),h=Math.min(64,r.y+r.h-y);
    g.drawImage(im,510,510,128*w/64,128*h/64,x,y,w,h);
  }
  // Restore the classic two true parking bays. These are the exact marks
  // from old drawRoom garage, not a new drivable vehicle or collider.
  g.strokeStyle='#d6cdb7';g.lineWidth=4;
  for(const x of [1331,1571]){
    g.beginPath();g.moveTo(x,885);g.lineTo(x,755);
    g.lineTo(x+180,755);g.lineTo(x+180,885);g.stroke();
    g.fillStyle='#b7b3a7';g.fillRect(x+30,758,120,9);
  }
  // Original plate's tool-cabinet crop is already collision-backed by
  // the real native source map (1690,670,124,38).
  g.drawImage(im,696,76,146,108,1690,656,124,70);
  g.font='600 12px sans-serif';g.textAlign='center';
  g.fillStyle='#d6cdb7';
  g.fillText('UNIT 9',1421,909);g.fillText('SERVICE BAY',1661,909);
  g.restore();
  label(g,r);stats.garage++;
  return true;
}
function room(g,r){
  if(r.label==='GARAGE')return garageFloor(g,r);
  const key=material(r),im=source(key);
  if(!ready(im))return false;
  // Draw the ORIGINAL 64px precinct-craft material as a repeating tile.
  g.save();g.imageSmoothingEnabled=false;
  g.fillStyle=g.createPattern(im,'repeat');
  g.fillRect(r.x,r.y,r.w,r.h);
  if(r.label==='LOBBY'){
    g.strokeStyle='#b19b6b';g.lineWidth=2;
    g.strokeRect(r.x+17,r.y+24,r.w-36,r.h-44);
    g.strokeStyle='rgba(248,239,210,.60)';g.lineWidth=1;
    g.strokeRect(r.x+20,r.y+27,r.w-42,r.h-50);
  }
  if(r.label==='LOCKER ROOM'){
    // Original classic changing-area sign, using the old source coordinates.
    g.fillStyle='rgba(12,32,51,.1)';g.fillRect(1304,510,80,90);
    g.fillStyle='#16283f';g.font='600 11px sans-serif';
    g.textAlign='center';g.fillText('CHANGING AREA',1344,601);
  }
  g.restore();label(g,r);stats.floors++;
  return true;
}
function furniture(g,f){
  let im,x,y,w,h;
  const type=f.type;
  if(type==='hcReceptionWing')return ready(source('reception'));
  if(type==='hcReception'){
    im=source('reception');
    if(ready(im)){
      // Source authored in the classic desk scene: crop 1601x591 ->
      // physical footprint 202x75 at (516,704); original counter stays solid.
      g.save();g.imageSmoothingEnabled=false;
      g.drawImage(im,90,150,1601,591,516,704,202,75);
      g.restore();stats.furniture++;return true;
    }
  }
  if(type==='hcLobbyPlant'){
    im=source('plant');if(ready(im)){
      g.drawImage(im,91,82,842,1351,f.x-8,f.y-40,40,64);
      stats.furniture++;return true;
    }
  }
  if(type==='hcWaitingPair'){
    im=source('bench');if(ready(im)){
      g.drawImage(im,10,0,34,32,f.x,f.y-32,84,62);
      stats.furniture++;return true;
    }
  }
  if(type==='hcChangingBench'){
    im=source('changingBench');if(ready(im)){
      g.drawImage(im,f.x,f.y-20,f.w,38);
      stats.furniture++;return true;
    }
  }
  if(type==='hcLobbyTable'){
    im=source('visitorTable');if(ready(im)){
      g.drawImage(im,f.x-2,f.y+f.h-38);
      stats.furniture++;return true;
    }
  }
  // The original hand-authored precinct-craft and cinematic prop crops.
  if(type==='table'&&f.x===880&&f.y===110){
    im=source('interview');x=f.x+f.w/2-75;y=f.y+f.h+2-112;w=150;h=112;
  }else if(type==='table'&&f.x===60&&f.y===170){
    im=source('workbench');x=f.x+f.w/2-52;y=f.y+f.h+2-72;w=104;h=72;
  }else if(type==='crate'&&f.x===28&&f.y===240){
    im=source('crate');x=f.x+f.w/2-28;y=f.y+f.h+2-44;w=56;h=44;
  }
  if(ready(im)){
    g.save();g.imageSmoothingEnabled=false;
    g.drawImage(im,x,y,w,h);g.restore();
    stats.furniture++;return true;
  }
  return false; // keep original classic vector fallback, never a blank object
}
function wallSkins(g,walls){
  const im=source('wall');if(!ready(im))return false;
  // Reuse ONLY real horizontal collision-wall rectangles and draw the
  // original native 96x48 wall material. The classic wall gaps are already
  // absent from ST.walls; this cannot close a door or relocate geometry.
  g.save();g.imageSmoothingEnabled=false;
  for(const r of walls){
    if(!(r.h<=32&&r.w>r.h)||r.x<=0||r.y<=0)continue;
    const top=r.y+r.h/2-24;
    for(let x=0;x<r.w;x+=96){
      const w=Math.min(96,r.w-x);
      g.drawImage(im,0,0,w,48,r.x+x,top,w,48);
    }
    stats.walls++;
  }
  g.restore();return true;
}
window.ROOKIE_V131_PRECINCT_BRIDGE=Object.freeze({
 version:'legacy-authored-precinct-reuse-1',worldId:'harbor-main',
 assetEpoch,material,room,furniture,wallSkins,
 assetStatus:()=>Object.fromEntries(keys.map(k=>[k,ready(source(k))])),
 stats:()=>({...stats}),
 source:'Original HARBOR.precinctCraft, precinctCinematic, receptionRoom, B2, EXT_IMG and __GARAGE. No new assets or world geometry.'
});
})();
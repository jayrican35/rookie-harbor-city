/* ROOKIE: Harbor City — reuse the ALREADY LOADED classic precinct artwork.
 * The earlier native station scene owns the authentic authored assets.
 * The V115 continuous world previously cached generic room placeholders and
 * missed late-decoded sprites / classic state.map-only texture overrides.
 * This adapter paints those original assets at their ORIGINAL room coordinates.
 * It never creates NEW artwork, maps, colliders, saves or simulation loops.
 * The classic B2 sprite objects were private to game.js; this review-only
 * bridge decodes their EXACT existing 2026-10-13/14 source files once when
 * global B2 is inaccessible, reusing the browser cache and native dimensions.
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
// The classic campaign wraps `var B2` inside its game script, so it cannot
// be reached as window.B2 from the standalone connected-world renderer.
// The original source images ARE available locally. Load exactly those
// files (one decode each, same cached browser URLs), never substitute art.
const classicFiles=Object.freeze({
  board:'642e392a9f180d575f32.webp',
  terminal:'1910741edc0ad733dfa3.webp',
  counter:'4007c9b0a59daff94429.webp',
  evidence:'656124c949796ab7fac9.webp',
  cabinet:'aeb62a8d3147f4724c61.webp',
  lockers:'f330a30836b8ab16d8e3.webp',
  desk:'b83efba068cc3a967e89.webp',
  chair:'563224c86afd608efbe0.webp',
  wallH:'172c05b4d3c69b60aff8.webp',
  bench:'545e448ac49ce80de3d7.webp',
  interview:'7da6f6234db1910de04c.webp'
});
let privateB2=null;
function b2(){
 if(window.B2)return window.B2;
 if(privateB2)return privateB2;
 const loaded=Object.create(null);
 for(const [key,file] of Object.entries(classicFiles)){
   const im=new Image();
   im.decoding='async';im.src='./assets/embedded/'+file;
   loaded[key]=im;
 }
 privateB2=loaded;return loaded;
}
const source=(key)=>({
  carpet:craft().carpet,cream:craft().cream,cool:craft().cool,wood:craft().wood,
  wall:craft().wall,interview:craft().interview,crate:craft().crate,
  visitorTable:craft().visitorTable,typing:craft().typing,
  reception:H.receptionRoom?.art,plant:H.receptionRoom?.plant,
  bench:b2().bench,changingBench:b2().bench,
  board:b2().board,terminal:b2().terminal,
  counter:b2().counter,evidence:b2().evidence,
  cabinet:b2().cabinet,lockers:b2().lockers,
  officeDesk:b2().desk,chair:b2().chair,
  interviewB2:b2().interview,wallH:b2().wallH,
  garage:garage(),clock:cinema().clock,sconce:cinema().sconce,
  workbench:cinema().workbench,sofa:H.worldFurniture?.art?.sofa
})[key];
const keys=['carpet','cream','cool','wood','wall','interview','crate',
  'visitorTable','reception','plant','bench','changingBench','garage',
  'clock','sconce','workbench','sofa','board','terminal','counter',
  'evidence','cabinet','lockers','officeDesk','chair','interviewB2','wallH'];
// One integer fingerprint is enough to rebuild the stationary room cache
// only as ORIGINAL legacy sprites decode. No per-frame texture allocation.
function assetEpoch(){
  let fingerprint=0;
  for(let i=0;i<keys.length;i++)if(ready(source(keys[i])))fingerprint+=2**i;
  if(interiorActive())fingerprint+=2**keys.length;
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
// The connected scene ALREADY has the correct user-authored concrete
// plate, two bays, north-door arrow and original collision-backed garage
// walls. Preserve it instead of overwriting it with repeated generic tiles.
// Add only the source artwork missing from the simplified world view.
function garageDetails(g,r){
 const im=source('garage');if(!ready(im))return false;
 g.save();g.imageSmoothingEnabled=false;
 // Cropped from the exact pre-existing classic 2026-10-14 garage plate.
 // This is positioned over the original already-solid service-tool
 // cabinet at (1690,670,124,38), so it is NEVER a phantom collider.
 g.drawImage(im,696,76,146,108,1690,656,124,70);
 g.restore();stats.garage++;return true;
}

function room(g,r){
  if(r.label==='GARAGE')return false; // preserve current full old garage floor
  const key=material(r),im=source(key);
  if(!ready(im))return false;
  // The original cinematic renderer already owns the finished room
  // lighting, source-art floor materials and furniture contact shadows.
  // It normally runs only in the classic station scene; explicitly call
  // its public read-only Canvas painter here in the connected station.
  // No classic scene swap, no state.map rewrite and no extra game loop.
  if(typeof H.precinctCinematic?.floor==='function'){
    try{
      g.save();g.imageSmoothingEnabled=false;
      H.precinctCinematic.floor(r,g);
      g.restore();
      label(g,r);stats.floors++;
      return true;
    }catch(e){
      g.restore();stats.missing.push('cinematic:'+r.label);
      // Keep original pixel-art tile material even if a legacy edition's
      // optional cinematic painter is incompatible with the connected view.
    }
  }
  // The ORIGINAL 64px precinct-craft material remains our safe fallback.
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
  if(window.ROOKIE_LOCKER_FURNITURE_ACTIVE&&interiorActive()){
    const banks=H.lockerAccess?.banks||[],index=banks.indexOf(f);
    if(type==='locker'&&index>=0){
      const base=f.y+f.h+2;
      wallKit().drawInteriorModule(g,index===1?'locker_open':'locker_closed',f.x,base-120,f.w,120);
      if(index===0){
        g.save();g.fillStyle='#d9ba4e';g.fillRect(f.x+f.w/2-14,base-106,28,16);
        g.fillStyle='#13253a';g.font='700 10px sans-serif';g.textAlign='center';g.fillText('7',f.x+f.w/2,base-94);g.restore();
      }stats.furniture++;return true;
    }
    const lockerRoom=H.cellblock?.map?.rooms?.find(r=>r.label==='LOCKER ROOM');
    if(type==='hcChangingBench'&&lockerRoom&&f.x>=lockerRoom.x&&f.x<lockerRoom.x+lockerRoom.w&&f.y>=lockerRoom.y&&f.y<lockerRoom.y+lockerRoom.h){
      const base=f.y+f.h;
      wallKit().drawInteriorModule(g,'changing_bench',f.x,base-44,f.w,44);
      if(f.x<1300)wallKit().drawInteriorModule(g,'locker_towels',f.x+24,base-36,20,13);
      else if(f.x<1600)wallKit().drawInteriorModule(g,'locker_bag',f.x+52,base-39,28,16);
      stats.furniture++;return true;
    }
  }
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
    // The connected world already renders the original dark-wood changing
    // benches better than the old generic blue seating sprite. Preserve it.
    return false;
  }
  if(type==='locker'||type==='board'){
    // Legacy map already paints the 16-bit original blue lockers with
    // Jay's numbered yellow Locker 7 plate, and better full-size wall
    // briefing boards. Don't replace these with weaker generic sprites.
    return false;
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
  // The room layout itself is always the original MAPS.station.furn.
  // Restore precisely the original B2 artist sprites, with the same world
  // feet and dimensions as b2FurnArt() from the classic playable game.
  // Unlike b2FurnArt(), none of these branches gate on state.map='station'.
  if(!ready(im)){
    const base=f.y+f.h+2,cx=f.x+f.w/2;
    switch(type){
      case 'board':
        im=source('board');w=84;h=84;x=cx-w/2;y=f.y+62-h;break;
      case 'locker':
        im=source('lockers');w=Math.min(Math.max(f.w,130),Math.max(60,(base-14)*1.5));
        h=w*2/3;x=cx-w/2;y=base-h;break;
      case 'cabinet':
        im=source('cabinet');w=54;h=108;x=cx-w/2;y=base-h;break;
      case 'desk':{
        const terminal=f.x===430&&f.y===56||f.x===600&&f.y===150;
        im=terminal&&ready(source('terminal'))?source('terminal'):source('officeDesk');
        w=terminal&&ready(source('terminal'))?86:Math.min(Math.max(f.w,96),150);
        h=terminal&&ready(source('terminal'))?86:w*.75;
        x=cx-w/2;y=base-h;break;
      }
      case 'shelf':
        if(f.y<300){im=source('evidence');w=f.w+8;h=Math.min(w,base-2);
          x=cx-w/2;y=base-h;}break;
      case 'counter':
      case 'reception':
        im=source('counter');w=type==='reception'?Math.max(f.w+24,180):Math.max(f.w,120);
        h=Math.min(w*.5,120,base-16);
        x=cx-w/2;y=base-h;break;
      case 'table':
        if(f.w>=120){im=source('interviewB2');w=150;h=120;
          x=cx-w/2;y=base-h;}break;
      case 'bench':
        im=source('bench');w=Math.max(f.w,110);
        h=Math.min(w*40/72,base-14);x=cx-w/2;y=base-h;break;
      case 'hcReceptionSign':
        g.save();g.fillStyle='#19364d';g.fillRect(f.x,f.y,f.w,f.h);
        g.fillStyle='#f2e6c2';g.font='bold 7px sans-serif';g.textAlign='center';
        g.fillText('PRECINCT 9 · RECEPTION',f.x+f.w/2,f.y+12);
        g.restore();stats.furniture++;return true;
    }
  }
  if(ready(im)){
    g.save();g.imageSmoothingEnabled=false;
    // The source sprite replaces its old flat vector placeholder; the
    // official furniture rectangle/collision/interaction is unchanged.
    g.drawImage(im,Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    if(type==='desk'&&ready(source('chair'))&&f.y<850&&f.x<1400)
      g.drawImage(source('chair'),Math.round(f.x+f.w/2-15),
        Math.round(f.y+f.h+1),30,40);
    g.restore();
    stats.furniture++;return true;
  }
  return false; // keep original classic vector fallback, never a blank object
}
function wallSkins(g,walls){
  // Keep the footprint in the existing station cache. The approved modular
  // faces use interiorDepthProps in the canonical actor queue below, so
  // they are never painted twice or trapped beneath every character.
  return false;
}

// The connected station already owns these walls, rooms and door plans.
// Extend this bridge's formerly disabled wall skin; do not create geometry.
const wallKit=()=>window.ROOKIE_V135_WALL_KIT;
function interiorActive(){return !!window.ROOKIE_INTERIOR_WALLS_ACTIVE&&!!wallKit()?.interiorWalls?.().loaded&&!!H.seamlessCampusV115?.isOpen()&&!H.academy?.active?.()&&!H.outbreak?.active?.();}
function scopedRoom(r){return !Array.isArray(window.ROOKIE_INTERIOR_WALL_ROOMS)||window.ROOKIE_INTERIOR_WALL_ROOMS.includes(r.label);}
function interiorFurnitureActive(f,rooms){return interiorActive()&&rooms.some(r=>scopedRoom(r)&&f.x+f.w/2>=r.x&&f.x+f.w/2<r.x+r.w&&f.y+f.h/2>=r.y&&f.y+f.h/2<r.y+r.h);}
let wallPlan=null,wallPlanSource=null;
const wallMetrics={builds:0,draws:0,faded:0};
function interiorWallPlan(walls,rooms,furn){
 if(wallPlanSource===walls)return wallPlan;
 const parts=[],decorated=new Set();
 for(const [index,w]of walls.entries()){
  if(w.h<=6)continue; // existing holding-cell bars are not opaque plaster.
  const horizontal=w.w>w.h;
  if(horizontal){
   for(let offset=0;offset<w.w;offset+=64){
    const width=Math.min(64,w.w-offset),x=w.x+offset,base=w.y+w.h;
    let module='wall_plain';
    const room=rooms.find(r=>Math.abs(base-r.y)<=20&&x+width/2>r.x+24&&x+width/2<r.x+r.w-24);
    if(room?.label==='GARAGE')module='wall_stone';
    if(room&&width===64&&!decorated.has(room.label)&&!furn.some(f=>f.type==='board'&&f.x>=room.x&&f.x<room.x+room.w&&f.y>=room.y&&f.y<room.y+room.h)){
      module=room.label==='LOBBY'||room.label==='EVIDENCE'?'wall_badge':room.label==='GARAGE'?'wall_utility':'wall_picture';decorated.add(room.label);
    }
    parts.push({id:'wall:'+index+':'+offset,module,x,y:base-48,w:width,h:48,base,physical:{x,y:w.y,w:width,h:w.h},orientation:'h'});
   }
  }else{
   const lift=48-w.w;
   for(let offset=0;offset<w.h;offset+=32){const height=Math.min(32,w.h-offset),y=w.y+offset;
    parts.push({id:'wall:'+index+':'+offset,module:'wall_vertical',x:w.x,y:y-lift,w:w.w,h:height,base:y+height,physical:{x:w.x,y,w:w.w,h:height},orientation:'v'});
   }
   const end=w.y+w.h;
   if(!walls.some(other=>other!==w&&other.w>other.h&&w.x<other.x+other.w&&w.x+w.w>other.x&&end>=other.y&&end<=other.y+other.h))
    parts.push({id:'wall:'+index+':end',module:'end_cap',x:w.x,y:end-48,w:w.w,h:48,base:end,physical:{...w},orientation:'v'});
  }
 }
 // Reuse the original door opening calculation. Only jambs are skinned;
 // no leaf/controller, collision, passage fill or replacement room is added.
 for(const door of H.precinctDoors?.doors||[]){
  const plan=H.precinctDoors.plan(door);
  for(const p of plan.parts.filter(p=>p.id.includes('jamb'))){
   const horizontal=door.axis==='h',y=horizontal?door.cy+16-48:p.y-24;
   parts.push({id:'door:'+plan.id+':'+p.id,module:horizontal?'jamb':'top_cap',x:p.x,y,w:p.w,h:horizontal?48:p.h,
    base:horizontal?door.cy+16:p.y+p.h,physical:{x:p.x,y:p.y,w:p.w,h:p.h},orientation:door.axis,door:plan.id});
  }
 }
 wallPlanSource=walls;wallPlan=parts;wallMetrics.builds++;return parts;
}
function interiorDepthProps(walls,rooms,furn,view){
 if(!interiorActive())return [];
 return interiorWallPlan(walls,rooms,furn).filter(p=>{
  const q=p.physical;
  if(!rooms.some(r=>scopedRoom(r)&&q.x<r.x+r.w+20&&q.x+q.w>r.x-20&&q.y<r.y+r.h+20&&q.y+q.h>r.y-20))return false;
  return !view||p.x+380<view.x+view.w+20&&p.x+p.w+380>view.x-20&&p.y+96<view.y+view.h+20&&p.y+p.h+96>view.y-20;
 }).map(p=>({...p,depthY:p.base+96}));
}
function drawInteriorWall(g,p,options){
 if(!interiorActive())return false;
 const r=options.room,player=options.player;
 // Use the SAME occupied-room and roof-cutaway state as the current scene.
 // Only nearby foreground sections fade; far walls retain their full height.
 const foreground=r&&options.roofAlpha<.1&&p.base>player.y&&p.base-player.y<110&&
   p.x<r.x+r.w+24&&p.x+p.w>r.x-24;
 g.save();if(foreground){g.globalAlpha*=.38;wallMetrics.faded++;}
 wallKit().drawInteriorModule(g,p.module,p.x+380,p.y+96,p.w,p.h);g.restore();wallMetrics.draws++;return true;
}

window.ROOKIE_V131_PRECINCT_BRIDGE=Object.freeze({
 version:'legacy-authored-precinct-reuse-1',worldId:'harbor-main',
 assetEpoch,material,room,garageDetails,furniture,wallSkins,
  interiorActive,interiorFurnitureActive,interiorDepthProps,drawInteriorWall,
  interiorStats:()=>({...wallMetrics,parts:wallPlan?.length||0}),
 assetStatus:()=>Object.fromEntries(keys.map(k=>[k,ready(source(k))])),
 stats:()=>({...stats}),
 source:'Original HARBOR.precinctCraft, precinctCinematic, receptionRoom, B2, EXT_IMG and __GARAGE. No new assets or world geometry.'
});
})();

/* ROOKIE: Harbor City — V115 Phase 1: living-world coordinate foundation.
 * This is an ADAPTER over the existing classic maps. It doesn't claim the
 * interiors have been physically merged yet. Zombie/Academy explicitly excluded.
 * No mutations to legacy MAPS, game physics, network behavior, save schema.
 */
(function () {
  'use strict';
  if (!window.HARBOR || !window.ROOKIE || typeof MAPS === 'undefined' || !MAPS.plaza) return;

  const OUTDOOR = Object.freeze({
    westfield:   [140, 640],
    residential: [440, 2310],
    plaza:       [3260, 710],
    northgate:   [6050, 805],
    downtown:    [2620, 2815],
    midtown:     [4510, 2690],
    eastside:    [4970, 4110],
    industrial:  [6810, 4450],
    waterfront:  [550, 4325],
    southbay:    [2930, 4915]
  });
  const INDOOR_PARENT = Object.freeze({
    station: 'plaza', store: 'midtown', cafe: 'downtown',
    municipal: 'downtown', house: 'residential', hale: 'residential',
    warehouse: 'industrial', marina: 'waterfront', shedint: 'waterfront'
  });
  const H = window.HARBOR;
  const CHUNK_SIZE = 512;
  const TILE_SIZE = 32;
  const cells = Object.create(null);
  const W = 8500, HGT = 6350;
  const zoneIds = Object.keys(OUTDOOR).filter(id => MAPS[id]);
  const indoorIds = Object.keys(INDOOR_PARENT).filter(id => MAPS[id]);
  const active = () => typeof state !== 'undefined' && state &&
    state.map !== 'training' &&
    !(H.academy && typeof H.academy.active === 'function' && H.academy.active()) &&
    !(H.academy && typeof H.academy.mode === 'function' && H.academy.mode() === 'zombie');

  function descriptor(id) {
    if (!MAPS[id] || id === 'training') return null;
    const m = MAPS[id];
    const parent = INDOOR_PARENT[id] || null;
    let origin = OUTDOOR[id];
    if (parent && OUTDOOR[parent]) {
      const base = OUTDOOR[parent];
      // Indoor positions are currently projected to their actual exterior
      // entrance, not falsely laid out 1:1: stations are much larger inside.
      const p = MAPS[parent];
      const door = (p.spots || []).find(s => s.to && s.to.map === id);
      origin = [base[0] + (door ? door.x : p.w/2), base[1] + (door ? door.y : p.h/2)];
    }
    if (!origin) return null;
    return Object.freeze({ id, name: m.name, x: origin[0], y: origin[1],
      w: m.w, h: m.h, indoor: !!m.indoor, parent,
      footprint: parent ? 'entrance-anchor-pending-rebuild' : 'native-playable-geometry',
      revision: 1, instanceId: 'harbor-main:' + id });
  }
  zoneIds.concat(indoorIds).forEach(id => { cells[id] = descriptor(id); });

  // Keep network-serializable player coordinates separate from local view state.
  // Never write to the live save format during the world migration.
  function worldPoint(mapId, x, y) {
    const d = cells[mapId];
    if (!d || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (d.indoor) return Object.freeze({ worldId: 'harbor-main', areaId: mapId,
      instanceId: d.instanceId, entryWorldX: d.x, entryWorldY: d.y,
      localX: x, localY: y, pendingInteriorPlacement: true });
    return Object.freeze({ worldId: 'harbor-main', areaId: mapId,
      instanceId: d.instanceId, x: d.x+x, y: d.y+y, localX: x, localY: y });
  }
  function playerPoint() {
    return !active() ? null : worldPoint(state.map, player.x + player.w/2, player.y + player.h/2);
  }
  function chunksAround(x, y, radius) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    radius = Math.max(0, Math.min(3, Math.trunc(radius || 1)));
    const cx = Math.floor(x/CHUNK_SIZE), cy = Math.floor(y/CHUNK_SIZE), arr=[];
    for (let iy=cy-radius; iy<=cy+radius; iy++) for (let ix=cx-radius; ix<=cx+radius; ix++) {
      if (ix >= 0 && iy >= 0 && ix*CHUNK_SIZE < W && iy*CHUNK_SIZE < HGT)
        arr.push({id:'harbor-main:'+ix+':'+iy, x: ix*CHUNK_SIZE, y:iy*CHUNK_SIZE,
          w: CHUNK_SIZE, h: CHUNK_SIZE, level:0});
    }
    return arr;
  }
  function visibleChunkIds(cameraX, cameraY, vw, vh) {
    if (![cameraX,cameraY,vw,vh].every(Number.isFinite)) return [];
    const x0=Math.floor(cameraX/CHUNK_SIZE), y0=Math.floor(cameraY/CHUNK_SIZE);
    const x1=Math.floor((cameraX+Math.max(0,vw))/CHUNK_SIZE), y1=Math.floor((cameraY+Math.max(0,vh))/CHUNK_SIZE);
    const result=[];
    for(let y=y0; y<=y1; y++) for(let x=x0; x<=x1; x++) {
      if(x>=0&&y>=0&&x*CHUNK_SIZE<W&&y*CHUNK_SIZE<HGT) result.push('harbor-main:'+x+':'+y);
    }
    return result;
  }
  // Scope gate is included in the world API so a future network session
  // can explicitly refuse to synchronize excluded Academy/Zombie sessions.
  function networkState() {
    const p=playerPoint();
    if (!p) return null;
    return {schema:1, worldId:'harbor-main', playerId:'local-preview',
      zone:p.areaId, areaInstance:p.instanceId,
      x:Number.isFinite(p.x)?p.x:null, y:Number.isFinite(p.y)?p.y:null,
      localX:p.localX, localY:p.localY, persistent:false,
      transport:'none', authoritativeServer:false};
  }

  // The live world map is drawn from the actual MAPS ground/decors/rooms,
  // never from the unrelated illustration. It is a cartographic blueprint
  // of the current playable districts while their topology is unified.
  const mapView=document.getElementById('mapView');
  const mapStage=document.getElementById('mapStage');
  const mapImg=document.getElementById('mapImg');
  const mapHint=document.querySelector('.maphint');
  const canvas = document.createElement('canvas');
  canvas.id='v115ActualWorldMap';
  canvas.width=1440; canvas.height=960;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Map showing actual playable district geometry and streets, with the player and objective plotted at local positions');
  mapStage.insertBefore(canvas, mapStage.firstChild);
  const mapctx=canvas.getContext('2d');
  const baseZoom=1;
  let showingBlueprint=true;
  function paintRect(rect, paint, x0, y0, scale) {
    if(!rect || !Number.isFinite(rect.x)||!Number.isFinite(rect.y))return;
    mapctx.fillStyle=paint;
    mapctx.fillRect(x0+rect.x*scale,y0+rect.y*scale,Math.max(1,(rect.w||6)*scale),Math.max(1,(rect.h||6)*scale));
  }
  const BACKGROUND='#0f2637', GROUND='#4e8055';
  function paintAtlas() {
    const sx=canvas.width/W, sy=canvas.height/HGT;
    const s=Math.min(sx,sy); const px=(canvas.width-W*s)/2, py=(canvas.height-HGT*s)/2;
    mapctx.clearRect(0,0,canvas.width,canvas.height);
    mapctx.fillStyle=BACKGROUND; mapctx.fillRect(0,0,canvas.width,canvas.height);
    mapctx.save(); mapctx.translate(px,py);
    mapctx.fillStyle='#15344b'; mapctx.fillRect(0,0,W*s,HGT*s);
    // Real map extents. The space between rectangles identifies areas where
    // the new connecting roads must still be designed and built.
    zoneIds.forEach(id => {
      const d=cells[id], m=MAPS[id], x=d.x*s,y=d.y*s;
      mapctx.fillStyle=GROUND;
      mapctx.fillRect(x,y,m.w*s,m.h*s);
      (m.ground||[]).forEach(g=>{
        const c=(g.c||'').toLowerCase();
        const color=/3d4148|43474e|4a4c50|road/.test(c)?'#5c626c':
          /2e6da8|water/.test(c)?'#1a7393':
          /c9cdd2|b9bec4|c2b8a4/.test(c)?'#d2c3a4':'#7aab6d';
        paintRect(g,color,x,y,s);
      });
      (m.decors||[]).forEach(v=>{
        if(!Number.isFinite(v.x)||!Number.isFinite(v.y)) return;
        const t=v.t||'';
        if(/bldg|house|shop|warehouse|extbuilding/.test(t)) {
          paintRect({x:v.x,y:v.y,w:v.w||46,h:v.h||36},'#c7a078',x,y,s);
        } else if(/tree|bigtree|palm/.test(t)) {
          mapctx.fillStyle='#1e7547'; mapctx.beginPath();
          mapctx.arc(x+v.x*s,y+v.y*s,Math.max(1,12*s),0,Math.PI*2);mapctx.fill();
        }
      });
      mapctx.strokeStyle='rgba(231,226,207,.6)'; mapctx.lineWidth=1.5;
      mapctx.strokeRect(x,y,m.w*s,m.h*s);
      const tx=x+m.w*s/2, ty=y+m.h*s/2;
      mapctx.textAlign='center';mapctx.textBaseline='middle';
      mapctx.font='700 17px Barlow Condensed,system-ui,sans-serif';
      mapctx.lineWidth=3; mapctx.strokeStyle='rgba(4,18,30,.92)';
      const label=id==='plaza'?'PRECINCT 9':id.toUpperCase();
      mapctx.strokeText(label,tx,ty); mapctx.fillStyle='#fff3cb';mapctx.fillText(label,tx,ty);
    });
    // Contextual links are dashed: walkable continuous streets haven't been
    // commissioned for the gaps. Never imply they exist in this build.
    const candidates=[['plaza','midtown'],['plaza','residential'],['plaza','northgate'],
      ['residential','westfield'],['downtown','midtown'],['midtown','eastside'],
      ['eastside','industrial'],['downtown','waterfront'],['waterfront','southbay'],
      ['southbay','industrial']];
    mapctx.lineWidth=2;mapctx.setLineDash([4,5]);mapctx.strokeStyle='rgba(248,215,143,.55)';
    candidates.forEach(pair=>{
      const a=cells[pair[0]],b=cells[pair[1]];if(!a||!b)return;
      mapctx.beginPath();mapctx.moveTo((a.x+a.w/2)*s,(a.y+a.h/2)*s);
      mapctx.lineTo((b.x+b.w/2)*s,(b.y+b.h/2)*s);mapctx.stroke();
    });
    mapctx.setLineDash([]);
    // Central precinct has a physically too-small exterior roof. The studio
    // must rebuild it to contain the full 1:1 interior; show a warning inset.
    const precinct=cells.plaza;
    if(precinct){mapctx.fillStyle='rgba(250,201,112,.95)';mapctx.font='600 12px Barlow,system-ui,sans-serif';mapctx.textAlign='left';
      mapctx.fillText('PRECINCT INTERIOR: FULL-SCALE REBUILD PENDING',precinct.x*s,Math.max(12,precinct.y*s-12));}
    mapctx.restore();
  }
  function mapPos(mapId, x, y) {
    const d=cells[mapId];if(!d)return null;
    // Indoor state is anchored at the physical exterior entrance until
    // the precinct shell is rebuilt at matching scale.
    const wx=d.indoor?d.x:d.x+x, wy=d.indoor?d.y:d.y+y;
    const scale=Math.min(canvas.width/W,canvas.height/HGT);
    const px=(canvas.width-W*scale)/2, py=(canvas.height-HGT*scale)/2;
    return {x:(px+wx*scale)/canvas.width*100, y:(py+wy*scale)/canvas.height*100};
  }
  function refreshMarkers() {
    const mark=(id,pos)=>{
      const el=document.getElementById(id);if(!el)return;
      if(!pos){el.style.display='none';return;}
      el.style.display='';el.style.left=pos.x+'%';el.style.top=pos.y+'%';
    };
    mark('mapYou',mapPos(state.map,player.x+player.w/2,player.y+player.h/2));
    mark('mapCar',state.inCar?null:mapPos(car.map,car.x,car.y));
    const target=typeof currentTargetId==='function'?targetDest(currentTargetId()):null;
    mark('mapDest',target?mapPos(target.map,
      (MAPS[target.map]&&MAPS[target.map].spots.find(s=>s.id===target.spot)||{}).x||MAPS[target.map].w/2,
      (MAPS[target.map]&&MAPS[target.map].spots.find(s=>s.id===target.spot)||{}).y||MAPS[target.map].h/2):null);
  }
  const originalOpenMap=openMap;
  function showMap() {
    if(!active()) return originalOpenMap.apply(this,arguments);
    originalOpenMap.apply(this,arguments);
    showingBlueprint=true;
    applyView();
    setMapZoom(baseZoom);
    const p=mapPos(state.map,player.x+player.w/2,player.y+player.h/2);
    if(p)centerMapOn(p.x,p.y);
    return true;
  }
  function applyView(){
    mapOverlay.classList.toggle('v115-atlas-view',showingBlueprint);
    if(mapHint)mapHint.textContent=showingBlueprint?
      'Actual district geometry and street footprints · dotted links still need seamless construction · pinch or swipe to pan, +/− zoom.':
      'Original illustrated city concept — not yet geographically matched to the playable world.';
    mapImg.style.display=showingBlueprint?'none':'';
    canvas.style.display=showingBlueprint?'block':'none';
    if(showingBlueprint){paintAtlas();refreshMarkers();}
  }
  const toggle=document.createElement('button');toggle.type='button';
  toggle.id='v115MapMode';toggle.textContent='ILLUSTRATION';
  toggle.setAttribute('aria-label','Toggle between actual playable districts and illustrative concept map');
  const tools=document.querySelector('#mapOverlay .maptools');
  if(tools) tools.appendChild(toggle);
  toggle.addEventListener('click',()=>{
    showingBlueprint=!showingBlueprint;
    toggle.textContent=showingBlueprint?'ILLUSTRATION':'ACTUAL MAP';
    if (!showingBlueprint) originalOpenMap();
    applyView();
    if(showingBlueprint){setMapZoom(1);}
  });
  // Existing map controls resolve openMap from the current global binding.
  openMap=showMap;
  window.ROOKIE.openMap=showMap;
  // Don't modify any legacy mini-game or Academy world-map behavior.
  H.worldV115=Object.freeze({
    version:'115-phase1-atlas',worldId:'harbor-main',chunkSize:CHUNK_SIZE,tileSize:TILE_SIZE,
    dimensions:Object.freeze({w:W,h:HGT}),
    rooms:()=>indoorIds.map(id=>cells[id]),
    areas:()=>zoneIds.map(id=>cells[id]),
    area:(id)=>cells[id]||null,
    toWorld:worldPoint,
    playerPoint,
    nearbyChunks:chunksAround,
    visibleChunkIds,
    networkState,
    allowed:active,
    paintAtlas,
    previewNotes:Object.freeze([
      'This phase establishes deterministic coordinate metadata and a truthful blueprint, not full seamless traversal.',
      'Existing interiors are entrance anchors; their physical 1:1 footprints must be reconstructed.',
      'Separated districts still require chunk-stitched streets; dotted lines are not playable roads.',
      'Zombie Outbreak and Academy modes are excluded from the world registry.'
    ])
  });
})();
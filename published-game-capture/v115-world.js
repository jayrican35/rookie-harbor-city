/* ROOKIE: Harbor City — V115 Phase 1: living-world coordinate foundation.
 * This is an ADAPTER over the existing classic maps. It doesn't claim the
 * interiors have been physically merged yet. Zombie/Academy explicitly excluded.
 * No mutations to legacy MAPS, game physics, network behavior, save schema.
 */
(function () {
  'use strict';
  if (!window.HARBOR || !window.ROOKIE || typeof MAPS === 'undefined' || !MAPS.plaza) return;

  const OUTDOOR = Object.freeze({
    westfield:   [-3100, 1260],
    residential: [-1500, 1260],
    plaza:       [148, 600],
    northgate:   [5086, 183],
    downtown:    [5056, 1283],
    midtown:     [2800, 1260],
    eastside:    [6556, 1260],
    industrial:  [8156, 1003],
    waterfront:  [4400, 3220],
    southbay:    [2800, 3220]
  });
  // V115 Phase 3B: canonical topological road plan. Both the atlas and the
  // connected scene consume these same world-space road segments and nodes.
  // All positions are absolute world units; no map swaps or screen loads.
  const STREET_NETWORK = Object.freeze({
    version:'115-phase3b-roads-1',worldId:'harbor-main',
    primary:Object.freeze({id:'harbor-avenue',name:'Harbor Avenue',centerY:1784,laneWidth:127}),
    segments:Object.freeze([
      {id:'harbor-ave-west',x:-3100,y:1721,w:3250,h:127,kind:'arterial'},
      {id:'harbor-ave-east',x:2068,y:1721,w:733,h:127,kind:'arterial'},
      // Bypass the preserved Maple Court houses along the empty eastern edge.
      {id:'maple-to-southbay',x:8,y:1800,w:144,h:1958,kind:'collector'},
      {id:'south-connector',x:-650,y:3680,w:3450,h:128,kind:'collector'},
      // Obsolete isolated Midtown dead-end replaced by the real Bayview feeder below.
      {id:'northgate-downtown',x:5751,y:945,w:156,h:352,kind:'collector'},
      {id:'downtown-waterfront',x:5751,y:2230,w:156,h:990,kind:'collector'},
      // Join both existing Midtown north stubs to Northgate's lower avenue.
      {id:'midtown-north-collector',x:4192,y:870,w:895,h:156,kind:'collector',newRoad:true},
      {id:'midtown-north-west',x:4192,y:1025,w:168,h:236,kind:'collector',newRoad:true},
      {id:'midtown-north-east',x:4848,y:1025,w:168,h:236,kind:'collector',newRoad:true},
      {id:'northgate-lower-avenue',x:5086,y:870,w:1600,h:156,kind:'collector',newRoad:true,underNative:true},
      {id:'bayview-link',x:4388,y:3680,w:55,h:128,kind:'collector'},
      // Harbor Avenue: a single actual asphalt corridor west -> precinct ->
      // Midtown -> Downtown -> Industrial. Existing district road tiles win.
      {id:'harbor-precinct-link',x:149,y:1721,w:1920,h:127,kind:'arterial',newRoad:true},
      {id:'harbor-east-through',x:2800,y:1721,w:6856,h:127,kind:'arterial',newRoad:true,underNative:true},
      // Western ring: follow Westfield's EXISTING southern exit lane,
      // continue through currently empty connected-world coordinates, and
      // join Maple's existing Southbay collector with a true junction.
      {id:'westfield-native-spine',x:-1927,y:1847,w:156,h:513,kind:'collector',newRoad:true,underNative:true},
      {id:'westfield-south-extension',x:-1927,y:2359,w:156,h:1385,kind:'collector',newRoad:true},
      {id:'westfield-south-connector',x:-1927,y:3680,w:1278,h:128,kind:'collector',newRoad:true},
      // Southbay's horizontal road is already authored at y=3681..3807.
      // Logical graph edge only: NEVER paint duplicate asphalt on finished art.
      {id:'southbay-loop',x:2800,y:3680,w:1589,h:128,kind:'collector',newRoad:true,underNative:true},
      // Source map inspection: Midtown's REAL lower avenue is at world
      // y=2476..2604 and its east spine at world x=4848..5016.
      {id:'midtown-east-spine',x:4848,y:1847,w:168,h:758,kind:'collector',newRoad:true,underNative:true},
      {id:'midtown-lower-avenue',x:2800,y:2476,w:2256,h:128,kind:'collector',newRoad:true,underNative:true},
      // This NEW clear southbound feeder runs west of Midtown's new deli
      // block, meeting Southbay's *actual* east entrance x=3973..4129.
      {id:'midtown-south',x:3973,y:2603,w:156,h:618,kind:'collector',newRoad:true,corrected:true},
      {id:'bayview-native-east-spine',x:3973,y:3220,w:156,h:462,kind:'collector',newRoad:true,underNative:true},
      // The Northgate and Downtown native roads already meet. Register their
      // through-line as topology; don't cover the original storefront paving.
      {id:'northgate-through-link',x:5751,y:1296,w:156,h:935,kind:'collector',newRoad:true,underNative:true}
    ].map(r=>Object.freeze(r))),
    // Road boundary points are pedestrian crossings and future AI graph nodes;
    // NOT teleports, mission triggers, or server-owned gameplay logic.
    crossings:Object.freeze([
      {id:'westfield-residential',x:-1500,y:1784,axis:'h',type:'district-seam'},
      {id:'residential-precinct',x:0,y:1784,axis:'h',type:'district-seam'},
      {id:'precinct-midtown',x:2800,y:1784,axis:'h',type:'district-seam'},
      {id:'midtown-downtown',x:5056,y:1784,axis:'h',type:'district-seam'},
      {id:'downtown-eastside',x:6556,y:1784,axis:'h',type:'district-seam'},
      {id:'eastside-industrial',x:8156,y:1784,axis:'h',type:'district-seam'},
      {id:'maple-arterial',x:80,y:1784,axis:'h',type:'intersection'},
      {id:'maple-south-road',x:80,y:3744,axis:'h',type:'intersection'},
      {id:'midtown-north-west-junction',x:4276,y:948,axis:'h',type:'intersection'},
      {id:'midtown-north-east-junction',x:4932,y:948,axis:'h',type:'intersection'},
      {id:'northgate-downtown',x:5829,y:1283,axis:'v',type:'intersection'},
      {id:'downtown-waterfront',x:5829,y:2283,axis:'v',type:'intersection'},
      {id:'southbay-waterfront',x:4400,y:3744,axis:'v',type:'district-seam'},
      {id:'midtown-harbor-junction',x:4932,y:1784,axis:'h',type:'intersection'},
      {id:'midtown-lower-junction',x:4050,y:2540,axis:'h',type:'intersection'},
      {id:'midtown-southbay-junction',x:4050,y:3744,axis:'h',type:'intersection'},
      {id:'westfield-south-junction',x:-1850,y:3744,axis:'h',type:'intersection'},
      {id:'northgate-harbor-junction',x:5829,y:1784,axis:'h',type:'intersection'}
    ].map(r=>Object.freeze(r))),
    landmarks:Object.freeze([
      {id:'precinct',label:'PRECINCT 9',x:948,y:1160},
      {id:'midtown',label:'MIDTOWN',x:3940,y:1760},
      {id:'downtown',label:'DOWNTOWN',x:5830,y:1780},
      {id:'waterfront',label:'WATERFRONT',x:5080,y:3810}
    ].map(r=>Object.freeze(r)))
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
  const MIN_X=-3100, W = 9656, HGT = 4680;
  const zoneIds = Object.keys(OUTDOOR).filter(id => MAPS[id]);
  const indoorIds = Object.keys(INDOOR_PARENT).filter(id => MAPS[id]);
  const active = () => typeof state !== 'undefined' && state &&
    state.map !== 'training' &&
    !(H.academy && typeof H.academy.active === 'function' && H.academy.active());

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
      origin = id==='station' ? [380,96] :
        [base[0] + (door ? door.x : p.w/2), base[1] + (door ? door.y : p.h/2)];
    }
    if (!origin) return null;
    return Object.freeze({ id, name: m.name, x: origin[0], y: origin[1],
      w: m.w, h: m.h, indoor: !!m.indoor, parent,
      footprint: id==='station'?'physical-1:1-precinct-campus' : parent ? 'entrance-anchor-pending-rebuild' : 'native-playable-geometry',
      revision: 1, instanceId: 'harbor-main:' + id });
  }
  zoneIds.concat(indoorIds).forEach(id => { cells[id] = descriptor(id); });

  // Keep network-serializable player coordinates separate from local view state.
  // Never write to the live save format during the world migration.
  function worldPoint(mapId, x, y) {
    const d = cells[mapId];
    if (!d || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (d.indoor && mapId!=='station') return Object.freeze({ worldId: 'harbor-main', areaId: mapId,
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
      if (ix*CHUNK_SIZE >= MIN_X && iy >= 0 && ix*CHUNK_SIZE < W && iy*CHUNK_SIZE < HGT)
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
      if(x*CHUNK_SIZE>=MIN_X&&y>=0&&x*CHUNK_SIZE<W&&y*CHUNK_SIZE<HGT) result.push('harbor-main:'+x+':'+y);
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
    const sx=canvas.width/(W-MIN_X), sy=canvas.height/HGT;
    const s=Math.min(sx,sy); const px=(canvas.width-(W-MIN_X)*s)/2, py=(canvas.height-HGT*s)/2;
    mapctx.clearRect(0,0,canvas.width,canvas.height);
    mapctx.fillStyle=BACKGROUND; mapctx.fillRect(0,0,canvas.width,canvas.height);
    mapctx.save(); mapctx.translate(px-MIN_X*s,py);
    mapctx.fillStyle='#15344b'; mapctx.fillRect(MIN_X*s,0,(W-MIN_X)*s,HGT*s);
    // Shared coordinate art, drawn beneath original district geometry.
    const reference=window.ROOKIE_V115_REFERENCE;
    if(reference){mapctx.save();mapctx.scale(s,s);reference.atlasTerrain(mapctx,{zoom:s});mapctx.restore();}
    const premium=window.ROOKIE_V115_PREMIUM;
    if(premium){mapctx.save();mapctx.scale(s,s);premium.atlasTerrain(mapctx,{zoom:s});mapctx.restore();}
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
      if(reference){mapctx.save();mapctx.scale(s,s);reference.atlasBlocks(mapctx,{zoom:s,districts:[{...d,map:m}]});mapctx.restore();}
      mapctx.strokeStyle='rgba(231,226,207,.6)'; mapctx.lineWidth=1.5;
      mapctx.strokeRect(x,y,m.w*s,m.h*s);
      const tx=x+m.w*s/2, ty=y+m.h*s/2;
      mapctx.textAlign='center';mapctx.textBaseline='middle';
      mapctx.font='700 17px Barlow Condensed,system-ui,sans-serif';
      mapctx.lineWidth=3; mapctx.strokeStyle='rgba(4,18,30,.92)';
      const label=id==='plaza'?'PRECINCT 9':id.toUpperCase();
      mapctx.strokeText(label,tx,ty); mapctx.fillStyle='#fff3cb';mapctx.fillText(label,tx,ty);
    });
    // Streets and connecting footpaths are real walkable coordinates in the
    // V115 connected-world preview, not imaginary district links.
    // Draw the authored network after districts so road connections stay
    // visible in the overview even when district ground paintings overlap.
    mapctx.fillStyle='rgba(102,119,132,.93)';
    STREET_NETWORK.segments.forEach(r=>mapctx.fillRect(r.x*s,r.y*s,Math.max(1,r.w*s),Math.max(1,r.h*s)));
    mapctx.strokeStyle='rgba(236,213,142,.9)';mapctx.lineWidth=1.3;
    STREET_NETWORK.crossings.forEach(c=>{
      const half=c.type==='intersection'?12:7;
      mapctx.beginPath();
      if(c.axis==='h'){mapctx.moveTo((c.x-half)*s,c.y*s);mapctx.lineTo((c.x+half)*s,c.y*s);}
      else {mapctx.moveTo(c.x*s,(c.y-half)*s);mapctx.lineTo(c.x*s,(c.y+half)*s);}
      mapctx.stroke();
    });
    // This is the actual 1:1 station envelope, not the old 640px exterior.
    const station=cells.station;
    if(station && MAPS.station){
      mapctx.fillStyle='rgba(13,36,60,.83)';
      mapctx.fillRect(station.x*s,station.y*s,MAPS.station.w*s,MAPS.station.h*s);
      (MAPS.station.rooms||[]).forEach(r=>{
        mapctx.fillStyle=r.fill||'#8fa4b9';
        mapctx.fillRect((station.x+r.x)*s,(station.y+r.y)*s,
          Math.max(1,(r.w-4)*s),Math.max(1,(r.h-4)*s));
      });
      mapctx.fillStyle='#ffe3a1';mapctx.font='800 16px Barlow Condensed,system-ui,sans-serif';mapctx.textAlign='center';
      mapctx.fillText('PRECINCT 9',(station.x+MAPS.station.w/2)*s,(station.y+MAPS.station.h*.52)*s);
    }
    // Landmarks use the same world coordinates as the playable canvas.
    if(reference){mapctx.save();mapctx.scale(s,s);reference.atlasLandmarks(mapctx,{zoom:s});mapctx.restore();}
    if(premium){mapctx.save();mapctx.scale(s,s);
      premium.atlasOverlay(mapctx,{zoom:s,districts:zoneIds.map(id=>({...cells[id],map:MAPS[id]}))});
      mapctx.restore();}
    mapctx.restore();
  }
  function mapPos(mapId, x, y) {
    const d=cells[mapId];if(!d)return null;
    // Indoor state is anchored at the physical exterior entrance until
    // the precinct shell is rebuilt at matching scale.
    const wx=d.indoor&&mapId!=='station'?d.x:d.x+x,
      wy=d.indoor&&mapId!=='station'?d.y:d.y+y;
    const scale=Math.min(canvas.width/(W-MIN_X),canvas.height/HGT);
    const px=(canvas.width-(W-MIN_X)*scale)/2, py=(canvas.height-HGT*scale)/2;
    return {x:(px+(wx-MIN_X)*scale)/canvas.width*100, y:(py+wy*scale)/canvas.height*100};
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
      'Connected precinct, Harbor Avenue, all nine outdoor districts and roads. Other buildings still need interior reconstruction · pinch / swipe to pan.':
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
    version:'115-phase3-connected-district-atlas',worldId:'harbor-main',chunkSize:CHUNK_SIZE,tileSize:TILE_SIZE,
    dimensions:Object.freeze({minX:MIN_X,w:W-MIN_X,h:HGT}),
    rooms:()=>indoorIds.map(id=>cells[id]),
    areas:()=>zoneIds.map(id=>cells[id]),
    area:(id)=>cells[id]||null,
    roadNetwork:()=>STREET_NETWORK,
    toWorld:worldPoint,
    playerPoint,
    nearbyChunks:chunksAround,
    visibleChunkIds,
    networkState,
    allowed:active,
    paintAtlas,
    previewNotes:Object.freeze([
      'The V115 connected-city prototype supports continuous walking in outdoor areas and into Precinct 9.',
      'Campaign missions, car driving, NPC schedules and most interiors still run in the original game.',
      'Zombie Outbreak and Academy modes are excluded from the world registry.'
    ])
  });
})();

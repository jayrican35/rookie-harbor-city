/* ROOKIE V115 — Seamless Precinct Campus, Phase 2 construction preview.
 * Purpose: physically contiguous 1:1 station rooms, grounds and street with
 * one simulation, one camera, and no screen/map swap at entrance thresholds.
 * This is an isolated walkable prototype; missions/vehicles are NOT migrated.
 * Never mutates MAPS, state, car, saves, Academy or Zombie Outbreak.
 */
(function () {
  'use strict';
  if (!window.HARBOR || !window.HARBOR.worldV115 ||
      typeof MAPS === 'undefined' || !MAPS.station || !MAPS.plaza ||
      !document.querySelector('#mapOverlay .maptools')) return;
  const H=window.HARBOR, ST=MAPS.station, PL=MAPS.plaza;
  const WORLD_ID='harbor-main', AREA_ID='precinct-campus-v115';
  const MIN_X=-3100, MIN_Y=0, W=9656,HGT=4680, TILE=32, CHUNK=512;
  // A single authored city graph, derived from the original district MAPS.
  // East/west main-street edges share the same world y=1784. Nothing swaps
  // MAPS or game-state on crossing a neighborhood boundary.
  const DISTRICT_ORIGINS=Object.freeze({
    westfield:{x:-3100,y:1260},residential:{x:-1500,y:1260},
    midtown:{x:2800,y:1260},downtown:{x:5056,y:1283},
    eastside:{x:6556,y:1260},industrial:{x:8156,y:1003},
    northgate:{x:5086,y:183},southbay:{x:2800,y:3220},waterfront:{x:4400,y:3220}
  });
  const districtEntries=Object.entries(DISTRICT_ORIGINS).filter(([id])=>MAPS[id]).map(([id,pos])=>({
    id,x:pos.x,y:pos.y,w:MAPS[id].w,h:MAPS[id].h,map:MAPS[id],
    instanceId:'harbor-main:district:'+id
  }));
  function inDistrict(d,x,y){return x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h;}
  function districtAt(x,y){
    for(const d of districtEntries)if(inDistrict(d,x,y))return d;
    return null;
  }
  // The atlas and walkable city now use the same authored road plan.
  const roadNetwork=H.worldV115.roadNetwork();
  if(roadNetwork.worldId!==WORLD_ID || roadNetwork.primary.centerY!==1784)
    throw new Error('Connected-road coordinate contract mismatch');
  const links=roadNetwork.segments;
  const crossings=roadNetwork.crossings;
  const linkCollision = []; // Roads are traversable, never scene exits.
  const districtSolids=[];
  for(const d of districtEntries){
    const solids = d.map.pedSolids || d.map.solids || [];
    for(const b of solids){
      if(!b||!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(b.w)||!Number.isFinite(b.h))continue;
      if(b.w<=0||b.h<=0)continue;
      districtSolids.push({x:d.x+b.x,y:d.y+b.y,w:b.w,h:b.h,id:d.id});
    }
  }
  const STX=380, STY=96, PLX=148, PLY=600;
  const FRONT={x:STX+568,y:STY+1028}, GARAGE={x:STX+1538,y:STY+1160};
  const rect=(r,ox,oy)=>({x:r.x+ox,y:r.y+oy,w:r.w,h:r.h});
  const roomRects=ST.rooms.map(r=>rect(r,STX,STY));
  const walls=ST.walls.map(r=>rect(r,STX,STY));
  const furniture=ST.furn.filter(f=>f.solid).map(f=>rect(f,STX,STY));
  const northEastVoid={x:STX+1558,y:STY+12,w:366,h:636};
  const collision=walls.concat(furniture,[northEastVoid]);
  const worldSpots=ST.spots.filter(s=>s.id!=='stationDoor'&&s.id!=='garageDoor')
    .map(s=>({id:'station:'+s.id,areaId:'station',x:STX+s.x,y:STY+s.y,label:s.label}));
  worldSpots.push({id:'campus:front',areaId:'precinct-campus',x:FRONT.x,y:FRONT.y+54,label:'Precinct 9 front entrance'},
    {id:'campus:garage',areaId:'precinct-campus',x:GARAGE.x,y:GARAGE.y+60,label:'Precinct garage door'},
    {id:'campus:road',areaId:'precinct-campus',x:948,y:1738,label:'Harbor Avenue — connects through city districts'});
  const npcActors=ST.npcs.map((n,i)=>({id:'station-npc:'+i,name:n.name,color:n.color,hat:n.hat,x:n.x+STX,y:n.y+STY}));
  npcActors.push({id:'campus-npc:diaz',name:'OFCR. DIAZ',color:'#44557a',hat:true,x:PLX+960,y:PLY+640});
  for(const d of districtEntries){
    for(const sp of d.map.spots||[]){
      if(sp.to||!Number.isFinite(sp.x)||!Number.isFinite(sp.y))continue;
      worldSpots.push({id:d.id+':'+sp.id,areaId:d.id,x:d.x+sp.x,y:d.y+sp.y,label:sp.label||sp.id});
    }
    for(const [i,n] of (d.map.npcs||[]).entries()){
      npcActors.push({id:d.id+':npc:'+i,name:n.name,color:n.color,hat:n.hat,x:d.x+n.x,y:d.y+n.y});
    }
  }
  let marinaActorsAdded=false;
  function attachMarinaActors(){
    const marina=window.ROOKIE_V116_MARINA;
    if(!marina||marinaActorsAdded)return;
    for(const a of marina.actors)npcActors.push(a);
    for(const sp of marina.interactions)worldSpots.push(sp);
    marinaActorsAdded=true;
  }
  const idOf=(x,y)=>WORLD_ID+':'+Math.floor(x/CHUNK)+':'+Math.floor(y/CHUNK);
  function chunkAt(x,y){return {id:idOf(x,y),x:Math.floor(x/CHUNK)*CHUNK,y:Math.floor(y/CHUNK)*CHUNK,w:CHUNK,h:CHUNK};}
  function chunkWindow(x,y,viewW,viewH){
    const arr=[];const x0=Math.max(Math.floor(MIN_X/CHUNK),Math.floor(x/CHUNK)),y0=Math.max(0,Math.floor(y/CHUNK));
    const x1=Math.min(Math.floor((W-1)/CHUNK),Math.floor((x+Math.max(0,viewW))/CHUNK));
    const y1=Math.min(Math.floor((HGT-1)/CHUNK),Math.floor((y+Math.max(0,viewH))/CHUNK));
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)arr.push(WORLD_ID+':'+cx+':'+cy);
    return arr;
  }
  function circleHitsRect(x,y,radius,b){
    const px=Math.max(b.x,Math.min(b.x+b.w,x)),py=Math.max(b.y,Math.min(b.y+b.h,y));
    return (x-px)*(x-px)+(y-py)*(y-py) < radius*radius;
  }
  function blocked(x,y,r=12){
    if(x<MIN_X+r||y<MIN_Y+r||x>W-r||y>HGT-r)return true;
    // Outside the precinct, preserve each district's original solid geometry.
    // Never let a hidden exterior district building block the rebuilt station.
    if(!districtAt(x,y)){
      for(let i=0;i<collision.length;i++)if(circleHitsRect(x,y,r,collision[i]))return true;
    } else {
      for(let i=0;i<districtSolids.length;i++){
        const b=districtSolids[i];
        if(window.ROOKIE_V116_MARINA?.ownsSolid?.(b))continue;
        if(circleHitsRect(x,y,r,b))return true;
      }
    }
    // V116 only adds solid coastal structures/water, never replaces legacy solids.
    const marina=window.ROOKIE_V116_MARINA;
    if(marina&&marina.blocksProp(x,y,r))return true;
    // Citywide coastline uses the SAME player collider. No walking on newly
    // extended water just outside the original marina material rectangle.
    if(window.ROOKIE_V127_CITY?.waterBlocked(x,y))return true;
    // The blank northeast corner of the irregular station footprint is not
    // usable interior. Existing station west/east/south wall gaps stay real.
    return false;
  }
  function interiorRoom(x,y){
    for(let i=0;i<roomRects.length;i++){
      const r=roomRects[i];if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)return ST.rooms[i].label;
    }
    return null;
  }
  const campus={open:false,x:FRONT.x,y:FRONT.y+86,dir:'up',stride:0,moved:false,speed:0,
    camX:0,camY:0,zoom:1.15,autoZoom:true,follow:true,keys:new Set(),stick:null,runHeld:false,frame:0,last:0,
    paintCosts:[],paintCount:0,near:null,firstPaint:true,doorCrossings:0,previousRoom:null,visibleChunks:[]};
  const modal=document.createElement('section');modal.id='v115Campus';modal.hidden=true;
  modal.setAttribute('aria-label','V115 seamless precinct and grounds development preview');
  modal.innerHTML=`<canvas id="v115CampusCanvas" aria-label="Continuous 1:1 Precinct 9 interior, grounds and streets"></canvas>
    <header class="v115-campus-header"><div class="v115-campus-brand">HARBOR CITY <span>CONNECTED STREETS · V115 ROAD PASS</span></div>
    <button type="button" id="v115CampusExit">Return to game</button></header>
    <div class="v115-campus-hud"><strong id="v115CampusRegion">Precinct Grounds</strong>
    <small id="v115CampusCoords">Single continuous world · no loading screens</small></div>
    <div class="v115-campus-tools"><button id="v115CampusZoomOut" aria-label="Zoom out">−</button>
      <button id="v115CampusOverview" aria-label="Toggle full campus overview">ALL</button>
      <button id="v115CampusZoomIn" aria-label="Zoom in">+</button></div>
    <div class="v115-campus-note" id="v115CampusNote">Continuous roads now share one topology with the city map. Driveable lanes, traffic and missions still need integration.</div>
    <div class="v115-campus-pad" id="v115CampusPad" aria-label="Floating movement joystick zone" role="button" tabindex="0">
      <div id="v125CampusBase" aria-hidden="true"><div id="v115CampusKnob"></div></div></div>
    <button id="v125CampusSprint" type="button" aria-label="Hold to run">RUN</button>
    <button id="v115CampusInteract" class="v115-campus-interact" type="button">Action</button>
    <footer class="v115-campus-footer">Continuous city streets · joystick / WASD · all districts one canvas · game saves unchanged</footer>`;
  document.body.appendChild(modal);
  const cv=modal.querySelector('canvas'),g=cv.getContext('2d',{alpha:false});
  const btn=document.createElement('button');btn.id='v115CampusLaunch';btn.type='button';
  btn.textContent='EXPLORE CONNECTED HARBOR CITY';btn.title='Walk inside and outside one continuous precinct world (experimental preview)';
  document.querySelector('#mapOverlay .maptools').appendChild(btn);
  let tw=960,th=640,dpr=1,oldCtx=null,cache=null,cacheValid=false,roofCanvas=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function pickZoom(z){campus.autoZoom=false;campus.zoom=clamp(z,.024,2.5);campus.follow=campus.zoom>.09;}
  function clearInput(){window.ROOKIE_JAY?.reset();campus.speed=0;campus.keys.clear();campus.stick=null;campus.runHeld=false;modal.querySelector('#v115CampusKnob').style.transform='translate(-50%,-50%)';modal.querySelector('#v125CampusBase').classList.remove('active');modal.querySelector('#v125CampusSprint').classList.remove('held');}
  function resize(){
    if(!campus.open)return;
    const r=cv.getBoundingClientRect();dpr=Math.min(1.5,window.devicePixelRatio||1);
    const wasLandscape=tw>th;
    tw=Math.max(320,Math.round(r.width));th=Math.max(280,Math.round(r.height));
    if(wasLandscape!==(tw>th)&&campus.autoZoom&&window.ROOKIE_V116_MARINA?.inMarina(campus.x,campus.y)){campus.zoom=tw>th?clamp(tw/1688,.5,1.1):.85;campus.firstPaint=true;}
    cv.width=Math.round(tw*dpr);cv.height=Math.round(th*dpr);
    g.setTransform(dpr,0,0,dpr,0,0);g.imageSmoothingEnabled=false;
    if(campus.firstPaint){campus.camX=campus.x-tw/(2*campus.zoom);campus.camY=campus.y-th/(2*campus.zoom);campus.firstPaint=false;}
  }
  function withOriginalContext(other,fn){
    if(typeof ctx==='undefined')return fn();
    const prior=ctx;ctx=other;try{return fn();}finally{ctx=prior;}
  }
  // Cache the original precinct room geometry at native resolution. Drawing
  // may use original game floor/furniture painters, but never alters them.
  function stationTexture(){
    if(cacheValid&&cache)return cache;
    const off=document.createElement('canvas');off.width=ST.w;off.height=ST.h;
    const c=off.getContext('2d');c.imageSmoothingEnabled=false;
    c.fillStyle='#253953';c.fillRect(0,0,ST.w,ST.h);
    try{
      withOriginalContext(c,()=>{
        ST.rooms.forEach(r=>drawRoom(r));
        ST.furn.forEach(f=>drawFurn(f));
      });
    }catch(e){
      // Fail visible rather than aborting the preview if a late painter is
      // incompatible with an offscreen canvas.
      c.fillStyle='#b7c3d1';ST.rooms.forEach(r=>{c.fillRect(r.x,r.y,r.w,r.h);});
    }
    c.fillStyle='rgba(10,25,44,.36)';ST.walls.forEach(r=>c.fillRect(r.x+2,r.y+7,r.w,r.h));
    c.fillStyle='#13263d';ST.walls.forEach(r=>c.fillRect(r.x,r.y,r.w,r.h));
    cache=off;cacheValid=true;return off;
  }
  function cameraFollow(dt){
    const zw=tw/campus.zoom,zh=th/campus.zoom;
    if(campus.follow){
      const wantedX=campus.x-zw/2,wantedY=campus.y-zh/2;
      const ease=1-Math.exp(-9*Math.max(.001,dt));
      campus.camX+=(wantedX-campus.camX)*ease;campus.camY+=(wantedY-campus.camY)*ease;
    }
    campus.camX=zw>=W-MIN_X?MIN_X+(W-MIN_X-zw)/2:clamp(campus.camX,MIN_X,W-zw);
    campus.camY=zh>=HGT-MIN_Y?MIN_Y+(HGT-MIN_Y-zh)/2:clamp(campus.camY,MIN_Y,HGT-zh);
  }
  function direction(){
    let dx=0,dy=0;
    const k=campus.keys;
    if(k.has('arrowleft')||k.has('a'))dx--;
    if(k.has('arrowright')||k.has('d'))dx++;
    if(k.has('arrowup')||k.has('w'))dy--;
    if(k.has('arrowdown')||k.has('s'))dy++;
    if(campus.stick){dx=campus.stick.x;dy=campus.stick.y;}
    const n=Math.hypot(dx,dy);if(n>1){dx/=n;dy/=n;}
    return {dx,dy};
  }
  function simulate(dt){
    attachMarinaActors();
    const marina=window.ROOKIE_V116_MARINA;
    if(marina)marina.stepNPCs(dt);
    let {dx,dy}=direction();
    const shared=window.ROOKIE_JAY,run=!!shared?.requestRun()||!!(campus.runHeld&&shared?.eligible());
    if(Math.hypot(dx,dy)<.08){dx=0;dy=0;}
    const motion=shared?shared.advanceSpeed(campus.speed||0,(dx||dy)?(run?325:210):0,dt):{speed:210,distance:clamp(dt,0,.05)*210};
    campus.speed=motion.speed;const step=motion.distance;
    const ox=campus.x,oy=campus.y,r=12;
    const ax=Math.abs(dx),ay=Math.abs(dy),vertical=campus.dir==='up'||campus.dir==='down';
    if(dx||dy){if(ay>ax*1.15||(ay>=ax/1.15&&vertical))campus.dir=dy<0?'up':'down';else campus.dir=dx<0?'left':'right';}
    if(!blocked(campus.x+dx*step,campus.y,r))campus.x+=dx*step;
    if(!blocked(campus.x,campus.y+dy*step,r))campus.y+=dy*step;
    const dist=Math.hypot(campus.x-ox,campus.y-oy);
    campus.moved=dist>.04;if(campus.moved){campus.stride+=dist*.055;dialogue.hidden=true;}
    if(shared?.eligible())shared.update('connected-jay',{x:campus.x,y:campus.y,dir:campus.dir,map:WORLD_ID,run},dt);
    marina?.updateInteriors?.({x:campus.x,y:campus.y},dt);
    const nowRoom=interiorRoom(campus.x,campus.y);
    if((campus.previousRoom===null)!==(nowRoom===null))campus.doorCrossings++;
    campus.previousRoom=nowRoom;
    return nowRoom;
  }
  function drawGrass(){
    // V127: same Southbay pixel-tile materials across the entire 1:1 world,
    // rendered before native roads, districts, buildings and interior layers.
    const city=window.ROOKIE_V127_CITY;
    if(city){city.base(g,{view:{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom},zoom:campus.zoom});return;}
    g.fillStyle='#608d56';g.fillRect(MIN_X,MIN_Y,W-MIN_X,HGT-MIN_Y);
    const x0=Math.max(MIN_X,Math.floor(campus.camX/48)*48),x1=Math.min(W,campus.camX+tw/campus.zoom+60);
    const y0=Math.max(0,Math.floor(campus.camY/48)*48),y1=Math.min(HGT,campus.camY+th/campus.zoom+60);
    for(let x=x0;x<x1;x+=48)for(let y=y0;y<y1;y+=48){
      const h=((x*73856093)^(y*19349663))>>>0;
      g.fillStyle=h%3===0?'rgba(172,207,104,.22)':'rgba(14,58,38,.09)';
      g.fillRect(x+(h%23),y+((h>>5)%23),4,4);
    }
  }
  function drawCampusGround(){
    drawGrass();
    g.save();g.translate(PLX,PLY);
    for(const v of PL.ground){
      const city=window.ROOKIE_V127_CITY;
      if(city)city.surface(g,{x:v.x,y:v.y,w:v.w,h:v.h},city.colorKind(v.c),
        {x:campus.camX-PLX,y:campus.camY-PLY,w:tw/campus.zoom,h:th/campus.zoom});
      else{g.fillStyle=v.c;g.fillRect(v.x,v.y,v.w,v.h);}
    }
    if(PL.dashes){g.fillStyle='rgba(246,208,98,.62)';for(let x=PL.dashes.from;x<PL.dashes.to;x+=52)g.fillRect(x,PL.dashes.at-2,28,4);}
    g.restore();
    // Physical promenade from a full-size precinct front door to the avenue.
    g.fillStyle='#b4bfc1';g.fillRect(FRONT.x-60,FRONT.y,120,650);
    g.fillStyle='#d6c6a7';g.fillRect(FRONT.x-41,FRONT.y,82,650);
    g.fillStyle='rgba(255,255,255,.30)';for(let y=FRONT.y+20;y<1650;y+=36)g.fillRect(FRONT.x-41,y,82,2);
    // The rebuilt building now has room for its entire 1,936-unit interior.
    // The old 640x448 building and its unrelated garage are NOT rendered.
    g.fillStyle='#535960';g.fillRect(2325,1280,380,378);
    g.fillStyle='#bbc2c5';for(let i=0;i<5;i++)g.fillRect(2337+i*70,1280,60,364);
    g.fillStyle='#d2b77c';g.fillRect(2345,1267,312,16);
    g.fillStyle='#c9d5d9';g.fillRect(STX-15,STY+1027,1180,28);
  }
  function drawDecorFallback(d){
    g.save();g.translate(PLX+d.x,PLY+d.y);
    if(d.t==='crosswalk'){g.fillStyle='#ddd8c2';for(let i=5;i<(d.w||88);i+=18)g.fillRect(i,0,9,d.h||90);}
    else if(d.t==='sign'){g.fillStyle='#17273e';g.fillRect(-3,-13,7,25);g.fillStyle='#d8b45c';g.fillRect(-49,-40,98,28);g.fillStyle='#142a41';g.font='bold 12px sans-serif';g.textAlign='center';g.fillText(d.text||'PRECINCT',0,-21);}
    else if(d.t==='flowerbed'){g.fillStyle='#31583c';g.fillRect(0,0,d.w||60,d.h||13);g.fillStyle='#e6a36a';for(let i=8;i<(d.w||60);i+=15)g.fillRect(i,4,4,5);}
    else if(d.t==='extgate'){g.fillStyle='#c6d5c9';g.fillRect(0,0,45,7);}
    else if(d.t==='gate'){g.fillStyle='#223d52';g.fillRect(0,0,92,22);}
    else if(d.t==='planter'){g.fillStyle='#8f684d';g.fillRect(-11,-10,22,16);g.fillStyle='#2d7c46';g.fillRect(-15,-19,30,14);}
    else if(d.t==='lamp'){g.fillStyle='#182d3c';g.fillRect(-3,-42,6,42);g.fillStyle='#f8df9a';g.fillRect(-8,-44,16,10);}
    else if(d.t==='tree'||d.t==='bigtree'||d.t==='palm'){drawTree(0,0,25);}
    g.restore();
  }
  function drawTree(x,y,r){
    const premium=window.ROOKIE_V127_CITY?.spriteImage?.('tree');
    if(premium){g.save();g.imageSmoothingEnabled=false;
      g.drawImage(premium,x-r*1.7,y-r*2.4,r*3.4,r*3.15);g.restore();return;}
    g.fillStyle='#695141';g.fillRect(x-5,y+4,10,30);
    g.fillStyle='#214d39';g.beginPath();g.arc(x,y,r+3,0,7);g.fill();
    g.fillStyle='#5da754';g.beginPath();g.arc(x-4,y-5,r,0,7);g.fill();
    g.fillStyle='rgba(194,226,96,.45)';g.beginPath();g.arc(x-10,y-11,r*.35,0,7);g.fill();
  }
  // Same authored world space as precinct. Unlike the legacy side exits,
  // every region below is rendered without changing state.map or the canvas.
  function nearViewport(x,y,w,h){
    return x+w>campus.camX-80 && x<campus.camX+tw/campus.zoom+80 &&
      y+h>campus.camY-80 && y<campus.camY+th/campus.zoom+80;
  }
  function roadRect(r){
    // Draw at world coordinates. Slightly textured gutters and edge lights
    // bridge imported tileset seams without repainting existing buildings.
    const horizontal=r.w>r.h;
    if(window.ROOKIE_V127_CITY)window.ROOKIE_V127_CITY.road(g,r,{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom});
    else {g.fillStyle='#3e4852';g.fillRect(r.x,r.y,r.w,r.h);}
    g.fillStyle='#717c83';
    if(horizontal){
      g.fillRect(r.x,r.y, r.w,4);g.fillRect(r.x,r.y+r.h-4,r.w,4);
      g.fillStyle='#c0bdaf';g.fillRect(r.x,r.y-16,r.w,15);g.fillRect(r.x,r.y+r.h+1,r.w,15);
      g.fillStyle='#d6b879';
      for(let x=r.x+20;x<r.x+r.w-20;x+=76)g.fillRect(x,r.y+r.h/2-2,33,4);
    }else{
      g.fillRect(r.x,r.y,4,r.h);g.fillRect(r.x+r.w-4,r.y,4,r.h);
      g.fillStyle='#c0bdaf';g.fillRect(r.x-16,r.y,15,r.h);g.fillRect(r.x+r.w+1,r.y,15,r.h);
      g.fillStyle='#d6b879';
      for(let y=r.y+20;y<r.y+r.h-20;y+=76)g.fillRect(r.x+r.w/2-2,y,4,33);
    }
  }
  function drawCrossing(c){
    // Readable curb-to-curb zebra crossings at real street intersections,
    // hidden at distant zoom to avoid an aliased citywide overview.
    if(campus.zoom<.18 || !nearViewport(c.x-85,c.y-85,170,170))return;
    const width=c.type==='intersection'?45:31;
    const lane=roadNetwork.primary.laneWidth;
    g.fillStyle='rgba(245,239,218,.83)';
    if(c.axis==='h'){
      const y=c.y-lane/2+10;
      for(let i=-width/2;i<width/2;i+=12)g.fillRect(c.x+i,y,7,lane-20);
      g.fillStyle='rgba(244,208,115,.65)';
      g.fillRect(c.x-width/2-8,y-6,width+16,3);
      g.fillRect(c.x-width/2-8,y+lane-15,width+16,3);
    }else{
      const x=c.x-lane/2+10;
      for(let i=-width/2;i<width/2;i+=12)g.fillRect(x,c.y+i,lane-20,7);
    }
  }
  function districtGround(d){
    const m=d.map,city=window.ROOKIE_V127_CITY;
    if(city)city.districtGround(g,d,{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom});
    else{
      g.fillStyle=m.base||'#7c9a67';g.fillRect(d.x,d.y,m.w,m.h);
      g.save();g.translate(d.x,d.y);
      for(const r of m.ground||[]){g.fillStyle=r.c||'#c2b8a4';g.fillRect(r.x,r.y,r.w,r.h);}
      g.restore();
    }
    g.save();g.translate(d.x,d.y);
    if(m.dashes){const a=m.dashes;g.fillStyle='rgba(237,219,153,.65)';
      if(a.axis==='h')for(let x=a.from;x<a.to;x+=58)g.fillRect(x,a.at-2,30,4);
      else for(let y=a.from;y<a.to;y+=58)g.fillRect(a.at-2,y,4,30);
    }
    g.restore();
  }
  const districtImages=new Map();
  function sprite(name){
    // Original Midtown decor IDs are abbreviated; use actual recovered WebP names.
    const names={conv:'convenience_store',cafe:'cafe',suds:'laundromat',
      pharm:'pharmacy',pizza:'pizza_shop',garage:'repair_garage',motel:'motel'};
    const filename=names[name]||name, key='midtown/'+filename;
    if(!districtImages.has(key)){
      const img=new Image();img.decoding='async';img.src='./assets/midtown/'+filename+'.webp';
      districtImages.set(key,img);
    }
    const im=districtImages.get(key);return im.complete&&im.naturalWidth>0?im:null;
  }
  function districtTree(x,y,r){
    const key='landscape-v1/tree';
    if(!districtImages.has(key)){
      const img=new Image();img.decoding='async';img.src='./assets/landscape-v1/tree.webp';
      districtImages.set(key,img);
    }
    const tree=districtImages.get(key);
    if(tree.complete&&tree.naturalWidth>0){g.drawImage(tree,x-r*1.25,y-r*2.25,r*2.5,r*2.7);}
    else drawTree(x,y,r);
  }
  function paintedBuilding(d,districtId){
    const bx=d.t==='mtbldg'?(d.bx||d.x):(d.x||0),
      by=d.t==='mtbldg'?(d.btop||d.y):(d.y||0),
      bw=d.t==='mtbldg'?(d.bw||d.w):(d.w||200),
      bh=d.t==='mtbldg'?(d.bh||d.h):(d.h||155);
    if(!Number.isFinite(bx)||!Number.isFinite(by)||!Number.isFinite(bw)||!Number.isFinite(bh))return;
    /* District visibility was already tested in world space by the caller. */
    if(d.t==='mtbldg'&&d.img){const im=sprite(d.img);
      if(im){g.drawImage(im,bx,by,bw,bh);return;}}
    // Prefer recovered original storefront sprites; a richer painted fallback
    // is used only when the source sprite is unavailable in this preview.
    if(window.ROOKIE_V115_SHOWCASE &&
       window.ROOKIE_V115_SHOWCASE.buildingFallback(g,d,campus.zoom))return;
    // V127: source sprite first; new shared architecture in place of older
    // simple color rectangles, with exactly the original wall footprint.
    if(window.ROOKIE_V127_CITY?.building(g,{x:bx,y:by,w:bw,h:bh,kind:d.t,district:districtId},campus.zoom))return;
    const roof=d.roof||'#615a55',wall=d.c||'#c1a98e';
    g.fillStyle='rgba(12,25,37,.27)';g.fillRect(bx+8,by+9,bw,bh);
    g.fillStyle=wall;g.fillRect(bx,by+18,bw,Math.max(20,bh-18));
    g.fillStyle=roof;g.fillRect(bx-6,by,bw+12,Math.max(14,bh*.70));
    g.fillStyle='rgba(255,255,255,.13)';g.fillRect(bx,by+4,bw,6);
    g.fillStyle='rgba(18,34,55,.5)';g.fillRect(bx+18,by+Math.max(25,bh*.7),Math.max(18,bw-36),Math.max(4,bh*.18));
    if(campus.zoom>.27){g.font='700 18px Barlow Condensed,sans-serif';g.textAlign='center';
      g.fillStyle='#fff2c3';g.fillText(String(d.name||d.label||'HARBOR CITY').slice(0,32),bx+bw/2,by+bh-8);}
  }
  const OVERVIEW_SHORT_NAMES=Object.freeze({
    westfield:'WEST',residential:'MAPLE',midtown:'MIDTOWN',
    downtown:'DOWNTOWN',eastside:'EAST',industrial:'INDUST.',
    northgate:'NORTH',southbay:'SOUTH',waterfront:'MARINA'
  });
  function overviewDistrictLabel(d){
    // At citywide zoom, full-size street sprites become visual static. Use
    // readable, abbreviated neighborhood placards in fixed SCREEN pixel sizes.
    const z=campus.zoom,fs=8.8/z,txt=OVERVIEW_SHORT_NAMES[d.id]||d.id.toUpperCase();
    const x=d.x+d.w/2,y=d.y+d.h*(d.id==='downtown'||d.id==='westfield'?.77:.26);
    const maxW=d.w-36,estimated=txt.length*fs*.57;
    const bw=Math.min(estimated+12/z,maxW),bh=15/z;
    g.save();
    g.fillStyle='rgba(10,33,51,.91)';g.fillRect(x-bw/2,y-bh/2,bw,bh);
    g.strokeStyle='rgba(239,210,140,.77)';g.lineWidth=1.1/z;
    g.strokeRect(x-bw/2,y-bh/2,bw,bh);
    g.font='800 '+fs+'px Barlow Condensed,system-ui,sans-serif';
    g.fillStyle='#fff0c2';g.textAlign='center';g.textBaseline='middle';
    g.fillText(txt,x,y,Math.max(15,maxW-8/z));
    g.restore();
  }
  function districtDecor(d){
    if(campus.zoom<.10){overviewDistrictLabel(d);return;}
    g.save();g.translate(d.x,d.y);
    for(const o of d.map.decors||[]){
      const x=o.x||0,y=o.y||0;
      if(!nearViewport(d.x+x-130,d.y+y-170,(o.w||240)+260,(o.h||200)+260))continue;
      if(['bldg','house','shed','lighthouse','mtbldg'].includes(o.t)){if(!window.ROOKIE_V116_MARINA?.ownsSolid?.({x:d.x+x,y:d.y+y,w:o.w,h:o.h}))paintedBuilding(o,d.id);continue;}
      // Native world decoration sprites now depth-sort with Jay, not underfoot.
      if(window.ROOKIE_V127_CITY?.handlesDecor(o))continue;
      if(o.t==='tree'||o.t==='bigtree'||o.t==='palm'){districtTree(x,y,o.t==='bigtree'?38:26);continue;}
      if(o.t==='lamp'){g.fillStyle='#1b3b50';g.fillRect(x-3,y-35,6,36);g.fillStyle='#f4df97';g.fillRect(x-8,y-40,16,10);continue;}
      if(o.t==='sign'||o.t==='gate'){g.fillStyle='#2a4458';g.fillRect(x-36,y-22,110,28);g.fillStyle='#fff0c3';g.font='700 15px Barlow Condensed,sans-serif';g.textAlign='left';g.fillText(String(o.text||d.id).slice(0,20),x-32,y-4);continue;}
      if(o.t==='bench'){g.fillStyle='#886443';g.fillRect(x,y,o.w||88,10);g.fillRect(x+5,y+10,5,10);continue;}
      if(o.t==='car'){g.fillStyle=o.c||'#587aa1';g.fillRect(x,y,o.w||70,o.h||36);g.fillStyle='#b8d2e3';g.fillRect(x+8,y+8,Math.min(24,(o.w||60)-12),10);continue;}
      if(o.t==='mtprop'||o.t==='rpgProp'){if(o.img==='shade'||o.img==='palm'||o.role==='shade')districtTree(x,y,27);continue;}
      if(o.t==='mailbox'){g.fillStyle='#28476b';g.fillRect(x-8,y-14,16,16);continue;}
      if(o.t==='fountain'){g.fillStyle='#70b9cc';g.beginPath();g.arc(x,y,35,0,Math.PI*2);g.fill();}
    }
    if(campus.zoom>.25&&!(d.id==='waterfront'&&window.ROOKIE_V116_MARINA?.active())){g.font='800 28px Barlow Condensed,sans-serif';g.textAlign='center';
      g.fillStyle='#fff0b5';g.fillText(d.map.name,d.w/2,46);}
    g.restore();
  }
  function drawLinkedDistricts(t){
    // Connected asphalt first; native streets, buildings and natural ground
    // retain their material quality. Crossings seal visibly disjoint seams.
    for(const link of links)if(nearViewport(link.x,link.y,link.w,link.h))roadRect(link);
    for(const d of districtEntries)if(nearViewport(d.x,d.y,d.w,d.h))districtGround(d);
    // V127 extends waterfront-quality pavement, landscaping materials and
    // shoreline across the native regions, without a new scene or map switch.
    const city=window.ROOKIE_V127_CITY;
    if(city){const view={x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom};
      city.walkways(g,{view,zoom:campus.zoom});
      city.coastline(g,{view,zoom:campus.zoom});
    }
    for(const c of crossings)drawCrossing(c);
    const ref=window.ROOKIE_V115_REFERENCE;
    if(ref)ref.gameBlocks(g,{zoom:campus.zoom,view:{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom},districts:districtEntries});
    for(const d of districtEntries)if(nearViewport(d.x,d.y,d.w,d.h))districtDecor(d);
  }

  function drawOutdoorDecor(){
    for(const d of PL.decors){
      if(d.ext==='precinct'||d.ext==='garage'||d.t==='extcar'||d.t==='shed')continue;
      // Existing small-precinct art was designed inside the much larger
      // corrected station footprint. Keep scenery only outside that shell.
      const x=PLX+d.x,y=PLY+d.y;
      if(x>STX-45&&x<STX+ST.w+35&&y>STY-30&&y<STY+ST.h+15)continue;
      if(x<campus.camX-150||x>campus.camX+tw/campus.zoom+150||y<campus.camY-150||y>campus.camY+th/campus.zoom+150)continue;
      drawDecorFallback(d);
    }
    // Scaled landscape composition along the expanded precinct promenade.
    for(const [x,y,r] of [[440,1310,31],[530,1530,28],[1450,1480,35],[1730,1510,36],[2140,1538,38],[2470,1140,29]])drawTree(x,y,r);
    for(const [x,y] of [[690,1325],[1260,1315],[1950,1310]]){
      g.fillStyle='#203e49';g.fillRect(x-4,y-34,8,38);g.fillStyle='#fbe0a0';g.fillRect(x-9,y-37,18,10);
    }
    g.fillStyle='rgba(21,36,55,.58)';g.fillRect(580,1448,345,32);
    g.fillStyle='#fff4c2';g.font='bold 21px Barlow Condensed,sans-serif';g.fillText('PRECINCT 9 · COMMUNITY WALK',591,1470);
  }
  function roofAlpha(){
    const room=interiorRoom(campus.x,campus.y);
    if(room)return .04;
    const dx=Math.abs(campus.x-FRONT.x),dy=Math.abs(campus.y-FRONT.y);
    if(dx<130&&dy<155)return clamp((dy-30)/180,.12,.94);
    const gd=Math.hypot(campus.x-GARAGE.x,campus.y-(GARAGE.y+30));
    if(gd<175)return clamp((gd-22)/180,.12,.94);
    return .95;
  }
  function drawStation(){
    if(!nearViewport(STX-20,STY-20,ST.w+40,ST.h+60))return;
    const image=stationTexture();
    g.drawImage(image,STX,STY);
    // Foyer, double-wide front entrance and garage threshold share exact world coordinates.
    g.fillStyle='#efcc82';g.fillRect(FRONT.x-34,FRONT.y-5,68,10);
    g.fillStyle='#e4c27e';g.fillRect(GARAGE.x-172,GARAGE.y-3,344,9);
    const alpha=roofAlpha();
    if(alpha>.10){
      g.save();g.globalAlpha=alpha;
      g.fillStyle='#253c57';g.fillRect(STX+8,STY+8,1140,1023);
      g.fillStyle='#314d70';g.fillRect(STX+1158,STY+652,754,504);
      g.fillStyle='#455e7c';for(let yy=STY+27;yy<STY+1005;yy+=76)g.fillRect(STX+24,yy,1110,5);
      g.fillStyle='#748ea9';g.fillRect(STX+300,STY+725,365,124);
      g.fillStyle='#f0d28b';g.font='bold 62px Barlow Condensed,sans-serif';g.textAlign='center';g.fillText('PRECINCT 9',STX+565,STY+535);
      g.font='bold 24px Barlow Condensed,sans-serif';g.fillText('HARBOR CITY POLICE',STX+565,STY+575);
      g.font='bold 28px Barlow Condensed,sans-serif';g.fillText('GARAGE',STX+1538,STY+910);
      // Always show the true entrance as an open passage, not a new scene load.
      // Roof rectangle ends at the exterior threshold; keep the canvas opaque.
      g.restore();
    }
    g.save();g.strokeStyle='rgba(255,225,142,.7)';g.lineWidth=3;
    g.strokeRect(STX+4,STY+4,1146,1020);
    g.strokeRect(STX+1159,STY+652,759,505);
    g.restore();
  }
  function drawOfficer(p,isPlayer,t){
    const shared=window.ROOKIE_JAY;
    if(isPlayer)shared?.control?.('v117ConnectedRun',!!shared.eligible());
    if(isPlayer&&shared?.eligible()){
      // V119 connected-marina-only step accents and subtle sprite bob.
      // The existing shared Jay animation, pose, timing and physical feet remain authoritative.
      const marinaMotion=window.ROOKIE_V119_MOTION;
      const inMarina=!!(marinaMotion&&window.ROOKIE_V116_MARINA?.inMarina(p.x,p.y));
      const movement={x:p.x,y:p.y,dir:campus.dir,moving:campus.moved,distance:campus.stride/.055,run:campus.speed>235};
      if(inMarina)marinaMotion.footsteps(g,movement,t);
      g.save();
      if(inMarina)g.translate(0,-marinaMotion.characterBob(movement,t));
      shared.draw(g,'connected-jay',{x:p.x,y:p.y,dir:campus.dir,map:WORLD_ID});
      g.restore();
      // V126: no artificial golden selection halo under the playable character.
      return;
    }
    const marina=window.ROOKIE_V116_MARINA;
    if(isPlayer&&marina&&marina.inMarina(p.x,p.y)){
      marina.drawNpc(g,{x:p.x,y:p.y,npcStyle:0,phase:0,moving:campus.moved,dir:campus.dir,distance:campus.stride/.055},t);
      // V126: retain grounded sprite shadow, never a golden ring.
      return;
    }
    g.save();g.translate(p.x,p.y);
    g.fillStyle='rgba(6,15,24,.35)';g.beginPath();g.ellipse(0,7,16,6,0,0,7);g.fill();
    g.fillStyle=p.color||'#254a77';g.fillRect(-9,-20,18,25);
    g.fillStyle='#e5b889';g.fillRect(-7,-29,14,13);
    g.fillStyle='#172a4d';g.fillRect(-9,-32,18,6);
    g.fillStyle='#294c7d';g.fillRect(-14,-15,5,14);g.fillRect(9,-15,5,14);
    if(isPlayer&&campus.moved){
      const stride=Math.sin(campus.stride)*3;g.fillStyle='#152438';g.fillRect(-8,5+stride,6,12);g.fillRect(3,5-stride,6,12);
    } else {g.fillStyle='#152438';g.fillRect(-8,5,6,12);g.fillRect(2,5,6,12);}
    g.restore();
    if(isPlayer){
      // Only the small distance-zoom label remains; no character selection ring.
      if(campus.zoom<.11){g.font='800 '+Math.min(280,10/campus.zoom)+'px Barlow Condensed,sans-serif';g.textAlign='center';g.fillStyle='#ffdc86';g.fillText('YOU',p.x,p.y-30);}
    }
    else if(campus.zoom>.54){g.fillStyle='#faf0cb';g.font='bold 13px Barlow Condensed,sans-serif';g.textAlign='center';g.fillText(p.name,p.x,p.y-39);}
  }
  function drawEntityHighlights(t){
    const view={x:campus.camX-50,y:campus.camY-60,w:tw/campus.zoom+100,h:th/campus.zoom+120};
    function visible(e){return e.x>view.x&&e.x<view.x+view.w&&e.y>view.y&&e.y<view.y+view.h;}
    const marina=window.ROOKIE_V116_MARINA;
    // One depth queue: existing actors and new furnishing geometry share it.
    const entries=npcActors.filter(npc=>visible(npc)&&(!marina?.interiorActorVisible||marina.interiorActorVisible(npc))).map(npc=>({y:npc.y,actor:npc}));
    if(marina?.interiorFurniture)for(const f of marina.interiorFurniture(view))entries.push({y:f.y+f.h,furniture:f});
    // V122: native marina piling bases join the SAME y-sorted draw queue as
    // Jay, ambient NPCs and interior furniture. This gives genuine occlusion:
    // an actor behind a piling is covered; in front of it, the actor covers it.
    if(marina?.active()&&marina.pierOccluders)
      for(const post of marina.pierOccluders(view))entries.push({y:post.depthY,pierPost:post});
    // V124 all structural silhouettes use the same sorted actor queue:
    // lamp behind player when Jay's feet are south of its base, roof behind
    // Jay outside the frontage, and only truly rear props occlude the player.
    if(marina?.active()&&marina.depthProps)
      for(const prop of marina.depthProps(view))entries.push({y:prop.depthY,depthProp:prop});
    if(window.ROOKIE_V127_CITY){
      for(const prop of window.ROOKIE_V127_CITY.depthProps(view,districtEntries))
        entries.push({y:prop.depthY,cityProp:prop});
    }
    entries.push({y:campus.y,player:true});entries.sort((a,b)=>a.y-b.y);
    for(const entry of entries){
      if(entry.cityProp){window.ROOKIE_V127_CITY.drawDepthProp(g,entry.cityProp);continue;}
      if(entry.depthProp){
        marina.drawDepthProp(g,entry.depthProp,{zoom:campus.zoom,view,player:{x:campus.x,y:campus.y}},t);continue;
      }
      if(entry.pierPost){marina.drawPierPost(g,entry.pierPost);continue;}
      if(entry.player){drawOfficer({x:campus.x,y:campus.y,color:'#2b467a'},true,t);continue;}
      if(entry.furniture){marina.drawInteriorFurniture(g,entry.furniture);continue;}
      const npc=entry.actor;
      if(marina&&(npc.npcStyle!==undefined||marina.inMarina(npc.x,npc.y))){if(marina.active())marina.drawNpc(g,npc.npcStyle!==undefined?npc:{...npc,npcStyle:1},t);}
      else drawOfficer(npc,false,t);
    }
    campus.near=null;let best=58;
    for(const sp of worldSpots){
      if(marina?.interactionAvailable&&!marina.interactionAvailable(sp,campus.x,campus.y))continue;
      const d=Math.hypot(sp.x-campus.x,sp.y-campus.y);
      if(d<best){best=d;campus.near=sp;}
      if(sp.building||!visible(sp)||campus.zoom<.38)continue;
      g.strokeStyle='rgba(234,193,88,.62)';g.lineWidth=2;g.beginPath();g.arc(sp.x,sp.y,8+2*Math.sin(t/410),0,7);g.stroke();
    }
  }
  function paint(t,dt){
    const paintStart=typeof performance!=='undefined'?performance.now():null;
    cameraFollow(dt);
    const viewW=tw/campus.zoom,viewH=th/campus.zoom;
    campus.visibleChunks=chunkWindow(campus.camX,campus.camY,viewW,viewH);
    g.save();g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#172e48';g.fillRect(0,0,tw,th);
    g.scale(campus.zoom,campus.zoom);g.translate(-campus.camX,-campus.camY);
    // The same canvas and camera always draw both the campus and interior.
    // Visual presentation hooks are optional and must never change gameplay.
    // They receive a read-only view rectangle and the drawing context only.
    const art=window.ROOKIE_V115_SHOWCASE;
    const view={x:campus.camX,y:campus.camY,w:viewW,h:viewH};
    drawCampusGround();
    if(art)art.ground(g,{zoom:campus.zoom,view},t);
    const pilot=window.ROOKIE_V115_PRECINCT_PILOT;
    if(pilot)pilot.ground(g,{zoom:campus.zoom,view},t);
    const reference=window.ROOKIE_V115_REFERENCE;
    if(reference)reference.terrain(g,{zoom:campus.zoom,view},t);
    const premium=window.ROOKIE_V115_PREMIUM;
    if(premium)premium.terrain(g,{zoom:campus.zoom,view},t);
    drawLinkedDistricts(t);
    if(reference)reference.gameOverlay(g,{zoom:campus.zoom,view,districts:districtEntries},t);
    if(premium)premium.overlay(g,{zoom:campus.zoom,view,districts:districtEntries},t);
    if(art)art.streets(g,{zoom:campus.zoom,view},t);
    drawOutdoorDecor();
    const marina=window.ROOKIE_V116_MARINA;
    if(marina)marina.background(g,{zoom:campus.zoom,view},t);
    // V118 optional camera-culled light/shadow pass; no gameplay state changes.
    const cinematic=window.ROOKIE_V118_CINEMATIC;
    if(cinematic)cinematic.ground(g,{zoom:campus.zoom,view},t);
    if(pilot)pilot.props(g,{zoom:campus.zoom,view},t);
    drawStation();
    if(art)art.precinct(g,{zoom:campus.zoom,view,STX,STY,alpha:roofAlpha()},t);
    drawEntityHighlights(t);
    if(marina)marina.foreground(g,{zoom:campus.zoom,view,player:{x:campus.x,y:campus.y}},t);
    if(cinematic)cinematic.atmosphere(g,{zoom:campus.zoom,view},t);
    if(pilot)pilot.animated(g,{zoom:campus.zoom,view},t);
    if(art)art.atmosphere(g,{zoom:campus.zoom,view},t);
    g.restore();
    const region=interiorRoom(campus.x,campus.y);
    const district=districtAt(campus.x,campus.y);
    const desc=region ? 'PRECINCT 9 · '+region : district ? district.map.name : campus.y>1640?'HARBOR CITY · CONNECTED AVENUES':'PRECINCT 9 · GROUNDS';
    modal.querySelector('#v115CampusRegion').textContent=desc;
    modal.querySelector('#v115CampusCoords').textContent='World '+Math.round(campus.x)+', '+Math.round(campus.y)+'  · '+idOf(campus.x,campus.y)+'  · '+Math.round(campus.zoom*100)+'%';
    if(window.ROOKIE_V116_HUD)window.ROOKIE_V116_HUD.paint({x:campus.x,y:campus.y},t);
    const act=modal.querySelector('#v115CampusInteract');
    const near=campus.near,actor=near&&marina?.actors?.some(a=>a.id===near.id);
    const caption=near?(actor?'Talk':'Inspect'):'Action';
    if(act.textContent!==caption)act.textContent=caption;
    if(act.disabled===!!near)act.disabled=!near;
    if(paintStart!==null){campus.paintCount++;campus.paintCosts.push(performance.now()-paintStart);if(campus.paintCosts.length>180)campus.paintCosts.shift();}
  }
  function loop(timestamp){
    if(!campus.open)return;
    const dt=campus.last?clamp((timestamp-campus.last)/1000,0,.05):1/60;campus.last=timestamp;
    if(!document.hidden){if(!window.ROOKIE_V116_HUD?.blocked())simulate(dt);paint(timestamp,dt);}
    campus.frame=requestAnimationFrame(loop);
  }
  function open(){
    if(campus.open)return;
    // Explicitly exclude the separated combat/Academy experience.
    if((typeof state!=='undefined' && state && state.map==='training') ||
       (H.academy&&typeof H.academy.active==='function'&&H.academy.active()) ||
       (H.outbreak&&typeof H.outbreak.active==='function'&&H.outbreak.active()))return;
    // Enter at the player's existing world-space location when available.
    // This is read-only; the real player's map and saves are not rewritten.
    if(typeof player!=='undefined' && player && typeof state!=='undefined' && state &&
       (state.map==='station'||state.map==='plaza')){
      const ox=state.map==='station'?STX:PLX,oy=state.map==='station'?STY:PLY;
      const x=ox+player.x+player.w/2,y=oy+player.y+player.h/2;
      if(!blocked(x,y)){campus.x=x;campus.y=y;}
      else {campus.x=FRONT.x;campus.y=FRONT.y+86;}
    }
    closeMap();
    campus.open=true;campus.firstPaint=true;campus.previousRoom=interiorRoom(campus.x,campus.y);
    modal.hidden=false;document.body.classList.add('v115-campus-open');
    if(window.ROOKIE_V116_MARINA)document.body.classList.add('v116-play-mode');
    clearInput();campus.last=0;resize();campus.frame=requestAnimationFrame(loop);
  }
  function close(){
    if(!campus.open)return;campus.open=false;cancelAnimationFrame(campus.frame);clearInput();
    window.ROOKIE_V116_HUD?.close();
    modal.hidden=true;document.body.classList.remove('v115-campus-open','v116-play-mode');
  }
  btn.addEventListener('click',open);
  modal.querySelector('#v115CampusExit').addEventListener('click',close);
  modal.querySelector('#v115CampusZoomOut').addEventListener('click',()=>pickZoom(campus.zoom/1.3));
  modal.querySelector('#v115CampusZoomIn').addEventListener('click',()=>pickZoom(campus.zoom*1.3));
  modal.querySelector('#v115CampusOverview').addEventListener('click',()=>{
    const fit=Math.min(tw/(W-MIN_X),th/(HGT-MIN_Y))*.96;
    if(campus.zoom<.09){pickZoom(1.15);campus.follow=true;}
    else {pickZoom(Math.min(tw/(W-MIN_X),th/(HGT-MIN_Y))*.96);campus.follow=false;campus.camX=(MIN_X+W-tw/campus.zoom)/2;campus.camY=(HGT-th/campus.zoom)/2;}
  });
  modal.querySelector('#v115CampusInteract').addEventListener('click',()=>{
    const sp=campus.near;
    const marina=window.ROOKIE_V116_MARINA;
    if(sp&&marina&&sp.id.startsWith('v116:')){
      const dialogue=modal.querySelector('#v116Dialogue');
      if(dialogue){dialogue.hidden=false;dialogue.textContent=sp.text||sp.label;}
      return;
    }
    modal.querySelector('#v115CampusNote').textContent=sp?
      sp.label+' · This is a continuous-world geometry preview. Story interactions still run in the main game.':
      'Move near a door or precinct marker to inspect its world position. No mission progress changes here.';
  });
  const dialogue=document.createElement('output');dialogue.id='v116Dialogue';
  dialogue.hidden=true;dialogue.setAttribute('aria-live','polite');modal.appendChild(dialogue);
  // V125: retain the existing campus.stick movement vector. Only the touch
  // origin moves inside the lower-left pad; no second joystick/input loop.
  const pad=modal.querySelector('#v115CampusPad'),knob=modal.querySelector('#v115CampusKnob');
  const base=modal.querySelector('#v125CampusBase'),sprint=modal.querySelector('#v125CampusSprint');
  let pointer=null,stickOrigin=null,sprintPointer=null;
  const changeStick=e=>{
    if(!stickOrigin)return;
    let dx=(e.clientX-stickOrigin.x)/46,dy=(e.clientY-stickOrigin.y)/46;
    const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
    if(Math.hypot(dx,dy)<.13){dx=0;dy=0;}
    campus.stick={x:dx,y:dy};
    knob.style.transform='translate(calc(-50% + '+Math.round(dx*38)+'px),calc(-50% + '+Math.round(dy*38)+'px))';
  };
  const release=e=>{
    if(e&&e.pointerId!==pointer)return;
    pointer=null;stickOrigin=null;campus.stick=null;knob.style.transform='translate(-50%,-50%)';
    base.classList.remove('active');
  };
  pad.addEventListener('pointerdown',e=>{
    if(pointer!==null||window.ROOKIE_V116_HUD?.blocked())return;
    e.preventDefault();e.stopPropagation();pointer=e.pointerId;
    pad.setPointerCapture?.(pointer);
    const r=pad.getBoundingClientRect();
    const localX=Math.max(53,Math.min(r.width-53,e.clientX-r.left));
    const localY=Math.max(53,Math.min(r.height-53,e.clientY-r.top));
    stickOrigin={x:r.left+localX,y:r.top+localY};
    base.style.left=localX+'px';base.style.top=localY+'px';base.classList.add('active');
    changeStick(e);
  });
  pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();changeStick(e);}});
  pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);
  pad.addEventListener('lostpointercapture',release);
  sprint.addEventListener('pointerdown',e=>{
    if(sprintPointer!==null||window.ROOKIE_V116_HUD?.blocked())return;
    e.preventDefault();e.stopPropagation();sprintPointer=e.pointerId;
    sprint.setPointerCapture?.(sprintPointer);campus.runHeld=true;sprint.classList.add('held');
  });
  const releaseSprint=e=>{
    if(e&&e.pointerId!==sprintPointer)return;
    sprintPointer=null;campus.runHeld=false;sprint.classList.remove('held');
  };
  sprint.addEventListener('pointerup',releaseSprint);sprint.addEventListener('pointercancel',releaseSprint);
  sprint.addEventListener('lostpointercapture',releaseSprint);
  // Accessible keyboard activation provides a release-safe hold; no auto-run.
  sprint.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();campus.runHeld=true;}});
  sprint.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();campus.runHeld=false;}});
  window.addEventListener('blur',()=>{release();releaseSprint();});
  function captureKey(e,down){
    if(!campus.open)return;
    const k=e.key.toLowerCase();
    if(window.ROOKIE_V116_HUD?.blocked()){
      clearInput();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','m','i','escape'].includes(k)){e.preventDefault();e.stopImmediatePropagation();}
      if(k==='escape'&&down)window.ROOKIE_V116_HUD.close();return;
    }
    if(k==='e'){e.preventDefault();e.stopImmediatePropagation();if(down)modal.querySelector('#v115CampusInteract').click();return;}

    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','escape','+','=','-'].includes(k)){
      e.preventDefault();e.stopImmediatePropagation();
      if(k==='escape'&&down)close();
      else if((k==='+'||k==='=')&&down)pickZoom(campus.zoom*1.2);
      else if(k==='-'&&down)pickZoom(campus.zoom/1.2);
      else if(down)campus.keys.add(k);else campus.keys.delete(k);
    }
  }
  window.addEventListener('keydown',e=>captureKey(e,true),true);
  window.addEventListener('keyup',e=>captureKey(e,false),true);
  // Pointer pinch zooms the SAME canvas/world. It never changes map IDs.
  const fingers=new Map();let priorPinch=null;
  cv.addEventListener('pointerdown',e=>{
    fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(fingers.size===2)priorPinch=null;
  });
  cv.addEventListener('pointermove',e=>{
    if(!fingers.has(e.pointerId))return;
    fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(fingers.size!==2)return;
    const pts=[...fingers.values()],span=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
    if(priorPinch&&priorPinch>3)pickZoom(campus.zoom*span/priorPinch);
    priorPinch=span;
  });
  function endFinger(e){fingers.delete(e.pointerId);priorPinch=null;}
  cv.addEventListener('pointerup',endFinger);cv.addEventListener('pointercancel',endFinger);
  cv.addEventListener('wheel',e=>{e.preventDefault();pickZoom(campus.zoom*(e.deltaY>0?.88:1.12));},{passive:false});
  window.addEventListener('blur',clearInput);
  window.addEventListener('resize',resize);
  // None of this state is stored in game saves or synchronized over a network.
  // This schema is deterministic and uses the same world ID as the Phase 1 atlas.
  const api={version:'115-phase2-seamless-precinct-prototype',worldId:WORLD_ID,areaId:AREA_ID,
    width:W-MIN_X,height:HGT,chunkSize:CHUNK,entrances:Object.freeze({front:FRONT,garage:GARAGE}),
    districts:()=>districtEntries.map(d=>({id:d.id,x:d.x,y:d.y,w:d.w,h:d.h,instanceId:d.instanceId})),
    links:()=>links.map(l=>({...l})),
    intersections:()=>crossings.map(c=>({...c})),
    roadTopologyVersion:roadNetwork.version,
    districtAt:(x,y)=>districtAt(x,y)?.id||'precinct-campus',
    open,close,isOpen:()=>campus.open,
    openAt:(x,y,z=1.1)=>{
      if(!Number.isFinite(x)||!Number.isFinite(y)||blocked(x,y))return false;
      open();if(!campus.open)return false;
      campus.x=x;campus.y=y;campus.zoom=clamp(z,.35,2.5);campus.autoZoom=true;campus.follow=true;
      campus.camX=x-tw/(2*campus.zoom);campus.camY=y-th/(2*campus.zoom);
      attachMarinaActors();
      return true;
    },
    toWorld:(areaId,x,y)=>areaId==='station'?{worldId:WORLD_ID,areaId,x:STX+x,y:STY+y}:
      areaId==='plaza'?{worldId:WORLD_ID,areaId:'precinct-campus-v115',x:PLX+x,y:PLY+y}:null,
    metrics:()=>{const times=campus.paintCosts.slice().sort((a,b)=>a-b);return {frames:campus.paintCount,paintP95Ms:times[Math.floor((times.length-1)*.95)]||0,paintMaxMs:times.at(-1)||0,samples:times.length};},
    snapshot:()=>Object.freeze({schema:1,worldId:WORLD_ID,areaId:districtAt(campus.x,campus.y)?.id||AREA_ID,
      playerId:'local-preview',x:campus.x,y:campus.y,instanceId:districtAt(campus.x,campus.y)?.instanceId||'harbor-main:campus',
      transport:'none',authoritativeServer:false,committedToSave:false}),
    chunks:(x,y,vw,vh)=>chunkWindow(x,y,vw,vh),
    geometry:()=>({walls:walls.length,furniture:furniture.length,rooms:roomRects.length,spots:worldSpots.length,
      stationFootprint:{x:STX,y:STY,w:ST.w,h:ST.h},plazaPlacement:{x:PLX,y:PLY},
      separateSceneLoads:0,doorTransitions:'world-space-continuous'}),
    // Screenshot-only deterministic camera: query-gated, cannot mutate world state or saves.
    qaCamera:(x,y,z)=>{
      if(!/[?&]pilotQA=1(?:&|$)/.test(window.location.search)||!campus.open)return false;
      campus.zoom=clamp(z,.35,1.8);campus.follow=false;
      campus.camX=x-tw/(2*campus.zoom);campus.camY=y-th/(2*campus.zoom);
      return true;
    },
    test:{blocked,interiorRoom,chunkAt,moveTo:(x,y)=>{if(blocked(x,y))return false;campus.x=x;campus.y=y;return true;},
      position:()=>({x:campus.x,y:campus.y}),doorCrossings:()=>campus.doorCrossings},
    scope:'Connected district geography and precinct foot exploration share one camera. Missions, street NPC routines, interiors beyond Precinct 9, live multiplayer and cars still require migration.'};
  H.seamlessCampusV115=Object.freeze(api);
})();
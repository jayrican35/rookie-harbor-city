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
  const W=2800,HGT=1950, TILE=32, CHUNK=512;
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
    {id:'campus:road',areaId:'precinct-campus',x:948,y:1738,label:'Harbor Avenue — continued road construction'});
  const npcActors=ST.npcs.map((n,i)=>({id:'station-npc:'+i,name:n.name,color:n.color,hat:n.hat,x:n.x+STX,y:n.y+STY}));
  npcActors.push({id:'campus-npc:diaz',name:'OFCR. DIAZ',color:'#44557a',hat:true,x:PLX+960,y:PLY+640});
  const idOf=(x,y)=>WORLD_ID+':'+Math.floor(x/CHUNK)+':'+Math.floor(y/CHUNK);
  function chunkAt(x,y){return {id:idOf(x,y),x:Math.floor(x/CHUNK)*CHUNK,y:Math.floor(y/CHUNK)*CHUNK,w:CHUNK,h:CHUNK};}
  function chunkWindow(x,y,viewW,viewH){
    const arr=[];const x0=Math.max(0,Math.floor(x/CHUNK)),y0=Math.max(0,Math.floor(y/CHUNK));
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
    if(x<r||y<r||x>W-r||y>HGT-r)return true;
    for(let i=0;i<collision.length;i++)if(circleHitsRect(x,y,r,collision[i]))return true;
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
  const campus={open:false,x:FRONT.x,y:FRONT.y+86,dir:'up',stride:0,moved:false,
    camX:0,camY:0,zoom:1.15,follow:true,keys:new Set(),stick:null,frame:0,last:0,
    near:null,firstPaint:true,doorCrossings:0,previousRoom:null,visibleChunks:[]};
  const modal=document.createElement('section');modal.id='v115Campus';modal.hidden=true;
  modal.setAttribute('aria-label','V115 seamless precinct and grounds development preview');
  modal.innerHTML=`<canvas id="v115CampusCanvas" aria-label="Continuous 1:1 Precinct 9 interior, grounds and streets"></canvas>
    <header class="v115-campus-header"><div class="v115-campus-brand">PRECINCT 9 <span>SEAMLESS CAMPUS · V115 EXPERIMENT</span></div>
    <button type="button" id="v115CampusExit">Return to game</button></header>
    <div class="v115-campus-hud"><strong id="v115CampusRegion">Precinct Grounds</strong>
    <small id="v115CampusCoords">Single continuous world · no loading screens</small></div>
    <div class="v115-campus-tools"><button id="v115CampusZoomOut" aria-label="Zoom out">−</button>
      <button id="v115CampusOverview" aria-label="Toggle full campus overview">ALL</button>
      <button id="v115CampusZoomIn" aria-label="Zoom in">+</button></div>
    <div class="v115-campus-note" id="v115CampusNote">Explore from the precinct lobby onto the sidewalk. Mission actions are not migrated yet.</div>
    <div class="v115-campus-pad" id="v115CampusPad" aria-label="Movement joystick" role="button" tabindex="0">
      <div id="v115CampusKnob"></div></div>
    <button id="v115CampusInteract" class="v115-campus-interact" type="button">LOOK</button>
    <footer class="v115-campus-footer">Walk with joystick / WASD · zoom without changing world · no story or save changes</footer>`;
  document.body.appendChild(modal);
  const cv=modal.querySelector('canvas'),g=cv.getContext('2d',{alpha:false});
  const btn=document.createElement('button');btn.id='v115CampusLaunch';btn.type='button';
  btn.textContent='EXPLORE PRECINCT CAMPUS';btn.title='Walk inside and outside one continuous precinct world (experimental preview)';
  document.querySelector('#mapOverlay .maptools').appendChild(btn);
  let tw=960,th=640,dpr=1,oldCtx=null,cache=null,cacheValid=false,roofCanvas=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function pickZoom(z){campus.zoom=clamp(z,.11,2.5);campus.follow=campus.zoom>.19;}
  function clearInput(){campus.keys.clear();campus.stick=null;modal.querySelector('#v115CampusKnob').style.transform='translate(0,0)';}
  function resize(){
    if(!campus.open)return;
    const r=cv.getBoundingClientRect();dpr=Math.min(1.5,window.devicePixelRatio||1);
    tw=Math.max(320,Math.round(r.width));th=Math.max(280,Math.round(r.height));
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
    campus.camX=clamp(campus.camX,0,Math.max(0,W-zw));
    campus.camY=clamp(campus.camY,0,Math.max(0,HGT-zh));
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
    const {dx,dy}=direction(),step=clamp(dt,0,.05)*210;
    const ox=campus.x,oy=campus.y,r=12;
    if(dx<0)campus.dir='left';else if(dx>0)campus.dir='right';
    else if(dy<0)campus.dir='up';else if(dy>0)campus.dir='down';
    if(!blocked(campus.x+dx*step,campus.y,r))campus.x+=dx*step;
    if(!blocked(campus.x,campus.y+dy*step,r))campus.y+=dy*step;
    const dist=Math.hypot(campus.x-ox,campus.y-oy);
    campus.moved=dist>.04;if(campus.moved)campus.stride+=dist*.055;
    const nowRoom=interiorRoom(campus.x,campus.y);
    if((campus.previousRoom===null)!==(nowRoom===null))campus.doorCrossings++;
    campus.previousRoom=nowRoom;
    return nowRoom;
  }
  function drawGrass(){
    g.fillStyle='#608d56';g.fillRect(0,0,W,HGT);
    const x0=Math.max(0,Math.floor(campus.camX/48)*48),x1=Math.min(W,campus.camX+tw/campus.zoom+60);
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
      g.fillStyle=v.c;g.fillRect(v.x,v.y,v.w,v.h);
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
    g.fillStyle='#695141';g.fillRect(x-5,y+4,10,30);
    g.fillStyle='#214d39';g.beginPath();g.arc(x,y,r+3,0,7);g.fill();
    g.fillStyle='#5da754';g.beginPath();g.arc(x-4,y-5,r,0,7);g.fill();
    g.fillStyle='rgba(194,226,96,.45)';g.beginPath();g.arc(x-10,y-11,r*.35,0,7);g.fill();
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
    if(isPlayer){g.strokeStyle='#e9c35b';g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y+7,19,7,0,0,7);g.stroke();}
    else if(campus.zoom>.54){g.fillStyle='#faf0cb';g.font='bold 13px Barlow Condensed,sans-serif';g.textAlign='center';g.fillText(p.name,p.x,p.y-39);}
  }
  function drawEntityHighlights(t){
    const view={x:campus.camX-50,y:campus.camY-60,w:tw/campus.zoom+100,h:th/campus.zoom+120};
    function visible(e){return e.x>view.x&&e.x<view.x+view.w&&e.y>view.y&&e.y<view.y+view.h;}
    for(const npc of npcActors)if(visible(npc))drawOfficer(npc,false,t);
    campus.near=null;let best=58;
    for(const sp of worldSpots){
      const d=Math.hypot(sp.x-campus.x,sp.y-campus.y);
      if(d<best){best=d;campus.near=sp;}
      if(!visible(sp)||campus.zoom<.38)continue;
      g.strokeStyle='rgba(234,193,88,.62)';g.lineWidth=2;g.beginPath();g.arc(sp.x,sp.y,8+2*Math.sin(t/410),0,7);g.stroke();
    }
    drawOfficer({x:campus.x,y:campus.y,color:'#2b467a'},true,t);
  }
  function paint(t,dt){
    cameraFollow(dt);
    const viewW=tw/campus.zoom,viewH=th/campus.zoom;
    campus.visibleChunks=chunkWindow(campus.camX,campus.camY,viewW,viewH);
    g.save();g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#172e48';g.fillRect(0,0,tw,th);
    g.translate(-campus.camX*campus.zoom,-campus.camY*campus.zoom);g.scale(campus.zoom,campus.zoom);
    // The same canvas and camera always draw both the campus and interior.
    drawCampusGround();drawOutdoorDecor();drawStation();drawEntityHighlights(t);
    g.restore();
    const region=interiorRoom(campus.x,campus.y);
    const desc=region ? 'PRECINCT 9 · '+region : campus.y>1670?'HARBOR AVENUE · PRECINCT ROAD':'PRECINCT 9 · GROUNDS';
    modal.querySelector('#v115CampusRegion').textContent=desc;
    modal.querySelector('#v115CampusCoords').textContent='World '+Math.round(campus.x)+', '+Math.round(campus.y)+'  · '+idOf(campus.x,campus.y)+'  · '+Math.round(campus.zoom*100)+'%';
    modal.querySelector('#v115CampusInteract').textContent=campus.near?'LOOK · '+campus.near.label:'LOOK';
  }
  function loop(timestamp){
    if(!campus.open)return;
    const dt=campus.last?clamp((timestamp-campus.last)/1000,0,.05):1/60;campus.last=timestamp;
    if(!document.hidden){simulate(dt);paint(timestamp,dt);}
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
    clearInput();campus.last=0;resize();campus.frame=requestAnimationFrame(loop);
  }
  function close(){
    if(!campus.open)return;campus.open=false;cancelAnimationFrame(campus.frame);clearInput();
    modal.hidden=true;document.body.classList.remove('v115-campus-open');
  }
  btn.addEventListener('click',open);
  modal.querySelector('#v115CampusExit').addEventListener('click',close);
  modal.querySelector('#v115CampusZoomOut').addEventListener('click',()=>pickZoom(campus.zoom/1.3));
  modal.querySelector('#v115CampusZoomIn').addEventListener('click',()=>pickZoom(campus.zoom*1.3));
  modal.querySelector('#v115CampusOverview').addEventListener('click',()=>{
    const fit=Math.min(tw/W,th/HGT)*.96;
    if(campus.zoom<.30){pickZoom(1.15);campus.follow=true;}
    else {pickZoom(fit);campus.follow=false;campus.camX=(W-tw/campus.zoom)/2;campus.camY=(HGT-th/campus.zoom)/2;}
  });
  modal.querySelector('#v115CampusInteract').addEventListener('click',()=>{
    const sp=campus.near;
    modal.querySelector('#v115CampusNote').textContent=sp?
      sp.label+' · This is a continuous-world geometry preview. Story interactions still run in the main game.':
      'Move near a door or precinct marker to inspect its world position. No mission progress changes here.';
  });
  const pad=modal.querySelector('#v115CampusPad'),knob=modal.querySelector('#v115CampusKnob');
  const changeStick=e=>{
    const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=(e.clientX-cx)/42,dy=(e.clientY-cy)/42;
    const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
    campus.stick={x:dx,y:dy};knob.style.transform='translate('+Math.round(dx*36)+'px,'+Math.round(dy*36)+'px)';
  };
  let pointer=null;
  pad.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(pointer);changeStick(e);});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer)changeStick(e);});
  const release=e=>{if(e.pointerId!==pointer)return;pointer=null;campus.stick=null;knob.style.transform='translate(0,0)';};
  pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);
  function captureKey(e,down){
    if(!campus.open)return;
    const k=e.key.toLowerCase();
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
    width:W,height:HGT,chunkSize:CHUNK,entrances:Object.freeze({front:FRONT,garage:GARAGE}),
    open,close,isOpen:()=>campus.open,
    toWorld:(areaId,x,y)=>areaId==='station'?{worldId:WORLD_ID,areaId,x:STX+x,y:STY+y}:
      areaId==='plaza'?{worldId:WORLD_ID,areaId:'precinct-campus-v115',x:PLX+x,y:PLY+y}:null,
    snapshot:()=>Object.freeze({schema:1,worldId:WORLD_ID,areaId:AREA_ID,
      playerId:'local-preview',x:campus.x,y:campus.y,instanceId:'harbor-main:campus',
      transport:'none',authoritativeServer:false,committedToSave:false}),
    chunks:(x,y,vw,vh)=>chunkWindow(x,y,vw,vh),
    geometry:()=>({walls:walls.length,furniture:furniture.length,rooms:roomRects.length,spots:worldSpots.length,
      stationFootprint:{x:STX,y:STY,w:ST.w,h:ST.h},plazaPlacement:{x:PLX,y:PLY},
      separateSceneLoads:0,doorTransitions:'world-space-continuous'}),
    test:{blocked,interiorRoom,chunkAt,moveTo:(x,y)=>{if(blocked(x,y))return false;campus.x=x;campus.y=y;return true;},
      position:()=>({x:campus.x,y:campus.y}),doorCrossings:()=>campus.doorCrossings},
    scope:'This is an isolated contiguous precinct-and-road exploration preview; existing missions, car driving and the remaining districts are NOT yet integrated.'};
  H.seamlessCampusV115=Object.freeze(api);
})();
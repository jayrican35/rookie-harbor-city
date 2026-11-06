/* Connected-world adapter. The builder inserts the ORIGINAL updateCar controller.
 * No campaign-car mutation, legacy map transitions, second clock or Zombie hooks.
 */
(function(){
'use strict';
const H=window.HARBOR,SPAWN=Object.freeze({x:1760,y:1568,angle:Math.PI/2});
const controllerFactory=/* CANONICAL_CONTROLLER */null;
function valid(v){return !!v&&v.id==='precinct-unit-9'&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.angle)&&v.x>=-3100&&v.x<=9656&&v.y>=0&&v.y<=4680;}
function restored(v){return {...(valid(v)?{x:v.x,y:v.y,angle:v.angle}:SPAWN),id:'precinct-unit-9',map:'harbor-main',speed:0,engine:false,lightMode:['off','red','blue','alternating'].includes(v?.lightMode)?v.lightMode:'off'};}
H.connectedCruiser={install({campus,modal,blocked,actors,clearInput}){
 let owner=null,car=null,update=null,driving=false,lastSave=0,collisions=0,saveError=false,lastContact=null;
 const V=window.ROOKIE_CRUISER_VISUAL;let visual=V?.create(),lightHeld=false;
 const artOptions={candidate:new URLSearchParams(location.search).get('cruiserCandidate')==='1',legacy:new URLSearchParams(location.search).get('cruiserLegacy')==='1'};
 const input={up:false,down:false,left:false,right:false},proxy={__carSpace:false};
 const image=new Image();let loading=false;
 const controls=document.createElement('div');controls.id='connectedDriveControls';controls.hidden=true;
 controls.innerHTML='<div class="drive-meta"><output aria-live="off"></output><button id="connectedCruiserLight" type="button">LIGHTS: OFF</button></div><div><button data-car="left" aria-label="Hold to steer left">◀</button><button data-car="right" aria-label="Hold to steer right">▶</button><button data-car="brake" aria-label="Hold to stop">STOP</button><button data-car="down" aria-label="Hold to brake then reverse">BRAKE / R</button><button data-car="up" aria-label="Hold to accelerate">GAS</button></div>';
 modal.appendChild(controls);
 const style=document.createElement('style');style.textContent=`
 #connectedDriveControls{position:absolute;bottom:22px;left:20px;right:20px;pointer-events:none;z-index:18;color:#fff0c5;font:700 13px system-ui}
 #connectedDriveControls[hidden]{display:none}#connectedDriveControls output{display:block;text-align:center;text-shadow:1px 2px #102238;margin-bottom:12px}
 #connectedDriveControls>div{display:flex;gap:6px;justify-content:space-between}#connectedDriveControls button{pointer-events:auto;touch-action:none;flex:1;min-width:40px;min-height:66px;background:#193c50ed;color:#fff0c5;border:3px solid #d9bc77;border-radius:18px;font:800 12px system-ui;box-shadow:0 4px #0b2332}
 #connectedDriveControls .drive-meta{align-items:center;margin-bottom:10px}#connectedDriveControls .drive-meta output{flex:1;margin:0;font-size:11px}#connectedDriveControls #connectedCruiserLight{flex:0 0 96px;min-height:32px;border-width:2px;border-radius:10px;font-size:10px}
 #connectedDriveControls button.held{background:#b58b35;color:#102238}body.v116-play-mode #v115Campus.connected-cruiser-driving #v115CampusPad,body.v116-play-mode #v115Campus.connected-cruiser-driving #v125CampusSprint{display:none!important}
 body.v116-play-mode #v115Campus.connected-cruiser-driving #v115CampusInteract{top:auto!important;bottom:155px!important;right:16px!important;transform:none!important;z-index:30!important}
 @media(min-width:900px){#connectedDriveControls{left:calc(50% - 270px);right:calc(50% - 270px)}}
 `;document.head.appendChild(style);
 function eligible(){return campus.open&&!H.academy?.active()&&!H.outbreak?.active();}
 function reset(){lightHeld=false;Object.keys(input).forEach(k=>input[k]=false);proxy.__carSpace=false;controls.querySelectorAll('button').forEach(b=>b.classList.remove('held'));}
 function ensure(){if(eligible()&&!loading){loading=true;V?.load();image.src='./assets/police-driving/cruiser-16-source.png';}if(owner===state)return;owner=state;car=restored(state.connectedCruiser);visual=V?.create();driving=false;reset();show();update=controllerFactory(car,input,proxy,collides,()=>persist(false),impact=>{collisions++;if(lastContact&&impact>3)window.ROOKIE_BANTER?.contact(lastContact,'vehicle-contact',performance.now());});}
 function persist(force=true){if(!owner||owner!==state||!eligible())return false;if(!force&&Date.now()-lastSave<700)return true;lastSave=Date.now();state.connectedCruiser={id:car.id,x:car.x,y:car.y,angle:car.angle,lightMode:car.lightMode};saveError=H.save()===false;if(saveError)message('Your cruiser could not be saved. Keep this page open and export your save from Menu.');return !saveError;}
 function collides(x,y,angle){
  lastContact=null;
  const c=Math.cos(angle),s=Math.sin(angle);
  // Cover the complete 96×48 footprint, using the SAME solid/water/traffic gate.
  for(const lx of [-40,-20,0,20,40])for(const ly of [-16,0,16])if(blocked(x+lx*c-ly*s,y+lx*s+ly*c,9,true,true,!!H.cityCollisions))return true;
  for(const a of actors())if(obbHitsRect(x,y,angle,{x:a.x-11,y:a.y-11,w:22,h:22})){lastContact=a;return true;}
  return false;
 }
 function show(){controls.querySelector('#connectedCruiserLight').textContent='LIGHTS: '+(car?.lightMode||'off').toUpperCase();controls.hidden=!driving;modal.classList.toggle('connected-cruiser-driving',driving);}
 function door(){const s=Math.sin(car.angle),c=Math.cos(car.angle);return {x:car.x+s*42-c*8,y:car.y-c*42-s*8};}
 function near(){ensure();return eligible()&&!driving&&Math.hypot(campus.x-car.x,campus.y-car.y)<88;}
 function message(text){const d=modal.querySelector('#v116Dialogue');if(d){d.hidden=false;d.textContent=text;}}
 function interact(){ensure();if(!eligible())return false;
  if(driving){
   if(Math.max(Math.abs(car.speed),car.impactState?car.impactSpeed||0:0)>6){message('Brake to a complete stop before getting out.');return true;}
   const c=Math.cos(car.angle),s=Math.sin(car.angle),tries=[door(),{x:car.x-s*58,y:car.y+c*58},{x:car.x+s*66,y:car.y-c*66},{x:car.x-c*76,y:car.y-s*76},{x:car.x+c*76,y:car.y+s*76}];
   const spot=tries.find(p=>!blocked(p.x,p.y,13,true)&&!obbHitsRect(car.x,car.y,car.angle,{x:p.x-12,y:p.y-12,w:24,h:24}));
   if(!spot){message('There is no clear place to step out. Move the cruiser slightly.');return true;}
   driving=false;car.speed=0;car.engine=false;campus.x=spot.x;campus.y=spot.y;clearInput();reset();show();persist();return true;
  }
  if(!near())return false;
  driving=true;car.engine=true;car.speed=0;clearInput();reset();campus.x=car.x;campus.y=car.y;campus.follow=true;show();persist();modal.querySelector('#v116Dialogue').hidden=true;return true;
 }
 for(const b of controls.querySelectorAll('[data-car]')){
  let pointer=null;const release=e=>{if(e&&pointer!==e.pointerId)return;pointer=null;if(b.dataset.car==='brake')proxy.__carSpace=false;else input[b.dataset.car]=false;b.classList.remove('held');};
  b.addEventListener('pointerdown',e=>{if(!driving||window.ROOKIE_V116_HUD?.blocked())return;e.preventDefault();pointer=e.pointerId;b.setPointerCapture?.(pointer);if(b.dataset.car==='brake')proxy.__carSpace=true;else input[b.dataset.car]=true;b.classList.add('held');});
  for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,release);
 }
 function bayMark(g){g.save();g.fillStyle='#f5db98';g.textAlign='center';g.font='bold 14px system-ui';g.fillText('UNIT 9',1760,1641);g.restore();}
 function cycleLights(){const modes=['off','alternating','red','blue'];car.lightMode=modes[(modes.indexOf(car.lightMode)+1)%modes.length];controls.querySelector('#connectedCruiserLight').textContent='LIGHTS: '+car.lightMode.toUpperCase();persist();}
 controls.querySelector('#connectedCruiserLight').onclick=()=>{if(driving)cycleLights();};
 function key(k,down){if(!driving)return false;if(k==='l'){if(down&&!lightHeld)cycleLights();lightHeld=down;return true;}const map={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'};if(map[k]){input[map[k]]=down;return true;}if(k===' '){proxy.__carSpace=down;return true;}return false;}
 function step(dt){ensure();if(!eligible())return false;
  H.cityCollisions?.beforeControl(car);
  if(driving){const n=Math.max(1,Math.ceil(dt/(1/120)));for(let i=0;i<n;i++)update(dt/n,performance.now());campus.x=car.x;campus.y=car.y;campus.moved=false;const d=modal.querySelector('#v116Dialogue');if(Math.abs(car.speed)<=6&&d.textContent==='Brake to a complete stop before getting out.')d.hidden=true;controls.querySelector('output').textContent=(car.speed<-3?'REVERSE · ':'UNIT 9 · ')+Math.round(Math.abs(car.speed)*.22)+' mph · E / Exit · Space: stop'+(saveError?' · Save unavailable':'');}
  H.cityCollisions?.afterControl(car);
  if(visual&&!H.cityCollisions)V.update(visual,car,dt,{down:input.down,brake:proxy.__carSpace});
  return driving;
 }
 function draw(g){ensure();if(!eligible())return;
  const premium=visual&&V.draw(g,visual,car,artOptions);
  if(!premium){
  const c=Math.cos(car.angle),s=Math.sin(car.angle);g.save();g.translate(car.x,car.y);g.rotate(car.angle);g.fillStyle='rgba(7,18,30,.32)';g.beginPath();g.ellipse(0,4,48,24,0,0,Math.PI*2);g.fill();g.restore();
  if(image.complete&&image.naturalWidth){
   // Eight genuine camera views selected from the existing local 16-pose sheet.
   // No screen-space rotation of the body art; only its footprint rotates.
   const heading=((Math.round(car.angle/(Math.PI/4))%8)+8)%8,index=[0,1,4,5,8,9,12,13][heading];
   const sx=(index%4)*362,sy=Math.round(Math.floor(index/4)*271.5),sh=Math.round((Math.floor(index/4)+1)*271.5)-sy;
   const w=362*.34,h=sh*.34,bottom=car.y+14*Math.abs(c)+34*Math.abs(s);g.save();g.imageSmoothingEnabled=false;g.drawImage(image,sx,sy,362,sh,car.x-w/2,bottom-h,w,h);g.restore();
  }else{const dir=Math.abs(c)>Math.abs(s)?(c>0?'right':'left'):(s>0?'down':'up');window.ROOKIE_V135_WALL_KIT?.drawPilotVehicle?.(g,{x:car.x,y:car.y,kind:'patrol',dir,length:96,width:48});}
  }
  if(near()){
   const d=door();g.save();g.fillStyle='#ffe3a0';g.strokeStyle='#17384a';g.lineWidth=3;g.beginPath();g.roundRect(d.x-29,d.y-40,58,26,9);g.fill();g.stroke();g.fillStyle='#17384a';g.textAlign='center';g.font='bold 15px system-ui';g.fillText('Drive',d.x,d.y-21);g.restore();
  }
 }
 window.addEventListener('blur',reset);window.addEventListener('pagehide',()=>persist());
 return Object.freeze({step,draw,bayMark,key,near,interact,reset,
  stageForScene:p=>{ensure();if(!p||collides(p.x,p.y,p.angle||0))return false;driving=false;Object.assign(car,{x:p.x,y:p.y,angle:p.angle||0,speed:0,engine:false,lightMode:'alternating'});visual=V?.create();reset();show();persist();return true;},
  vehicleImpact:()=>{collisions++;},
  physicsBody:()=>{ensure();Object.assign(car,{kind:'patrol',length:96,width:48,driving});return car;},
  syncImpact:dt=>{if(driving){campus.x=car.x;campus.y=car.y;}if(visual)V.update(visual,car,dt,{down:input.down,brake:proxy.__carSpace,impact:car.impactJolt||0,sliding:!!car.impactState});if(car.impactState)persist(false);},
  audioState:()=>{ensure();return{x:car.x,y:car.y,speed:car.speed,engine:car.engine,driving,throttle:input.up||input.down&&car.speed<0};},
  active:()=>driving,position:()=>{ensure();return {x:car.x,y:car.y};},
  blocksWalker:(x,y,r)=>{ensure();return !driving&&obbHitsRect(car.x,car.y,car.angle,{x:x-r,y:y-r,w:r*2,h:r*2});},
  overlapsTraffic:tc=>{ensure();if(Math.abs(car.x-tc.x)>180||Math.abs(car.y-tc.y)>180)return false;if(Number.isFinite(tc.angle)&&window.ROOKIE_CITY_TRAFFIC)return window.ROOKIE_CITY_TRAFFIC.overlap({x:car.x,y:car.y,angle:car.angle,length:96,width:48},tc);const h=tc.dir==='left'||tc.dir==='right',w=h?(tc.kind==='delivery'?104:86):38,l=h?38:(tc.kind==='delivery'?104:86);return obbHitsRect(car.x,car.y,car.angle,{x:tc.x-w/2,y:tc.y-l/2,w,h:l});},
  yields:tc=>{ensure();const dx=car.x-tc.x,lateral=Math.abs(Math.sin(car.angle))*48+Math.abs(Math.cos(car.angle))*24+19;return Math.abs(car.y-tc.y)<lateral&&Math.abs(dx)<165&&(tc.dir==='left'?dx<0:dx>0);},
  suspend:()=>{ensure();if(driving){car.speed=0;car.engine=false;interact();if(driving)return false;}reset();persist();return true;},
  snapshot:()=>{ensure();return {...car,driving,collisions,saveError,assetReady:image.complete&&image.naturalWidth>0,count:1,visual:visual?V.inspect(visual):null,art:V?.status()};},
  collisionAt:(x,y,a)=>{ensure();return collides(x,y,a);}
 });
}};
})();

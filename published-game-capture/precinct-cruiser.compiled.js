/* Connected-world adapter. The builder inserts the ORIGINAL updateCar controller.
 * No campaign-car mutation, legacy map transitions, second clock or Zombie hooks.
 */
(function(){
'use strict';
const H=window.HARBOR,SPAWN=Object.freeze({x:1760,y:1568,angle:Math.PI/2});
const controllerFactory=function(car,keys,window,carCollidesAt,saveThrottled,feedback){
const driveKeys={},document={getElementById:()=>null},AC=null,traffic=[];
const syncPlayerToCar=()=>{},checkCarExits=()=>{},perfCollision=feedback,tone=()=>{},toast=()=>{};
const HANDLING=Object.freeze({"maxSpeed":265,"reverseSpeed":92,"acceleration":165,"accelerationRolloff":0.35,"serviceBrake":128,"emergencyBrake":140,"reverseAcceleration":115,"reverseToForwardBrake":140,"coastDeceleration":30,"steeringResponseSeconds":0.085,"steeringLength":44,"steeringSpeedKnee":105,"steeringSpeedExponent":2,"maxYawRate":1.15,"steeringMinSpeed":0.5,"normalLateralGrip":18,"slidingLateralGrip":3.5,"driftSpeedThreshold":145,"driftSpeedFade":45,"driftDemandStart":115,"driftDemandFull":205,"gripLossResponse":4,"gripRecoveryResponse":8,"countersteerGrip":22,"countersteerMinLateralSpeed":3,"countersteerRecoverySeconds":0.35,"handbrakeGripLoss":0.75,"maxSlipAngle":0.5,"driftDeceleration":50,"driftingSlipAngle":0.1});
const CAR_MAX=HANDLING.maxSpeed,CAR_REV=-HANDLING.reverseSpeed;
var connectedSteer=0;
var carReboundTime=0;
function updateCar(dt, tNow){
  carReboundTime=Math.max(0,carReboundTime-dt);
  var previousAngle=car.angle;
  // World velocity survives heading changes. A scalar speed adjustment by
  // the existing impact bridge changes only its longitudinal component.
  var oldCos=Math.cos(previousAngle),oldSin=Math.sin(previousAngle);
  var driveVX=Number.isFinite(car.driveVelocityX)?car.driveVelocityX:oldCos*car.speed;
  var driveVY=Number.isFinite(car.driveVelocityY)?car.driveVelocityY:oldSin*car.speed;
  var longitudinalCorrection=car.speed-(driveVX*oldCos+driveVY*oldSin);
  driveVX+=oldCos*longitudinalCorrection;driveVY+=oldSin*longitudinalCorrection;

  /* Stage A: the car cannot drive with its engine off. With the engine off
     the accelerator is dead and the car only rolls to a stop; steering,
     braking and the exit keys keep working. */
  var gas = (keys.up || driveKeys.up) && car.engine, brk = keys.down || driveKeys.down;
  var left = keys.left || driveKeys.left, right = keys.right || driveKeys.right;
  if(driveKeys.brake || window.__carSpace){ brk = true; }
  // Connected Sporty Arcade steering: continuous signed speed, reduced
  // high-speed yaw and a short input response. No stationary rotation.
  var steer = (right ? 1 : 0) - (left ? 1 : 0);
  connectedSteer += (steer-connectedSteer)*(1-Math.exp(-dt/HANDLING.steeringResponseSeconds));
  if(Math.abs(car.speed)>HANDLING.steeringMinSpeed){
    var yaw=car.speed/HANDLING.steeringLength/(1+Math.pow(Math.abs(car.speed)/HANDLING.steeringSpeedKnee,HANDLING.steeringSpeedExponent));
    car.angle += connectedSteer*Math.max(-HANDLING.maxYawRate,Math.min(HANDLING.maxYawRate,yaw))*dt;
  }
  if(carReboundTime>0){gas=false;brk=false;}
  if(carCollidesAt(car.x,car.y,car.angle,car.map)&&!carCollidesAt(car.x,car.y,previousAngle,car.map))car.angle=previousAngle;
  // The existing impact solver owns velocity/translation during contact.
  var impactOwned=!!car.impactState,driveCos=Math.cos(car.angle),driveSin=Math.sin(car.angle);
  if(!impactOwned)car.speed=driveVX*driveCos+driveVY*driveSin;
  // One mutually exclusive longitudinal integration per substep.
  var stop=!!(driveKeys.brake || window.__carSpace);
  if(carReboundTime>0){gas=false;brk=false;}
  if(stop){
    car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-HANDLING.emergencyBrake*dt) || 0;
  }else if(brk){
    car.speed=car.speed>0?Math.max(0,car.speed-HANDLING.serviceBrake*dt):Math.max(CAR_REV,car.speed-HANDLING.reverseAcceleration*dt);
  }else if(gas){
    if(car.speed<0)car.speed=Math.min(0,car.speed+HANDLING.reverseToForwardBrake*dt);
    else {var rolloff=HANDLING.accelerationRolloff,drag=HANDLING.acceleration*rolloff/CAR_MAX;car.speed=CAR_MAX/rolloff+(car.speed-CAR_MAX/rolloff)*Math.exp(-drag*dt);}
  }else{
    car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-HANDLING.coastDeceleration*dt) || 0;
  }
  car.speed=Math.max(CAR_REV,Math.min(CAR_MAX,car.speed));
  if(!impactOwned){
    var lateral=-driveVX*driveSin+driveVY*driveCos,absSpeed=Math.abs(car.speed);
    var yawRate=dt?(car.angle-previousAngle)/dt:0;
    var countersteer=steer*lateral>HANDLING.countersteerMinLateralSpeed;
    car.tractionRecovery=countersteer?HANDLING.countersteerRecoverySeconds:Math.max(0,(car.tractionRecovery||0)-dt);
    var speedLoad=Math.max(0,Math.min(1,(absSpeed-HANDLING.driftSpeedThreshold)/HANDLING.driftSpeedFade));
    var cornerLoad=Math.max(0,Math.min(1,(Math.abs(yawRate)*absSpeed-HANDLING.driftDemandStart)/(HANDLING.driftDemandFull-HANDLING.driftDemandStart)));
    var targetLoss=speedLoad*Math.max(cornerLoad,stop?HANDLING.handbrakeGripLoss*Math.abs(connectedSteer):0);
    if(car.tractionRecovery>0)targetLoss=0;
    var loss=car.tractionLoss||0,response=targetLoss>loss?HANDLING.gripLossResponse:HANDLING.gripRecoveryResponse;
    loss+=(targetLoss-loss)*(1-Math.exp(-response*dt));
    var grip=HANDLING.normalLateralGrip+(HANDLING.slidingLateralGrip-HANDLING.normalLateralGrip)*loss;
    if(car.tractionRecovery>0)grip=Math.max(grip,HANDLING.countersteerGrip);
    lateral*=Math.exp(-grip*dt);
    var limit=Math.max(absSpeed,HANDLING.driftSpeedFade)*Math.tan(HANDLING.maxSlipAngle);
    lateral=Math.max(-limit,Math.min(limit,lateral));
    car.speed=Math.sign(car.speed)*Math.max(0,absSpeed-HANDLING.driftDeceleration*loss*Math.min(1,Math.abs(lateral)/Math.max(absSpeed,1))*dt);
    var total=Math.hypot(car.speed,lateral),cap=car.speed<0?-CAR_REV:CAR_MAX;
    if(total>cap){car.speed*=cap/total;lateral*=cap/total;}
    car.driveVelocityX=car.speed*driveCos-lateral*driveSin;
    car.driveVelocityY=car.speed*driveSin+lateral*driveCos;
    car.lateralSpeed=lateral;car.slipAngle=Math.atan2(lateral,Math.max(Math.abs(car.speed),1));
    car.tractionLoss=loss;car.lateralGrip=grip;
    car.drifting=Math.abs(car.slipAngle)>HANDLING.driftingSlipAngle&&total>HANDLING.driftSpeedThreshold&&loss>.1;
  }
  car.wheelPhase = (car.wheelPhase || 0) + car.speed * dt * 0.085;
  if(Math.abs(car.speed) < 0.6 && !gas && !brk) car.speed = 0;
  if(car.speed !== 0 || Math.abs(car.lateralSpeed||0)>.01){
    var nx = car.x + (impactOwned?Math.cos(car.angle)*car.speed:car.driveVelocityX)*dt;
    var ny = car.y + (impactOwned?Math.sin(car.angle)*car.speed:car.driveVelocityY)*dt;
    if(!carCollidesAt(nx, ny, car.angle, car.map)){ car.x = nx; car.y = ny; }
    else {
      /* Stage C: a genuine at-speed impact is an avoidable collision and
         is scored (cooldown + minimum-speed guards live in perfCollision,
         so one bump can never drain the score and parking nudges are
         free). The bump itself still does no damage, ever. */
      perfCollision(Math.abs(car.speed));
      /* clear, gentle feedback when the blocker is a civilian car:
         a soft thud + toast, speed scrubbed — no damage, ever */
      var hitTraffic = false, myPts2 = carCorners(nx, ny, car.angle);
      for(var tbi=0; tbi<traffic.length; tbi++){
        var tbo = traffic[tbi];
        if(tbo.map !== car.map || !tbo.active) continue;
        if(obbHitsObb(myPts2, trafficCorners(tbo))){ hitTraffic = true; break; }
      }
      // Move a short, collision-tested distance away from impact. Reversing
      // the signed speed works for both front and rear bumps; a brief coast
      // prevents a held accelerator immediately cancelling the rebound.
      var impactSpeed=car.speed,away=impactSpeed>=0?-1:1;
      var clearStart=!carCollidesAt(car.x,car.y,car.angle,car.map);
      if(clearStart){
        for(var back=0;back<12;back+=2){
          var bx=car.x+Math.cos(car.angle)*away*2,by=car.y+Math.sin(car.angle)*away*2;
          if(carCollidesAt(bx,by,car.angle,car.map))break;
          car.x=bx;car.y=by;
        }
      } else {
        // A moving traffic car may have overlapped us. Only accept a nearby
        // fully clear position, never a distant spawn or an obstacle interior.
        var escaped=false;
        for(var radius=2;radius<=24&&!escaped;radius+=2){
          for(var ai=0;ai<16;ai++){
            var ra=car.angle+Math.PI+ai*Math.PI/8,rx=car.x+Math.cos(ra)*radius,ry=car.y+Math.sin(ra)*radius;
            if(!carCollidesAt(rx,ry,car.angle,car.map)){car.x=rx;car.y=ry;escaped=true;break;}
          }
        }
      }
      car.speed=away*Math.min(65,Math.max(28,Math.abs(impactSpeed)*.28));
      carReboundTime=.22;
      car.driveVelocityX=Math.cos(car.angle)*car.speed;car.driveVelocityY=Math.sin(car.angle)*car.speed;
      car.lateralSpeed=car.slipAngle=car.tractionLoss=car.tractionRecovery=0;car.drifting=false;

      tone(110,0.08,0,"square");
      if(hitTraffic && Date.now() - (window.__lastTrafficBump || 0) > 3200){
        window.__lastTrafficBump = Date.now();
        toast("Bump — no harm done. Steer around the other car.");
      }
    }
  }
  syncPlayerToCar();
  /* siren sound: alternating two-tone while on */
  if(car.siren && AC){
    sirenTimer -= dt;
    if(sirenTimer <= 0){ sirenTimer = 0.38; sirenHigh = !sirenHigh; tone(sirenHigh ? 950 : 700, 0.34, 0, "triangle"); }
  }
  var sv = document.getElementById("speedVal");
  if(sv) sv.textContent = Math.round(Math.abs(car.speed) * 0.22);
  var sg = document.getElementById("speedGear");
  if(sg) sg.textContent = !car.engine ? "ENGINE OFF \u00B7 UNIT 9" : (car.speed > 6 ? "DRIVE \u00B7 UNIT 9" : (car.speed < -6 ? "REVERSE \u00B7 UNIT 9" : "STOPPED \u00B7 UNIT 9"));
  if(car.speed !== 0) saveThrottled();
  checkCarExits();
}

return updateCar;};
function valid(v){return !!v&&v.id==='precinct-unit-9'&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.angle)&&v.x>=-3100&&v.x<=9656&&v.y>=0&&v.y<=4680;}
function restored(v){return {...(valid(v)?{x:v.x,y:v.y,angle:v.angle}:SPAWN),id:'precinct-unit-9',map:'harbor-main',speed:0,engine:false,lightMode:['off','red','blue','alternating'].includes(v?.lightMode)?v.lightMode:'off'};}
H.connectedCruiser={install({campus,modal,blocked,actors,clearInput,roadContact}){
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
 function clearMotion(){if(car){car.driveVelocityX=car.driveVelocityY=car.lateralSpeed=car.slipAngle=car.tractionLoss=car.tractionRecovery=0;car.drifting=false;}}
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
   if(Math.max(Math.abs(car.speed),Math.hypot(car.driveVelocityX||0,car.driveVelocityY||0),car.impactState?car.impactSpeed||0:0)>6){message('Brake to a complete stop before getting out.');return true;}
   const c=Math.cos(car.angle),s=Math.sin(car.angle),tries=[door(),{x:car.x-s*58,y:car.y+c*58},{x:car.x+s*66,y:car.y-c*66},{x:car.x-c*76,y:car.y-s*76},{x:car.x+c*76,y:car.y+s*76}];
   const spot=tries.find(p=>!blocked(p.x,p.y,13,true)&&!obbHitsRect(car.x,car.y,car.angle,{x:p.x-12,y:p.y-12,w:24,h:24}));
   if(!spot){message('There is no clear place to step out. Move the cruiser slightly.');return true;}
   driving=false;car.speed=0;car.engine=false;clearMotion();campus.x=spot.x;campus.y=spot.y;clearInput();reset();show();persist();return true;
  }
  if(!near())return false;
  driving=true;car.engine=true;car.speed=0;clearMotion();clearInput();reset();campus.x=car.x;campus.y=car.y;campus.follow=true;show();persist();modal.querySelector('#v116Dialogue').hidden=true;return true;
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
 function updateVisual(dt){if(visual)V.update(visual,car,dt,{up:input.up,down:input.down,brake:proxy.__carSpace,roadContact});}
 function step(dt){ensure();if(!eligible())return false;
  H.cityCollisions?.beforeControl(car);
  if(driving){const n=Math.max(1,Math.ceil(dt/(1/120)));for(let i=0;i<n;i++)update(dt/n,performance.now());campus.x=car.x;campus.y=car.y;campus.moved=false;const d=modal.querySelector('#v116Dialogue');if(Math.abs(car.speed)<=6&&d.textContent==='Brake to a complete stop before getting out.')d.hidden=true;controls.querySelector('output').textContent=(car.speed<-3?'REVERSE · ':'UNIT 9 · ')+Math.round(Math.abs(car.speed)*.22)+' mph · E / Exit · Space: stop'+(saveError?' · Save unavailable':'');}
  H.cityCollisions?.afterControl(car);
  if(!H.cityCollisions)updateVisual(dt);
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
  stageForScene:p=>{ensure();if(!p||collides(p.x,p.y,p.angle||0))return false;driving=false;Object.assign(car,{x:p.x,y:p.y,angle:p.angle||0,speed:0,engine:false,lightMode:'alternating'});clearMotion();visual=V?.create();reset();show();persist();return true;},
  vehicleImpact:()=>{collisions++;},
  physicsBody:()=>{ensure();Object.assign(car,{kind:'patrol',length:96,width:48,driving});return car;},
  syncImpact:dt=>{if(driving){campus.x=car.x;campus.y=car.y;}updateVisual(dt);if(car.impactState)persist(false);},
  cameraVelocity:()=>driving?{x:car.driveVelocityX??car.speed*Math.cos(car.angle),y:car.driveVelocityY??car.speed*Math.sin(car.angle)}:null,
  audioState:()=>{ensure();return{x:car.x,y:car.y,speed:car.speed,engine:car.engine,driving,
   acceleration:visual?.acceleration||0,throttle:!proxy.__carSpace&&(car.speed<0?input.down&&!input.up:input.up&&!input.down)};},
  active:()=>driving,position:()=>{ensure();return {x:car.x,y:car.y};},
  blocksWalker:(x,y,r)=>{ensure();return !driving&&obbHitsRect(car.x,car.y,car.angle,{x:x-r,y:y-r,w:r*2,h:r*2});},
  overlapsTraffic:tc=>{ensure();if(Math.abs(car.x-tc.x)>180||Math.abs(car.y-tc.y)>180)return false;if(Number.isFinite(tc.angle)&&window.ROOKIE_CITY_TRAFFIC)return window.ROOKIE_CITY_TRAFFIC.overlap({x:car.x,y:car.y,angle:car.angle,length:96,width:48},tc);const h=tc.dir==='left'||tc.dir==='right',w=h?(tc.kind==='delivery'?104:86):38,l=h?38:(tc.kind==='delivery'?104:86);return obbHitsRect(car.x,car.y,car.angle,{x:tc.x-w/2,y:tc.y-l/2,w,h:l});},
  yields:tc=>{ensure();const dx=car.x-tc.x,lateral=Math.abs(Math.sin(car.angle))*48+Math.abs(Math.cos(car.angle))*24+19;return Math.abs(car.y-tc.y)<lateral&&Math.abs(dx)<165&&(tc.dir==='left'?dx<0:dx>0);},
  suspend:()=>{ensure();if(driving){car.speed=0;car.engine=false;clearMotion();interact();if(driving)return false;}reset();persist();return true;},
  snapshot:()=>{ensure();return {...car,driving,collisions,saveError,assetReady:image.complete&&image.naturalWidth>0,count:1,visual:visual?V.inspect(visual):null,art:V?.status()};},
  collisionAt:(x,y,a)=>{ensure();return collides(x,y,a);}
 });
}};
})();

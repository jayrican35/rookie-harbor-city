/* One render-only adapter shared by Unit 9 and its angle inspector.
 * Reads vehicle position/heading; never owns input, physics, collision or camera.
 */
(function(){
'use strict';
const TAU=Math.PI*2,HYST=Math.PI/180*.7;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const assets={status:'idle',manifest:null,image:null,error:null};let pending=null,trafficAtlas=null;
const PREVIOUS='./assets/police-driving/interceptor/',IMPORTED='./assets/police-driving/interceptor-true/';
function loadAtlas(root){
 return fetch(root+'manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Cruiser manifest '+r.status);return r.json();}).then(m=>{
  const count=m.directionCount,step=360/count;
  if(![16,32].includes(count)||m.frames.length!==count||m.vehicleId!=='precinct-unit-9'||!m.frames.every((f,i)=>
   f.index===i&&f.angleDegrees===i*step&&Math.abs(f.angleRadians-i*TAU/count)<1e-6&&
   f.rect[2]===m.cellSize[0]&&f.rect[3]===m.cellSize[1]&&f.anchor[0]===m.anchor[0]&&f.anchor[1]===m.anchor[1]))throw Error('Invalid cruiser atlas geometry');
  return new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=()=>{if(!m.frames.every(f=>f.rect[0]>=0&&f.rect[1]>=0&&f.rect[0]+f.rect[2]<=im.naturalWidth&&f.rect[1]+f.rect[3]<=im.naturalHeight))return reject(Error('Cruiser atlas dimensions do not match its manifest'));resolve({m,im});};im.onerror=()=>reject(Error('Cruiser atlas unavailable'));im.src=root+m.atlas+(m.atlasSha256?'?v='+m.atlasSha256:'');});
 });
}
function load(root){
 if(pending)return pending;
 assets.status='loading';
 const choice=window.location&&new URLSearchParams(window.location.search).get('cruiserArt');
 const selected=root||(choice==='previous'?PREVIOUS:IMPORTED);
 const request=loadAtlas(selected).catch(error=>{
  if(root||selected===PREVIOUS)throw error;
  assets.error=error.message;
  return loadAtlas(PREVIOUS);
 });
 pending=request.then(({m,im})=>{assets.manifest=m;assets.image=im;trafficAtlas=Object.freeze({manifest:m,image:im});assets.status='ready';return true;})
  .catch(error=>{assets.status='fallback';assets.error=error.message;return false;});
 return pending;
}
function create(){
 return {angle:null,index:null,directions:0,time:0,pitch:0,roll:0,brake:0,acceleration:0,slip:0,
  draws:0,frameChanges:0,effects:[],previous:null,rear:null,fxTime:0,puffSide:0,lastDraw:null};
}
function approach(value,target,rate,dt){return value+(target-value)*(1-Math.exp(-dt*rate));}
function rear(car,side){
 const m=assets.manifest,[back,track]=m?.rearTire||[30,19];
 const c=Math.cos(car.angle),s=Math.sin(car.angle),lateral=side*track;
 return {x:car.x-c*back-s*lateral,y:car.y+(-s*back+c*lateral)*(m?.groundScaleY||1)};
}
function update(v,car,dt,input={}){
 dt=clamp(dt||0,0,.05);v.time+=dt;
 const c=Math.cos(car.angle),s=Math.sin(car.angle);
 const vx=car.driveVelocityX??car.speed*c,vy=car.driveVelocityY??car.speed*s;
 const speed=Math.hypot(vx,vy),prior=v.previous;
 const displaced=prior&&Math.hypot(car.x-prior.x,car.y-prior.y)>18+dt*360;
 const continuous=dt>0&&prior&&!displaced;
 if(v.angle===null||displaced)v.angle=car.angle;
 v.angle+=wrap(car.angle-v.angle)*(1-Math.exp(-dt/.025));
 const count=assets.manifest?.directionCount||32,step=TAU/count;
 if(v.directions!==count){v.index=null;v.directions=count;}
 if(v.index===null||Math.abs(wrap(v.angle-v.index*step))>step/2+HYST){
  const i=((Math.round(v.angle/step)%count)+count)%count;
  if(v.index!==null&&i!==v.index)v.frameChanges++;
  v.index=i;
 }
 const longitudinal=continuous?(car.speed-prior.forward)/dt:0;
 const lateral=continuous?(-(vx-prior.vx)*s+(vy-prior.vy)*c)/dt:0;
 const deceleration=continuous?(prior.speed-speed)/dt:0;
 const braking=input.brake||(input.down&&car.speed>0)||(input.up&&car.speed<0);
 v.acceleration=approach(v.acceleration,clamp(-deceleration,-240,220),12,dt);
 v.pitch=approach(v.pitch,clamp(longitudinal/155,-1,1),11,dt);
 v.roll=approach(v.roll,clamp(-lateral/205,-1,1),9,dt);
 v.brake=approach(v.brake,braking?clamp(.24+deceleration/165,.24,1):0,22,dt);
 v.slip=clamp((Math.abs(car.lateralSpeed||0)-12)/35,0,1);
 v.previous={x:car.x,y:car.y,vx,vy,speed,forward:car.speed};
 if(displaced){v.effects.length=0;v.rear=null;v.fxTime=0;}
 for(let i=v.effects.length-1;i>=0;i--){
  v.effects[i].life-=dt;
  if(v.effects[i].life<=0)v.effects.splice(i,1);
 }
 const brakeScrub=braking?clamp((deceleration-90)/100,0,.5):0;
 const load=Math.max(v.slip,brakeScrub)*clamp((speed-55)/80,0,1);
 if(load<.12||!continuous){v.rear=null;v.fxTime=0;return;}
 v.fxTime+=dt;
 if(v.rear&&v.fxTime<.05)return;
 const wheels=[rear(car,-1),rear(car,1)];
 if(v.rear){
  v.puffSide=1-v.puffSide;
  for(let i=0;i<2;i++){
  const a=v.rear[i],b=wheels[i],distance=Math.hypot(b.x-a.x,b.y-a.y);
  if(distance<1||distance>25)continue;
  const road=!input.roadContact||input.roadContact(b.x,b.y);
  if(road&&(!input.roadContact||input.roadContact(a.x,a.y)))v.effects.push({kind:'skid',a,b,load,life:2.6,max:2.6});
  if(load>.24&&i===v.puffSide)v.effects.push({kind:'puff',a:b,load,road,life:.5,max:.5});
  }
 }
 if(v.effects.length>72)v.effects.splice(0,v.effects.length-72);
 v.rear=wheels;v.fxTime=0;
}
function effects(g,v){
 g.save();for(const e of v.effects){const a=e.life/e.max;
  if(e.kind==='skid'){g.strokeStyle='rgba(14,20,27,'+(a*e.load*.58)+')';g.lineWidth=1.4+e.load;g.beginPath();g.moveTo(e.a.x,e.a.y);g.lineTo(e.b.x,e.b.y);g.stroke();}
  else{g.fillStyle=(e.road?'rgba(222,228,216,':'rgba(207,184,139,')+(a*e.load*.32)+')';g.beginPath();g.ellipse(e.a.x,e.a.y-(1-a)*8,2+(1-a)*5,1.5+(1-a)*3,0,0,TAU);g.fill();}
 }g.restore();
}
function lensPath(g,lens,anchor){
 g.beginPath();
 lens.polygon.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x-anchor[0],y-anchor[1]));
 g.closePath();
}
function cap(g,lens,color,anchor){
 if(!lens)return;const c=lens.center;
 g.save();g.fillStyle=color==='red'?'rgba(255,50,40,.13)':'rgba(55,150,255,.13)';g.beginPath();g.ellipse(c[0]-anchor[0],c[1]-anchor[1],12,9,0,0,TAU);g.fill();
 lensPath(g,lens,anchor);
 g.shadowColor=color==='red'?'#ff3029':'#429cff';g.shadowBlur=5;g.fillStyle=color==='red'?'rgba(255,92,60,.65)':'rgba(85,178,255,.68)';g.fill();
 g.clip();g.shadowBlur=0;g.fillStyle='#fff5de';g.fillRect(c[0]-anchor[0]-2,c[1]-anchor[1]-2,4,2);g.restore();
}
function draw(g,v,car,options={}){
 const m=assets.manifest;
 if(assets.status!=='ready'||!m||!m.reviewed&&!options.candidate||options.legacy)return false;
 if(v.index===null||v.directions!==m.directionCount)update(v,car,0);
 effects(g,v);
 // The same continuous physical footprint supplies every pose's shadow.
 g.save();g.translate(car.x+2,car.y+4);g.scale(1,m.groundScaleY||1);g.rotate(car.angle);
 g.fillStyle='rgba(7,18,30,.07)';g.beginPath();g.ellipse(0,0,49,25,0,0,TAU);g.fill();
 g.fillStyle='rgba(7,18,30,.22)';g.beginPath();g.ellipse(0,v.roll*1.4,43,17,0,0,TAU);g.fill();g.restore();
 const f=m.frames[v.index],a=f.anchor,scale=m.renderScale;
 // Fill part of the angle between authored perspectives while retaining a
 // single opaque silhouette. The bounded correction never rotates a full pose.
 const limit=Math.min(.125,TAU/m.directionCount*.34);
 const residual=options.subframe===false?0:clamp(wrap(v.angle-f.angleRadians)*.60,-limit,limit);
 const c=Math.cos(car.angle),s=Math.sin(car.angle);
 const x=car.x-v.pitch*c*1.6-v.roll*s*1.3;
 const y=car.y+(m.renderOffsetY||0)-v.pitch*s*1.3+v.roll*c*.9;
 const groundY=m.groundScaleY||1;
 g.save();g.translate(x,y);g.scale(1,groundY);g.rotate(residual);g.scale(scale,scale/groundY);g.imageSmoothingEnabled=false;
 // Small screen-space lean around the ground anchor. Collision and tire
 // marks remain on the unchanged physical footprint underneath the body.
 g.transform(1,-v.pitch*c*.043+v.roll*s*.018,v.roll*c*.05,1+v.pitch*s*.028,0,0);
 g.drawImage(assets.image,...f.rect,-a[0],-a[1],m.cellSize[0],m.cellSize[1]);
 if(v.brake>.05)for(const [lx,ly,w,h] of f.brakeLamps||[]){
  g.fillStyle='rgba(255,68,43,'+(v.brake*.24)+')';
  g.beginPath();g.ellipse(lx-a[0],ly-a[1],w*.69,h*.65,0,0,TAU);g.fill();
  g.fillStyle='rgba(255,185,136,'+(v.brake*.82)+')';
  g.beginPath();g.ellipse(lx-a[0],ly-a[1],w*.34,h*.33,0,0,TAU);g.fill();
 }
 if(v.brake>.05)for(const lamp of f.brakeLights||[]){
  lensPath(g,lamp,a);g.shadowColor='#ff3735';g.shadowBlur=3*v.brake;
  g.fillStyle='rgba(255,122,104,'+(v.brake*.82)+')';g.fill();g.shadowBlur=0;
 }
 const mode=car.lightMode||'off',active=mode==='alternating'?(Math.floor(v.time/.32)%2?'blue':'red'):mode;
 if(active==='red'||active==='blue')cap(g,f.lighting[active],active,a);
 g.restore();v.draws++;
 v.lastDraw={index:v.index,angle:car.angle,visualAngle:v.angle,residual,anchor:[car.x,car.y],
  imageOrigin:[x,y],pitch:v.pitch,roll:v.roll,brake:v.brake,lightMode:mode,activeLight:active,shadow:{center:[car.x+2,car.y+4],radii:[49,25],angle:car.angle}};
 return true;
}
window.ROOKIE_CRUISER_VISUAL=Object.freeze({load,create,update,draw,wrap,
 status:()=>({status:assets.status,error:assets.error,reviewed:!!assets.manifest?.reviewed,directionCount:assets.manifest?.directionCount||0,atlas:assets.manifest?.atlas||null}),
 inspect:v=>({index:v.index,draws:v.draws,frameChanges:v.frameChanges,effectCount:v.effects.length,pitch:v.pitch,roll:v.roll,brake:v.brake,slip:v.slip,lastDraw:v.lastDraw}),
 manifest:()=>assets.manifest,trafficAtlas:()=>trafficAtlas});
})();

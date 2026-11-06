/* One render-only adapter shared by Unit 9 and its angle inspector.
 * Reads vehicle position/heading; never owns input, physics, collision or camera.
 */
(function(){
'use strict';
const STEP=Math.PI/8,TAU=Math.PI*2,HYST=Math.PI/180*.7;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const assets={status:'idle',manifest:null,image:null,error:null};let pending=null;
function load(root='./assets/police-driving/turning/'){
 if(pending)return pending;assets.status='loading';
 pending=fetch(root+'manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Cruiser manifest '+r.status);return r.json();}).then(m=>{
  if(m.directionCount!==16||m.frames.length!==16||m.vehicleId!=='precinct-unit-9'||!m.frames.every((f,i)=>f.index===i&&f.angleDegrees===i*22.5&&f.rect[2]===m.cellSize[0]&&f.rect[3]===m.cellSize[1]&&f.anchor[0]===m.anchor[0]&&f.anchor[1]===m.anchor[1]))throw Error('Invalid cruiser atlas geometry');
  return new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=()=>{if(!m.frames.every(f=>f.rect[0]>=0&&f.rect[1]>=0&&f.rect[0]+f.rect[2]<=im.naturalWidth&&f.rect[1]+f.rect[3]<=im.naturalHeight))return reject(Error('Cruiser atlas dimensions do not match its manifest'));resolve({m,im});};im.onerror=()=>reject(Error('Cruiser atlas unavailable'));im.src=root+m.atlas+(m.atlasSha256?'?v='+m.atlasSha256:'');});
 }).then(({m,im})=>{assets.manifest=m;assets.image=im;assets.status='ready';return true;}).catch(e=>{assets.status='fallback';assets.error=e.message;return false;});
 return pending;
}
function create(){return {angle:null,index:null,lastAngle:null,time:0,sway:0,rate:0,draws:0,frameChanges:0,effects:[],rear:null,fxTime:0,lastDraw:null};}
function rear(car,side){const c=Math.cos(car.angle),s=Math.sin(car.angle);return {x:car.x-c*30-s*side*19,y:car.y-s*30+c*side*19};}
function update(v,car,dt,input={}){
 dt=clamp(dt||0,0,.05);v.time+=dt;
 if(v.angle===null){v.angle=car.angle;v.lastAngle=car.angle;}
 const rate=dt?wrap(car.angle-v.lastAngle)/dt:0;v.lastAngle=car.angle;
 v.rate+=(clamp(rate,-3,3)-v.rate)*(1-Math.exp(-dt*14));
 v.angle+=wrap(car.angle-v.angle)*(1-Math.exp(-dt/0.035));
 if(v.index===null)v.index=((Math.round(v.angle/STEP)%16)+16)%16;
 if(Math.abs(wrap(v.angle-v.index*STEP))>STEP/2+HYST){const i=((Math.round(v.angle/STEP)%16)+16)%16;if(i!==v.index){v.index=i;v.frameChanges++;}}
 const braking=!!(input.brake||input.down&&car.speed>8),sharp=Math.abs(v.rate)>1.2&&Math.abs(car.speed)>170;
 const target=clamp(v.rate*Math.abs(car.speed)/700,-.35,.35)+(braking&&Math.abs(car.speed)>12?.2:0)+(input.impact||0)*.8;
 v.sway+=(target-v.sway)*(1-Math.exp(-dt*12));
 for(const e of v.effects)e.life-=dt;v.effects=v.effects.filter(e=>e.life>0);
 const wheels=[rear(car,-1),rear(car,1)];v.fxTime+=dt;
 if((sharp||input.brake||input.sliding)&&Math.max(Math.abs(car.speed),car.impactSpeed||0)>70&&v.rear&&v.fxTime>.07){
  for(let i=0;i<2;i++){v.effects.push({kind:'skid',a:v.rear[i],b:wheels[i],life:1.7,max:1.7});v.effects.push({kind:'puff',a:wheels[i],life:.38,max:.38});}
  v.fxTime=0;
 }
 v.effects=v.effects.slice(-48);v.rear=wheels;
}
function effects(g,v){
 g.save();for(const e of v.effects){const a=e.life/e.max;
  if(e.kind==='skid'){g.strokeStyle='rgba(18,26,33,'+(a*.22)+')';g.lineWidth=2;g.beginPath();g.moveTo(e.a.x,e.a.y);g.lineTo(e.b.x,e.b.y);g.stroke();}
  else{g.fillStyle='rgba(222,228,216,'+(a*.17)+')';g.beginPath();g.ellipse(e.a.x,e.a.y-(1-a)*7,2+(1-a)*3,1.5+(1-a)*2,0,0,TAU);g.fill();}
 }g.restore();
}
function cap(g,lens,color,anchor){
 if(!lens)return;const p=lens.polygon,c=lens.center;
 g.save();g.fillStyle=color==='red'?'rgba(255,50,40,.13)':'rgba(55,150,255,.13)';g.beginPath();g.ellipse(c[0]-anchor[0],c[1]-anchor[1],12,9,0,0,TAU);g.fill();
 g.beginPath();p.forEach((p,i)=>g[i?'lineTo':'moveTo'](p[0]-anchor[0],p[1]-anchor[1]));g.closePath();
 g.shadowColor=color==='red'?'#ff3029':'#429cff';g.shadowBlur=5;g.fillStyle=color==='red'?'rgba(255,92,60,.65)':'rgba(85,178,255,.68)';g.fill();
 g.clip();g.shadowBlur=0;g.fillStyle='#fff5de';g.fillRect(c[0]-anchor[0]-2,c[1]-anchor[1]-2,4,2);g.restore();
}
function draw(g,v,car,options={}){
 const m=assets.manifest;
 if(assets.status!=='ready'||!m||!m.reviewed&&!options.candidate||options.legacy)return false;
 if(v.index===null)update(v,car,0);
 effects(g,v);
 // The same continuous physical footprint supplies every pose's shadow.
 g.save();g.translate(car.x+2,car.y+4);g.rotate(car.angle);
 g.fillStyle='rgba(7,18,30,.07)';g.beginPath();g.ellipse(0,0,49,25,0,0,TAU);g.fill();
 g.fillStyle='rgba(7,18,30,.18)';g.beginPath();g.ellipse(0,0,44,20,0,0,TAU);g.fill();g.restore();
 const f=m.frames[v.index],a=f.anchor,scale=m.renderScale;
 // At most 2.2 degrees of supplementary sub-frame alignment. The 16 genuine
 // views supply perspective; no bitmap is spun through the full turntable.
 const residual=options.subframe===false?0:clamp(wrap(v.angle-f.angleRadians)*.18,-.0384,.0384);
 const x=Math.round(car.x*2)/2,y=Math.round((car.y+v.sway)*2)/2;
 g.save();g.translate(x,y);g.rotate(residual);g.scale(scale,scale);g.imageSmoothingEnabled=false;
 g.drawImage(assets.image,...f.rect,-a[0],-a[1],m.cellSize[0],m.cellSize[1]);
 const mode=car.lightMode||'off',active=mode==='alternating'?(Math.floor(v.time/.32)%2?'blue':'red'):mode;
 if(active==='red'||active==='blue')cap(g,f.lighting[active],active,a);
 g.restore();v.draws++;
 v.lastDraw={index:v.index,angle:car.angle,visualAngle:v.angle,residual,anchor:[car.x,car.y],
  imageOrigin:[x,y],bodySway:v.sway,lightMode:mode,activeLight:active,shadow:{center:[car.x+2,car.y+4],radii:[49,25],angle:car.angle}};
 return true;
}
window.ROOKIE_CRUISER_VISUAL=Object.freeze({load,create,update,draw,wrap,
 status:()=>({status:assets.status,error:assets.error,reviewed:!!assets.manifest?.reviewed,directionCount:assets.manifest?.directionCount||0}),
 inspect:v=>({index:v.index,draws:v.draws,frameChanges:v.frameChanges,effectCount:v.effects.length,lastDraw:v.lastDraw}),
 manifest:()=>assets.manifest});
})();

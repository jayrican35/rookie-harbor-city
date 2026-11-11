/* Impact/recovery extension on the connected city's existing simulation clock.
 * Normal Sporty Arcade control and the existing road graph remain authoritative
 * outside contact. No dependency, RAF, save owner or protected-mode hook. */
(function(){'use strict';
const T=Object.freeze({restitution:.20,bounceThreshold:14,friction:.24,mass:Object.freeze({compact:.8,civilian:1,sedan:1,patrol:1.25,suv:1.5,delivery:1.85}),angularResponse:1,linearDamping:.65,angularDamping:1.7,tireGrip:2.6,parkedDrag:2.7,maxSpeed:360,maxAngularSpeed:3.2,slop:.25,correction:.55,maxCorrection:2.5,substep:1/120,iterations:3,minRecovery:.65,rejoinSpeed:24,rejoinSpin:.22,offscreenRecovery:20,particleIntensity:1,cameraIntensity:1});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function dimensions(b){return[b.length||86,b.width||38];}
function axes(b){return[{x:Math.cos(b.angle),y:Math.sin(b.angle)},{x:-Math.sin(b.angle),y:Math.cos(b.angle)}];}
function radius(b,n){const a=axes(b),[l,w]=dimensions(b);return Math.abs(a[0].x*n.x+a[0].y*n.y)*l/2+Math.abs(a[1].x*n.x+a[1].y*n.y)*w/2;}
function contact(a,b){let depth=Infinity,n=null;const dx=b.x-a.x,dy=b.y-a.y;
 for(const axis of [...axes(a),...axes(b)]){const projection=dx*axis.x+dy*axis.y,overlap=radius(a,axis)+radius(b,axis)-Math.abs(projection);if(overlap<=0)return null;if(overlap<depth){depth=overlap;const sign=projection<0?-1:1;n={x:axis.x*sign,y:axis.y*sign};}}
 const t={x:-n.y,y:n.x},an=a.x*n.x+a.y*n.y,bn=b.x*n.x+b.y*n.y,at=a.x*t.x+a.y*t.y,bt=b.x*t.x+b.y*t.y;
 const along=(an+radius(a,n)+bn-radius(b,n))/2,side=(Math.max(at-radius(a,t),bt-radius(b,t))+Math.min(at+radius(a,t),bt+radius(b,t)))/2;
 return{nx:n.x,ny:n.y,depth,x:n.x*along+t.x*side,y:n.y*along+t.y*side};
}
function create(io){
 const states=new Map(),events=[],effects=[],costs=[],stats={contacts:0,impulses:0,rejoins:0,offscreen:0,pairs:0,steps:0,maxStepMs:0};let time=0,unitCapture=null,shake=0;
 function bodies(){const unit=io.unit?.(),all=io.fleet().concat(io.parked?.()||[]);if(unit)all.push(unit);return all;}
 function state(ref){let b=states.get(ref);if(!b){const mass=T.mass[ref.massClass||ref.kind]||1,[l,w]=dimensions(ref);b={ref,mass,inv:1/mass,inertia:mass*(l*l+w*w)/12,vx:0,vy:0,omega:0,age:0,active:false,retry:0};states.set(ref,b);}return b;}
 function sync(b){if(b.active)return;const r=b.ref,s=r===io.unit?.()?(r.driving?r.speed:0):r.parked?0:r.velocity||0;b.vx=r===io.unit?.()&&r.driving&&Number.isFinite(r.driveVelocityX)?r.driveVelocityX:Math.cos(r.angle)*s;b.vy=r===io.unit?.()&&r.driving&&Number.isFinite(r.driveVelocityY)?r.driveVelocityY:Math.sin(r.angle)*s;b.omega=0;}
 function activate(b,refresh=false){if(b.active){if(refresh)b.age=0;return;}b.active=true;b.age=0;b.ref.impactState='impact';io.release?.(b.ref);}
 function apply(b,jx,jy,rx,ry){b.vx+=jx*b.inv;b.vy+=jy*b.inv;b.omega+=(rx*jy-ry*jx)/b.inertia*T.angularResponse;const speed=Math.hypot(b.vx,b.vy);if(speed>T.maxSpeed){b.vx*=T.maxSpeed/speed;b.vy*=T.maxSpeed/speed;}b.omega=clamp(b.omega,-T.maxAngularSpeed,T.maxAngularSpeed);}
 function safe(r,x,y,angle=r.angle){return !io.blocked?.(x,y,angle,r);}
 function shift(b,dx,dy){const r=b.ref;if(safe(r,r.x+dx,r.y+dy)){r.x+=dx;r.y+=dy;return true;}return false;}
 function resolve(a,b,c){const ar=a.ref,br=b.ref,rax=c.x-ar.x,ray=c.y-ar.y,rbx=c.x-br.x,rby=c.y-br.y;
  const rvx=b.vx-b.omega*rby-a.vx+a.omega*ray,rvy=b.vy+b.omega*rbx-a.vy-a.omega*rax,vn=rvx*c.nx+rvy*c.ny;
  let j=0;if(vn<-.01){const ra=rax*c.ny-ray*c.nx,rb=rbx*c.ny-rby*c.nx,den=a.inv+b.inv+ra*ra/a.inertia+rb*rb/b.inertia;
   const before={a:[a.vx,a.vy,a.omega],b:[b.vx,b.vy,b.omega]};j=-(1+(vn<-T.bounceThreshold?T.restitution:0))*vn/den;activate(a,-vn>9);activate(b,-vn>9);
   apply(a,-j*c.nx,-j*c.ny,rax,ray);apply(b,j*c.nx,j*c.ny,rbx,rby);
   // Coulomb friction from the updated contact velocity, clamped by normal impulse.
   const tx=-c.ny,ty=c.nx,va=(b.vx-b.omega*rby-a.vx+a.omega*ray)*tx+(b.vy+b.omega*rbx-a.vy-a.omega*rax)*ty;
   const rat=rax*ty-ray*tx,rbt=rbx*ty-rby*tx,jt=clamp(-va/(a.inv+b.inv+rat*rat/a.inertia+rbt*rbt/b.inertia),-T.friction*j,T.friction*j);
   apply(a,-jt*tx,-jt*ty,rax,ray);apply(b,jt*tx,jt*ty,rbx,rby);stats.impulses++;
   const key=ar.id<br.id?ar.id+'|'+br.id:br.id+'|'+ar.id;if(-vn>9&&time>(lastEvent.get(key)||-1)+.22){lastEvent.set(key,time);const e={a:ar.id,b:br.id,x:c.x,y:c.y,nx:c.nx,ny:c.ny,impulse:j,closing:-vn,at:time,before,after:{a:[a.vx,a.vy,a.omega],b:[b.vx,b.vy,b.omega]}};events.push(e);if(events.length>60)events.shift();io.impact?.(e,ar,br);if(ar===io.unit?.()||br===io.unit?.())shake=Math.max(shake,Math.min(3,-vn/80)*T.cameraIntensity);for(let i=0;i<Math.min(9,2+Math.floor(-vn/40))*T.particleIntensity;i++)effects.push({x:c.x,y:c.y,vx:Math.cos(i*2.4)*Math.min(50,-vn*.25),vy:Math.sin(i*2.4)*Math.min(50,-vn*.25),life:.32,max:.32});}
  }
  const correction=Math.min(T.maxCorrection,Math.max(0,c.depth-T.slop)*T.correction)/(a.inv+b.inv);if(correction>0){if(!a.active)activate(a);if(!b.active)activate(b);shift(a,-c.nx*correction*a.inv,-c.ny*correction*a.inv);shift(b,c.nx*correction*b.inv,c.ny*correction*b.inv);}stats.contacts++;
 }
 const lastEvent=new Map();
 function integrate(b,dt){if(!b.active)return;const r=b.ref;b.age+=dt;const c=Math.cos(r.angle),s=Math.sin(r.angle),long=b.vx*c+b.vy*s,lat=-b.vx*s+b.vy*c,grip=T.tireGrip*(.25+.75*Math.min(b.age/1.8,1));
  const drag=r.parked||r===io.unit?.()&&!r.driving?T.parkedDrag:T.linearDamping,l=long*Math.exp(-drag*dt),q=lat*Math.exp(-(drag+grip)*dt);b.vx=l*c-q*s;b.vy=l*s+q*c;b.omega*=Math.exp(-T.angularDamping*dt);
  const angle=wrap(r.angle+b.omega*dt),dx=b.vx*dt,dy=b.vy*dt;
  if(safe(r,r.x+dx,r.y+dy,angle)){r.x+=dx;r.y+=dy;r.angle=angle;}
  else{if(!safe(r,r.x,r.y,angle))b.omega*=-.12;else r.angle=angle;const xclear=safe(r,r.x+dx,r.y),yclear=safe(r,r.x,r.y+dy);if(xclear)r.x+=dx;else b.vx*=-.10;if(yclear)r.y+=dy;else b.vy*=-.10;}
  r.cos=Math.cos(r.angle);r.sin=Math.sin(r.angle);r.dir=Math.abs(r.cos)>=Math.abs(r.sin)?r.cos>0?'right':'left':r.sin>0?'down':'up';
 }
 function pairs(all){const grid=new Map(),seen=new Set(),list=[];for(const b of all){const r=b.ref,extent=Math.max(...dimensions(r))*.6;for(let x=Math.floor((r.x-extent)/160);x<=Math.floor((r.x+extent)/160);x++)for(let y=Math.floor((r.y-extent)/160);y<=Math.floor((r.y+extent)/160);y++){const key=x+','+y;let cell=grid.get(key);if(!cell)grid.set(key,cell=[]);for(const other of cell){if(r.parked&&other.ref.parked&&!b.active&&!other.active)continue;const id=r.id<other.ref.id?r.id+'|'+other.ref.id:other.ref.id+'|'+r.id;if(!seen.has(id)){seen.add(id);list.push([b,other]);}}cell.push(b);}}return list;}
 function step(dt){const start=performance.now();dt=clamp(dt||0,0,.05);time+=dt;const refs=bodies(),present=new Set(refs);for(const r of states.keys())if(!present.has(r))states.delete(r);const all=refs.map(state);for(const b of all)sync(b);
  const n=Math.max(1,Math.ceil(dt/T.substep)),h=dt/n;for(let k=0;k<n;k++){for(const b of all)integrate(b,h);const nearby=pairs(all);stats.pairs+=nearby.length;for(let i=0;i<T.iterations;i++)for(const [a,b]of nearby){const c=contact(a.ref,b.ref);if(c)resolve(a,b,c);}}
  for(const b of all){const r=b.ref;r.impactJolt=(r.impactJolt||0)*Math.exp(-dt*8);if(!b.active)continue;const speed=Math.hypot(b.vx,b.vy);r.impactSpeed=speed;if(!Number.isFinite(r.x+r.y+r.angle+b.vx+b.vy+b.omega))throw Error('Nonfinite vehicle collision state');
   if(r===io.unit?.()){r.speed=b.vx*Math.cos(r.angle)+b.vy*Math.sin(r.angle);r.driveVelocityX=b.vx;r.driveVelocityY=b.vy;r.lateralSpeed=-b.vx*Math.sin(r.angle)+b.vy*Math.cos(r.angle);r.slipAngle=Math.atan2(r.lateralSpeed,Math.max(Math.abs(r.speed),1));r.tractionLoss=0;r.drifting=false;if(b.age>T.minRecovery&&Math.abs(b.omega)<.08&&Math.abs(-b.vx*Math.sin(r.angle)+b.vy*Math.cos(r.angle))<3){b.active=false;delete r.impactState;}}
   else if(r.parked){if(speed<1&&Math.abs(b.omega)<.03){b.vx=b.vy=b.omega=0;b.active=false;delete r.impactState;}}
   else{r.velocity=speed;r.stopped=speed<1;r.playerWait=0;r.stopReason='impact';r.impactState=b.age>1?'recovery':'impact';if(b.age>T.minRecovery&&speed<T.rejoinSpeed&&Math.abs(b.omega)<T.rejoinSpin&&time>=b.retry){b.retry=time+1;if(io.rejoin?.(r)){b.active=false;delete r.impactState;stats.rejoins++;}else{r.impactState='waiting';if(b.age>T.offscreenRecovery&&io.reenter?.(r)){b.active=false;delete r.impactState;stats.offscreen++;}}}}
  }
  for(const e of effects){e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;}while(effects.length>80)effects.shift();for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0)effects.splice(i,1);shake*=Math.exp(-dt*13);stats.steps++;const cost=performance.now()-start;stats.maxStepMs=Math.max(stats.maxStepMs,cost);costs.push(cost);if(costs.length>180)costs.shift();
 }
 function beforeControl(r){const b=states.get(r);unitCapture=b?.active?{x:r.x,y:r.y,speed:r.speed}:null;}
 function afterControl(r){const b=states.get(r);if(!unitCapture||!b?.active)return;const delta=r.speed-unitCapture.speed;b.vx+=Math.cos(r.angle)*delta;b.vy+=Math.sin(r.angle)*delta;r.x=unitCapture.x;r.y=unitCapture.y;unitCapture=null;}
 function inspect(){const sorted=costs.slice().sort((a,b)=>a-b);return{tuning:T,stats:{...stats,p95StepMs:sorted[Math.floor(sorted.length*.95)]||0},events:events.slice(),bodies:[...states.values()].map(b=>({id:b.ref.id,x:b.ref.x,y:b.ref.y,angle:b.ref.angle,mass:b.mass,vx:b.vx,vy:b.vy,omega:b.omega,active:b.active,age:b.age,state:b.ref.impactState||'route',parked:!!b.ref.parked}))};}
 function fixture(placements,hold=0){if(!io.qa)return false;const refs=bodies(),prepared=[];for(const p of placements){const r=refs.find(r=>r.id===p.id);if(!r||![p.x,p.y,p.angle,p.speed||0].every(Number.isFinite)||!safe(r,p.x,p.y,p.angle))return false;prepared.push({r,p});}for(const{r,p}of prepared){Object.assign(r,{x:p.x,y:p.y,angle:p.angle,speed:p.speed||0,velocity:p.speed||0,cos:Math.cos(p.angle),sin:Math.sin(p.angle)});r.dir=Math.abs(r.cos)>=Math.abs(r.sin)?r.cos>0?'right':'left':r.sin>0?'down':'up';const b=state(r);activate(b);b.vx=Math.cos(p.angle)*(p.speed||0);b.vy=Math.sin(p.angle)*(p.speed||0);b.omega=0;b.retry=time+hold;}return true;}
 return Object.freeze({step,beforeControl,afterControl,owns:r=>!!states.get(r)?.active,fixture:io.qa?fixture:undefined,reset(){for(const r of states.keys()){delete r.impactState;delete r.impactSpeed;r.impactJolt=0;}states.clear();events.length=effects.length=0;lastEvent.clear();},inspect,draw(g){g.save();for(const e of effects){g.globalAlpha=e.life/e.max;g.fillStyle='#efcf82';g.fillRect(e.x-1,e.y-1,2,2);}g.globalAlpha=1;if(io.debug){g.font='10px monospace';g.fillStyle='#fff1aa';for(const b of states.values())if(b.active)g.fillText(b.ref.id+' m'+b.mass+' v'+b.vx.toFixed(0)+','+b.vy.toFixed(0)+' w'+b.omega.toFixed(2)+' '+b.ref.impactState,b.ref.x-60,b.ref.y-45);const e=events.at(-1);if(e){g.strokeStyle='#ff9860';g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+e.nx*36,e.y+e.ny*36);g.stroke();g.fillText('J '+e.impulse.toFixed(1),e.x,e.y-12);}}g.restore();},camera:()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(time*73)*shake});
}
window.ROOKIE_WILD_ARCADE=Object.freeze({create,contact,tuning:T});
})();

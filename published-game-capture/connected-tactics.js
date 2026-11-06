/* The existing Hale/warehouse controllers, operating at 1:1 scale on the
 * actual connected floor, cover and camera. No scene swap or extra clock. */
(function connectedTactics(o){
 'use strict';
 const {H,api,campus}=o,configs=new Map(),homes=new Map(),handlers=new WeakMap();let current=null,running=null;
 const owns=()=>!!window.ROOKIE_MAIN_CITY_ACTIVE&&api.isOpen()&&!H.academy.active()&&!H.outbreak.active();
 function freePoint(room,fx,fy){const f=room.floor,x=f.x+f.w*fx,y=f.y+f.h*fy;for(let r=0;r<100;r+=12)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]])if(x+dx>f.x+24&&x+dx<f.x+f.w-24&&y+dy>f.y+24&&y+dy<f.y+f.h-24&&!o.blocked(x+dx,y+dy,13,true,false,true))return{x:x+dx-f.x,y:y+dy-f.y};return {x:f.w/2,y:f.h-42};}
 function config(id){if(running!==id)return null;return configs.get(id);}
 function make(room){
  if(configs.has(room.map))return configs.get(room.map);const f=room.floor;
  const solids=[...room.walls,...room.furniture.filter(p=>p.solid)].map(p=>({...p,x:p.x-f.x,y:p.y-f.y}));
  const npc=freePoint(room,.72,.55),threat=freePoint(room,.3,.56),entry={x:room.door.x-f.x-13,y:room.door.y-f.y-38};
  const map={...o.maps[room.map],w:f.w,h:f.h,solids,visionSolids:solids,walls:solids,furn:room.furniture.map(p=>({...p,x:p.x-f.x,y:p.y-f.y})),rooms:[{x:0,y:0,w:f.w,h:f.h}]};
  const c={id:room.map,floor:f,map,npc:{...o.maps.warehouse.npcs.find(n=>n.talk==='reyes'),...npc},home:{...npc},threat,entry,door:{x:room.door.x-f.x,y:room.door.y-f.y}};configs.set(room.map,c);return c;
 }
 function context(id,fn,draw=false){const c=configs.get(id);if(!c)return false;const old=running;running=id;try{return o.context(c,fn,draw);}finally{running=old;}}
 function control(id,fn){return (...args)=>context(id,()=>fn(...args));}
 function host(id){const el=document.getElementById(id==='hale'?'haleTools':'tacticalTools');if(!el)return;
  if(!homes.has(el)){homes.set(el,{parent:el.parentNode,next:el.nextSibling});o.modal.appendChild(el);for(const b of el.querySelectorAll('button'))if(b.onclick){if(!handlers.has(b))handlers.set(b,b.onclick);b.onclick=control(id,handlers.get(b));}}
 }
 function reset(){if(current){H.haleTactical.reset();H.tactical.reset();current=null;}for(const [el,h]of homes){el.style.display='none';h.parent.insertBefore(el,h.next?.parentNode===h.parent?h.next:null);}homes.clear();}
 function sync(){
  if(!owns()){reset();return null;}const room=o.room(),id=room?.map;
  if(!['hale','warehouse'].includes(id)){reset();return null;}
  if(current&&current!==id)reset();make(room);current=id;host(id);
  return id;
 }
 function step(dt,moved=0){const id=sync();if(!id)return;context(id,()=>id==='hale'?H.haleTactical.update(dt):H.tactical.update(dt,moved));
  if(id==='warehouse'){const c=configs.get(id),a=o.actors.find(n=>n.storyRoom==='warehouse'&&n.talk==='reyes'),s=context(id,()=>H.tactical.status());if(a&&s?.active){a.x=c.floor.x+s.npc.x;a.y=c.floor.y+s.npc.y;const sp=o.spots.find(s=>s.id===a.id);if(sp){sp.x=a.x;sp.y=a.y+15;}}}
 }
 function paint(){const id=sync();if(id)context(id,()=>id==='hale'?H.haleTactical.paint():H.tactical.paint(),true);}
 function begin(id){if(sync()!==id)return false;return context(id,()=>id==='hale'?H.haleTactical.begin():H.tactical.active());}
 function key(k,down){if(!current||!owns()||!down)return false;const actions=current==='hale'?{t:()=>H.haleTactical.talk(),b:()=>H.haleTactical.backup(),o:()=>H.haleTactical.observe(),f:()=>H.haleTactical.fire(),q:()=>H.haleTactical.aim((H.haleTactical.status().angle||0)+Math.PI/8),c:()=>H.haleTactical.aim((H.haleTactical.status().angle||0)-Math.PI/8)}:{c:()=>H.tactical.toggleQuiet(),q:()=>H.tactical.turn()};if(!actions[k])return false;context(current,actions[k]);return true;}
 // Native button handlers are reused; the connected aim pad sends the same
 // aim API angles, using its existing room/camera instead of a second view.
 const pad=document.getElementById('haleAim');let pointer=null;
 pad?.addEventListener('pointerdown',e=>{if(current!=='hale')return;pointer={id:e.pointerId,x:e.clientX};pad.setPointerCapture(e.pointerId);});
 pad?.addEventListener('pointermove',e=>{if(pointer?.id!==e.pointerId)return;const dx=e.clientX-pointer.x;pointer.x=e.clientX;context('hale',()=>H.haleTactical.aim((H.haleTactical.status().angle||0)+dx*.012));});
 for(const type of ['pointerup','pointercancel'])pad?.addEventListener(type,()=>pointer=null);
 return Object.freeze({owns,executing:id=>running===id,action:context,config,sync,step,paint,begin,key,reset,
  interact:sp=>current==='warehouse'&&sp.nativeMap==='warehouse'&&sp.nativeId==='npc:reyes'?(context('warehouse',()=>H.tactical.talk()),true):false,
  actorVisible:a=>current!=='warehouse'||a.storyRoom!=='warehouse'||!context('warehouse',()=>H.tactical.active())||context('warehouse',()=>{const c=configs.get('warehouse');return H.tactical.visible(a.x-c.floor.x,a.y-c.floor.y);}),
  drawThreat:(g,a,raised)=>{if(running!=='hale')return false;const painted=window.ROOKIE_CIVILIANS?.draw(g,{x:a.x,y:a.y,name:'UNKNOWN PERSON',civilianRole:'resident',dir:'down',moving:false});if(painted&&raised){g.fillStyle='#263844';g.fillRect(a.x+11,a.y-22,13,5);g.fillStyle='#b9c3c6';g.fillRect(a.x+16,a.y-22,8,2);}return !!painted;},
  quiet:()=>current==='warehouse'&&context('warehouse',()=>H.tactical.status().quiet),
  inspect:()=>({room:current,configs:[...configs.values()].map(c=>({id:c.id,floor:c.floor,solids:c.map.solids,threat:c.threat,home:c.home})),hale:current==='hale'?context('hale',()=>H.haleTactical.status()):null,warehouse:current==='warehouse'?context('warehouse',()=>H.tactical.status()):null})});
})

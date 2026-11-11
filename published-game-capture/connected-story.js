/* Local connected-world adapter. Canonical case handlers, cast artwork and
 * profile saves remain authoritative. Compiled inside the existing campus. */
(function connectedStory(o){
 'use strict';
 const {H,ST,MAPS,STX,STY,PLX,PLY,campus,modal,npcActors,worldSpots,districtEntries}=o;
 let sourceActors=null,spotKey='',arcKey='',profile='',resumeActivity=false;
 const interiors=[],buildingOwners=new WeakMap(),clearedProps=[];let interiorsReady=false,clearClock=0,clearAttempts=0;
 const familyNames={jay:'PAPI',rosa:'ROSA',kaleb:'KALEB',gigi:'GIGI',lingling:'SARITAH'};
 const seats={jay:[625,854],rosa:[700,850],kaleb:[1480,220],gigi:[1500,130],lingling:[1690,250]};
 const familyKey=n=>n==='PAPI'||n==='GUIDE JAY'?'jay':n==='SARITAH'?'lingling':H.family?.key(n,false);
 const nativePanels=['hcAssignmentBoard','caperNotebook','dbOverlay','lockerOverlay','hcCells','hcStoryOverlay','invPage','manualOverlay'];
 if(window.ROOKIE_MAIN_CITY_ACTIVE)nativePanels.push('shiftOverlay','endOverlay','resetModal');
 // Reparent the existing panels so their own callbacks/focus handling work
 // above this canvas. Restore their original homes when leaving the city.
 const homes=new Map();
 function hostPanels(){for(const id of nativePanels){const p=document.getElementById(id);if(p&&p.parentNode!==modal){homes.set(p,{parent:p.parentNode,next:p.nextSibling});modal.appendChild(p);}}}
 function restorePanels(){for(const [p,h] of homes)h.parent.insertBefore(p,h.next?.parentNode===h.parent?h.next:null);homes.clear();}
 function sync(){
  if(H.academy?.active()||H.outbreak?.active())return;
  hostPanels();const current=H.profiles.current();
  const currentSpots=ST.spots.filter(s=>s.arcChapter===undefined),key=currentSpots.map(s=>s.id).join('|');
  if(sourceActors===ST.npcs&&spotKey===key&&profile===current)return;
  sourceActors=ST.npcs;spotKey=key;profile=current;
  for(let i=npcActors.length-1;i>=0;i--)if(npcActors[i].storyStation)npcActors.splice(i,1);
  for(let i=worldSpots.length-1;i>=0;i--)if(worldSpots[i].areaId==='station'||worldSpots[i].storyStation)worldSpots.splice(i,1);
  const actors=ST.npcs.slice();for(const n of H.connectedOriginalStation||[])if(!actors.some(a=>a.name===n.name))actors.push({...n,legacy:true});const seen=new Set(actors.map(a=>a.familyId||familyKey(a.name)).filter(Boolean));
  for(const [id,name] of Object.entries(familyNames))if(id!==current&&!seen.has(id))actors.push({name,familyId:id,x:seats[id][0],y:seats[id][1],talk:'caperFamily'+id});
  const placedFamily=new Set([current]);
  for(const [i,n] of actors.entries()){
   const key=n.familyId||familyKey(n.name);
   if(key){if(placedFamily.has(key))continue;placedFamily.add(key);}
   const a={...n,id:'station-npc:'+i,source:n,storyStation:true,familyId:key,x:n.x+STX,y:n.y+STY};if(n.legacy&&o.blocked(a.x,a.y)){const room=ST.rooms.find(r=>n.x>=r.x&&n.x<r.x+r.w&&n.y>=r.y&&n.y<r.y+r.h);let found=false;for(let r=16;r<=112&&!found;r+=16)for(let dx=-r;dx<=r&&!found;dx+=16)for(let dy=-r;dy<=r;dy+=16){const x=n.x+dx,y=n.y+dy;if(room&&(x<room.x+16||x>room.x+room.w-16||y<room.y+16||y>room.y+room.h-16))continue;if(!o.blocked(x+STX,y+STY)){a.x=x+STX;a.y=y+STY;found=true;break;}}}npcActors.push(a);
   if(n.talk)worldSpots.push({id:a.id,x:a.x,y:a.y+18,label:'Talk to '+n.name,nativeMap:'station',nativeId:n.legacy&&['chen','park'].includes(n.talk)?'legacy:'+n.talk:!H.caper?.active()&&n.talk.startsWith('caperFamily')?'family:'+key:'npc:'+n.talk,nativeX:n.x,nativeY:n.y,storyStation:true,sourceActor:n});
  }
  for(const s of currentSpots)if(!s.to)worldSpots.push({...s,id:'station:'+s.id,areaId:'station',x:s.x+STX,y:s.y+STY,nativeMap:'station',nativeId:s.id,nativeX:s.x,nativeY:s.y,storyStation:true});
  initInteriors();
 }
 function duplicate(a){const id=a.familyId||familyKey(a.name);return id===profile||npcActors.some(n=>n.storyStation&&(n.name===a.name||id&&n.familyId===id));}
 function drawActor(a){if(!a.storyStation&&!a.storyInterior)return false;if(!o.actorVisible(a.source)||!available(a,campus.x,campus.y))return true;if(H.connectedTactics&&!H.connectedTactics.actorVisible(a))return true;if(window.ROOKIE_CIVILIANS?.draw(g,a))return true;o.paintActor(a);return true;}
 function drawPlayer(p){const id=H.profiles.current();if(id==='jay')return false;o.paintActor({...p,name:familyNames[id],dir:campus.dir,moving:campus.moved,distance:campus.stride/.055,source:{x:p.x,y:p.y}},true);return true;}
 function interact(sp){
  if(!sp?.nativeMap||H.academy?.active()||H.outbreak?.active())return false;
  if(sp.nativeId==='trafficStop'&&H.mainCity)return H.mainCity.beginTraffic(sp,()=>o.dispatch(sp.nativeMap,sp.nativeX,sp.nativeY,sp.nativeId));
  if(H.connectedTactics?.interact(sp))return true;
  o.clearInput();o.dispatch(sp.nativeMap,sp.nativeX,sp.nativeY,sp.nativeId);sync();return true;
 }
 function initInteriors(){
  if(interiorsReady)return;const marina=window.ROOKIE_V116_MARINA;if(!marina?.interiors)return;
  interiorsReady=true;
  // Case-only rebuilds use the existing building footprint, a 64px doorway,
  // perimeter furnishings and a clear central aisle. No whole-map shrinking.
  const wanted=new Set(Object.keys(MAPS).filter(id=>MAPS[id].indoor&&!['station','training'].includes(id)));
  for(const d of districtEntries)for(const s of d.map.spots||[]){
   const map=s.to?.map||(s.id==='haleDoor'?'hale':s.id==='shed'?'shedint':null);if(!wanted.has(map)||interiors.some(b=>b.map===map))continue;
   const native=MAPS[map],existing=map==='marina'?marina.interiors.find(b=>b.kind==='office'):map==='shedint'?marina.interiors.find(b=>b.kind==='workshop'):null;
   const candidates=(d.map.decors||[]).map(object=>({object,box:o.buildingBox(object)})).filter(b=>b.box);
   candidates.sort((a,b)=>Math.hypot(a.box.x+a.box.w/2-s.x,a.box.y+a.box.h-s.y)-Math.hypot(b.box.x+b.box.w/2-s.x,b.box.y+b.box.h-s.y));
   const match=candidates[0];if(!existing&&!match)continue;
   const e=existing?.exterior||{...match.box,x:d.x+match.box.x,y:d.y+match.box.y};
   const floor=existing?.floor||{x:e.x+8,y:e.y+24,w:e.w-16,h:e.h-30};
   const door=existing?.door||{x:e.x+e.w/2,y:floor.y+floor.h,w:64};
   const b={map,label:native.name,exterior:e,floor,door,existing,roof:1,furniture:[],walls:[],entry:{map:d.id,x:s.x,y:s.y,id:s.id}};interiors.push(b);
   if(!existing){
    buildingOwners.set(match.object,b);const left=door.x-32,right=door.x+32;
    b.walls=[{x:floor.x,y:floor.y,w:floor.w,h:6},{x:floor.x,y:floor.y,w:6,h:floor.h},{x:floor.x+floor.w-6,y:floor.y,w:6,h:floor.h},{x:floor.x,y:door.y-6,w:left-floor.x,h:6},{x:right,y:door.y-6,w:floor.x+floor.w-right,h:6}];
   }
   const clues=native.spots.filter(p=>!p.to&&p.arcChapter===undefined),roles={storeCamera:'desk',storeShelf:'shelf',storeRear:'cabinet',haleNote:'counter',halePhoto:'table',haleKey:'desk',whCrates:'crate',whManifest:'desk',whDock:'crate',harborLog:'desk',shedGoods:'crate',shedDesk:'table'};
   for(const [i,p] of clues.entries()){
    const x=floor.x+34+(floor.w-68)*(clues.length===1?.5:i/(clues.length-1)),y=floor.y+Math.min(48,floor.h*.37);
    const sp={id:'story:'+map+':'+p.id,label:p.label,x,y,nativeMap:map,nativeId:p.id,nativeX:p.x,nativeY:p.y,storyRoom:map};
    if(existing){const f=existing.furniture.find(f=>f.id.endsWith(map==='marina'?':desk':p.id==='shedDesk'?':workbench':':parts'));if(f){sp.x=f.x+f.w/2;sp.y=f.y+f.h+15;if(p.id==='shedGoods'){sp.x=f.x-16;sp.y=f.y+f.h/2;}}}
    else b.furniture.push({x:x-24,y:y-31,w:48,h:16,type:roles[p.id]||'table',solid:true});
    worldSpots.push(sp);
   }
   for(const [i,n] of native.npcs.entries()){
    const a={...n,id:'story:'+map+':npc:'+i,source:n,storyInterior:true,storyRoom:map,x:floor.x+floor.w*(.35+(i%2)*.3),y:floor.y+Math.min(floor.h-45,80+Math.floor(i/2)*64),dir:'down'};npcActors.push(a);
    worldSpots.push({id:a.id,label:'Talk to '+n.name,x:a.x,y:a.y+15,nativeMap:map,nativeId:'npc:'+n.talk,nativeX:n.x,nativeY:n.y,storyRoom:map,sourceActor:n});
   }
   // Exterior entry remains inspectable for locked houses/sheds, preserving
   // the original authorization dialogue before those thresholds open.
   const sp=worldSpots.find(p=>p.id===d.id+':'+s.id);
   if(sp){Object.assign(sp,{x:door.x,y:door.y+20,nativeMap:d.id,nativeId:s.id,nativeX:s.x,nativeY:s.y});}
  }
  // Outdoor case witnesses retain their canonical talks and save callbacks.
  for(const s of MAPS.plaza.spots||[])if(!s.to&&s.arcChapter===undefined)worldSpots.push({id:'plaza:'+s.id,areaId:'plaza',x:PLX+s.x,y:PLY+s.y,label:s.label,nativeMap:'plaza',nativeId:s.id,nativeX:s.x,nativeY:s.y});
  const diaz=npcActors.find(n=>n.id==='campus-npc:diaz'),nativeDiaz=MAPS.plaza.npcs.find(n=>n.talk==='diaz');
  if(diaz&&nativeDiaz){diaz.source=nativeDiaz;diaz.storyInterior=true;worldSpots.push({id:'plaza:npc:diaz',x:diaz.x,y:diaz.y+15,label:'Talk to '+diaz.name,nativeMap:'plaza',nativeId:'npc:diaz',nativeX:nativeDiaz.x,nativeY:nativeDiaz.y});}
  for(const d of districtEntries){
   for(const [i,n] of (d.map.npcs||[]).entries())if(n.talk){const a=npcActors.find(a=>a.id===d.id+':npc:'+i);if(a){a.source=n;a.storyInterior=true;worldSpots.push({id:a.id,label:'Talk to '+n.name,x:a.x,y:a.y+15,nativeMap:d.id,nativeId:'npc:'+n.talk,nativeX:n.x,nativeY:n.y});}}
   for(const s of d.map.spots||[]){const sp=worldSpots.find(p=>p.id===d.id+':'+s.id);if(sp&&!s.to&&!sp.nativeMap)Object.assign(sp,{nativeMap:d.id,nativeId:s.id,nativeX:s.x,nativeY:s.y});}
  }
 }
 // Only the connected placement is owned here. The original Story journal
 // still owns chapter gates, questions, evidence, decisions and save flags.
 const arcAnchors={
  'arc:0:0':['whManifest',0,34],
  'arc:0:1':['npc:marco',0,36],
  'arc:2:1':['whCrates',0,34],
  'arc:3:1':['npc:almeida',0,36],
  'arc:5:1':['npc:ana',0,34],
  'arc:6:0':['npc:sergeant',0,36]
 };
 function arcPosition(map,nativeX,nativeY,anchor){
  const room=interiors.find(b=>b.map===map),d=districtEntries.find(b=>b.id===map);
  const npc=anchor&&worldSpots.find(s=>s.nativeMap===map&&s.nativeId===anchor[0]);
  const origin=npc?{x:npc.x+anchor[1],y:npc.y+anchor[2]}:room?{
   x:room.floor.x+room.floor.w*nativeX/MAPS[map].w,
   y:room.floor.y+room.floor.h*nativeY/MAPS[map].h
  }:locate(map,nativeX,nativeY);
  if(!origin)return null;
  const fits=(x,y)=>(!room||roomAt(x,y)===room)&&
   (!d||(x>d.x+12&&y>d.y+12&&x<d.x+d.w-12&&y<d.y+d.h-12))&&
   !worldSpots.some(s=>!s.ambientActor&&!s.campaignHidden&&Math.hypot(s.x-x,s.y-y)<24)&&
   !o.blocked(x,y,16,true,false,true);
  if(fits(origin.x,origin.y))return origin;
  for(let r=12;r<=144;r+=12)for(const [dx,dy] of [[0,r],[r,0],[-r,0],[0,-r],[r,r],[-r,r],[r,-r],[-r,-r]]){
   const x=origin.x+dx,y=origin.y+dy;
   if(fits(x,y))return {x,y};
  }
  return null;
 }
 function syncArc(){
  if(!window.ROOKIE_MAIN_CITY_ACTIVE||!interiorsReady)return;
  const a=H.arc(),chapter=H.objective()?H.chapters[a.index]:null;
  const key=chapter?profile+':'+a.index+':'+a.steps.join(','):'';
  if(key===arcKey)return;
  arcKey=key;
  for(let i=worldSpots.length-1;i>=0;i--)if(worldSpots[i].connectedArc)worldSpots.splice(i,1);
  if(!chapter)return;
  for(const [j,[map,nativeX,nativeY,label]] of chapter.steps.entries()){
   if(a.steps.includes(j))continue;
   const nativeId='arc:'+a.index+':'+j;
   const p=arcPosition(map,nativeX,nativeY,arcAnchors[nativeId]);
   if(p)worldSpots.push({...p,id:map+':'+nativeId,label,nativeMap:map,nativeId,nativeX,nativeY,
    connectedArc:true,storyRoom:interiors.some(b=>b.map===map)?map:null});
  }
 }
 function clearEntrances(){
  for(const b of interiors){if(b.existing)continue;const d=districtEntries.find(d=>d.id===b.entry.map);if(!d)continue;
   const removed=new Set();for(const prop of d.map.decors||[]){if(!/flower|planter|hedge|bench|bin/i.test([prop.role,prop.img,prop.t].join(' ')))continue;
    const p=o.nativeProp(prop)||window.ROOKIE_V127_CITY?.propGeometry?.(prop,{x:0,y:0});if(!p)continue;const box={x:d.x+p.x,y:d.y+p.y,w:p.w,h:p.h};
    if(box.x<b.door.x+42&&box.x+box.w>b.door.x-42&&box.y<b.door.y+100&&box.y+box.h>b.door.y-8){removed.add(prop);clearedProps.push(box);}
   }if(removed.size)d.map={...d.map,decors:d.map.decors.filter(p=>!removed.has(p))};
  }
 }
 function roomAt(x,y){return interiors.find(b=>x>b.floor.x+6&&x<b.floor.x+b.floor.w-6&&y>b.floor.y+6&&y<b.door.y)||null;}
 function available(sp,x,y){return !sp.campaignHidden&&(!sp.sourceActor||o.actorVisible(sp.sourceActor))&&(!sp.storyRoom||roomAt(x,y)?.map===sp.storyRoom);}
 function step(dt){initInteriors();syncArc();clearClock+=dt;if(clearClock>.5&&clearAttempts<8){clearClock=0;clearAttempts++;clearEntrances();}for(const b of interiors){const near=Math.abs(campus.x-b.door.x)<b.door.w/2&&Math.abs(campus.y-b.door.y)<24;const target=roomAt(campus.x,campus.y)===b||near?0:1;b.roof+=(target-b.roof)*(1-Math.exp(-12*dt));}}
 function ownsSolid(r){if(clearedProps.some(p=>r.w<=p.w+12&&r.h<=p.h+12&&r.x<p.x+p.w&&r.x+r.w>p.x&&r.y<p.y+p.h&&r.y+r.h>p.y))return true;return interiors.some(b=>!b.existing&&r.x>=b.exterior.x-18&&r.y>=b.exterior.y-18&&r.x+r.w<=b.exterior.x+b.exterior.w+18&&r.y+r.h<=b.exterior.y+b.exterior.h+18&&r.w>b.exterior.w*.45&&r.h>b.exterior.h*.4);}
 function collides(x,y,r){if(x>=STX+768&&x<=STX+1148&&y>=STY+796&&y<=STY+1040&&(ST.pedSolids||ST.solids).some(p=>p.x>=780&&p.x<1140&&p.y>=808&&o.circleHitsRect(x,y,r,{...p,x:p.x+STX,y:p.y+STY})))return true;return interiors.some(b=>[...b.walls,...b.furniture,...(!o.canEnter(b.map)?[{x:b.door.x-b.door.w/2,y:b.door.y-6,w:b.door.w,h:12}]:[])].some(p=>o.circleHitsRect(x,y,r,p)));}
 function objective(){const goal=H.objective()||(H.caper?.active()?H.caper.objective():window.ROOKIE.objective());if(!goal)return null;const sp=worldSpots.find(s=>s.nativeMap===goal.map&&s.nativeId===goal.spot);if(!sp)return null;const b=interiors.find(b=>b.map===sp.storyRoom);return b&&roomAt(campus.x,campus.y)!==b?{x:b.door.x,y:b.door.y+22}:sp;}
 function ground(g){const target=objective();if(target){g.save();g.strokeStyle='#ffdc76';g.lineWidth=3;g.beginPath();g.arc(target.x,target.y,14,0,Math.PI*2);g.stroke();g.restore();}for(const b of interiors)if(!b.existing&&b.roof<.995){const f=b.floor;g.save();g.fillStyle=b.map==='warehouse'?'#727d7e':'#d6c7aa';g.fillRect(f.x,f.y,f.w,f.h);g.strokeStyle='#9c947f';g.lineWidth=1;for(let y=f.y;y<f.y+f.h;y+=24){g.beginPath();g.moveTo(f.x,y);g.lineTo(f.x+f.w,y);g.stroke();}for(let x=f.x;x<f.x+f.w;x+=24){g.beginPath();g.moveTo(x,f.y);g.lineTo(x,f.y+f.h);g.stroke();}for(const w of b.walls){g.fillStyle='#405262';g.fillRect(w.x,w.y-12,w.w,w.h+12);}g.restore();for(const f of b.furniture)o.drawFurniture(f);}}
 function roofFor(object){return buildingOwners.get(object)?.roof??1;}
 function locate(map,x,y){
  const b=interiors.find(b=>b.map===map);if(b)return {x:b.door.x,y:b.door.y-24};
  if(map==='station')return {x:STX+x,y:STY+y};if(map==='plaza')return {x:PLX+x,y:PLY+y};
  const d=districtEntries.find(d=>d.id===map);return d?{x:d.x+x,y:d.y+y}:null;
 }
 function travel(map,x,y){if(!campus.open||!o.canEnter(map))return false;const p=locate(map,x,y);if(!p)return false;campus.x=p.x;campus.y=p.y;campus.follow=true;return true;}
 function blocked(){return !!o.nativeOverlay();}
 function activity(){
  if(!H.academy?.active()&&!H.outbreak?.active())return false;
  resumeActivity=true;o.close();return true;
 }
 // The existing Academy toggles this control on entry/exit. Observe that
 // lifecycle instead of adding a polling timer or changing simulation code.
 const tools=document.getElementById('trainingTools');
 const observer=tools?new MutationObserver(()=>{
  if(resumeActivity&&!H.academy?.active()&&!H.outbreak?.active()&&!H.profiles.isOpen()){
   resumeActivity=false;o.openAt(STX+633,STY+819,1.1);
  }
 }):null;
 observer?.observe(tools,{attributes:true,attributeFilter:['style','class']});
 return {sync,duplicate,drawActor,drawPlayer,interact,blocked,activity,restorePanels,available,step,ground,roofFor,ownsSolid,collides,travel,locate,roomData:()=>roomAt(campus.x,campus.y),room:()=>roomAt(campus.x,campus.y)?.map||null,
  qa:()=>({profile,clearedEntranceProps:clearedProps.length,near:campus.near?.id,interiors:interiors.map(b=>({map:b.map,floor:b.floor,door:b.door,roof:b.roof,locked:!o.canEnter(b.map)})),actors:npcActors.filter(n=>n.storyStation||n.storyInterior).map(n=>({id:n.id,name:n.name,familyId:n.familyId,x:n.x,y:n.y})),spots:worldSpots.filter(s=>s.nativeMap).map(s=>({...s}))})};
})

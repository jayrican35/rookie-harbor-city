/* Main-world lifecycle, compiled in the existing engine scope. No new game loop. */
(function connectedMain(o){
 'use strict';
 const {H,api,campus}=o;
 let owner=null,profile=null,lastSave=0,launching=false;
 const isolated=()=>!!(H.academy?.active()||H.outbreak?.active());
 function beginEncounter(map){return H.connectedTactics?.begin(map)||false;}
 function beginTraffic(sp,dispatch){
  if(isolated()||!api.isOpen()||H.speech.current())return false;
  save();return H.campaignScenes?.startTraffic(sp,dispatch)||false;
 }
 const panels=['familySelect','menuPage','mapOverlay','invPage','manualOverlay','tutOverlay','avOverlay','hcStoryOverlay','fade','lbTop','lbBot','csTitle','csCaption','btnSkipCs'];
 const homes=new Map();
 function host(){document.body.classList.remove('main-activity-open');for(const id of panels){const el=document.getElementById(id);if(el&&el.parentNode!==document.getElementById('v115Campus')){if(!homes.has(el))homes.set(el,{parent:el.parentNode,next:el.nextSibling});document.getElementById('v115Campus').appendChild(el);}}}
 function suspend(){document.body.classList.add('main-activity-open');for(const [el,h]of homes){if(h.parent?.isConnected)h.parent.insertBefore(el,h.next?.parentNode===h.parent?h.next:null);}homes.clear();}
 function persist(){
  if(!api.isOpen()||isolated()||H.campaignScenes?.active()||H.profiles.isOpen()||o.state()!==owner||H.profiles.current()!==profile)return;
  const s=api.snapshot();o.state().connectedWorld={schema:1,worldId:'harbor-main',x:s.x,y:s.y,dir:s.dir,zoom:s.zoom};
 }
 const nativeSave=o.getSave();
 function save(){persist();return nativeSave();}
 o.setSave(save);H.save=save;H.profiles.save=save;
 function safePoint(p){
  if(p&&!api.test.blocked(p.x,p.y))return p;
  if(p)for(let r=16;r<=256;r+=16)for(const [dx,dy]of [[0,r],[r,0],[-r,0],[0,-r]])if(!api.test.blocked(p.x+dx,p.y+dy))return {x:p.x+dx,y:p.y+dy};
  return {x:948,y:1210};
 }
 function resume(){
  if(launching||isolated()||H.profiles.isOpen()||H.speech?.current())return;
  host();let state=o.state();const id=H.profiles.current();
  if(api.isOpen()&&owner===state&&profile===id)return;
  launching=true;
  try{
   const marker='rookie:connected-main:migrated:'+id;
   if(!localStorage.getItem(marker)){
    const raw=window.ROOKIE_MAIN_SAVES?.[id];
    if(raw){try{const candidate=JSON.parse(raw);H.validateSave(candidate);H.importSave(candidate);state=o.state();}catch(error){console.warn('Connected save migration retained the original profile:',error.message);}}
    localStorage.setItem(marker,'1');
   }
   const saved=state.connectedWorld;
   const migrated=api.legacyLocation(state.map,(state.pos?.x||0)+13,(state.pos?.y||0)+13);
   const p=safePoint(saved?.worldId==='harbor-main'?saved:migrated);
   // Classic driving is parked on migration; Unit 9 remains the single
   // profile-owned connected cruiser and keeps its already saved position.
   if(state.inCar&&!state.connectedCruiser){const car=state.car,q=car&&api.legacyLocation(car.map,car.x,car.y);if(q&&!api.test.blocked(q.x,q.y,24,true,true,true))state.connectedCruiser={id:'precinct-unit-9',x:q.x,y:q.y,angle:car.angle||0,lightMode:car.lights?'alternating':'off'};}
   state.inCar=false;
   if(state.map==='training')o.nativePlace('station',560,880);
   if(api.openAt(p.x,p.y,saved?.zoom||.9)){campus.dir=saved?.dir||'down';owner=state;profile=id;save();H.mainOpening?.maybeStart();}
  }finally{launching=false;}
 }
 function openNative(type){
  if(isolated())return;host();persist();
  if(type==='profiles')return H.profiles.open();
  document.getElementById({menu:'btnMenu',map:'btnMap',gear:'btnInv'}[type]||'btnMenu')?.click();
 }
 function tick(t){if(H.profiles.isOpen())return;if(owner!==o.state()||profile!==H.profiles.current())resume();H.mainOpening?.maybeStart();if(t-lastSave>2000){lastSave=t;save();}}
 const watcher=new MutationObserver(resume);
 for(const id of ['familySelect','dlgPanel','trainingTools']){const el=document.getElementById(id);if(el)watcher.observe(el,{attributes:true,attributeFilter:['class','style','hidden']});}
 window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
 // Native dialogs remain on top of the same city canvas. Combat simulations
 // retain their original entry/exit lifecycle and renderer.
 document.body.classList.add('rookie-main-city');
 document.getElementById('v115Campus')?.setAttribute('aria-label','Harbor City');
 document.querySelector('#v115Campus .v115-campus-brand')?.replaceChildren(document.createTextNode('ROOKIE: HARBOR CITY'));
 H.mainCity=Object.freeze({resume,openNative,tick,persist,save,suspend,beginEncounter,beginTraffic,activityActive:()=>false,travel:(map,x,y)=>{const m=MAPS[map];return !!m&&api.travelStory(map,Number.isFinite(x)?x:m.spawn?.x??560,Number.isFinite(y)?y:m.spawn?.y??880);},mode:'connected',schema:1});
 // Character selection uses the same city as its backdrop. Do not import,
 // advance or autosave an unselected profile while this panel is open.
 host();if(H.profiles.isOpen()&&!isolated()){const map=o.state().map;if(map==='training')o.state().map='station';api.openAt(948,1210,.9);o.state().map=map;}
 requestAnimationFrame(resume);
})

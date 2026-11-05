/* Scene direction only. The native campus clock, pedestrian routes, cameraFollow
 * and H.speech own simulation, rendering, projection and dialogue advancement. */
(()=>{'use strict';
 const query=new URLSearchParams(location.search),KEY='precinctParkingEncounter';
 const ZONE=Object.freeze({x:590,y:1300,w:240,h:115});
 const LINES=Object.freeze([
  ['Chicken','OFFICER! THIS BANANA STOLE MY PARKING SPOT!'],
  ['Banana',"You don't even own a car."],
  ['Chicken','THAT IS COMPLETELY IRRELEVANT!'],
  ['Banana','Speaking of which... did you move those boxes?'],
  ['Chicken','WHAT BOXES?!'],
  ['Banana','The ones under your eyes. You look exhausted.'],
  ['Chicken','I DEMAND TO SPEAK TO YOUR SUPERVISOR!']
 ]);
 let ctx=null,owner=null,age=0,frontage=false,wasInside=false,pending=false,travel=0,last=null,scene=null,lastResult=null;
 function mode(){return !!window.HARBOR?.seamlessCampusV115?.isOpen()&&!window.HARBOR.outbreak?.active?.()&&!window.HARBOR.academy?.active?.()&&window.ROOKIE?.state()?.map!=='training';}
 function state(){return window.ROOKIE?.state();}
 function done(){return state()?.connectedEvents?.[KEY]===true;}
 function pair(){return[window.ROOKIE_CHICKEN?.actor(),window.ROOKIE_BANANA?.actor()];}
 function locked(){return !!scene;}
 function controlsActor(a){return !!scene&&scene.actors.includes(a);}
 function holds(a){return controlsActor(a)&&!scene.moving.has(a);}
 function face(a,b){const dx=b.x-a.x,dy=b.y-a.y;a.dir=Math.abs(dx)>=Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
 function ui(show){if(!ctx)return;let box=document.getElementById('parkingEncounterUI');if(!box){box=document.createElement('div');box.id='parkingEncounterUI';box.innerHTML='<span>A Very Suspicious Parking Spot</span><button id="parkingEncounterSkip" type="button">Skip scene</button>';ctx.host.appendChild(box);box.querySelector('button').onclick=()=>skip();}box.hidden=!show;ctx.host.classList.toggle('parking-encounter-active',show);}
 function snapshot(a){return{actor:a,route:a.route.map(p=>p.slice()),targetIndex:a.targetIndex,speed:a.speed,stepLength:a.stepLength,dir:a.dir};}
 function resetGate(){age=0;frontage=false;wasInside=false;pending=false;travel=0;last=null;}
 function start(dev=false){if(scene||!mode()||!ctx?.free||ctx.driving||pair().some(a=>!a))return false;
  const actors=pair();scene={phase:query.get('encounterPilot')==='1'?'pan':'stage',elapsed:0,lineTime:0,dev,owner:state(),profile:window.HARBOR.profiles.current(),actors,saved:actors.map(snapshot),camera:ctx.camera(),moving:new Set(),index:-1,skipped:false,prototype:query.get('encounterPilot')==='1'};
  actors.forEach(a=>{a.moving=false;});face(actors[0],actors[1]);face(actors[1],actors[0]);ctx.clearInput();ui(true);
  if(!scene.prototype){walk(actors[0],[[680,1356]],48);walk(actors[1],[[actors[1].x,1394],[750,1394],[750,1356]],48);}
  return true;
 }
 function walk(a,points,speed){let from=[a.x,a.y];for(const to of points){const steps=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/6));for(let i=1;i<=steps;i++)if(ctx.blocked(from[0]+(to[0]-from[0])*i/steps,from[1]+(to[1]-from[1])*i/steps,13)){scene.pathBlocked=true;returning(false);return false;}from=to;}
  a.route=[[a.x,a.y],...points.map(p=>p.slice())];a.targetIndex=1;a.speed=speed;a.stepLength=speed*.17;scene.moving.add(a);return true;
 }
 function arrived(a){const p=a.route[a.route.length-1];return Math.hypot(a.x-p[0],a.y-p[1])<2;}
 function beginDialogue(){const current=scene;scene.phase='dialogue';scene.elapsed=0;scene.index=0;scene.lineTime=0;const [a,b]=scene.actors;face(a,b);face(b,a);
  const styles=['angry','normal','excited','whisper','confusion','normal','angry'],script=scene.prototype?LINES.slice(0,2):LINES;
  window.HARBOR.comicDialogue.pop?.();const ok=window.ROOKIE_COMIC.sequence(script,{actors:scene.actors,quietText:LINES[3][1],stylesByText:Object.fromEntries(LINES.map((l,i)=>[l[1],styles[i]]))},()=>{if(scene!==current)return;if(scene.prototype)returning(true);else{scene.phase='storm';scene.elapsed=0;scene.moving.clear();walk(a,[[620,1356]],65);face(b,ctx.player);}});
  if(!ok)returning(false);
 }
 function poseFor(a){if(!controlsActor(a))return null;if(scene.moving.has(a))return null;if(scene.phase==='dialogue'){
   if(a.name==='Chicken')return[0,2,6].includes(scene.index)?'argue':'walk';
   if([1,3,5].includes(scene.index))return scene.index===5&&scene.lineTime<.25?'walk':'talk';
  }return'walk';
 }
 function portraitMood(speaker){if(!scene||scene.phase!=='dialogue')return null;return speaker==='Chicken'?scene.index===4?'confused':'angry':scene.index===3?'talking':'smug';}
 function remember(){if(!scene||scene.dev||state()!==scene.owner||window.HARBOR.profiles.current()!==scene.profile)return;
  const s=state();s.connectedEvents=Object.assign({},s.connectedEvents,{[KEY]:true});scene.savedOK=window.HARBOR.save()!==false;
 }
 function restoreActors(){if(!scene)return;for(const saved of scene.saved){const a=saved.actor;a.route=saved.route.map(p=>p.slice());a.targetIndex=saved.targetIndex;a.speed=saved.speed;a.stepLength=saved.stepLength;a.moving=false;}scene.moving.clear();if(scene.naturalEnd){const [a,b]=scene.actors;a.route=[[610,1356],[650,1356],[650,1384],[610,1384]];b.route=[[690,1356],[735,1356],[735,1384],[690,1384]];a.targetIndex=b.targetIndex=0;}}
 function returning(mark=true){if(!scene||scene.phase==='return')return;if(mark)remember();restoreActors();scene.phase='return';scene.elapsed=0;ctx.clearInput();}
 function finish(){if(!scene)return;ctx.restoreCamera(scene.camera);lastResult={profile:scene.profile,skipped:scene.skipped,dev:scene.dev,savedOK:scene.savedOK!==false,pathBlocked:!!scene.pathBlocked};scene=null;ui(false);ctx.clearInput();resetGate();}
 function skip(){if(!scene)return false;scene.skipped=true;window.HARBOR.comicDialogue.close();returning(true);return true;}
 function cancel(){if(!scene)return;const speech=window.HARBOR.speech.current();if(speech&&LINES.some(l=>l[0]===speech.speaker&&l[1]===speech.full))window.HARBOR.comicDialogue.close();restoreActors();ctx.restoreCamera(scene.camera);scene=null;ui(false);ctx.clearInput();resetGate();}
 function camera(){if(!scene)return null;if(scene.phase==='return')return{x:scene.camera.follow?ctx.player.x:scene.camera.x,y:scene.camera.follow?ctx.player.y:scene.camera.y,zoom:scene.camera.zoom,ease:7};
  const [a,b]=scene.actors;return{x:(a.x+b.x)/2,y:(a.y+b.y)/2-70,zoom:Math.max(.65,Math.min(1.35,(ctx.width-64)/300,(ctx.height-130)/330)),ease:4};
 }
 function tick(context,dt){ctx=context;if(!mode()){cancel();return;}const now=state();if(owner!==now){cancel();owner=now;resetGate();}
  const h=window.HARBOR;
  if(scene){scene.elapsed+=Math.min(.05,Math.max(0,dt));
   if(now!==scene.owner||h.profiles.current()!==scene.profile){cancel();return;}
   const [a,b]=scene.actors;
   if(scene.phase==='stage'){
    for(const actor of scene.actors)if(scene.moving.has(actor)&&arrived(actor)){scene.moving.delete(actor);actor.moving=false;}
    if(!scene.moving.size){face(a,b);face(b,a);scene.phase='pan';scene.elapsed=0;}else if(scene.elapsed>8)returning(false);
   }else if(scene.phase==='pan'&&scene.elapsed>=.9)beginDialogue();
   else if(scene.phase==='dialogue'){
    scene.lineTime+=Math.min(.05,Math.max(0,dt));const speech=h.speech.current();if(!speech&&scene.elapsed>.2){skip();return;}
    const i=LINES.findIndex(l=>l[0]===speech?.speaker&&l[1]===speech?.full);if(speech&&i<0){returning(false);return;}
    if(i>=0&&i!==scene.index){scene.index=i;scene.lineTime=0;scene.moving.clear();face(a,b);face(b,a);if(i===3)walk(b,[[740,1356]],22);if(i===5)face(b,ctx.player);}
    if(scene.moving.has(b)&&arrived(b)){scene.moving.delete(b);b.moving=false;}
   }else if(scene.phase==='storm'&&arrived(a)){scene.moving.clear();a.moving=false;scene.phase='glance';scene.elapsed=0;face(b,ctx.player);}
   else if(scene.phase==='glance'&&scene.elapsed>=.6){scene.phase='follow';scene.elapsed=0;walk(b,[[680,1356]],48);}
   else if(scene.phase==='follow'&&arrived(b)){scene.naturalEnd=true;returning(true);}
   else if(['storm','follow'].includes(scene.phase)&&scene.elapsed>4)returning(false);
   else if(scene.phase==='return'&&scene.elapsed>=1.15)finish();
   return;
  }
  age+=Math.min(.05,Math.max(0,dt));const p=ctx.player,inside=p.x>=ZONE.x&&p.x<=ZONE.x+ZONE.w&&p.y>=ZONE.y&&p.y<=ZONE.y+ZONE.h;
  if(ctx.room||p.x>=860&&p.x<=1100&&p.y>=1100&&p.y<1290)frontage=true;
  if(last&&!ctx.driving){const d=Math.hypot(p.x-last.x,p.y-last.y);if(d<25)travel+=d;}last={...p};
  if(!ctx.driving&&inside&&!wasInside&&frontage&&travel>=20)pending=true;if(!inside||ctx.driving)pending=false;wasInside=inside;
  if(age>=1&&pending&&ctx.free&&!done())start(false);
 }
 window.ROOKIE_PARKING_ENCOUNTER=Object.freeze({tick,locked,controlsActor,holds,camera,skip,cancel,poseFor,portraitMood,
  replay:()=>query.get('pilotQA')==='1'&&start(true),
  qa:()=>query.get('pilotQA')==='1'?{zone:ZONE,completed:done(),phase:scene?.phase||'idle',index:scene?.index??-1,prototype:!!scene?.prototype,profile:scene?.profile||hProfile(),armed:frontage,pending,travel,age,lastResult,script:LINES.map(l=>l.slice())}:null});
 function hProfile(){return window.HARBOR?.profiles.current();}
})();

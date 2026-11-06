/* Supplied city samples on the engine's shared AudioContext and SFX gain.
 * The existing city frame drives every trigger; no new clock or music player. */
window.ROOKIE_CITY_AUDIO_FACTORY=function cityAudio(o){
 'use strict';
 const pack=window.ROOKIE_CITY_AUDIO_PACK||{clips:[]},spec=new Map(pack.clips.map(c=>[c.id,c]));
 const buffers=new Map(),loads=new Map(),failed=new Map(),jobs=[],voices=new Set(),loops=new Map(),cooldowns=new Map(),passes=new WeakMap();
 let unlocked=false,focused=true,warmed=false,decoding=0,bus=null,bound=null,lastStep=null,nextScan=0,nextBird=0,nextPass=0,nextRev=0,previousDrive=null,previousSpeed=0,now=0;
 let listener={x:0,y:0},environment={zone:'city',indoors:false},vehicle=null;
 const history=[],counts={played:0,dropped:0,failed:0,maxVoices:0,maxLoops:0,decoded:0},probe=document.createElement('audio');
 const preferred=probe.canPlayType?.('audio/ogg; codecs="vorbis"')?'ogg':'mp3';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const allowed=()=>unlocked&&focused&&!document.hidden&&o.allowed()&&o.context()?.state==='running'&&o.gain()>0;
 function record(id,detail){history.push({id,at:now,...detail});if(history.length>64)history.shift();}
 function sharedBus(){const c=o.context();if(!c)return null;if(bound!==c){stop();bound=c;bus=c.createGain();bus.gain.value=0;bus.connect(c.destination);}return bus;}
 function pump(){const c=o.context();if(!c||!unlocked||!o.allowed())return;
  while(decoding<2&&jobs.length){const {id,resolve}=jobs.shift(),entry=spec.get(id);decoding++;
   const formats=[preferred,preferred==='ogg'?'mp3':'ogg'];
   async function decode(){let error;for(const format of formats){try{const response=await fetch('./assets/audio/city-ambient/'+entry.files[format]);if(!response.ok)throw Error('Missing '+id);return await c.decodeAudioData(await response.arrayBuffer());}catch(e){error=e;}}throw error;}
   decode().then(buffer=>{buffers.set(id,buffer);counts.decoded++;resolve(true);}).catch(()=>{failed.set(id,now+30000);counts.failed++;resolve(false);}).finally(()=>{decoding--;loads.delete(id);pump();});
  }
 }
 function load(id){if(buffers.has(id))return Promise.resolve(true);if(loads.has(id))return loads.get(id);if(!spec.has(id)||!o.context()||!unlocked||now<(failed.get(id)||0))return Promise.resolve(false);
  const promise=new Promise(resolve=>jobs.push({id,resolve}));loads.set(id,promise);pump();return promise;
 }
 function warm(){if(warmed||!o.context())return;warmed=true;for(const id of spec.keys())if(id.startsWith('footstep_')||['ambience_city_traffic','ambience_forest_birds','car_engine_idle_loop','car_horn_short','car_door_close'].includes(id))load(id);}
 function unlock(event){if(!o.allowed()||event&&event.isTrusted===false)return;o.unlock();unlocked=true;sharedBus();warm();}
 function dispose(v){if(!voices.has(v))return;voices.delete(v);for(const n of v.nodes)try{n.disconnect();}catch{}if(loops.get(v.slot)===v)loops.delete(v.slot);}
 function stopVoice(v,fade=0){if(!v||v.stopping)return;v.stopping=true;try{const c=o.context();v.gain.gain.cancelScheduledValues(c.currentTime);v.gain.gain.setTargetAtTime(0,c.currentTime,Math.max(.005,fade/4));v.source.stop(c.currentTime+fade);}catch{dispose(v);}}
 function stop(){for(const v of [...voices])stopVoice(v);loops.clear();if(bus&&bound)bus.gain.setValueAtTime(0,bound.currentTime);lastStep=null;}
 function spatial(origin,radius=320){if(!origin)return{gain:1,pan:0};const dx=origin.x-listener.x,dy=origin.y-listener.y,d=Math.hypot(dx,dy);return{gain:d>radius*1.5?0:1/(1+(d/radius)**2),pan:clamp(dx/radius,-.85,.85)};}
 function makeVoice(id,volume,origin,rate=1,slot=null){
  if(!allowed()||!sharedBus()||!buffers.has(id))return null;
  if(!slot&&[...voices].filter(v=>!v.slot&&!v.stopping).length>=6){counts.dropped++;return null;}
  const c=o.context(),s=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner?.(),position=spatial(origin);
  if(position.gain<=.001)return null;
  s.buffer=buffers.get(id);s.loop=!!slot;s.playbackRate.value=clamp(rate,.65,1.8);g.gain.value=volume*position.gain;
  const nodes=[s,g];s.connect(g);if(p){p.pan.value=position.pan;g.connect(p);p.connect(bus);nodes.push(p);}else g.connect(bus);
  const v={id,source:s,gain:g,pan:p,nodes,slot,volume,origin,stopping:false};voices.add(v);s.onended=()=>dispose(v);if(slot)loops.set(slot,v);s.start();
  counts.played++;counts.maxVoices=Math.max(counts.maxVoices,voices.size);counts.maxLoops=Math.max(counts.maxLoops,[...voices].filter(v=>v.slot).length);record(id,{loop:!!slot,volume,rate});return v;
 }
 function play(id,volume=.15,origin=null,rate=1,gap=0){if(!allowed()||now<(cooldowns.get(id)||0))return false;if(!buffers.has(id)){load(id);return false;}const voice=makeVoice(id,volume,origin,rate);if(!voice)return false;if(gap)cooldowns.set(id,now+gap);return true;}
 function loop(slot,id,volume,origin=null,rate=1){const old=loops.get(slot);if(!id||volume<=.001){if(old){loops.delete(slot);stopVoice(old,.35);}return;}
  if(old&&old.id!==id){loops.delete(slot);stopVoice(old,.35);}const v=loops.get(slot);
  if(!v){if(!buffers.has(id)){load(id);return;}makeVoice(id,volume,origin,rate,slot);return;}
  const c=o.context(),p=spatial(origin);v.volume=volume;v.origin=origin;v.gain.gain.setTargetAtTime(volume*p.gain,c.currentTime,.12);if(v.pan)v.pan.pan.setTargetAtTime(p.pan,c.currentTime,.12);v.source.playbackRate.setTargetAtTime(clamp(rate,.65,1.8),c.currentTime,.12);
 }
 function footstep(p){const index=Math.floor(p.stride/Math.PI);if(lastStep===null){lastStep=index;return;}if(index===lastStep)return;lastStep=index;
  if(!p.moved||vehicle?.driving||environment.paused)return;const material=o.surface(),running=p.speed>250;
  const ids=material==='wood'?['footstep_wood_01','footstep_wood_02']:material==='grass'||material==='earth'||material==='sand'?['footstep_grass_01','footstep_grass_02','footstep_grass_03']:running?['footstep_run_pavement']:['footstep_pavement_01','footstep_pavement_02','footstep_pavement_03'];
  const id=ids[Math.abs(index)%ids.length];play(id,.18,null,running?1.04:1,90);
 }
 function tick(t){now=t;const p=o.player();listener={x:p.x,y:p.y};
  if(o.allowed()&&o.context()?.state==='running'){unlocked=true;warm();pump();}
  if(!allowed()){stop();return;}sharedBus();environment=o.environment();
  if(environment.paused){stop();return;}
  bus.gain.setTargetAtTime(o.gain()*(environment.dialogue?.3:1),bound.currentTime,.10);
  footstep(p);if(t<nextScan)return;nextScan=t+250;vehicle=o.vehicle();
  const forest=environment.zone==='forest',coast=environment.zone==='coast',outside=!environment.indoors;
  loop('ambience',outside?(forest?'ambience_forest_birds':'ambience_city_traffic'):null,forest?.12:coast?.075:.10);
  if(previousDrive!==null&&previousDrive!==!!vehicle?.driving)play('car_door_close',.20,vehicle,1,600);
  previousDrive=!!vehicle?.driving;
  let engine=vehicle?.driving&&vehicle.engine?vehicle:null,engineLevel=.20;
  const traffic=o.traffic();
  if(!engine&&outside){let nearest=130;for(const c of traffic){const d=Math.hypot(c.x-p.x,c.y-p.y);if(c.velocity>8&&d<nearest){engine=c;nearest=d;}}engineLevel=.045;}
  loop('engine',engine?'car_engine_idle_loop':null,engine?engineLevel:0,engine,engine?.driving?.8+Math.min(Math.abs(engine.speed)/265,1)*.9:.8+Math.min(engine?.velocity||0,120)/200);
  const speed=Math.abs(vehicle?.speed||0);if(vehicle?.driving&&vehicle.throttle&&speed>25&&previousSpeed<=25&&t>=nextRev){if(play('car_engine_rev',.13,vehicle,1,5000))nextRev=t+5000;}previousSpeed=speed;
  if(outside&&t>=nextBird){const id=coast?'bird_gull_call':'bird_chirp_0'+(1+Math.floor(Math.random()*4));if(forest||coast){play(id,coast?.10:.13,{x:p.x+(Math.random()-.5)*240,y:p.y-80},1,4000);}nextBird=t+7000+Math.random()*9000;}
  for(const c of traffic){const d=Math.hypot(c.x-p.x,c.y-p.y),old=passes.get(c);if(outside&&c.velocity>40&&old&&old.distance<100&&d>old.distance+3&&t>=nextPass){const id=c.id.endsWith('0')?'car_passby_01':'car_passby_02';if(play(id,.10,c,1,8000))nextPass=t+8000;}passes.set(c,{distance:d});}
 }
 function horn(origin){if(!allowed()||environment.indoors||environment.paused)return false;return play('car_horn_short',.20,origin,1,12000);}
 document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
 window.addEventListener('blur',()=>{focused=false;stop();});window.addEventListener('focus',()=>focused=true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 return Object.freeze({tick,stop,horn,load,play,
  stats:()=>({unlocked,contextState:o.context()?.state||'none',sharedContext:bound===o.context(),preferred,loaded:[...buffers.keys()],loading:[...loads.keys()],failed:[...failed.keys()],voices:voices.size,loops:[...loops.values()].map(v=>({id:v.id,volume:v.volume,rate:v.source.playbackRate.value})),decodedBytes:[...buffers.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0),counts:{...counts},recent:history.slice(),gain:bus?.gain.value||0})});
};

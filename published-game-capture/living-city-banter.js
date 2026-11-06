/* A bounded content/cooldown policy for ROOKIE_COMIC's existing frame and
 * H.speech.say bubble. No renderer, timers, movement lock or save writes. */
(function(){
 'use strict';
 const pack=window.ROOKIE_BANTER_PACK||{assignments:[],entries:[]};
 function create({random=Math.random}={}){
  const actors=new Map(),lastActor=new Map(),lastEntry=new Map(),heard=new Set(),recent=[];
  let queue=null,nextCheck=0,nextExchange=8000,lastResolve=-Infinity,wasDriving=false,parkedUntil=0,profile=null;
  const stats={checks:0,lines:0,exchanges:0,cancelled:0,maxActorsChecked:0,reactions:0,trafficReactions:0,pedestrianReactions:0};
  const voices=new WeakMap();let pendingReaction=null,nextReactionCheck=0,lastReaction=-Infinity,pilotCar=null,driverSeen=0,driverBlocked=false,driverResume=0,rareDecision=null,driverEpisode=null;
  const pedestrian={touching:false,runningNear:false,contacts:[],last:-Infinity,cooldown:-Infinity};
  function driver(c){if(!voices.has(c))voices.set(c,{id:'driver:'+c.id,name:pack.reactions.trafficPilot.label,vehicle:c,head:24,get x(){return c.x},get y(){return c.y}});return voices.get(c);}
  function offer(item){if(!pendingReaction||item.priority>pendingReaction.priority){pendingReaction=item;return true;}return false;}
  function contact(a,kind,t){
   const spec=pack.reactions;if(!spec||a?.id!==spec.pedestrianPilot||t-pedestrian.cooldown<45000)return false;
   const line=spec.pedestrian[kind];if(!line)return false;
   return offer({key:kind+':'+a.id,actor:a,text:spec.pedestrianLabel+': '+line.text,mood:line.mood,seconds:4,priority:3,source:'pedestrian',valid:ctx=>nearby(a,ctx),spoken:time=>{pedestrian.cooldown=time;}});
  }
  function observe(ctx,t){
   const spec=pack.reactions;if(!spec||t<nextReactionCheck)return;nextReactionCheck=t+100;resolve(ctx,t);
   if(!pilotCar)pilotCar=ctx.traffic?.find(c=>c.kind===spec.trafficPilot.kind&&c.district===spec.trafficPilot.initialDistrict)||null;
   if(pilotCar){const c=pilotCar,blocked=c.stopped&&c.stopReason==='player'&&c.playerWait>0;
    if(blocked&&driverEpisode!==c.playerBlockEpisode){if(driverEpisode!==null&&driverSeen>0)driverResume=Math.max(driverResume,t+20000);driverEpisode=c.playerBlockEpisode;driverSeen=0;rareDecision=null;if(pendingReaction?.actor.vehicle===c)pendingReaction=null;}
    if(!blocked){if(driverBlocked&&driverSeen>0)driverResume=t+20000;driverBlocked=false;driverSeen=0;rareDecision=null;if(pendingReaction?.actor.vehicle===c)pendingReaction=null;}
    else {driverBlocked=true;if(t>=driverResume){
     if(c.playerWait>=12&&rareDecision===null)rareDecision=random()<(spec.traffic[2].chance||0);
     const stage=c.playerWait>=12&&rareDecision?3:c.playerWait>=8?2:c.playerWait>=3?1:0;
     if(stage>driverSeen&&nearby(driver(c),ctx)){const line=spec.traffic[stage-1],episode=c.playerBlockEpisode;offer({key:c.id+':'+stage,actor:driver(c),text:spec.trafficPilot.label+': '+line.text,mood:line.mood,seconds:stage===3?4:3,priority:stage,source:'traffic',stage,valid:ctx=>nearby(driver(c),ctx)&&c.playerBlockEpisode===episode&&c.stopped&&c.stopReason==='player'&&c.playerWait>=line.seconds,spoken:()=>{driverSeen=stage;}});}
    }}
   }
   const a=ctx.actors.find(a=>a.id===spec.pedestrianPilot);if(!a||ctx.driving||!nearby(a,ctx))return;
   const d=Math.hypot(a.x-ctx.player.x,a.y-ctx.player.y),touching=d<23&&ctx.player.moving;
   if(touching&&!pedestrian.touching&&t-pedestrian.last>600){pedestrian.last=t;pedestrian.contacts=pedestrian.contacts.filter(at=>t-at<8000);pedestrian.contacts.push(t);if(pedestrian.contacts.length>=2){contact(a,'repeat-contact',t);pedestrian.contacts=[];}}
   const running=ctx.player.moving&&ctx.player.speed>250&&d>=23&&d<48;
   if(running&&!pedestrian.runningNear)contact(a,'running-close',t);
   pedestrian.touching=touching;pedestrian.runningNear=running;
  }
  function resolve(ctx,t){if(t-lastResolve<2000)return;lastResolve=t;
   for(const spec of pack.assignments){const a=ctx.actors.find(a=>spec.actorId?a.id===spec.actorId:a.name===spec.name&&(!spec.station||a.storyStation)&&(!spec.room||a.storyRoom===spec.room));if(a)actors.set(spec.id,a);else actors.delete(spec.id);}
  }
  function flags(ctx,t){const f=new Set([ctx.player.moving?(ctx.player.speed>250?'running':'walking'):'standing']);if(ctx.driving)f.add('driving');if(t<parkedUntil)f.add('parked');if(ctx.timeOfDay==='day'||ctx.timeOfDay==='night')f.add(ctx.timeOfDay);if(ctx.comedyNear)f.add('comedy-near');return f;}
  function gate(e,ctx){if(e.gate==='after-first-case')return !!ctx.progress?.firstCaseComplete;if(e.gate==='m2-camera')return ctx.progress?.mission==='m2'&&ctx.progress?.briefed&&!ctx.progress?.cameraFound;return true;}
  function nearby(a,ctx,r=220){return !!a&&ctx.visible(a)&&Math.hypot(a.x-ctx.player.x,a.y-ctx.player.y)<=r;}
  function eligible(e,ctx,t,f,ignoreRecent=false){
   if(!nearby(actors.get(e.starter),ctx)||t-(lastEntry.get(e.id)??-Infinity)<180000||!ignoreRecent&&recent.includes(e.id)||!gate(e,ctx)||e.requiresHeard&&!heard.has(e.requiresHeard))return false;
   const spec=pack.assignments.find(a=>a.id===e.starter);if(e.areas&&!e.areas.includes(ctx.area||spec.area))return false;
   if(e.contexts&&!e.contexts.some(c=>f.has(c)))return false;
   for(const id of new Set(e.lines.map(l=>l[0]))){const a=actors.get(id);if(!nearby(a,ctx)||t-(lastActor.get(id)??-Infinity)<35000)return false;}
   if(e.partner){const a=actors.get(e.starter),b=actors.get(e.partner);if(!b||Math.hypot(a.x-b.x,a.y-b.y)>148)return false;}
   return true;
  }
  function tick(ctx,t,io){
   if(!ctx.enabled||ctx.profile!==profile){queue=null;pendingReaction=null;actors.clear();lastResolve=-Infinity;profile=ctx.profile;pedestrian.touching=false;pedestrian.contacts=[];if(!ctx.enabled)return false;}
   if(wasDriving&&!ctx.driving)parkedUntil=t+15000;wasDriving=!!ctx.driving;
   if(!ctx.free||io.busy()){pendingReaction=null;if(queue){queue=null;stats.cancelled++;nextExchange=Math.max(nextExchange,t+8000);}return false;}
   observe(ctx,t);
    if(pendingReaction){const item=pendingReaction;if(!item.valid(ctx)){pendingReaction=null;}else if(!io.ambient()&&t-lastReaction>=4000){if(io.say(item.actor,item.text,item.mood,item.seconds)){if(item.source==='traffic'&&item.stage===1)io.horn?.(item.actor);if(queue){queue=null;stats.cancelled++;}item.spoken(t);stats.lines++;stats.reactions++;stats[item.source==='traffic'?'trafficReactions':'pedestrianReactions']++;pendingReaction=null;lastReaction=t;nextExchange=Math.max(nextExchange,t+20000);return true;}}if(pendingReaction)return false;}
   if(queue){
    if(t<queue.next||io.ambient())return false;
    const [id,text]=queue.entry.lines[queue.index],a=actors.get(id),spec=pack.assignments.find(s=>s.id===id);
    if(!nearby(a,ctx)||t-queue.started>25000){queue=null;stats.cancelled++;nextExchange=t+8000;return false;}
    if(!io.say(a,spec.label+': '+text,queue.entry.mood||'normal'))return false;
    stats.lines++;queue.index++;queue.next=t+6200; // native bubble lifetime is at most six seconds
    if(queue.index===queue.entry.lines.length){heard.add(queue.entry.id);queue=null;}return true;
   }
   if(t<nextCheck||t<nextExchange||io.ambient())return false;nextCheck=t+1000;stats.checks++;resolve(ctx,t);stats.maxActorsChecked=Math.max(stats.maxActorsChecked,actors.size);
   const f=flags(ctx,t);let choices=pack.entries.filter(e=>eligible(e,ctx,t,f));
   if(!choices.length)choices=pack.entries.filter(e=>eligible(e,ctx,t,f,true)).sort((a,b)=>(lastEntry.get(a.id)||0)-(lastEntry.get(b.id)||0)).slice(0,1);
   const rare=choices.filter(e=>e.rare),normal=choices.filter(e=>!e.rare),pool=rare.length&&random()<.04?rare:normal;if(!pool.length)return false;
   const entry=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];queue={entry,index:0,next:t,started:t};
   lastEntry.set(entry.id,t);for(const [id]of entry.lines)lastActor.set(id,t);recent.push(entry.id);if(recent.length>6)recent.shift();nextExchange=t+20000;stats.exchanges++;
   return tick(ctx,t,io);
  }
  return Object.freeze({tick,contact,hasPending:()=>!!queue||!!pendingReaction,reset:()=>{queue=null;pendingReaction=null;actors.clear();lastResolve=-Infinity;},inspect:()=>({stats:{...stats},queue:queue?.entry.id||null,reaction:pendingReaction?.key||null,trafficPilot:pilotCar?{id:pilotCar.id,x:pilotCar.x,y:pilotCar.y,reason:pilotCar.stopReason,playerWait:pilotCar.playerWait,stageSpoken:driverSeen}:null,pedestrianPilot:pack.reactions?.pedestrianPilot,heard:[...heard],recent:[...recent],resolved:[...actors].map(([id,a])=>({id,actorId:a.id,x:a.x,y:a.y}))})});
 }
 const runtime=create();
 // Give two existing Midtown walkers a parallel, verified-clear meeting
 // segment. Their original waypoint follower, speed and art still own them.
 function arrange(a,b,clear){if(!a||!b||b.banterMeeting)return false;const [p,q]=a.route,dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy)||1;
  for(const side of [1,-1]){const ox=-dy/len*34*side,oy=dx/len*34*side,route=a.route.map(p=>[p[0]+ox,p[1]+oy]);if(!clear(...route[0],...route[1]))continue;b.route=route;b.x=route[1][0];b.y=route[1][1];b.targetIndex=0;b.banterMeeting=true;return true;}return false;
 }
 window.ROOKIE_BANTER=Object.freeze({create,tick:runtime.tick,contact:(a,kind,t)=>!/[?&]banter=off(?:&|$)/.test(window.location?.search||'')&&runtime.contact(a,kind,t),hasPending:runtime.hasPending,reset:runtime.reset,inspect:runtime.inspect,arrange,pack,
  assigned:a=>pack.assignments.some(s=>s.actorId?a.id===s.actorId:a.name===s.name&&(!s.station||a.storyStation)&&(!s.room||a.storyRoom===s.room))});
})();

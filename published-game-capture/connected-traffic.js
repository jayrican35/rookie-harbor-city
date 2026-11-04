/* Navigation for the existing connected fleet. No clock, canvas, asset or save owner. */
(function(){
'use strict';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function path(points){let length=0;const samples=[];for(let i=0;i<points.length;i++){if(i)length+=dist(points[i-1],points[i]);samples.push({...points[i],s:length});}return {points:samples,length};}
function pose(p,s){const a=p.points;let i=1;while(i<a.length-1&&a[i].s<s)i++;const u=a[i-1],v=a[i],t=Math.max(0,Math.min(1,(s-u.s)/(v.s-u.s||1)));return {x:u.x+(v.x-u.x)*t,y:u.y+(v.y-u.y)*t,angle:Math.atan2(v.y-u.y,v.x-u.x)};}
function corners(p,length=104,width=40){const c=Math.cos(p.angle),s=Math.sin(p.angle),a=[];for(const x of [-length/2,0,length/2])for(const y of [-width/2,0,width/2])a.push({x:p.x+x*c-y*s,y:p.y+x*s+y*c});return a;}
function overlap(a,b,pad=0){
 const dx=b.x-a.x,dy=b.y-a.y,al=(a.length||86)/2,bl=(b.length||86)/2,aw=(a.width||38)/2,bw=(b.width||38)/2;
 for(let i=0;i<4;i++){const angle=(i%2?a.angle:b.angle)+(i>1?Math.PI/2:0),c=Math.cos(angle),s=Math.sin(angle);
  const ar=Math.abs(Math.cos(a.angle-angle))*al+Math.abs(Math.sin(a.angle-angle))*aw,br=Math.abs(Math.cos(b.angle-angle))*bl+Math.abs(Math.sin(b.angle-angle))*bw;
  if(Math.abs(dx*c+dy*s)>=ar+br+pad)return false;
 }return true;
}
function build(roads,blocked=()=>false,anchors=[]){
 const asphalt=roads.filter(r=>r.w>0&&r.h>0),inside=(x,y)=>asphalt.some(r=>x>=r.x-.1&&x<=r.x+r.w+.1&&y>=r.y-.1&&y<=r.y+r.h+.1);
 const lines=[];
 for(const r of asphalt){const h=r.w>=r.h,w=h?r.h:r.w;if(w<100||w>220||Math.max(r.w,r.h)<w*(r.kind?1.2:1.5))continue;
  const c=(h?r.y+r.h/2:r.x+r.w/2),lo=h?r.x:r.y,hi=lo+(h?r.w:r.h);
  let line=lines.find(l=>l.h===h&&Math.abs(l.c-c)<=24&&lo<=l.hi+24&&hi>=l.lo-24);
  if(line){line.lo=Math.min(lo,line.lo);line.hi=Math.max(hi,line.hi);}else lines.push({h,c,lo,hi,points:[]});
 }
 // Merge transitive pieces created by overlapping native and logical surfaces.
 for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){const a=lines[i],b=lines[j];if(a.h===b.h&&Math.abs(a.c-b.c)<=24&&a.lo<=b.hi+24&&a.hi>=b.lo-24){a.lo=Math.min(a.lo,b.lo);a.hi=Math.max(a.hi,b.hi);lines.splice(j--,1);}}
 const nodes=[],getNode=(x,y)=>{let n=nodes.find(n=>Math.abs(n.x-x)<1&&Math.abs(n.y-y)<1);if(!n){n={id:nodes.length,x,y,legs:[]};nodes.push(n);}return n;};
 for(const l of lines){l.points.push(getNode(l.h?l.lo:l.c,l.h?l.c:l.lo),getNode(l.h?l.hi:l.c,l.h?l.c:l.hi));}
 for(const h of lines.filter(l=>l.h))for(const v of lines.filter(l=>!l.h))if(v.c>=h.lo-80&&v.c<=h.hi+80&&h.c>=v.lo-80&&h.c<=v.hi+80){const n=getNode(v.c,h.c);n.junction=true;h.points.push(n);v.points.push(n);}
 for(const a of anchors)for(const l of lines)if(l.h&&a.axis==='h'&&Math.abs(a.y-l.c)<32&&a.x>l.lo+200&&a.x<l.hi-200&&!l.points.some(n=>Math.abs(n.x-a.x)<200))l.points.push(getNode(a.x,l.c));
 // Native strips often end at the near curb of an overlapping junction.
 // That cap is not a second node 15–125 units before the real crossing.
 // Keep the actual crossing and validate its complete approach on pavement.
 for(const l of lines)l.points=l.points.filter(n=>n.junction||!l.points.some(j=>j!==n&&j.junction&&dist(n,j)<150));
 const rejected=[],legs=[],turns=[];
 function valid(p){for(let s=0;s<=p.length+15;s+=16){const q=pose(p,Math.min(s,p.length));for(const c of corners(q))if(!inside(c.x,c.y)||blocked(c.x,c.y,2))return c;}return null;}
 for(const l of lines){const sorted=[...new Set(l.points)].sort((a,b)=>l.h?a.x-b.x:a.y-b.y);
  for(let i=1;i<sorted.length;i++)for(const [a,b] of [[sorted[i-1],sorted[i]],[sorted[i],sorted[i-1]]]){
   const distance=dist(a,b);if(distance<100)continue;const ux=(b.x-a.x)/distance,uy=(b.y-a.y)/distance,trim=Math.min(96,distance*.3);let p,bad,offset;
   // A visible post may narrow one side of a wide road. Use a validated
   // inset in that same lane rather than deleting the obstacle or road.
   for(offset of [24,40,52]){p=path([{x:a.x+ux*trim-uy*offset,y:a.y+uy*trim+ux*offset},{x:b.x-ux*trim-uy*offset,y:b.y-uy*trim+ux*offset}]);bad=valid(p);if(!bad)break;}
   if(bad){rejected.push({type:'leg',from:a.id,to:b.id,at:bad});continue;}
   const leg={id:legs.length,from:a.id,to:b.id,angle:Math.atan2(uy,ux),path:p,next:[],trim,offset};legs.push(leg);a.legs.push(leg.id);
  }
 }
 for(const leg of legs){const n=nodes[leg.to],start=pose(leg.path,leg.path.length);for(const id of n.legs){const out=legs[id],end=pose(out.path,0),delta=wrap(out.angle-leg.angle);let points=[];
   if(Math.abs(delta)>3){const c={x:(start.x+end.x)/2,y:(start.y+end.y)/2},ux=Math.cos(leg.angle),uy=Math.sin(leg.angle),nx=-uy,ny=ux;
    const radius=dist(start,end)/2;for(let i=0;i<=24;i++){const t=i*Math.PI/24;points.push({x:c.x+ux*radius*Math.sin(t)+nx*radius*Math.cos(t),y:c.y+uy*radius*Math.sin(t)+ny*radius*Math.cos(t)});}
   }else if(Math.abs(delta)<.1)points=[start,end];
   else {const control=Math.abs(Math.cos(leg.angle))>.5?{x:end.x,y:start.y}:{x:start.x,y:end.y};for(let i=0;i<=24;i++){const t=i/24;points.push({x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y});}}
   const p=path(points),bad=valid(p);if(bad){rejected.push({type:'turn',from:leg.id,to:id,at:bad});continue;}
   const turn={id:turns.length,node:n.id,from:leg.id,to:id,path:p,kind:Math.abs(delta)>3?'uturn':delta>.1?'right':delta<-.1?'left':'straight'};turns.push(turn);leg.next.push(turn.id);
  }}
 // Reject traps, retaining only directed legs that can continue indefinitely.
 let live=new Set(legs.map(l=>l.id)),changed=true;while(changed){changed=false;for(const id of live)if(!legs[id].next.some(t=>live.has(turns[t].to))){live.delete(id);changed=true;}}
 // Reachability for destination selection is cached, not searched every frame.
 const destinations=new Map();for(const id of live){const reached=new Set([id]),todo=[id];while(todo.length){const n=todo.pop();for(const t of legs[n].next){const next=turns[t].to;if(live.has(next)&&!reached.has(next)){reached.add(next);todo.push(next);}}}destinations.set(id,[...reached]);}
 return {roads:asphalt,nodes,legs,turns,live,destinations,rejected,inside,valid};
}
function create({roads,blocked,districtAt,actors=()=>[],player=()=>null,cruiser=()=>null,view=()=>null,count=28,fleet=[],anchors=[]}){
 const graph=build(roads,blocked,anchors),cars=fleet,reservations=new Map(),closures=new Map(),routes=new Set(),turnKinds=new Set(),visited=new Set();let clock=0,accumulator=0,seed=9147;
 const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const legPose=c=>pose(c.recovery?.path||(c.turn===null?graph.legs[c.leg].path:graph.turns[c.turn].path),c.distance);
 const shape=c=>({...legPose(c),length:c.kind==='delivery'?104:86});
 function assign(c){Object.assign(c,legPose(c));c.cos=Math.cos(c.angle);c.sin=Math.sin(c.angle);c.dir=Math.abs(c.cos)>=Math.abs(c.sin)?(c.cos>0?'right':'left'):(c.sin>0?'down':'up');c.length=c.kind==='delivery'?104:86;}
 function choose(c){const reachable=graph.destinations.get(c.leg)||[];
  const available=reachable.filter(id=>!closures.has(id));if(c.destination===undefined||c.destination===c.leg||closures.has(c.destination)||!reachable.includes(c.destination))c.destination=available[Math.floor(random()*available.length)];
  const queue=[c.leg],via=new Map([[c.leg,null]]);let found=null;
  while(queue.length){const id=queue.shift();if(id===c.destination){found=id;break;}for(const t of graph.legs[id].next){const to=graph.turns[t].to;if(graph.live.has(to)&&!closures.has(to)&&!via.has(to)){via.set(to,{prev:id,turn:t});queue.push(to);}}}
  if(found!==null&&found!==c.leg){while(via.get(found)?.prev!==c.leg)found=via.get(found).prev;return via.get(found).turn;}
  let options=graph.legs[c.leg].next.filter(t=>graph.live.has(graph.turns[t].to)&&!closures.has(graph.turns[t].to));if(!options.length)options=graph.legs[c.leg].next.filter(t=>graph.live.has(graph.turns[t].to));return options[Math.floor(random()*options.length)];
 }
 const ids=[...graph.live];
 // Long public-road legs first; deterministic district-weighted distribution.
 const candidates=ids.flatMap(id=>{const l=graph.legs[id],mid=pose(l.path,l.path.length/2),district=districtAt(mid.x,mid.y),weight=/downtown|midtown/.test(district)?3:/industrial|residential/.test(district)?1:2;return Array.from({length:weight},()=>id)});
 const regions=['precinct','downtown','residential','southbay','industrial','westfield','midtown','northgate','eastside','downtown','midtown','precinct','southbay'];
 for(let attempt=0;attempt<3000&&cars.length<count&&candidates.length;attempt++){
  const region=regions[cars.length%regions.length],local=candidates.filter(id=>{const l=graph.legs[id],p=pose(l.path,l.path.length/2);return districtAt(p.x,p.y)===region}),pool=attempt<2000&&local.length?local:candidates;
  const id=pool[Math.floor(random()*pool.length)],l=graph.legs[id];if(l.path.length<180)continue;
  const c={id:'street:'+cars.length,leg:id,turn:null,distance:60+random()*(l.path.length-120),velocity:0,speed:90+cars.length%5*9,kind:region==='industrial'?'delivery':cars.length%11===0?'patrol':cars.length%7===0?'delivery':'civilian',color:['#557e9a','#a66852','#7d8b76','#c5a975'][cars.length%4],stopped:false,wait:0,completed:0};assign(c);
  if(cars.some(b=>dist(c,b)<160)||cruiser()?.overlapsTraffic?.(c))continue;cars.push(c);
 }
 function obstructed(c,p,padding=12){const body={...p,length:c.length};
  // Following distance comes from the forward probe. Inflating lateral
  // widths beyond the lane gap makes opposing queues stop each other.
  for(const other of cars)if(other!==c&&dist(p,other)<150&&overlap(body,other,Math.min(padding,4)))return true;
  const human=player();if(human&&!human.driving&&dist(p,human)<c.length/2+23)return true;
  for(const a of actors())if(dist(p,a)<c.length/2+18)return true;
  const unit=cruiser();if(unit?.overlapsTraffic?.({...body,dir:Math.abs(Math.cos(p.angle))>.5?'right':'down'}))return true;
  return false;
 }
 let recoveries=0,reroutes=0,offscreenReentries=0;
 function outside(p){const v=view();return !!v&&(p.x<v.x-250||p.y<v.y-250||p.x>v.x+v.w+250||p.y>v.y+v.h+250);}
 function reenter(c){
  // Bounded ambient management only: source AND destination must be outside
  // the expanded camera. Unit 9 never uses this pool. Visible cars never snap.
  if(!outside(c))return false;
  const local=ids.filter(id=>{const l=graph.legs[id],p=pose(l.path,l.path.length/2);return districtAt(p.x,p.y)===regions[Number(c.id.split(':')[1])%regions.length]});
  const pool=local.length?local:ids;
  for(let i=0;i<80;i++){const id=pool[Math.floor(random()*pool.length)],l=graph.legs[id];if(l.path.length<220)continue;const distance=60+random()*(l.path.length-120),p=pose(l.path,distance);
   if(!outside(p)||obstructed(c,p,5)||cars.some(o=>o!==c&&dist(p,o)<180))continue;
   for(const [n,owner] of reservations)if(owner===c.id)reservations.delete(n);
   Object.assign(c,{leg:id,turn:null,distance,velocity:0,wait:0,destination:undefined,nextTurn:undefined,deliveryUntil:0});delete c.recovery;assign(c);offscreenReentries++;return true;
  }return false;
 }
 function recover(c){
  const l=graph.legs[c.leg],reverse=graph.legs.find(b=>b.from===l.to&&b.to===l.from&&graph.live.has(b.id));if(!reverse)return false;
  // A sampled lane-to-lane turnaround, never an instantaneous reverse/snap.
  const end=pose(reverse.path,Math.max(0,Math.min(reverse.path.length,reverse.path.length-c.distance))),start={x:c.x,y:c.y},center={x:(start.x+end.x)/2,y:(start.y+end.y)/2},radius=dist(start,end)/2;
  if(radius>55||dist(start,end)<20)return false;
  const ux=Math.cos(c.angle),uy=Math.sin(c.angle),nx=-uy,ny=ux,points=[];
  for(let i=0;i<=32;i++){const t=i*Math.PI/32;points.push({x:center.x+ux*radius*Math.sin(t)+nx*radius*Math.cos(t),y:center.y+uy*radius*Math.sin(t)+ny*radius*Math.cos(t)});}
  const inset=[],lead=32,inner=16,arcCenter={x:center.x+ux*lead,y:center.y+uy*lead},arcStart={x:arcCenter.x+nx*inner,y:arcCenter.y+ny*inner},arcEnd={x:arcCenter.x-nx*inner,y:arcCenter.y-ny*inner};
  function cubic(a,b,d,e){for(let i=0;i<=16;i++){const t=i/16;inset.push({x:(1-t)**3*a.x+3*(1-t)**2*t*b.x+3*(1-t)*t*t*d.x+t**3*e.x,y:(1-t)**3*a.y+3*(1-t)**2*t*b.y+3*(1-t)*t*t*d.y+t**3*e.y});}}
  cubic(start,{x:start.x+ux*16,y:start.y+uy*16},{x:arcStart.x-ux*16,y:arcStart.y-uy*16},arcStart);
  for(let i=1;i<=32;i++){const t=i*Math.PI/32;inset.push({x:arcCenter.x+ux*inner*Math.sin(t)+nx*inner*Math.cos(t),y:arcCenter.y+uy*inner*Math.sin(t)+ny*inner*Math.cos(t)});}
  cubic(arcEnd,{x:arcEnd.x-ux*16,y:arcEnd.y-uy*16},{x:end.x+ux*16,y:end.y+uy*16},end);
  let p=null;
  for(const candidate of [path(points),path(inset)]){let safe=true;
   for(let s=0;safe&&s<=candidate.length+7;s+=8){const q=pose(candidate,Math.min(s,candidate.length));if(obstructed(c,q,5)){safe=false;break;}for(const b of corners(q,c.length,38))if(!graph.inside(b.x,b.y)||blocked(b.x,b.y,2)){safe=false;break;}}
   if(safe){p=candidate;break;}
  }
  if(!p)return false;
  closures.set(c.leg,clock+45);c.recovery={path:p,to:reverse.id,end:Math.max(0,Math.min(reverse.path.length,reverse.path.length-c.distance))};c.distance=0;c.velocity=0;recoveries++;return true;
 }
 function step(dt){accumulator+=Math.max(0,Math.min(.05,dt||0));while(accumulator>=1/30){tick(1/30);accumulator-=1/30;}}
 function tick(dt){clock+=dt;for(const [id,until] of closures)if(until<clock)closures.delete(id);
  for(const c of cars){const current=c.recovery||(c.turn===null?graph.legs[c.leg]:graph.turns[c.turn]),remaining=current.path.length-c.distance;
   if(c.wait>30&&reenter(c))continue;
   if(c.wait>7&&c.turn===null&&!c.recovery&&clock>(c.retryAt||0)){
    c.retryAt=clock+3;
    const options=graph.legs[c.leg].next.filter(t=>graph.live.has(graph.turns[t].to)&&!obstructed(c,pose(graph.legs[graph.turns[t].to].path,80),5));
    if(remaining<125&&options.length&&options.some(t=>t!==c.nextTurn)){c.nextTurn=options.find(t=>t!==c.nextTurn);c.destination=graph.turns[c.nextTurn].to;reroutes++;}
    else if(recover(c))continue;
   }
   if(c.nextTurn===undefined||closures.has(graph.turns[c.nextTurn].to))c.nextTurn=choose(c);let hold=false;
   const junction=c.turn===null?graph.legs[c.leg].to:current.node;
   if(!c.recovery&&c.turn===null&&remaining<115){const owner=reservations.get(junction),turn=graph.turns[c.nextTurn],exit=graph.legs[turn.to];
    if(owner!==c.id){let blockedTurn=false;for(let s=0;!blockedTurn&&s<=turn.path.length;s+=24)blockedTurn=obstructed(c,pose(turn.path,s),4);
     if(owner||blockedTurn||obstructed(c,pose(exit.path,Math.min(90,exit.path.length)),20))hold=true;else {reservations.set(junction,c.id);}}
   }
   const district=districtAt(c.x,c.y),base=/residential|southbay|waterfront|westfield/.test(district)?70:/industrial/.test(district)?80:c.speed;
   let target=c.recovery?28:c.turn===null?base:(current.kind==='uturn'?28:current.kind==='straight'?base:52);
   if(!c.recovery&&c.turn===null&&remaining<130)target=Math.min(target,55);
   if(hold)target=Math.min(target,Math.max(0,(remaining-84)*1.2));
   const look=Math.min(remaining,Math.max(65,c.velocity*.85));if(obstructed(c,pose(current.path,c.distance+look),14))target=0;
   if(c.deliveryUntil>clock)target=0;
   c.velocity=target<c.velocity?Math.max(target,c.velocity-240*dt):Math.min(target,c.velocity+65*dt);
   let move=Math.min(c.velocity*dt,remaining);if(hold)move=Math.min(move,Math.max(0,remaining-84));
   const next=pose(current.path,c.distance+move);if(obstructed(c,next,5)){move=0;c.velocity=0;}
   c.distance+=move;c.stopped=move<.01;c.wait=c.stopped?c.wait+dt:0;assign(c);
   for(const [id,owner] of reservations)if(owner===c.id&&dist(c,graph.nodes[id])>135&&id!==junction)reservations.delete(id);
   if(current.path.length-c.distance<.001){
    if(c.recovery){const r=c.recovery;c.leg=r.to;c.distance=r.end;delete c.recovery;delete c.nextTurn;c.destination=undefined;}
    else if(c.turn===null){if(reservations.get(junction)!==c.id)continue;c.turn=c.nextTurn;turnKinds.add(graph.turns[c.turn].kind);c.distance=0;}
    else {const t=graph.turns[c.turn];routes.add(t.from+'>'+t.to);c.leg=t.to;c.turn=null;c.distance=0;delete c.nextTurn;c.completed++;if(c.kind==='delivery'&&c.completed%7===0&&/downtown|midtown/.test(district))c.deliveryUntil=clock+1.5;}
    assign(c);
   }
   visited.add(district);
  }
 }
 return {cars,step,graph,metrics:()=>({cars:cars.length,legs:graph.legs.length,liveLegs:graph.live.size,turns:graph.turns.length,rejected:graph.rejected,distinctTransitions:routes.size,turnKinds:[...turnKinds],districts:[...visited],recoveries,reroutes,offscreenReentries,reservations:reservations.size,clock,maxWait:Math.max(0,...cars.map(c=>c.wait))}),pose,corners,overlap};
}
window.ROOKIE_CITY_TRAFFIC=Object.freeze({build,create,pose,corners,overlap});
})();

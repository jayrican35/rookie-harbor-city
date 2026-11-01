/* V115 Phase 2 geometry and browser-event regression harness. node >=20. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const directory=path.join(root,'published-game-capture');
const sourceEngine=fs.readFileSync(path.join(directory,'game.js'),'utf8');
const mapContext={MAPS:{}};
for(const [id,next] of [['station','/* ---------- PRECINCT GROUNDS'],['plaza','/* ---------- DOWNTOWN']]){
  const start=sourceEngine.indexOf('MAPS.'+id+' = {'),end=sourceEngine.indexOf(next,start);
  assert(start>=0&&end>start,'Cannot locate authentic '+id+' geometry');
  vm.runInNewContext(sourceEngine.slice(start,end),mapContext);
}
const geoms='var MAPS = '+JSON.stringify(mapContext.MAPS)+';';
const src=fs.readFileSync(path.join(directory,'v115-campus.js'),'utf8');
const css=fs.readFileSync(path.join(directory,'v115-campus.css'),'utf8');
assert(!/(outbreak|zombie|academy)[-_ ]?(ai|map|combat|sprite|balance)/i.test(css));
function context2D(){
 const base={fillRect(){},clearRect(){},strokeRect(){},fillText(){},strokeText(){},drawImage(){},
 save(){},restore(){},translate(){},scale(){},setTransform(){},beginPath(){},arc(){},ellipse(){},rect(){},
 moveTo(){},lineTo(){},fill(){},stroke(){},closePath(){},measureText:()=>({width:75}),
 createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),
 setLineDash(){}};
 return base;
}
const ctx=context2D();
function element(id){
 return {id,hidden:false,style:{},classList:{add(){},remove(){}},children:[],events:{},
 setAttribute(){},addEventListener(name,fn){this.events[name]=fn;},
 appendChild(el){this.children.push(el);},setPointerCapture(){},
 querySelector(selector){return elements[selector]||(elements[selector]=element(selector));},
 getBoundingClientRect(){return {left:0,top:0,width:900,height:650};},
 getContext(){return ctx}};
}
const elements={};
const tools=element('maptools');const body=element('body');
const document={body,hidden:false,createElement:(tag)=>element(tag),
 querySelector:(s)=>s==='#mapOverlay .maptools'?tools:null};
const window={devicePixelRatio:1,events:{},addEventListener(type,fn,capture){window.events[type+(capture?'_capture':'')]=fn;},
 HARBOR:{worldV115:{version:'phase1',roadNetwork:()=>({worldId:'harbor-main',primary:{centerY:1784},segments:[],crossings:[]})},academy:{active:()=>false},outbreak:{active:()=>false}}};
let raf=0;const queue=new Map();
const sandbox={window,document,console,Math,Number,Date, state:{map:'station'},
 closeMap(){},canvas:element('original'),ctx,
 drawRoom(r){const p=sandbox.ctx;p.fillStyle=r.fill;p.fillRect(r.x,r.y,r.w,r.h);},
 drawFurn(f){sandbox.ctx.fillRect(f.x,f.y,f.w,f.h);},
 requestAnimationFrame(fn){queue.set(++raf,fn);return raf;},cancelAnimationFrame(n){queue.delete(n);}};
vm.createContext(sandbox);
vm.runInContext(geoms,sandbox);
vm.runInContext(src,sandbox,{filename:'v115-campus.js'});
const api=window.HARBOR.seamlessCampusV115;
assert(api,'No campus API');
const geom=api.geometry();
assert.deepEqual([geom.stationFootprint.w,geom.stationFootprint.h],[1936,1172]);
assert.equal(geom.rooms,11);
assert.equal(geom.walls,34);
assert.equal(geom.doorTransitions,'world-space-continuous');
assert.equal(geom.separateSceneLoads,0);
assert.equal(api.test.blocked(948,1124,12),false,'True front door should be an opening');
assert.equal(api.test.blocked(833,1124,12),true,'Other front wall stays solid');
assert.equal(api.test.blocked(948,1100,12),false,'Lobby walk space should be open');
assert.equal(api.test.blocked(948,1180,12),false,'Grounds outside lobby should be open');
assert.equal(api.test.blocked(1918,1256,12),false,'Garage door opening must not be blocked');
assert.equal(api.test.blocked(451,474,12),true,'Original operations desk solid must block walking');
assert.equal(api.toWorld('station',568,1028).x,api.entrances.front.x);
assert.equal(api.toWorld('station',568,1028).y,api.entrances.front.y);
assert.equal(api.chunks(800,800,1200,700).length>4,true);
assert.equal(api.snapshot().transport,'none');
assert.equal(api.snapshot().committedToSave,false);
assert.equal(api.snapshot().authoritativeServer,false);
assert.equal(tools.children.length,1,'Launch button must appear in actual-world map UI');
assert.equal(api.test.moveTo(948,1082),true);
const snap0=api.snapshot();
assert.equal(snap0.y,1082);
api.open();
assert.equal(api.isOpen(),true);
assert.ok(elements['canvas'].width>0);
assert.ok(elements['canvas'].height>0);
const down=window.events.keydown_capture;
assert(down);
down({key:'ArrowDown',preventDefault(){},stopImmediatePropagation(){}},true);
for(let i=0;i<55;i++){
 const n=queue.keys().next().value;
 assert(n,'requestAnimationFrame missing');const fn=queue.get(n);queue.delete(n);fn((i+1)*16.67);
}
const after=api.test.position();
assert(after.y>api.entrances.front.y+10,'Player must physically walk from lobby through front doorway to grounds: '+JSON.stringify(after));
assert.equal(api.isOpen(),true,'Crossing the front door must not close or reload world');
assert(api.test.doorCrossings()>=1,'Entering grounds must be detected as world-space boundary');
api.close();
assert.equal(api.isOpen(),false);
sandbox.state.map='training';api.open();assert.equal(api.isOpen(),false,'Academy world must be excluded');
sandbox.state.map='station';window.HARBOR.outbreak.active=()=>true;api.open();assert.equal(api.isOpen(),false,'Zombie Outbreak must be excluded');
window.HARBOR.outbreak.active=()=>false;
api.open();assert.equal(api.isOpen(),true);api.close();
console.log('PASS V115 Phase 2: 1:1 precinct geometry, aligned front/garage doors, real room walls, continuous footstep crossing, single scene, original saves untouched, Academy/Zombie excluded.');
api.open();window.ROOKIE_V116_HUD={blocked:()=>true,paint(){},close(){}};
const paused=api.test.position();
down({key:'ArrowDown',preventDefault(){},stopImmediatePropagation(){}},true);
for(let i=0;i<12;i++){const n=queue.keys().next().value;if(n){const fn=queue.get(n);queue.delete(n);fn(2000+i*16.67);}}
assert.deepEqual(api.test.position(),paused,'HUD dialog must pause the actual movement loop');
api.close();
console.log('PASS marina modal pauses player simulation and blocks held movement');

// Actual player movement must supply accumulated distance and facing to marina art.
let lastPose=null;
window.ROOKIE_V116_HUD=undefined;
window.ROOKIE_V116_MARINA={inMarina:()=>true,drawNpc(g,a){if(a.npcStyle===0)lastPose=a;},
 actors:[],interactions:[],stepNPCs(){},blocksProp:()=>false,background(){},foreground(){},active:()=>true};
api.open();
const tick=(start,n)=>{for(let i=0;i<n;i++){const id=queue.keys().next().value;if(id){const fn=queue.get(id);queue.delete(id);fn(start+i*16.67);}}};
down({key:'ArrowDown',preventDefault(){},stopImmediatePropagation(){}},true);tick(4000,5);
assert(lastPose?.moving&&lastPose.distance>0&&lastPose.dir==='down','Real movement must reach the walk renderer');
const travelled=lastPose.distance;
window.events.keyup_capture({key:'ArrowDown',preventDefault(){},stopImmediatePropagation(){}});tick(4200,4);
assert(!lastPose.moving&&lastPose.distance===travelled,'No idle pedaling or time-only frame updates');
api.close();console.log('PASS actual movement passes facing/travel into sprites and stops advancing at idle');

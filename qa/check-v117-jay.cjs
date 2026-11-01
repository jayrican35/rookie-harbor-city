'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const manifest=JSON.parse(read('published-game-capture/assets/jay-v117/manifest.json'));
let profile='jay',combat=false;const events={},docEvents={},images=[];
const window={HARBOR:{profiles:{current:()=>profile},outbreak:{active:()=>combat},academy:{active:()=>false}},addEventListener:(k,fn)=>events[k]=fn};
const document={querySelector:()=>null,getElementById:()=>null,hidden:false,addEventListener:(k,fn)=>docEvents[k]=fn,querySelectorAll:()=>[]};
const source=read('published-game-capture/v117-jay.js');
vm.runInNewContext(source,{window,document,Image:function(){const im={complete:true,naturalWidth:0,naturalHeight:512};Object.defineProperty(im,'src',{set(v){im.naturalWidth=v.includes('walk')?1152:1024;}});images.push(im);return im;},Math,Map,Object});
const jay=window.ROOKIE_JAY;assert(jay.ready());
for(const map of ['harbor-main','station','midtown','southbay','maple','industrial','waterfront']){
 jay.update(map,{map,x:0,y:0,dir:'down'},1/60);
 for(const [dir,row] of [['down',0],['left',1],['right',2],['up',3]]){
  const cols=[];for(let i=0;i<8;i++){const p=jay.pose({mode:'walk',phase:i,dir});assert.equal(p.row,row);cols.push(p.col);}
  assert.deepEqual(cols,[1,2,3,4,5,6,7,8]);assert.equal(jay.pose({mode:'idle',phase:6,dir}).col,0);
 }
}
let a=jay.update('walk',{map:'world',x:0,y:0,dir:'left'},.02);
a=jay.update('walk',{map:'world',x:4,y:0,dir:'left'},.02);assert.equal(a.mode,'walk');const phase=a.phase;
a=jay.update('walk',{map:'world',x:4,y:0,dir:'left'},.02);assert.equal(a.mode,'idle');assert.equal(a.phase,phase);
a=jay.update('walk',{map:'world',x:10,y:0,dir:'right',run:true},.02);assert.equal(a.mode,'run');
a=jay.update('walk',{map:'world',x:1000,y:0,dir:'right'},.02);assert.equal(a.mode,'idle');assert.equal(a.phase,0);
a=jay.update('walk',{map:'new',x:1005,y:0,dir:'up'},.02);assert.equal(a.mode,'idle');
// Integrating acceleration over subdivided time must give the same speed/distance.
const integrate=fps=>{let speed=0,distance=0;for(let i=0;i<fps;i++){const q=jay.advanceSpeed(speed,325,1/fps);speed=q.speed;distance+=q.distance;}return {speed,distance};};
for(const fps of [30,60,120]){const a=integrate(fps),b=integrate(60);assert(Math.abs(a.distance-b.distance)<1e-8);assert(Math.abs(a.speed-b.speed)<1e-8);}
assert(integrate(60).distance>270);
events.keydown({key:'Shift'});assert(jay.requestRun());events.blur();assert(!jay.requestRun());
combat=true;assert(!jay.eligible());combat=false;profile='rosa';assert(!jay.eligible());profile='jay';
const calls=[],g={save(){},restore(){},beginPath(){},ellipse(){},fill(){},drawImage(...args){calls.push(args);}};
for(const map of ['station','harbor-main','midtown'])jay.draw(g,map,{map,x:500,y:600,dir:'up'});
assert(calls.every(c=>c[0]===images[0]));const upClip=manifest.walk.frame_bounds[27];
assert.deepEqual(calls[0].slice(5),[468+upClip[0]/2,539+upClip[1]/2,upClip[2]/2,upClip[3]/2]);
// Every animation source rect excludes detached pixels and preserves its original
// cell-to-world transform. Cropping must never stretch or shift Jay's artwork.
for(const mode of ['walk','run']){
 const m=manifest[mode];assert.equal(m.frame_bounds.length,m.columns*4);
 for(let row=0;row<4;row++)for(let col=0;col<m.columns;col++){
  const clip=m.frame_bounds[row*m.columns+col],[cx,cy,cw,ch]=clip;
  assert(cx>=0&&cy>=0&&cx+cw<=128&&cy+ch<=128);
  const idle=mode==='walk'&&col===0;
  jay.draw(g,'crop',{map:'crop',x:500,y:600,dir:['down','left','right','up'][row],mode:idle?'idle':mode,phase:mode==='walk'?col-1:col});
  const draw=calls.at(-1);assert.deepEqual(draw.slice(1,5),[col*128+cx,row*128+cy,cw,ch]);
  assert.equal(draw[5]-cx/2,468);assert.equal(draw[6]-cy/2,539);
  assert.equal(draw[7]/cw,.5);assert.equal(draw[8]/ch,.5);
 }
}
for(let col=0;col<9;col++)assert(manifest.walk.frame_bounds[9+col][1]>10,'Left-facing walk must exclude the strip above the hair');
for(let col=0;col<8;col++){const c=manifest.run.frame_bounds[16+col];assert(c[1]+c[3]<118,'Right-facing run must exclude feet leaking from the next row');}
assert(!/requestAnimationFrame|createElement\(['"]canvas|localStorage/.test(source));
// Exercise bridge in the real dispatcher contract, including original mode delegation.
let speed=196,delegate=0,paint,draws=0,open=false,throws=false;
const sandbox={window,Math,state:{map:'station'},player:{x:10,y:20,w:26,h:26,speed,dir:'down'},ctx:g,dlgOpen:false,
 movePlayer(dt){delegate++;if(throws)throw Error('fixture');sandbox.player.y+=sandbox.player.speed*dt;},
 characterRenderers:{add(kind,id,priority,fn){assert.equal(id,'jay-shared-v117');assert.equal(priority,100);paint=fn;}},overlayOpen:()=>false,isDriving:()=>false};
window.HARBOR.seamlessCampusV115={isOpen:()=>open};vm.runInNewContext(read('published-game-capture/v117-jay-bridge.js'),sandbox);
assert(paint(10,20,null,null,'JAY','down',true));assert(!paint(10,20,null,null,'NPC','down',false));
events.keydown({key:'Shift'});sandbox.movePlayer(.02);assert.equal(sandbox.player.speed,196);assert(sandbox.player.y>26);
throws=true;assert.throws(()=>sandbox.movePlayer(.02));assert.equal(sandbox.player.speed,196);throws=false;
combat=true;const y=sandbox.player.y;sandbox.movePlayer(.02);assert(Math.abs(sandbox.player.y-y-196*.02)<1e-8);assert(!paint(10,20,null,null,'JAY','down',true));combat=false;
sandbox.state.map='training';assert(!paint(10,20,null,null,'JAY','down',true));sandbox.state.map='station';events.blur();
// Extract the compiled loop to prove hidden-world suspension and safe resumption.
const bundlePath=process.argv[2];if(bundlePath){
 const bundle=fs.readFileSync(bundlePath,'utf8'),start=bundle.indexOf('function loop(t){'),end=bundle.indexOf('\nrefreshPanels();',start);
 const loopSource=bundle.slice(start,end);assert(loopSource.includes('seamlessCampusV115?.isOpen()'));
 const noop=()=>{};
 const clock={window,document:{hidden:false,querySelector:()=>null},Math,console,requestAnimationFrame(){clock.scheduled++;},scheduled:0,lastT:1200,simDt:.02,
 frameFailureCount:0,frameFailure:null,perfRing:[],perfFramesTotal:0,perfLongFrames:0,dlgOpen:false,overlayOpen:()=>false,isDriving:()=>false,
 movePlayer:noop,updateTraffic:noop,updatePeds:noop,pushPlayerFromTraffic:noop,draw(){clock.draws++;clock.drawDt=clock.simDt;},draws:0};
 vm.createContext(clock);vm.runInContext(loopSource,clock);open=true;clock.loop(9000);assert.equal(clock.lastT,0);assert.equal(clock.simDt,0);assert.equal(clock.scheduled,1);assert.equal(clock.draws,0);
 open=false;clock.loop(12000);assert.equal(clock.frameFailureCount,0);assert.equal(clock.draws,1);assert.equal(clock.drawDt,0,'Returning from hidden world cannot jump the campaign clock');
 open=true;combat=true;clock.loop(12016);assert.equal(clock.draws,2,'Original combat loop must remain active');combat=false;
 assert.equal((bundle.match(/jay-shared-v117/g)||[]).length,1);
}
for(const mode of ['walk','run']){const m=manifest[mode],bytes=fs.readFileSync(path.join(root,'published-game-capture/assets/jay-v117',m.file));assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),m.sha256);assert.deepEqual(m.cell,[128,128]);assert(m.unique_by_row.every(n=>n>=8));}
console.log('PASS Jay: four facings/eight phases, all maps one identity, actual-distance stride, blocked/idle freeze, run, frame-rate integration, fixed anchor, teleport reset, input cleanup, original combat delegation and one active world');

'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),out='cruiser-turning-evidence';fs.mkdirSync(out,{recursive:true});
const baseline='2e17267',normalize=s=>s.replace(/\r\n/g,'\n');
const read=p=>normalize(fs.readFileSync(p,'utf8'));
const old=p=>normalize(cp.execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:8*1024*1024}));
const protectedFiles={};
for(const name of ['game.js','outbreak.css','v115-campus.js','v115-world.js','v116-marina.js','v116-marina-walk.js','v117-jay.js','civilian-connected.js','v135-precinct-wallkit-test.js']){
 const p='published-game-capture/'+name,s=read(p);let expected=old(p);
 if(name==='v115-campus.js'){
  const start='  // Static connected geometry is indexed once.',end='  // Read-only browser QA aid:';
  const originalStart=expected.indexOf('  function blocked('),originalEnd=expected.indexOf(end);
  assert(s.includes(start),'Static collision index present');
  expected=expected.slice(0,originalStart)+s.slice(s.indexOf(start),s.indexOf(end))+expected.slice(originalEnd);
  cp.execFileSync(process.execPath,['qa/check-connected-collision-index.cjs']);
 }
 assert.equal(s,expected,'Protected source outside the equivalence-tested collision candidate index '+name);protectedFiles[p]=crypto.createHash('sha256').update(s).digest('hex');
}
const raw='published-game-capture/assets/police-driving/cruiser-16-source.png',bytes=fs.readFileSync(raw),original=cp.execFileSync('git',['show',baseline+':'+raw],{maxBuffer:16*1024*1024});assert(bytes.equals(original),'Original fallback/source artwork is preserved');protectedFiles[raw]=crypto.createHash('sha256').update(bytes).digest('hex');
const bridge='published-game-capture/precinct-cruiser.js',s=read(bridge),before=old(bridge);
for(const [a,b] of [[' function collides(',' function show('],[' function interact(',' for(const b of controls.'],['  blocksWalker:','  suspend:']]){
 assert.equal(s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a))),before.slice(before.indexOf(a),before.indexOf(b,before.indexOf(a))),'Existing collision, entry/exit and traffic yielding retained');
}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),runs=[];try{
 for(const legacy of [true,false]){
  const p=await b.newPage({viewport:{width:1280,height:800}});await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1'+(legacy?'&cruiserLegacy=1':''));await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());await p.evaluate(()=>{const h=window.HARBOR;h.profiles.choose('jay');h.seamlessCampusV115.openAt(1705,1568,1.2)});await p.waitForFunction(()=>window.ROOKIE_CRUISER_VISUAL.status().status==='ready');await p.waitForTimeout(500);
  const result=await p.evaluate(()=>new Promise(resolve=>{let first=0,last=0;const times=[];function tick(t){if(!first)first=t;if(last)times.push(t-last);last=t;if(t-first<1800)return requestAnimationFrame(tick);times.sort((a,b)=>a-b);resolve({fps:Math.round(times.length*10000/(t-first))/10,p95Ms:times[Math.floor(times.length*.95)],car:window.HARBOR.seamlessCampusV115.cruiserQA().snapshot()});}requestAnimationFrame(tick)}));
  assert.equal(result.car.lightMode,'off');if(legacy)assert.equal(result.car.visual.draws,0);else assert(result.car.visual.draws>0&&result.car.art.reviewed);
  runs.push({legacy,...result});await p.close();
 }
 assert.deepEqual(runs.map(r=>[r.car.x,r.car.y,r.car.angle,r.car.speed]),[[1760,1568,Math.PI/2,0],[1760,1568,Math.PI/2,0]],'Renderer choice never moves the vehicle');
 const p=await b.newPage(),requests=[];p.on('request',r=>{if(r.url().includes('/police-driving/'))requests.push(r.url())});await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1');await p.waitForFunction(()=>window.HARBOR?.outbreak);await p.locator('#familySelect .family-card').filter({hasText:'Jay'}).click();
 const zombie=await p.evaluate(()=>{const h=window.HARBOR;h.dismissTransient();h.outbreak.seed(9012026);return {started:h.academy.begin('zombie','explorer'),refused:h.seamlessCampusV115.openAt(1705,1568,1)===false,map:h.outbreakMap.build(),visual:window.ROOKIE_CRUISER_VISUAL.status()};});assert(zombie.started&&zombie.refused);assert.equal(requests.length,0);assert.equal(zombie.visual.status,'idle');
 const expected=JSON.parse(fs.readFileSync('docs/precinct-cruiser/safety.json','utf8')).zombie.mapSHA256;assert.equal(crypto.createHash('sha256').update(JSON.stringify(zombie.map)).digest('hex'),expected,'Seeded Zombie map remains identical');
 fs.writeFileSync(out+'/isolation.json',JSON.stringify({baseline,protectedFiles,runs,zombie:{started:true,refused:true,assetRequests:0,visualStatus:zombie.visual.status,mapSHA256:expected}},null,2));
 console.log('PASS protected controller/world/traffic/cast/mode sources, exact collision-index equivalence, original entry/exit; default 16-pose renderer, legacy fallback, equal parked position and untouched seeded Zombie map');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

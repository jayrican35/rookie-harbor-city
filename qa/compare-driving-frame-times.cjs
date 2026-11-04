'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const clean=s=>s.replace(/\r\n/g,'\n');
const campus=clean(fs.readFileSync('published-game-capture/v115-campus.js','utf8'));
const old=clean(cp.execFileSync('git',['show',(process.env.ROOKIE_PERF_BASELINE||'3984435')+':published-game-capture/v115-campus.js'],{encoding:'utf8'}));
const compiled=clean(fs.readFileSync('site/preview/civilian-updated/game-v115.bundle.js','utf8'));
assert(compiled.includes(campus));
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),runs=[];try{
for(const rate of [1,4])for(const baseline of [true,false]){
 const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.route('**/game-v115.bundle.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:baseline?compiled.replace(campus,old):compiled}));
 await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1');await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());await p.evaluate(()=>{const h=window.HARBOR;h.profiles.choose('jay');h.seamlessCampusV115.openAt(1705,1568,1.2)});await p.waitForFunction(()=>window.ROOKIE_CRUISER_VISUAL.status().status==='ready');await p.keyboard.press('e');
 await p.waitForTimeout(2000);const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate});await p.keyboard.down('w');await p.keyboard.down('d');
 const timing=await p.evaluate(()=>new Promise(resolve=>{let first=0,last=0;const times=[];requestAnimationFrame(function tick(t){if(!first)first=t;if(last)times.push(t-last);last=t;if(t-first<4500)return requestAnimationFrame(tick);times.sort((a,b)=>a-b);resolve({fps:Math.round(times.length*10000/(t-first))/10,p50Ms:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],over34:times.filter(x=>x>34).length,frames:times.length})})}));
 runs.push({baseline,rate,...timing});await p.close();
}
fs.writeFileSync('cruiser-turning-evidence/frame-comparison.json',JSON.stringify({baseline:process.env.ROOKIE_PERF_BASELINE||'3984435',note:'Uninstrumented actual driving; identical art, view, keys. Baseline campus served from the selected local commit in an isolated browser route. Headless Chrome; not a handset benchmark.',runs},null,2));console.log(runs);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

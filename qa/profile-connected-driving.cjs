'use strict';
const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage({viewport:{width:1280,height:800}});
await p.addInitScript(()=>{window.__work={draws:{},writes:0,writeMs:0};const proto=CanvasRenderingContext2D.prototype;
for(const k of ['drawImage','fillRect','fillText']){const fn=proto[k];proto[k]=function(...a){const id=this.canvas.id||'(offscreen)';window.__work.draws[id]=(window.__work.draws[id]||0)+1;return fn.apply(this,a)}}
const set=Storage.prototype.setItem;Storage.prototype.setItem=function(...a){const t=performance.now();try{return set.apply(this,a)}finally{window.__work.writes++;window.__work.writeMs+=performance.now()-t}};
});
await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1');await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());
await p.evaluate(()=>{const h=window.HARBOR;h.profiles.choose('jay');h.seamlessCampusV115.openAt(1705,1568,1.2)});await p.waitForFunction(()=>window.ROOKIE_CRUISER_VISUAL.status().status==='ready');await p.keyboard.press('e');
const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await p.waitForTimeout(1000);
await p.evaluate(()=>{window.__work.draws={};window.__work.writes=0;window.__work.writeMs=0});
await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
await p.keyboard.down('w');await p.keyboard.down('d');
const timing=await p.evaluate(()=>new Promise(resolve=>{const ms=[];let first=0,last=0;requestAnimationFrame(function tick(t){if(!first)first=t;if(last)ms.push(t-last);last=t;if(t-first<6000)return requestAnimationFrame(tick);ms.sort((a,b)=>a-b);resolve({frames:ms.length,fps:ms.length*1000/(t-first),p50:ms[Math.floor(ms.length*.5)],p95:ms[Math.floor(ms.length*.95)],over34:ms.filter(x=>x>34).length,work:window.__work})})}));
const {profile}=await cdp.send('Profiler.stop'),nodes=new Map(profile.nodes.map(n=>[n.id,n])),cost=new Map();
for(let i=0;i<profile.samples.length;i++){const n=nodes.get(profile.samples[i]);const k=n.callFrame.functionName+' '+n.callFrame.url.split('/').pop()+':'+n.callFrame.lineNumber;cost.set(k,(cost.get(k)||0)+(profile.timeDeltas[i]||0));}
const result={throttle:4,...timing,topSelfMs:[...cost].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([fn,t])=>({fn,ms:t/1000}))};
fs.mkdirSync('cruiser-turning-evidence',{recursive:true});fs.writeFileSync('cruiser-turning-evidence/performance-'+(process.argv[2]||'latest')+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const versions=[];
 try{
  for(const tag of ['before','updated']){
   const page=await browser.newPage();
   await page.goto(`http://127.0.0.1:8767/preview/marina-${tag}/?pilotQA=1`);
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V116_MARINA);
   const maps=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.perspectiveQA());
   versions.push({tag,mapHash:crypto.createHash('sha256').update(JSON.stringify(maps)).digest('hex')});
   if(tag==='updated'){
    const result=await page.evaluate(()=>{
     const a=window.HARBOR.seamlessCampusV115,m=window.ROOKIE_V116_MARINA,blocked=(x,y)=>{
      const d=a.test.roadCollisionDiagnostic(x,y,12);
      return d.bounds||d.solidHits.length>0||d.water||d.trees||m.blocksScenery(x,y,12);
     };
     const segments=[[[3700,4108],[4365,4108]],[[4365,4108],[4365,3758]],[[4365,3758],[4450,3758]],
      [[3530,4108],[3530,3990]],[[3590,4108],[3590,4236]],[[3590,4236],[3606,4236]],[[3606,4236],[3606,4280]],
      ...[4655,5105,5555].map(x=>[[x+61,3754],[x+61,4070]])];
     let samples=0;const hits=[];
     for(const [p,q] of segments){const count=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/2);for(let i=0;i<=count;i++){
      const x=p[0]+(q[0]-p[0])*i/count,y=p[1]+(q[1]-p[1])*i/count;samples++;if(blocked(x,y))hits.push({x,y,p,q});
     }}
     const b=m.interiors.find(b=>b.kind==='bait'),f=b.floor;
     // Flood the actual room using the same physical radius as Jay.
     const step=4,start=[Math.round((b.door.x-f.x)/step),Math.round((b.door.y-f.y-16)/step)],seen=new Set(),queue=[start];
     const key=(x,y)=>x+','+y;
     for(let n=0;n<queue.length;n++){
      const [x,y]=queue[n],k=key(x,y);if(seen.has(k))continue;
      const wx=f.x+x*step,wy=f.y+y*step;
      if(wx<f.x+12||wx>f.x+f.w-12||wy<f.y+12||wy>b.door.y-12||blocked(wx,wy))continue;
      seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!seen.has(key(x+dx,y+dy)))queue.push([x+dx,y+dy]);
     }
     const reachable=[...seen].map(k=>{const [x,y]=k.split(',').map(Number);return {x:f.x+x*step,y:f.y+y*step}});
     const fittings=b.furniture.filter(p=>p.solid).map(p=>({id:p.id,solid:blocked(p.x+p.w/2,p.y+p.h/2),reachable:reachable.some(q=>Math.hypot(q.x-p.x-p.w/2,q.y-p.y-p.h/2)<65)}));
     return {radius:12,spacing:2,samples,hits,roomReachableCells:seen.size,fittings,
      waterBlocked:blocked(3100,4300),doorClear:!blocked(b.door.x,b.door.y),
      wallBlocked:blocked(f.x+35,b.door.y),assets:m.metrics().assets};
    });
    assert.equal(result.hits.length,0,JSON.stringify(result.hits.slice(0,5)));assert(result.waterBlocked&&result.doorClear&&result.wallBlocked);
    assert(result.roomReachableCells>500);assert(result.fittings.every(f=>f.solid&&f.reachable));
    versions.at(-1).navigation=result;
   }
   await page.close();
  }
  assert.equal(versions[0].mapHash,versions[1].mapHash,'All nine source district maps stay unchanged');
  fs.writeFileSync('marina-integration-evidence/navigation.json',JSON.stringify({versions},null,2));
  console.log('PASS waterfront/room navigation',JSON.stringify(versions[1].navigation));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

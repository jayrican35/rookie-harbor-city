'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const out='waterfront-layout-evidence';fs.mkdirSync(out,{recursive:true});
async function move(p,key,axis,target,greater){await p.keyboard.down(key);try{await p.waitForFunction(q=>{const s=window.HARBOR.seamlessCampusV115.snapshot();return q.greater?s[q.axis]>=q.target:s[q.axis]<=q.target},{axis,target,greater},{timeout:16000,polling:'raf'})}catch(e){throw Error(`${key} failed: ${JSON.stringify(await p.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot()))}`)}finally{await p.keyboard.up(key)}}
async function start(p,x,y,z=1){assert(await p.evaluate(v=>window.HARBOR.seamlessCampusV115.openAt(...v),[x,y,z]),`Start blocked ${x},${y}`)}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),runs=[];
 try{for(const tag of ['before','after'])for(const [width,height] of [[1280,800],[390,844]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:8767/preview/${tag==='before'?'waterfront-layout-before':'marina-updated'}/?pilotQA=1`);
  await p.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY?.ready()&&window.ROOKIE_V116_MARINA?.metrics().decoded===window.ROOKIE_V116_MARINA?.metrics().assets);
  await start(p,3750,4136,.8);fs.mkdirSync(`${out}/${tag}`,{recursive:true});
  for(const [name,x,y,z] of [['corner',4130,3980,.95],['marina',5150,3810,.7],['bay-pier',3590,4170,1.1]]){
   await p.evaluate(v=>window.HARBOR.seamlessCampusV115.qaCamera(...v),[x,y,z]);await p.waitForTimeout(400);await p.screenshot({path:`${out}/${tag}/${width}-${name}.png`});
  }
  const data=await p.evaluate(()=>{
   const a=window.HARBOR.seamlessCampusV115,m=window.ROOKIE_V116_MARINA,hits=[];let samples=0;
   function inspect(x,y,area){samples++;const d=a.test.roadCollisionDiagnostic(x,y,12);if(d.bounds||d.solidHits.length||d.water||d.trees||m.blocksScenery(x,y,12))hits.push({x,y,area,...d});}
   for(let x=4420;x<=5880;x+=12)for(let y=3724;y<=3772;y+=12)inspect(x,y,'Marina promenade');
   for(let x=2820;x<=4120;x+=12)for(let y=4120;y<=4152;y+=8)inspect(x,y,'Bayview boardwalk');
   for(let x=4330;x<=4400;x+=10)for(let y=4008;y<=4256;y+=8)inspect(x,y,'Arrival deck');
   for(const px of [4655,5105,5555])for(let x=px+24;x<=px+66;x+=6)for(let y=3812;y<=4076;y+=8)inspect(x,y,'Pier '+px);
   for(let y=4188;y<=4280;y+=4)inspect(3590,y,'Bayview pier');
   for(let y=3810;y<=4066;y+=8)inspect(3748,y,'New access street');
   for(let x=3748;x<=4220;x+=8)inspect(x,4066,'Shop frontage');
   return {samples,hits,maps:a.perspectiveQA(),cornerDecor:a.perspectiveQA().find(d=>d.id==='southbay').decors.filter(o=>o.x>900&&o.y>730),actors:m.actors.map(n=>({id:n.id,blocked:m.blocksScenery(n.x,n.y,8)})),water:m.blocksScenery(4540,4250,12),deck:m.blocksScenery(4395,4200,12),shop:m.interiors.find(b=>b.kind==='bait').door};
  });
  const mapHash=crypto.createHash('sha256').update(JSON.stringify(data.maps)).digest('hex');delete data.maps;
  fs.writeFileSync(`${out}/${tag}-${width}-audit.json`,JSON.stringify({...data,mapHash},null,2));
  const routes=[];
  if(tag==='after'){
   assert.equal(data.hits.length,0,JSON.stringify(data.hits.slice(0,6)));assert(data.water&&!data.deck);assert(data.actors.every(a=>!a.blocked));
   if(!process.env.LAYOUT_CAPTURE_ONLY&&width===1280){
    await start(p,3000,4136,.9);await move(p,'d','x',4360,true);await move(p,'w','y',3750,false);await move(p,'d','x',5800,true);
    routes.push('Bayview boardwalk through gateway to full Marina promenade');
    for(const px of [4655,5105,5555]){await start(p,px+45,3750,1.1);await move(p,'s','y',4070,true);await move(p,'w','y',3750,false);routes.push('Straight center walk and return: pier '+px)}
    await start(p,3590,4136,1.1);await move(p,'s','y',4274,true);await move(p,'w','y',4136,false);routes.push('Straight Bayview pier walk and return');
    await start(p,3748,3780,.9);await move(p,'s','y',4066,true);await move(p,'d','x',4360,true);routes.push('Connected shop access street to arrival deck');
    await start(p,4000,4118,1.4);await move(p,'w','y',3945,false);await p.waitForTimeout(500);
    const inside=await p.evaluate(()=>{const m=window.ROOKIE_V116_MARINA,b=m.interiors.find(b=>b.kind==='bait');return {inside:b.inside,roof:b.roof,s:window.HARBOR.seamlessCampusV115.snapshot(),camera:window.HARBOR.seamlessCampusV115.entranceQA()}});assert(inside.inside&&inside.roof<.02&&inside.camera.follows);
    await p.evaluate(()=>window.HARBOR.seamlessCampusV115.qaCamera(3950,3920,1.8));await p.screenshot({path:`${out}/after/shop-interior.png`});
    await move(p,'s','y',4118,true);await p.waitForTimeout(500);assert(await p.evaluate(()=>window.ROOKIE_V116_MARINA.interiors.find(b=>b.kind==='bait').roof>.98));routes.push('Relocated shop seamless entry and exit');
   }
   if(!process.env.LAYOUT_CAPTURE_ONLY&&width===390){
    await start(p,4000,4136,.9);const initial=await p.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());const b=await p.locator('#v115CampusPad').boundingBox();
    await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2+35,b.y+b.height/2);await p.waitForTimeout(300);await p.mouse.up();
    assert((await p.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot())).x>initial.x+10);routes.push('Mobile pointer movement');
   }
  }
  assert.equal(errors.length,0);runs.push({tag,width,height,errors,mapHash,samples:data.samples,hits:data.hits.length,routes});await p.close();console.log('PASS waterfront layout',tag,width,'hits',data.hits.length);
 }
 assert.equal(runs[0].mapHash,runs[2].mapHash,'Native map data remains untouched');
 fs.writeFileSync(out+(process.env.LAYOUT_CAPTURE_ONLY?'/captures.json':'/results.json'),JSON.stringify({runs},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

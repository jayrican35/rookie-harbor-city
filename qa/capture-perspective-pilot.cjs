'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out='perspective-evidence';fs.mkdirSync(out,{recursive:true});
const tree=JSON.parse(fs.readFileSync('published-game-capture/assets/community-walk/manifest.json','utf8')).frames.tree_round;
const server=require('node:http').createServer((req,res)=>{
 const root=path.resolve('site'),name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'),file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data);});
});
async function until(page,key,predicate,arg,timeout=16000){await page.keyboard.down(key);try{await page.waitForFunction(predicate,arg,{timeout});}finally{await page.keyboard.up(key);}}
(async()=>{
 await new Promise(r=>server.listen(8768,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const runs=[],protectedRuns=[];
 try{
  for(const tag of ['before','after'])for(const [width,height]of [[390,844],[1280,720]]){
   const folder=`${out}/${tag}`;fs.mkdirSync(folder,{recursive:true});
   const page=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390,
    ...(tag==='after'&&width===1280?{recordVideo:{dir:`${folder}/video`,size:{width,height}}}:{})});
   const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
   const dir=tag==='after'?'precinct9-perspective-pilot':'precinct9-perspective-before';
   await page.goto(`http://127.0.0.1:8768/preview/${dir}/?pilotQA=1&v116QA=0`);
   await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY?.ready());
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1430,.85)));
   await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.stats()?.communityAtlas&&window.ROOKIE_V135_WALL_KIT?.stats()?.roadAtlas);
   if(tag==='after')await page.waitForFunction(()=>window.ROOKIE_V135_WALL_KIT?.perspectivePilot?.().loaded);
   for(const [name,x,y,z]of [['campus',1400,960,.4],['normal-gameplay',948,1430,.85],['traffic',948,1784,1],['outside-pilot',4932,1784,.65]]){
    await page.evaluate(q=>window.HARBOR.seamlessCampusV115.qaCamera(...q),[x,y,z]);await page.waitForTimeout(400);
    await page.screenshot({path:`${folder}/${width}-${name}.png`});
   }
   const baseline=await page.evaluate(()=>{const api=window.HARBOR.seamlessCampusV115;const geometry=api.geometry();delete geometry.spots;
    return{geometry,links:api.links(),entrances:api.entrances,player:api.snapshot().playerId,collisions:[[948,1124],[1918,1256],[948,1500],[948,1680],[1918,1550]].map(([x,y])=>({x,y,blocked:api.test.blocked(x,y,11)}))};});
   assert(baseline.collisions.every(p=>!p.blocked));
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1430,1)));
   const animation=[];
   for(const [key,dir]of [['d','right'],['a','left'],['w','up'],['s','down']]){
    await page.keyboard.down(key);await page.waitForTimeout(260);
    const state=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));await page.keyboard.up(key);
    assert.equal(state.dir,dir);assert.equal(state.mode,'walk');assert(state.phase>0);animation.push(state);
   }
   await page.keyboard.down('Shift');await page.keyboard.down('s');await page.waitForTimeout(450);
   const running=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
   await page.screenshot({path:`${folder}/${width}-running.png`});
   await page.keyboard.up('s');await page.keyboard.up('Shift');assert.equal(running.mode,'run');
   const follow=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());assert(follow.follows);
   // Start the independent entrance route at the existing doorway approach;
   // the directional animation test above is a separate movement scenario.
   assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1195,1)));
   await until(page,'w',()=>window.HARBOR.seamlessCampusV115.entranceQA()?.room==='LOBBY');
   const interior=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.entranceQA());assert(interior.roofAlpha<.1);
   await page.screenshot({path:`${folder}/${width}-lobby.png`});
   await until(page,'s',()=>window.HARBOR.seamlessCampusV115.entranceQA().playerY>=1680);
   await until(page,'d',()=>window.HARBOR.seamlessCampusV115.entranceQA().playerX>=1918);
   await until(page,'w',()=>window.HARBOR.seamlessCampusV115.entranceQA().playerY<=1245);
   await until(page,'s',()=>window.HARBOR.seamlessCampusV115.entranceQA().playerY>=1390);
   let touch=null;
   if(width===390){
    await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(948,1500,1));
    const before=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());const pad=await page.locator('#v115CampusPad').boundingBox();assert(pad);
    const cdp=await page.context().newCDPSession(page),x=Math.round(pad.x+pad.width/2),y=Math.round(pad.y+pad.height/2);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+32,y}]});await page.waitForTimeout(450);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const after=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());touch={dx:after.x-before.x};assert(touch.dx>20);await cdp.detach();
   }
   // Read-only instrumentation of the actual Canvas calls proves occlusion
   // ordering. Initial QA placements are separate from the real route above.
   await page.evaluate(frame=>{const original=CanvasRenderingContext2D.prototype.drawImage;window.__depth=[];
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
     if(this.canvas.id==='v115CampusCanvas'){
      const src=args[0]?.src||'';
      if(src.includes('/assets/jay-v117/')||src.includes('/assets/v126-jay/'))window.__depth.push('jay');
      if(src.includes('/assets/community-walk/')&&args[1]===frame.x&&args[2]===frame.y&&args[5]===782&&args[6]===1312)window.__depth.push('tree');
     }return original.apply(this,args);
    };
   },tree);
   const depth=[];
   for(const [name,y]of [['behind-tree',1410],['in-front-of-tree',1470]]){
    await page.evaluate(y=>window.HARBOR.seamlessCampusV115.openAt(818,y,1),y);
    await page.waitForTimeout(180);
    const order=await page.evaluate(()=>{const a=window.__depth;return {jay:a.lastIndexOf('jay'),tree:a.lastIndexOf('tree')};});
    assert(order.jay>=0&&order.tree>=0,'Actual tree/player Canvas calls must be observed');
    assert(name==='behind-tree'?order.jay<order.tree:order.jay>order.tree,'Feet sorting: '+name);
    depth.push({name,...order});await page.screenshot({path:`${folder}/${width}-${name}.png`});
   }
   if(tag==='after'){
    const rejected=await page.evaluate(()=>window.ROOKIE_V135_WALL_KIT.drawPilotVehicle({}, {x:3000,y:1784,dir:'right',kind:'civilian'})===false);assert(rejected);
   }
   const performance=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.metrics());
   const pilot=await page.evaluate(()=>window.ROOKIE_V135_WALL_KIT.perspectivePilot?.()||null);
   assert.equal(errors.length,0,'Browser exceptions: '+errors.join(';'));
   assert(!failed.some(url=>url.includes('/perspective-pilot/')),'Pilot assets must load');
   runs.push({tag,width,height,baseline,animation,running,follow,interior,touch,depth,performance,pilot,errors,failed});await page.close();
   fs.writeFileSync(`${out}/results.json`,JSON.stringify({runs,protectedRuns},null,2));
  }
  for(const width of [390,1280]){
   const pair=runs.filter(r=>r.width===width);assert.deepEqual(pair[0].baseline,pair[1].baseline,'Original geometry/navigation/player unchanged');
  }
  for(const tag of ['before','after']){
   const page=await browser.newPage({viewport:{width:1280,height:720}}),dir=tag==='after'?'precinct9-perspective-pilot':'precinct9-perspective-before';
   await page.goto(`http://127.0.0.1:8768/preview/${dir}/?pilotQA=1`);await page.waitForFunction(()=>window.HARBOR?.outbreak);
   await page.locator('#familySelect .family-card').filter({hasText:'Jay'}).click();
   const result=await page.evaluate(()=>{const H=window.HARBOR;H.dismissTransient();H.outbreak.seed(9012026);const started=H.academy.begin('zombie','explorer');
    return {started,map:H.outbreakMap.build(),pilotLoaded:!!window.ROOKIE_V135_WALL_KIT.perspectivePilot?.().loaded,refused:H.seamlessCampusV115.openAt(948,1195,1)===false};});
   assert(result.started&&result.refused&&!result.pilotLoaded);assert(await page.evaluate(()=>window.HARBOR.armory.inspect('rifle')));
   await page.locator('#armoryPanel .armory-equip').click();result.weapon=await page.evaluate(()=>window.HARBOR.training.status().weaponId);assert.equal(result.weapon,'rifle');
   await page.screenshot({path:`${out}/${tag}/protected-mode.png`});protectedRuns.push({tag,...result});await page.close();
  }
  assert.deepEqual(protectedRuns[0].map,protectedRuns[1].map);
  fs.writeFileSync(`${out}/results.json`,JSON.stringify({runs,protectedRuns},null,2));
  console.log(JSON.stringify({runs:runs.map(r=>({tag:r.tag,width:r.width,walkDirections:r.animation.map(a=>a.dir),run:r.running.mode,touch:r.touch,paintP95Ms:r.performance.paintP95Ms,pilot:r.pilot,errors:r.errors})),protectedMode:'startup/map/equipment parity; full playthrough not certified'},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

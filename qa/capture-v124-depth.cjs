'use strict';
// Real on-screen evidence of V124 sorting at exact world coordinates.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.V124_BEFORE_URL||'http://127.0.0.1:8765/preview/v123-collision/?v116QA=1&pilotQA=1';
const after=process.env.V124_AFTER_URL||'http://127.0.0.1:8765/preview/v124-depth/?v116QA=1&pilotQA=1';
const folder=process.env.V124_EVIDENCE||path.resolve('site/preview/v124-depth/evidence');
const scenes=[
 {name:'lamp-in-front',x:5073,y:3759,cx:5065,cy:3727},
 {name:'lamp-behind',x:5073,y:3702,cx:5065,cy:3727},
 {name:'building-front',x:4730,y:3582,cx:4730,cy:3510}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const records=[];
 for(const scene of scenes)for(const [version,url] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V116_MARINA,{timeout:35000});
  const setup=await page.evaluate(({x,y,cx,cy})=>{
   const game=window.HARBOR.seamlessCampusV115;
   if(game.test.blocked(x,y))throw Error('Expected walkable scene point is blocked '+x+','+y);
   if(!game.openAt(x,y,1.10))throw Error('Could not position Jay '+x+','+y);
   if(!game.qaCamera(cx,cy,1.10))throw Error('Could not position real camera');
   return {x,y};
  },scene);
  await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.isOpen()&&window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:30000});
  await page.waitForTimeout(1000);
  const state=await page.evaluate(()=>{
   const m=window.ROOKIE_V116_MARINA;
   const lamp=m.depthProps?.({x:5000,y:3600,w:150,h:200})?.find(p=>p.kind==='tall'&&p.object.x===5060);
   const office=m.interiors.find(b=>b.id==='marina:office');
   const roof=m.depthProps?.({x:4550,y:3300,w:350,h:380})?.find(p=>p.kind==='roof'&&p.building.id===office.id);
   return {player:window.HARBOR.seamlessCampusV115.snapshot(),
     lampDepth:lamp?.depthY??null,officeDepth:roof?.depthY??null,
     officeRoof:office.roof,waterSolid:window.HARBOR.seamlessCampusV115.test.blocked(5000,3920),
     pierClear:!window.HARBOR.seamlessCampusV115.test.blocked(5150,3920)};
  });
  if(version==='after'){
   assert.equal(state.lampDepth,3737);
   assert(state.waterSolid&&state.pierClear);
   if(scene.name==='lamp-in-front')assert(state.player.y>state.lampDepth,'Jay must draw after lamp');
   if(scene.name==='lamp-behind')assert(state.player.y<state.lampDepth,'Jay must draw before lamp');
   if(scene.name==='building-front'){
    assert(state.officeDepth<state.player.y,'Jay must draw after shop roof on front pavement');
    assert(state.officeRoof>.97,'Roof must remain closed outside doorway threshold');
   }
  }
  if(errors.length)throw Error(errors.join('\n'));
  await page.locator('#v115CampusCanvas').screenshot({path:path.join(folder,scene.name+'-'+version+'-canvas.png')});
  await page.screenshot({path:path.join(folder,scene.name+'-'+version+'-gameplay.png')});
  records.push({scene:scene.name,version,position:setup,state,errors});
  console.log('PASS V124 actual gameplay',scene.name,version,'roof',state.officeRoof,'lampDepth',state.lampDepth);
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(folder,'metrics.json'),JSON.stringify({records,notes:'Chromium mobile-sized genuine game Canvas, not Android FPS or generated concept art'},null,2));
})().catch(e=>{console.error(e);process.exit(1)});

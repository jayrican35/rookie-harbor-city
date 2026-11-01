'use strict';
// Browser evidence: actual rendered character/pier overlap, never a generated mockup.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.V122_BEFORE_URL||'http://127.0.0.1:8765/preview/v121-marina/?v116QA=1&pilotQA=1';
const after=process.env.V122_AFTER_URL||'http://127.0.0.1:8765/preview/v122-pier/?v116QA=1&pilotQA=1';
const out=process.env.V122_EVIDENCE||path.resolve('site/preview/v122-pier/evidence');
const scenes=[{name:'behind-post',x:5119,y:3834},{name:'in-front-of-post',x:5119,y:3882}];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={note:'Real game Canvas at matched world coordinates, 390×844 mobile Chromium. Not physical Android FPS.',captures:[]};
 for(const scene of scenes)for(const [which,url] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.HARBOR?.seamlessCampusV115&&!!window.ROOKIE_V116_MARINA,{timeout:45000});
  const init=await page.evaluate(({x,y})=>{
   const api=window.HARBOR.seamlessCampusV115;
   if(api.test.blocked(x,y))throw Error('Original pier geometry blocks requested in-bounds player position');
   if(!api.openAt(x,y,1.10))throw Error('Could not position real player on original pier');
   if(!api.qaCamera(5140,3860,1.10))throw Error('Cannot set matching camera for pier test');
   return {x,y};
  },scene);
  await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.isOpen()&&window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:30000});
  if(which==='after')await page.waitForFunction(()=>window.ROOKIE_V120_ART?.ready()&&typeof window.ROOKIE_V116_MARINA.drawPierPost==='function',{timeout:30000});
  await page.waitForTimeout(950);
  const state=await page.evaluate(()=>{
   const m=window.ROOKIE_V116_MARINA;
   const actor=window.HARBOR.seamlessCampusV115.snapshot();
   const post=m.pierOccluders?.({x:5080,y:3760,w:180,h:220})?.find(p=>p.y===3820&&p.x===5108);
   return {actor,post:post?{x:post.x,y:post.y,depthY:post.depthY}:null,
    blockedPier:window.HARBOR.seamlessCampusV115.test.blocked(5160,3940),
    blockedWater:window.HARBOR.seamlessCampusV115.test.blocked(5010,3940),
    material:window.ROOKIE_V120_ART?.metrics()||null};
  });
  assert.equal(state.actor.x,scene.x);
  assert.equal(state.actor.y,scene.y);
  assert.equal(state.blockedPier,false);
  assert.equal(state.blockedWater,true);
  if(which==='after'){
   assert(state.post&&state.post.depthY===3851);
   assert(state.material.ready&&state.material.dockTiles>0);
   assert(state.material.postDraws>0,'Real pier pilings must have been drawn through actor queue');
  }
  if(errors.length)throw Error('Page errors '+errors.join(' | '));
  await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,scene.name+'-'+which+'-canvas.png')});
  await page.screenshot({path:path.join(out,scene.name+'-'+which+'-gameplay.png')});
  report.captures.push({scene:scene.name,which,worldPos:init,metrics:state,errors});
  console.log('PASS',scene.name,which,JSON.stringify({postDepth:state.post?.depthY,postDraws:state.material?.postDraws}));
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(report,null,2));
 console.log('PASS V122: real playable behind/in-front piling depth screenshots with native pier/water collisions preserved');
})().catch(e=>{console.error(e);process.exit(1)});

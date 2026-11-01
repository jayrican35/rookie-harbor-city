'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const before=process.env.V119_BEFORE_URL||'http://127.0.0.1:8765/preview/v118-cinematic/?v116QA=1&pilotQA=1';
const after=process.env.V119_AFTER_URL||'http://127.0.0.1:8765/preview/v119-water-motion/?v116QA=1&pilotQA=1';
const out=process.env.V119_EVIDENCE||path.resolve('site/preview/v119-water-motion/evidence');
const views=[{name:'portrait',width:390,height:844,zoom:.85},{name:'landscape',width:844,height:390,zoom:1.04}];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={before,after,description:'Real in-game Canvas at matched viewport, zoom and world coordinates; desktop Chromium Android-sized simulation, not physical device',scenes:[]};
 for(const v of views){
  for(const [name,url] of [['before',before],['after',after]]){
   const page=await browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>!!window.HARBOR?.seamlessCampusV115&&!!window.ROOKIE_V116_MARINA,{timeout:45000});
   const pos=await page.evaluate(({zoom})=>{
    const api=window.HARBOR.seamlessCampusV115;
    const starts=[[5150,3720],[4980,3710],[5340,3720],[4790,3720],[5600,3730]];
    for(const [x,y] of starts)if(!api.test.blocked(x,y)&&api.openAt(x,y,zoom))return [x,y];
    throw Error('No clear marina entry');
   },{zoom:v.zoom});
   await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.isOpen()&&window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:30000});
   await page.evaluate(({zoom})=>{
    if(!window.HARBOR.seamlessCampusV115.qaCamera(5180,3880,zoom))throw Error('QA camera positioning failed');
   },{zoom:v.zoom});
   await page.waitForTimeout(750);
   const metrics=await page.evaluate(()=>({
    marina:window.ROOKIE_V116_MARINA.metrics(),
    visual:window.ROOKIE_V119_MOTION?.metrics()||null,
    world:window.HARBOR.seamlessCampusV115.snapshot()
   }));
   if(name==='after'){
    if(!metrics.visual||metrics.visual.waterFrames===0||metrics.visual.waveCrests<10||metrics.visual.boatWakes<3)
      throw Error('V119 wave and wake pass did not run: '+JSON.stringify(metrics));
   }
   if(errors.length)throw Error('Runtime errors: '+errors.join('; '));
   await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,v.name+'-'+name+'-canvas.png')});
   await page.screenshot({path:path.join(out,v.name+'-'+name+'-gameplay.png')});
   report.scenes.push({name:v.name,version:name,viewport:[v.width,v.height],zoom:v.zoom,pos,metrics,errors});
   await page.close();
  }
 }
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(report,null,2));
 await browser.close();
 console.log('PASS V119: real visible browser scenes, matching water camera and zoom; wave/wake visual hooks ran in both layouts');
})().catch(error=>{console.error(error);process.exit(1)});

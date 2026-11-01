'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const before=process.env.V120_BEFORE_URL||'http://127.0.0.1:8765/preview/v119-water-motion/?v116QA=1&pilotQA=1';
const after=process.env.V120_AFTER_URL||'http://127.0.0.1:8765/preview/v120-premium/?v116QA=1&pilotQA=1';
const out=process.env.V120_EVIDENCE||path.resolve('site/preview/v120-premium/evidence');
const sizes=[{label:'portrait',width:390,height:844,zoom:.85},{label:'landscape',width:844,height:390,zoom:1.04}];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={before,after,disclaimer:'Real game screenshots using desktop Chromium at Android portrait/landscape dimensions; not physical phone performance.',scenes:[]};
 for(const v of sizes)for(const [version,url] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.HARBOR?.seamlessCampusV115&&!!window.ROOKIE_V116_MARINA,{timeout:45000});
  const start=await page.evaluate(({z})=>{
   const api=window.HARBOR.seamlessCampusV115;
   for(const [x,y] of [[5150,3720],[4980,3710],[5340,3720],[4790,3720],[5600,3730]]){
    if(!api.test.blocked(x,y)&&api.openAt(x,y,z))return{x,y};
   }
   throw Error('No valid promenade starting position');
  },{z:v.zoom});
  await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.isOpen()&&window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:35000});
  if(version==='after'){
   await page.waitForFunction(()=>window.ROOKIE_V120_ART?.ready(),{timeout:30000});
  }
  await page.evaluate(({z})=>{
   if(!window.HARBOR.seamlessCampusV115.qaCamera(5180,3880,z))throw Error('Camera position unavailable');
  },{z:v.zoom});
  await page.waitForTimeout(1300);
  const metrics=await page.evaluate(()=>({
   camera:window.HARBOR.seamlessCampusV115.snapshot(),
   marina:window.ROOKIE_V116_MARINA.metrics(),
   v120:window.ROOKIE_V120_ART?.metrics()||null,
   originalBlocked:window.HARBOR.seamlessCampusV115.test.blocked(5010,3940),
   originalPierOpen:!window.HARBOR.seamlessCampusV115.test.blocked(5145,3940)
  }));
  if(!metrics.originalBlocked||!metrics.originalPierOpen)throw Error('Native collision geometry changed');
  if(version==='after'&&(!metrics.v120||!metrics.v120.ready||metrics.v120.waterFrames<2||metrics.v120.materialsDrawn<8||metrics.v120.dockTiles<3))
    throw Error('Real V120 visual material pipeline not active: '+JSON.stringify(metrics));
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,v.label+'-'+version+'-canvas.png')});
  await page.screenshot({path:path.join(out,v.label+'-'+version+'-gameplay.png')});
  report.scenes.push({size:v.label,version,viewport:[v.width,v.height],zoom:v.zoom,spawn:start,metrics,errors});
  console.log('PASS V120 in-game mobile viewport',v.label,version,JSON.stringify({decoded:metrics.v120?.decoded||0,waterFrames:metrics.v120?.waterFrames||0}));
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1)});

'use strict';
/* Capture the ORIGINAL GAME canvas at the exact same camera and zoom, no HUD overlays.
 * Requires local preview served at http://127.0.0.1:8765/preview/v115-pilot/?pilotQA=1
 */
const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');
const target=process.env.PILOT_URL||'http://127.0.0.1:8765/preview/v115-pilot/?pilotQA=1';
const dir=process.env.PILOT_EVIDENCE||path.join(process.cwd(),'site/preview/v115-pilot/evidence');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
 await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!(window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V115_PRECINCT_PILOT),{timeout:45000});
 await page.evaluate(()=>document.querySelector('#v115CampusLaunch')?.click());
 await page.waitForFunction(()=>window.HARBOR.seamlessCampusV115.isOpen(),{timeout:12000});
 await page.waitForFunction(()=>window.ROOKIE_V115_PRECINCT_PILOT.ready(),{timeout:30000});
 await page.evaluate(()=>{
  if(!window.HARBOR.seamlessCampusV115.qaCamera(672,1480,.80))throw new Error('QA camera unavailable');
  document.body.classList.add('pilot-capture');
 });
 fs.mkdirSync(dir,{recursive:true});
 const canvas=page.locator('#v115CampusCanvas');
 await page.evaluate(()=>window.ROOKIE_V115_PRECINCT_PILOT.setEnabled(false));
 await page.waitForTimeout(300);await canvas.screenshot({path:path.join(dir,'before.png')});
 await page.evaluate(()=>window.ROOKIE_V115_PRECINCT_PILOT.setEnabled(true));
 await page.waitForTimeout(300);await canvas.screenshot({path:path.join(dir,'after.png')});
 const perf=await page.evaluate(()=>{
  const s=window.ROOKIE_V115_PRECINCT_PILOT.inspect();
  const can=document.querySelector('#v115CampusCanvas');
  return {...s,canvas:{width:can.width,height:can.height},userAgent:navigator.userAgent};
 });
 fs.writeFileSync(path.join(dir,'metrics.json'),JSON.stringify({url:target,errors,performance:perf,identicalCamera:true},null,2));
 if(errors.length)throw new Error('Browser console errors: '+errors.join(' | '));
 if(perf.loadedSpriteCount<5)throw new Error('Source WebP sprites were not all loaded');
 console.log('Screenshots captured from real V115 canvas at identical camera/zoom:',JSON.stringify(perf));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
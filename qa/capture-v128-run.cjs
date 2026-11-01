'use strict';
// V128 actual playable phone-sized Chromium RUN/idle inspection.
// A browser emulator cannot substitute for physical Android FPS testing.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const url=process.env.V128_URL||'http://127.0.0.1:8765/preview/v128-world-quality/?v116QA=0&pilotQA=1';
 const folder=process.env.V128_EVIDENCE||path.resolve('site/preview/v128-world-quality/evidence');
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_JAY&&window.ROOKIE_V127_CITY,{timeout:45000});
  assert(await page.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(5200,3758,.95)));
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode')&&window.ROOKIE_JAY.ready(),{timeout:35000});
  await page.waitForTimeout(1100);
  await page.screenshot({path:path.join(folder,'v128-idle.png')});
  await page.keyboard.down('Shift');await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>window.ROOKIE_JAY.snapshot('connected-jay')?.mode==='run',{timeout:6000});
  await page.waitForTimeout(280);
  const running=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
  await page.screenshot({path:path.join(folder,'v128-running.png')});
  await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');
  await page.waitForTimeout(900);
  const stopped=await page.evaluate(()=>window.ROOKIE_JAY.snapshot('connected-jay'));
  assert.equal(stopped.mode,'idle','RUN to idle must settle with player planted');
  assert(running.x!==stopped.x||running.y!==stopped.y||running.mode==='run');
  assert.equal(errors.length,0,'No JS console errors: '+errors.join(', '));
  fs.writeFileSync(path.join(folder,'v128-run-metrics.json'),JSON.stringify({running:{mode:running.mode,phase:running.phase},stopped:{mode:stopped.mode,phase:stopped.phase},viewport:'390x844 Chromium emulated mobile',errors},null,2));
  console.log('PASS V128 live mobile-size gameplay RUN / idle transition in the original single player/camera world');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

'use strict';
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),runs=[];
 try{for(const [width,height] of [[1280,800],[390,844],[844,390]])for(const tag of ['before','updated']){
  const page=await browser.newPage({viewport:{width,height},isMobile:width!==1280,hasTouch:width!==1280});
  await page.goto(`http://127.0.0.1:8767/preview/marina-${tag}/?pilotQA=1`);
  await page.waitForFunction(()=>window.ROOKIE_JAY?.ready()&&window.ROOKIE_V120_ART?.ready());
  await page.evaluate(()=>{const a=window.HARBOR.seamlessCampusV115;a.openAt(3700,4108,.7);a.qaCamera(3930,3990,.7)});
  await page.waitForTimeout(1800);
  const result=await page.evaluate(()=>new Promise(resolve=>{let start=0,last=0;const times=[];
   function tick(t){if(!start)start=t;if(last)times.push(t-last);last=t;if(t-start<2400)return requestAnimationFrame(tick);
    times.sort((a,b)=>a-b);resolve({fps:Math.round(times.length*10000/(t-start))/10,frameP95Ms:times[Math.floor(times.length*.95)],marina:window.ROOKIE_V116_MARINA.metrics(),world:window.HARBOR.seamlessCampusV115.metrics()});}requestAnimationFrame(tick);
  }));runs.push({tag,width,height,...result});console.log(tag,width,result.fps,result.frameP95Ms);await page.close();
 }fs.writeFileSync('marina-integration-evidence/performance.json',JSON.stringify({note:'Headless Chrome, same camera/zoom and no video recording for either build. Mobile viewport emulation, not physical hardware.',runs},null,2));}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

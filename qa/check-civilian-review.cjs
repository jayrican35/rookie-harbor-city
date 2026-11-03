'use strict';
const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8767/');await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.ROOKIE_CIVILIANS?.metrics().draws>0);
 await p.screenshot({path:'civilian-evidence/review.png'});
 await p.locator('[data-version=before]').click();await p.waitForFunction(()=>{const w=document.querySelector('iframe').contentWindow;return w.HARBOR?.seamlessCampusV115?.isOpen()&&!w.ROOKIE_CIVILIANS});
 await p.locator('[data-version=updated]').click();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.ROOKIE_CIVILIANS?.metrics().draws>0);
 await p.goto('http://127.0.0.1:8767/evidence/civilian-preview/');await p.waitForFunction(()=>window.atlasReviewReady);
 assert.equal(await p.locator('#roster canvas').count(),30);
 await p.evaluate(()=>Promise.all([...document.querySelectorAll('#roster a')].map(a=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=reject;im.src=a.href}))));
 await p.locator('#play').uncheck();await p.waitForTimeout(180);const down=await p.locator('#roster canvas').first().evaluate(c=>c.toDataURL());
 await p.locator('#direction').selectOption('3');await p.waitForTimeout(180);const up=await p.locator('#roster canvas').first().evaluate(c=>c.toDataURL());assert.notEqual(down,up,'Review direction control must change the displayed frames');
 await p.screenshot({path:'civilian-evidence/atlas-review.png'});assert.equal(errors.length,0);
 console.log('PASS playable before/after review and all 30 supplied atlases, direction and pause controls');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

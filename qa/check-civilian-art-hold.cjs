'use strict';
const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.goto('http://127.0.0.1:8767/');await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.HARBOR?.seamlessCampusV115?.isOpen());
 assert((await p.locator('iframe').getAttribute('src')).includes('civilian-updated'));
 await p.screenshot({path:'civilian-evidence/restored-art.png'});
 await p.goto('http://127.0.0.1:8767/evidence/civilian-preview/');assert.equal(await p.locator('canvas').count(),0);assert((await p.locator('body').innerText()).includes('disabled'));
 const requests=[];p.on('request',r=>{if(r.url().includes('/civilian-approved/atlases/'))requests.push(r.url())});
 await p.goto('http://127.0.0.1:8767/preview/civilian-updated/?pilotQA=1');await p.waitForFunction(()=>window.ROOKIE_CIVILIANS&&window.HARBOR?.seamlessCampusV115);
 assert(await p.evaluate(()=>window.HARBOR.seamlessCampusV115.openAt(3750,4136,1)));
 await p.waitForFunction(()=>window.ROOKIE_CIVILIANS.metrics().draws>0);const m=await p.evaluate(()=>window.ROOKIE_CIVILIANS.metrics());assert(m.requested>0);assert.equal(requests.length,0);
 console.log('PASS corrected artwork active, rejected source remains quarantined, no damaged atlas requests, historical status page accurate');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

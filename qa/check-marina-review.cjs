'use strict';
const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8767/');
  await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.HARBOR?.seamlessCampusV115?.isOpen());
  await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.ROOKIE_V116_MARINA?.metrics().decoded===41);
  await page.screenshot({path:'marina-integration-evidence/review.png'});
  await page.locator('[data-version=before]').click();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.ROOKIE_V116_MARINA?.actors.length===9);
  await page.locator('[data-version=updated]').click();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.ROOKIE_V116_MARINA?.actors.length===12);
  await page.goto('http://127.0.0.1:8767/evidence/marina-integration/');
  for(const path of ['updated/1280-shop-interior.png','waterfront-walk-and-shop.webm','navigation.json','performance.json']){
   const response=await page.request.get('http://127.0.0.1:8767/evidence/marina-integration/'+path);assert.equal(response.status(),200,path);
  }
  assert.equal(errors.length,0);console.log('PASS local playable review, before/after switching, evidence and demonstration links');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

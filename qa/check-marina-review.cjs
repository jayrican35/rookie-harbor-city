'use strict';
const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8767/');
  await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.HARBOR?.seamlessCampusV115?.isOpen());
  await page.waitForFunction(()=>{const m=document.querySelector('iframe').contentWindow.ROOKIE_V116_MARINA;return m&&m.metrics().decoded===m.metrics().assets});
  await page.screenshot({path:'marina-integration-evidence/review.png'});
  await page.locator('[data-version=before]').click();await page.waitForFunction(()=>{const m=document.querySelector('iframe').contentWindow.ROOKIE_V116_MARINA;return m&&!m.objects.some(o=>o.id==='marina:gateway')});
  await page.locator('[data-version=updated]').click();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.ROOKIE_V116_MARINA?.objects.some(o=>o.id==='marina:gateway'));
  await page.goto('http://127.0.0.1:8767/evidence/waterfront-layout/');
  for(const path of ['after/shop-interior.png','after/1280-corner.png','after/1280-marina.png','results.json','performance.json']){
   const response=await page.request.get('http://127.0.0.1:8767/evidence/waterfront-layout/'+path);assert.equal(response.status(),200,path);
  }
  assert.equal(errors.length,0);console.log('PASS local playable review, previous-layout switch and current evidence links');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

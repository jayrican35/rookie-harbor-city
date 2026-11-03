'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),runs=[];
 try{
  for(const tag of ['before','updated']){
   const page=await browser.newPage();await page.goto(`http://127.0.0.1:8767/preview/marina-${tag}/?pilotQA=1`);
   await page.waitForFunction(()=>window.HARBOR?.outbreak);
   await page.locator('#familySelect .family-card').filter({hasText:'Jay'}).click();
   const result=await page.evaluate(()=>{const h=window.HARBOR;h.dismissTransient();h.outbreak.seed(9012026);return {started:h.academy.begin('zombie','explorer'),map:h.outbreakMap.build(),refused:h.seamlessCampusV115.openAt(3700,4108,1)===false}});
   assert(result.started&&result.refused);runs.push({tag,started:result.started,refused:result.refused,mapHash:crypto.createHash('sha256').update(JSON.stringify(result.map)).digest('hex')});await page.close();
  }
  assert.equal(runs[0].mapHash,runs[1].mapHash);fs.writeFileSync('marina-integration-evidence/isolation.json',JSON.stringify({runs},null,2));console.log('PASS Zombie startup, seeded map parity, connected-world exclusion');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

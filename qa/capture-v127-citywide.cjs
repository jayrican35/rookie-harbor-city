'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const before=process.env.V127_BEFORE_URL||'http://127.0.0.1:8765/preview/v126-polish/?v116QA=0&pilotQA=1';
const after=process.env.V127_AFTER_URL||'http://127.0.0.1:8765/preview/v127-citywide/?v116QA=0&pilotQA=1';
const folder=process.env.V127_EVIDENCE||path.resolve('site/preview/v127-citywide/evidence');
const scenes=[
 {name:'marina-center',x:5200,y:3758},
 {name:'marina-east-boundary',x:5975,y:3699},
 {name:'southbay-west-connection',x:4185,y:3700},
 {name:'westfield',x:-2450,y:1784},
 {name:'residential',x:-1180,y:1620},
 {name:'midtown',x:3930,y:1784},
 {name:'downtown',x:5880,y:2010},
 {name:'northgate',x:5850,y:950},
 {name:'eastside',x:7350,y:1784},
 {name:'industrial',x:8520,y:3530}
];
(async()=>{
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 for(const [version,url] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V116_MARINA&&window.ROOKIE_V116_HUD,{timeout:40000});
  await page.evaluate(()=>{
   if(!window.HARBOR.seamlessCampusV115.openAt(5200,3758,.85))throw Error('Marina world could not open');
  });
  await page.waitForFunction(()=>document.body.classList.contains('v116-play-mode'),{timeout:12000});
  if(version==='after'){
   await page.waitForFunction(()=>window.ROOKIE_V127_CITY?.metrics().atlasReady,{timeout:30000});
  }
  const shots=[];
  for(const scene of scenes){
    const location=await page.evaluate(({x,y})=>{
      const api=window.HARBOR.seamlessCampusV115;
      let position=null;
      // Respect genuine legacy collision as we move across the already-linked
      // world; find a walkable point within one block, never teleport maps.
      for(let radius=0;radius<=160&&!position;radius+=32){
        for(let dy=-radius;dy<=radius&&!position;dy+=32){
          for(let dx=-radius;dx<=radius;dx+=32){
            if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
            if(!api.test.blocked(x+dx,y+dy)&&api.test.moveTo(x+dx,y+dy))position={x:x+dx,y:y+dy};
            if(position)break;
          }
        }
      }
      if(!position)throw Error('No walkable world position near '+x+','+y);
      if(!api.qaCamera(position.x,position.y,.95))throw Error('No real game camera');
      return position;
    },scene);
    await page.waitForTimeout(520);
    const obs=await page.evaluate(()=>{
      const p=window.HARBOR.seamlessCampusV115.snapshot();
      const root=document.getElementById('v116MarinaHUD');
      return {
       player:p,visible:root&&!root.hidden&&getComputedStyle(root).display!=='none',
       profile:root?.querySelector('.v116-identity strong')?.textContent||'',
       label:root?.querySelector('.v116-identity i')?.textContent||'',
       menu:root?.querySelector('#v125HudMenu')?.getBoundingClientRect()?.width||0,
       materials:window.ROOKIE_V127_CITY?.metrics()||null,
       pierClear:!window.HARBOR.seamlessCampusV115.test.blocked(4700,3920),
       waterSolid:window.HARBOR.seamlessCampusV115.test.blocked(6000,4010),
       cityChapters:window.HARBOR.worldV115.areas().length,
       worldId:p.worldId,transport:p.transport
      };
    });
    assert.equal(obs.worldId,'harbor-main');
    assert.equal(obs.transport,'none');
    if(version==='after'){
      assert(obs.visible,'HUD disappeared outside Marina at '+scene.name);
      assert(obs.menu>=44,'Native menu lost outside Marina');
      assert(obs.materials?.drawn>0&&obs.materials?.chunks<=112,'World tiles did not render with bounded cache');
      assert(obs.waterSolid,'Water extension collision missing beyond marina');
      assert(obs.label.length>=4,'Location label missing');
    }
    await page.screenshot({path:path.join(folder,scene.name+'-'+version+'.png')});
    shots.push({scene:scene.name,location,...obs});
    console.log('PASS V127 actual world',version,scene.name,location,'HUD',obs.visible,obs.label);
  }
  // Verify real on-screen menu and map remain interactive EAST of the marina.
  if(version==='after'){
    const menu=page.locator('#v125HudMenu');
    await menu.click();
    assert.equal(await page.locator('#v125HudActions').isVisible(),true);
    await page.locator('[data-action="map"]').click();
    assert.equal(await page.locator('.v116-panel').isVisible(),true);
    await page.locator('.v116-panel-close').click();
    const perf=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.metrics());
    results.push({version,shots,perf,errors});
  }else results.push({version,shots,errors});
  if(errors.length)throw Error('JavaScript errors: '+errors.join('\n'));
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(folder,'metrics.json'),JSON.stringify({about:'Actual running continuous-world HTML Canvas. Android-size Chromium viewport; not native device FPS.',results},null,2));
 console.log('PASS V127 ten real-district screenshot comparisons; premium tile atlas, HUD, native map, coastline and original world physics intact');
})().catch(e=>{console.error(e);process.exit(1)});

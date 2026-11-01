'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const url=process.env.V125_URL||'http://127.0.0.1:8765/preview/v125-mobile/?v116QA=0&pilotQA=1';
const out=process.env.V125_EVIDENCE||path.resolve('site/preview/v125-mobile/evidence');
const views=[{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}];
const intersects=(a,b)=>a&&b&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={about:'Real connected-world Canvas, Chromium touch emulation at Android-sized portrait/landscape viewports; not physical Android performance.',views:[]};
 for(const view of views){
  const page=await browser.newPage({viewport:{width:view.width,height:view.height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.HARBOR?.seamlessCampusV115&&window.ROOKIE_V116_MARINA&&window.ROOKIE_V116_HUD,{timeout:40000});
  const init=await page.evaluate(()=>{
   const game=window.HARBOR.seamlessCampusV115;
   if(!game.openAt(5200,3758,.85))throw Error('Native marina test spawn blocked');
   return game.snapshot();
  });
  await page.waitForFunction(()=>!document.querySelector('#v116MarinaHUD')?.hidden && document.querySelector('#v125HudMenu') && window.ROOKIE_V116_MARINA.metrics().decoded>=14,{timeout:40000});
  const selectors={minimap:'.v116-minimap',identity:'.v116-identity',menu:'#v125HudMenu',
    pad:'#v115CampusPad',action:'#v115CampusInteract',run:'#v125CampusSprint'};
  const boxes={};for(const [name,sel] of Object.entries(selectors)){
   boxes[name]=await page.locator(sel).boundingBox();
   assert(boxes[name],name+' visible');
   assert(boxes[name].x>=-1&&boxes[name].y>=-1&&boxes[name].x+boxes[name].width<=view.width+2&&boxes[name].y+boxes[name].height<=view.height+2,name+' clipped viewport');
  }
  for(const [a,b] of [['minimap','identity'],['action','run'],['action','pad'],['menu','minimap'],['menu','identity']])
   assert(!intersects(boxes[a],boxes[b]),'Buttons overlap: '+a+' '+b);
  assert.equal(await page.locator('#v115CampusExit').isVisible(),false,'Normal gameplay must not show developer Return to Game');
  assert.equal(await page.locator('.v115-campus-tools').isVisible(),false,'Normal gameplay must not show zoom, ALL and dev controls');
  assert.equal(await page.locator('#v125HudActions').isVisible(),false,'Collapsed nav must not cover gameplay');
  const menu=page.locator('#v125HudMenu');await menu.click();
  assert.equal(await page.locator('#v125HudActions').isVisible(),true,'Menu must expand on demand');
  assert.equal(await page.locator('#v125HudSettings').isVisible(),true,'Original settings must be accessible');
  const blocked=await page.evaluate(()=>window.ROOKIE_V116_HUD.blocked());
  assert(blocked,'Expanded menu prevents accidental walking');
  await page.locator('[data-action="case"]').click();
  assert.equal(await page.locator('.v116-panel').isVisible(),true,'Original Case File overlay works');
  await page.locator('.v116-panel-close').click();
  assert.equal(await page.locator('.v116-panel').isVisible(),false);
  await menu.click();await page.locator('[data-action="map"]').click();
  assert.equal(await page.locator('.v116-panel').isVisible(),true,'Existing minimap panel works');
  await page.locator('.v116-panel-close').click();
  // Movement remains the original campus movement simulation; touch is only input.
  const origin=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  const pad=boxes.pad;
  const x=Math.round(pad.x+pad.width*.50),y=Math.round(pad.y+pad.height*.56);
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:7,x:x+30,y:y-28}]});
  await page.waitForTimeout(650);
  const moved=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  assert(Math.hypot(moved.x-origin.x,moved.y-origin.y)>8,'Floating thumb joystick must move Jay in real game');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(450);
  const stopped=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  await page.waitForTimeout(350);
  const idle=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  assert(Math.hypot(stopped.x-idle.x,stopped.y-idle.y)<.2,'Joystick release must stop motion');
  // Test simultaneous second thumb on sprint control, while still steering.
  await page.evaluate(()=>window.HARBOR.seamlessCampusV115.test.moveTo(5200,3758));
  const rr=boxes.run;const rx=Math.round(rr.x+rr.width/2),ry=Math.round(rr.y+rr.height/2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:11,x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:11,x:x+35,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:11,x:x+35,y},{id:12,x:rx,y:ry}]});
  await page.waitForTimeout(280);
  const sprintHeld=await page.evaluate(()=>document.querySelector('#v125CampusSprint').classList.contains('held'));
  assert(sprintHeld,'Second thumb should hold native run behavior');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const runRest=await page.evaluate(()=>!document.querySelector('#v125CampusSprint').classList.contains('held'));
  assert(runRest,'Sprint must release to walk');
  // E and arrow keys still route to the original handlers.
  const beforeKeyboard=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(260);await page.keyboard.up('ArrowLeft');
  const afterKeyboard=await page.evaluate(()=>window.HARBOR.seamlessCampusV115.snapshot());
  assert(afterKeyboard.x<beforeKeyboard.x-2,'Original keyboard movement still works');
  if(errors.length)throw Error('Uncaught browser exceptions: '+errors.join(' | '));
  await page.screenshot({path:path.join(out,view.name+'-gameplay.png')});
  await page.locator('#v115CampusCanvas').screenshot({path:path.join(out,view.name+'-world.png')});
  await menu.click();await page.screenshot({path:path.join(out,view.name+'-expanded-menu.png')});
  report.views.push({...view,boxes,origin,moved,idle,afterKeyboard,runHoldPassed:sprintHeld,errors});
  console.log('PASS V125 real '+view.name+' touch gameplay: floating joystick, simultaneous sprint, release, keyboard, panels, safe areas');
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1)});

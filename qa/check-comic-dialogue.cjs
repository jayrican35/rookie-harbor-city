'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='docs/comic-dialogue',base=process.env.GAME_URL||'http://localhost:8767';fs.mkdirSync(root,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={errors:[],stages:{}};
try{
 async function page(stage,width=1280,height=850,reducedMotion='no-preference'){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion}),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/preview/civilian-updated/?pilotQA=1&comicStage='+stage);await p.waitForFunction(()=>window.ROOKIE_JAY?.ready());
  await p.evaluate(()=>{HARBOR.profiles.choose('jay');HARBOR.dismissTransient();HARBOR.comicDialogue.close();HARBOR.speech.setSpeed(0);HARBOR.seamlessCampusV115.openAt(1205,1355,1.1)});await p.waitForTimeout(150);return p;
 }
 async function snap(p,file){await p.waitForTimeout(300);await p.screenshot({path:root+'/'+file+'.png'});}
 async function bounds(p){return p.evaluate(()=>{const n=document.getElementById('dlgPanel'),r=n.getBoundingClientRect(),t=document.getElementById('dlgText'),a=HARBOR.speech.current();return{x:r.x,y:r.y,w:r.width,h:r.height,iw:innerWidth,ih:innerHeight,font:getComputedStyle(t).fontSize,overflow:t.scrollWidth>t.clientWidth+1,full:a.full,pages:a.pages.join(''),actor:a.actor?.kind,style:n.dataset.comicStyle,tail:n.querySelector('.comic-tail').style.display,visible:getComputedStyle(n).visibility};});}
 function fits(r){assert(r.x>=5&&r.y>=5&&r.x+r.w<=r.iw-5&&r.y+r.h<=r.ih-5,JSON.stringify(r));assert(!r.overflow);assert.equal(r.pages,r.full);}
 // Gate 1: the real interaction outside Precinct 9, fixed-size text under zoom,
 // native pagination, keyboard input, player movement lock and mobile taps.
 for(const width of [1280,390]){
  const p=await page('civilian',width,width===390?844:850);await p.locator('#v115CampusInteract').click();await p.waitForTimeout(300);
  let r=await bounds(p);fits(r);assert.equal(r.actor,'connected');assert.equal(r.style,'normal');assert.equal(r.font,'18px');
  const pos=await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot());await p.keyboard.down('w');await p.waitForTimeout(180);await p.keyboard.up('w');assert.equal((await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot())).y,pos.y);
  for(const z of [.55,1.6]){await p.evaluate(z=>{const a=HARBOR.seamlessCampusV115.civilianQA().actors.find(a=>a.id==='ambient:precinct:visitor');HARBOR.seamlessCampusV115.qaCamera(a.x,a.y,z)},z);await p.waitForTimeout(150);r=await bounds(p);fits(r);assert.equal(r.font,'18px');}
  await snap(p,width===390?'02-mobile':'01-precinct-civilian');
  if(width===390)await p.locator('#dlgText').tap();else await p.keyboard.press('Enter');await p.waitForTimeout(200);assert(!await p.evaluate(()=>HARBOR.speech.current()));
  const full=('A long sentence with accents café, emoji 🐟 and careful spacing. ').repeat(20);
  await p.evaluate(full=>HARBOR.comicDialogue.lines([['Precinct visitor',full]]),full);await p.waitForTimeout(100);r=await bounds(p);fits(r);
  await p.evaluate(()=>{window.comicSeen=new WeakSet();window.comicTexts=[]});let steps=0;while(await p.evaluate(()=>!!HARBOR.speech.current())){assert(++steps<100);await p.evaluate(()=>{const a=HARBOR.speech.current();if(!window.comicSeen.has(a)){window.comicSeen.add(a);window.comicTexts.push(a.full)}ROOKIE_COMIC.advance();});}
  assert.equal((await p.evaluate(()=>window.comicTexts.join(' '))).replace(/\s+/g,' ').trim(),full.replace(/\s+/g,' ').trim());
  report.stages['civilian-'+width]={...r,paginationAdvances:steps,keyboardMovementBlocked:true,tapOrKeyboardAdvance:true};await p.context().close();
 }
 if(process.env.COMIC_GATE==='civilian'){fs.writeFileSync(root+'/gate-civilian.json',JSON.stringify(report,null,2));assert.deepEqual(report.errors,[]);console.log('PASS civilian gate: actual interaction, zoom, mobile, wrapping, long-text preservation and progression');return;}
 // Gate 2: alternating speakers use the same showLines callbacks and anchors.
 const c=await page('comedy');await c.evaluate(()=>HARBOR.seamlessCampusV115.openAt(755,1385,1.6));await c.waitForTimeout(150);await c.locator('#v115CampusInteract').click();await c.waitForTimeout(200);
 const sequence=[];for(const [i,type] of ['angry','normal','excited'].entries()){const r=await bounds(c);fits(r);assert.equal(r.style,type);sequence.push(await c.evaluate(()=>({speaker:HARBOR.speech.current().speaker,text:HARBOR.speech.current().full})));await snap(c,'03-comedy-'+i);await c.evaluate(()=>ROOKIE_COMIC.advance());await c.waitForTimeout(200);}
 assert(!await c.evaluate(()=>HARBOR.speech.current()));report.stages.comedy=sequence;await c.context().close();
 if(process.env.COMIC_GATE==='comedy'){fs.writeFileSync(root+'/gate-comedy.json',JSON.stringify(report,null,2));assert.deepEqual(report.errors,[]);console.log('PASS comedy gate: native alternating dialogue, three personalities and final dismissal');return;}
 // Gate 3: bounded nonmodal thoughts, visibility and no player-input block.
 const p=await page('reactions');await p.evaluate(()=>{HARBOR.seamlessCampusV115.openAt(4440,4230,1.2)});await p.waitForTimeout(200);
 // QA snapshots are copies; use the live resolved actor for runtime remarks.
 await p.evaluate(()=>{const ref=ROOKIE_COMIC.resolve('Bayview angler');ROOKIE_COMIC.reaction(ref.ref,'🐟','thought')});await snap(p,'04-fisher-thought');
 assert.equal(await p.locator('#hcAmbientSpeech').count(),1);assert(!await p.evaluate(()=>ROOKIE_COMIC.modalActive()));
 const y=await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot().y);await p.keyboard.down('s');await p.waitForTimeout(200);await p.keyboard.up('s');assert.notEqual(await p.evaluate(()=>HARBOR.seamlessCampusV115.snapshot().y),y);
 await p.waitForTimeout(3300);assert.equal(await p.locator('#hcAmbientSpeech').evaluate(n=>getComputedStyle(n).display),'none');
 report.stages.reactions={singleInstance:true,playerCanMove:true,expires:true};await p.context().close();
 if(process.env.COMIC_GATE==='reactions'){fs.writeFileSync(root+'/gate-reactions.json',JSON.stringify(report,null,2));assert.deepEqual(report.errors,[]);console.log('PASS reactions gate: one native ambient instance, nonblocking input and expiry');return;}
 // Gate 4: native choices/callback-once behavior, classic fallback, all shapes,
 // reduced motion, roof visibility, legacy bypass, protected Zombie entry.
 const f=await page('full');await f.evaluate(()=>{window.comicChoiceCount=0;HARBOR.speech.setSpeed(32);HARBOR.comicDialogue.choices('Precinct visitor','Which way?', [{label:'Continue patrol',fn:()=>{window.comicChoiceCount++;HARBOR.comicDialogue.close()}},{label:'Cancel',fn:()=>HARBOR.comicDialogue.close()}]);});await f.waitForTimeout(200);assert.equal(await f.locator('#dlgText').textContent(),'Which way?');await snap(f,'05-native-choices');await f.locator('#dlgActions button').first().click();assert.equal(await f.evaluate(()=>window.comicChoiceCount),1);await f.evaluate(()=>HARBOR.speech.setSpeed(0));
 for(const style of await f.evaluate(()=>ROOKIE_COMIC.qa().styles)){await f.evaluate(type=>ROOKIE_COMIC.preview(type,ROOKIE_COMIC.resolve('Precinct visitor').ref),style);await f.waitForTimeout(80);assert.equal((await bounds(f)).style,style);await f.evaluate(()=>HARBOR.comicDialogue.close());}
 // Hidden indoor speaker must never leak ordinary dialogue through station roof.
 assert(await f.evaluate(()=>{const a=HARBOR.seamlessCampusV115.civilianQA().actors.find(a=>a.id.startsWith('station-npc:'));const ref=ROOKIE_COMIC.resolve(a.name);if(!ref||ref.ref.id!==a.id)throw Error('Resolve actual indoor actor');return !ROOKIE_COMIC.present(ref)}));
 await f.evaluate(()=>{HARBOR.seamlessCampusV115.close();HARBOR.comicDialogue.lines([['DISPATCH','Proceed to your next assignment.']])});await f.waitForTimeout(200);assert(await f.locator('#dlgPanel').evaluate(n=>n.classList.contains('comic-balloon')));await snap(f,'06-classic-fallback');await f.evaluate(()=>HARBOR.comicDialogue.close());
 // Exercise an actual, unmodified story branch and completion callback.
 await f.evaluate(()=>{const a=HARBOR.caper.points.brooks;ROOKIE.goto('station',a.x-13,a.y-13);ROOKIE.interact()});await f.waitForTimeout(200);
 assert.equal(await f.locator('#dlgActions button').count(),3);assert.equal(await f.locator('#dlgText').textContent(),'Everybody, listen up! We have a Code Red situation!');await snap(f,'07-story-choices');await f.locator('#dlgActions button').nth(1).click();
 let storySteps=0;while(await f.evaluate(()=>!!HARBOR.speech.current())){assert(++storySteps<80);await f.evaluate(()=>ROOKIE_COMIC.advance())}
 assert(await f.evaluate(()=>HARBOR.caper.status().briefed));
 await f.evaluate(()=>{const a=HARBOR.caper.points.fridge;ROOKIE.teleport(a.x-13,a.y-13);ROOKIE.interact()});
 while(await f.evaluate(()=>!!HARBOR.speech.current())){assert(++storySteps<100);await f.evaluate(()=>ROOKIE_COMIC.advance())}
 assert(await f.evaluate(()=>HARBOR.caper.status().clues.fridge));report.story={branch:'What happened?',briefed:true,fridgeClue:true,nativeAdvances:storySteps};
 const perf=await f.evaluate(async()=>{HARBOR.seamlessCampusV115.openAt(1205,1355,1.1);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));ROOKIE_COMIC.preview('normal',ROOKIE_COMIC.resolve('Precinct visitor').ref);const stamps=[];await new Promise(resolve=>{const start=performance.now();function tick(t){stamps.push(t);if(t-start>2200)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});return{fps:1000*(stamps.length-1)/(stamps.at(-1)-stamps[0]),paint:HARBOR.seamlessCampusV115.metrics()}});report.performance={...perf,activeBalloon:true};
 await f.context().close();const rm=await page('full',390,844,'reduce');await rm.locator('#v115CampusInteract').click();assert.equal(await rm.locator('#dlgPanel').evaluate(n=>getComputedStyle(n).animationName),'none');await rm.context().close();
 const z=await page('full');const zombie=await z.evaluate(()=>{HARBOR.seamlessCampusV115.close();HARBOR.dismissTransient();HARBOR.outbreak.seed(9012026);return{started:HARBOR.academy.begin('zombie','explorer'),map:HARBOR.outbreakMap.build()}});assert(zombie.started);assert(!await z.evaluate(()=>ROOKIE_COMIC.enabled()));assert(!await z.locator('#dlgPanel').evaluate(n=>n.classList.contains('comic-balloon')));report.zombie={guard:true,mapSHA256:require('node:crypto').createHash('sha256').update(JSON.stringify(zombie.map)).digest('hex')};assert.equal(report.zombie.mapSHA256,JSON.parse(fs.readFileSync('docs/precinct-cruiser/safety.json')).zombie.mapSHA256);await z.context().close();
 const legacy=await browser.newPage();await legacy.goto(base+'/preview/civilian-updated/?pilotQA=1&comicLegacy=1');await legacy.waitForFunction(()=>window.ROOKIE_JAY?.ready());await legacy.evaluate(()=>HARBOR.profiles.choose('jay'));assert(!await legacy.evaluate(()=>ROOKIE_COMIC.enabled()));assert(!await legacy.locator('#dlgPanel').evaluate(n=>n.classList.contains('comic-balloon')));await legacy.close();report.legacyFallback=true;
 report.stages.migration={nativeChoiceCallbackCount:1,allStyles:true,roofOcclusion:true,classicFallback:true,reducedMotion:true};assert.deepEqual(report.errors,[]);fs.writeFileSync(root+'/results.json',JSON.stringify(report,null,2));console.log('PASS all comic dialogue gates; FPS '+perf.fps.toFixed(1));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

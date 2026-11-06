'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(process.env.ROOKIE_PACKAGE_ROOT||'published-game-capture'),out='docs/published-package';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};
 // Always create a NEW server rooted in the distributable. Never reuse the
 // preview/local-server helper or fall back to an existing listener.
 const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+path.sep))throw Error('path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)}catch{res.statusCode=404;res.end('Not found')}});
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});const url='http://127.0.0.1:'+server.address().port+'/index.html';
 const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:850}}),errors=[],missing=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(url.split('/index.html')[0])){requests.push(r.url());if(r.status()>=400)missing.push({url:r.url(),status:r.status()})}});
 try{
  await p.goto(url);await p.waitForFunction(()=>window.HARBOR?.mainCity&&window.ROOKIE_JAY?.ready());await p.locator('#familySelect .family-card').first().click();await p.waitForFunction(()=>HARBOR.mainOpening.active());await p.locator('#btnSkipCs').click();await p.waitForFunction(()=>!HARBOR.mainOpening.active());
  assert(await p.evaluate(()=>HARBOR.seamlessCampusV115.isOpen()&&!!HARBOR.cityCollisions&&!!HARBOR.connectedCruiser&&!!window.ROOKIE_CITY_TRAFFIC));assert.equal(await p.locator('iframe').count(),0);
  await p.waitForFunction(()=>ROOKIE_CRUISER_VISUAL.status().status==='ready');assert.equal(await p.evaluate(()=>ROOKIE_CRUISER_VISUAL.status().directionCount),16);
  assert(await p.locator('#v125HudMenu').isVisible());await p.screenshot({path:out+'/direct-main.png'});
  // Same index, with existing read-only diagnostics/fixture hooks enabled.
  // These place actual live bodies; entry, driving and contact still use the
  // game's current controls, controller, renderer and collision solver.
  await p.goto(url+'?pilotQA=1');await p.waitForFunction(()=>window.HARBOR?.cityCollisions?.fixture&&window.ROOKIE_JAY?.ready());await p.locator('#familySelect .family-card').first().click();await p.waitForTimeout(300);await p.waitForFunction(()=>HARBOR.seamlessCampusV115.trafficQA().length>10);
  const initial=await p.evaluate(()=>HARBOR.seamlessCampusV115.trafficQA());await p.waitForTimeout(700);const moving=await p.evaluate(()=>HARBOR.seamlessCampusV115.trafficQA());assert(moving.some(c=>{const a=initial.find(a=>a.id===c.id);return a&&Math.hypot(a.x-c.x,a.y-c.y)>1}),'Actual connected route traffic moves');
  const parked=await p.evaluate(()=>{const a=HARBOR.seamlessCampusV115,v=a.cruiserQA(),c=v.snapshot(),d={x:c.x+Math.sin(c.angle)*42-Math.cos(c.angle)*8,y:c.y-Math.cos(c.angle)*42-Math.sin(c.angle)*8};if(!a.openAt(d.x,d.y,1))throw Error('No clear Unit 9 door');return c});await p.waitForTimeout(300);assert.match(await p.locator('#v115CampusInteract').innerText(),/Drive/i);await p.locator('#v115CampusInteract').click();assert(await p.evaluate(()=>HARBOR.seamlessCampusV115.cruiserQA().active()));await p.screenshot({path:out+'/parked-cruiser.png'});
  const setting=await p.evaluate(()=>{const a=HARBOR.seamlessCampusV115,g=a.trafficGraphQA(),v=a.cruiserQA();const c=v.physicsBody();c.speed=0;v.interact();for(const n of g.nodes.filter(n=>n.junction&&n.x>500&&n.x<6000&&n.y>1000&&n.y<3500)){let clear=true;for(let d=-260;d<=260;d+=25)if(v.collisionAt(n.x+d,n.y,0))clear=false;if(clear)return{node:n,id:a.trafficQA().find(c=>c.kind==='civilian').id}}return null});assert(setting);
  const entry=await p.evaluate(({node:n,id})=>{const a=HARBOR.seamlessCampusV115,v=a.cruiserQA(),e=HARBOR.cityCollisions;e.reset();const unit={id:'precinct-unit-9',x:n.x-150,y:n.y,angle:0,speed:0},target={id,x:n.x+95,y:n.y,angle:0,speed:0};if(!e.fixture([unit,target],9)||!a.openAt(unit.x-8,unit.y-42,.95))return false;v.interact();return v.active()},setting);assert(entry);
  await p.keyboard.down('w');try{await p.waitForFunction(()=>HARBOR.cityCollisions.inspect().events.some(e=>e.a==='precinct-unit-9'||e.b==='precinct-unit-9'),null,{timeout:8000})}finally{await p.keyboard.up('w')}
  const hit=await p.evaluate(()=>HARBOR.cityCollisions.inspect().events.find(e=>e.a==='precinct-unit-9'||e.b==='precinct-unit-9'));for(const id of ['a','b'])assert(Math.hypot(hit.after[id][0]-hit.before[id][0],hit.after[id][1]-hit.before[id][1])>1,'Both vehicles change velocity');await p.waitForTimeout(200);await p.screenshot({path:out+'/two-way-contact.png'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert(await p.locator('#connectedDriveControls [data-car="up"]').isVisible());await p.screenshot({path:out+'/phone-direct.png'});
  // These five historical optional preloads also fail in the already assembled
  // site/game build. Parking is painted by the newer ground atlas; the three
  // old civilian sheets are superseded by the approved 30-role atlas adapter.
  // Do not fabricate replacement art or change renderer behavior in packaging.
  const optional=new Set(['/assets/exterior/parking_bay.webp','/assets/exterior/wheel_stop.webp','/assets/civilians/civilian_man_blue.webp','/assets/civilians/civilian_man_tan.webp','/assets/civilians/civilian_woman_red.webp']);
  const requiredMissing=missing.filter(r=>!optional.has(new URL(r.url).pathname));
  assert.deepEqual(errors,[]);assert.deepEqual(requiredMissing,[]);assert(!requests.some(u=>/\/site\/|\/preview\/|\/game\//.test(new URL(u).pathname)));
  const result={servedDirectory:root,entry:url,freshDedicatedServer:true,normalMainStartup:true,cruiserDoorEntry:true,parked,trafficCount:moving.length,actualTrafficMoves:true,directionalSprites:await p.evaluate(()=>ROOKIE_CRUISER_VISUAL.status()),twoWayLiveKeyboardContact:hit,phoneViewport:[390,844],requiredMissing,unchangedOptionalLegacyPreloadFailures:missing,errors,localRequests:requests};fs.writeFileSync(out+'/results.json',JSON.stringify(result,null,2));console.log('PASS direct published-game-capture/index.html: connected city, Unit 9 entry, moving traffic, 16-angle art, two-body impact, phone HUD and no missing required local assets');
 }catch(e){await p.screenshot({path:out+'/failure.png'});console.error({errors,missing});throw e}finally{await b.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});

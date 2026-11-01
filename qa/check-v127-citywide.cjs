'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..','published-game-capture');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const cityCode=read('v127-citywide-art.js'),world=read('v115-campus.js'),hud=read('v116-marina-hud.js');
const g={draws:0,save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},strokeRect(){},
 drawImage(){this.draws++},scale(){},translate(){},clearRect(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){}};
let images=0,canvases=0;
const Image=function(){images++;return {complete:true,naturalWidth:256,naturalHeight:128,
 decoding:'async',addEventListener(){},set src(u){this.url=u;}}};
const sandbox={window:{HARBOR:{worldV115:{areas:()=>[],roadNetwork:()=>({segments:[{x:5750,y:1700,w:300,h:127}]})}}},Image,
 document:{createElement(tag){assert.equal(tag,'canvas');canvases++;return{width:0,height:0,getContext:()=>g}}},Math,Map,Set,Number,Object,Array,console};
vm.runInNewContext(cityCode,sandbox,{filename:'v127-citywide-art.js'});
const c=sandbox.window.ROOKIE_V127_CITY;
assert(c&&c.worldId==='harbor-main');
assert.equal(c.colorKind('#3d4148'),'road','Original gray streets must NEVER become water');
assert.equal(c.colorKind('#2e6da8'),'water');
assert.equal(c.colorKind('#68994d'),'grass');
assert.equal(c.colorKind('#c2b8a4'),'brick');
assert.equal(c.waterBlocked(5100,3950),false,'Native marina owns water and piers');
assert.equal(c.waterBlocked(5950,3720),false,'Adjacent promenade remains walkable');
assert.equal(c.waterBlocked(5950,3950),true,'Extended coastal water is physically impassable');
assert.equal(c.waterBlocked(7020,3900),false,'Coast progressively recedes into eastside');
assert.equal(c.waterBlocked(7020,4500),true);
const v={x:5820,y:3490,w:900,h:850};
c.base(g,{view:v,zoom:1});
c.road(g,{x:5880,y:1721,w:200,h:127},{x:5800,y:1700,w:400,h:200});
c.districtGround(g,{x:6000,y:3480,w:600,h:420,map:{base:'#608d56',ground:[{x:20,y:10,w:400,h:60,c:'#c2b8a4'},{x:80,y:120,w:140,h:80,c:'#3d4148'}]}},v);
c.walkways(g,{view:v,zoom:.85});c.coastline(g,{view:v,zoom:.85});
assert(g.draws>10,'Actual tile textures rendered onto native Canvas');
assert(c.metrics().chunks>0&&c.metrics().chunks<=c.metrics().cacheMax,'Bounded material chunk cache');
assert(c.metrics().coast>0,'Playable shore gradually extends beyond marina boundary');
assert(c.metrics().atlasReady,'Existing premium marina tile atlas loaded');
const areas=[
 {id:'westfield',x:-3100,y:1260,w:1600,h:1200,map:{decors:[{t:'tree',x:200,y:130},{t:'bench',x:300,y:340},{t:'lamp',x:400,y:500}]}},
 {id:'waterfront',x:4400,y:3220,w:1500,h:1000,map:{decors:[{t:'tree',x:200,y:100}]}}
];
const props=c.depthProps({x:-3100,y:1200,w:1700,h:1300},areas);
assert.equal(props.length,3,'Existing trees, benches and lampposts enter shared actor draw queue');
assert(props.every(p=>Number.isFinite(p.depthY)));
for(const item of props)c.drawDepthProp(g,item);
assert(c.handlesDecor({t:'lamp'}));
assert(!c.handlesDecor({t:'bldg'}));
assert.equal(c.building(g,{x:300,y:400,w:200,h:160},1),true);
assert(c.location(5150,3800)==='SOUTHBAY MARINA');
assert(c.location(6010,3300)!=='SOUTHBAY MARINA');
c.map(g,6010,3300);
assert(images<=14,'Render uses shared atlas and a small constant sprite set');
assert(canvases<=c.metrics().cacheMax+8);
assert(world.includes('window.ROOKIE_V127_CITY.depthProps(view,districtEntries)'));
assert(world.includes('if(window.ROOKIE_V127_CITY?.waterBlocked(x,y))return true'));
assert(world.includes('city.districtGround(g,d,'));
assert(world.includes('city.walkways(g,'));
assert(world.includes('window.ROOKIE_V127_CITY?.building(g,'));
assert(hud.includes('root.hidden=false;'),'HUD must not disappear beyond marina');
assert(hud.includes('city.map(g,state.x,state.y)'));
assert(hud.includes('city?.location(state.x,state.y)'));
assert(!/requestAnimationFrame|localStorage|sessionStorage|fetch\s*\(/.test(cityCode));
assert(!/outbreak\.|zombie|Academy.*renderer/.test(cityCode));
console.log('PASS V127 9-area native world contract: shared tile/road/paving atlas, bounded chunk cache, all-world depth props, seafront physics, persistent HUD/minimap and original game-state isolation');

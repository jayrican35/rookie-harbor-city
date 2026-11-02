'use strict';
// User mobile recording: Bayview main north/south road was erased by a broad
// y=3650..3784 brick overlay, leaving a 23px asphalt sliver at the junction.
// Test the REAL city renderer, source sprites and collision, never a mock map.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../published-game-capture/v127-citywide-art.js'),'utf8');
const camera=fs.readFileSync(path.join(__dirname,'../published-game-capture/v115-campus.js'),'utf8');
let tileDraws=0,clipped=0,detailRects=0;
const g={save(){},restore(){},beginPath(){},closePath(){},rect(){},clip(){clipped++},
 fillRect(){detailRects++},strokeRect(){},drawImage(){tileDraws++},scale(){},translate(){},
 clearRect(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){},rotate(){},ellipse(){}};
const Image=function(){return{complete:true,naturalWidth:256,naturalHeight:128,decoding:'async',addEventListener(){},set src(v){this.url=v;}}};
const H={worldV115:{areas:()=>[],roadNetwork:()=>({segments:[]})}};
const ctx={window:{HARBOR:H},document:{createElement(tag){assert.equal(tag,'canvas');return{width:256,height:256,getContext:()=>g};}},Image,Math,Map,Set,Array,Object,Number,console};
vm.runInNewContext(source,ctx,{filename:'v127-citywide-art.js'});
const city=ctx.window.ROOKIE_V127_CITY;assert(city);
assert.equal(city.bayviewPromenadeAt(4050,3744),false,'Actual Bayview street center must not be buried in decorative brick');
assert.equal(city.bayviewPromenadeAt(4050,3681),false,'Never cover the cross-street junction with a promenade');
assert.equal(city.bayviewPromenadeAt(4050,3807),false,'Preserve complete south edge of native horizontal road');
assert.equal(city.bayviewPromenadeAt(4050,3808),true,'Stone promenade begins immediately AFTER street pavement');
assert.equal(city.bayviewPromenadeAt(4050,3870),true,'Premium paving carries south from junction');
assert.equal(city.bayviewPromenadeAt(4200,3890),false,'Do not paint a false sidewalk over water');
assert.equal(city.bayviewPromenadeAt(4400,3820),false,'Original Marina terrain owns everything x>=4352');
assert.equal(city.bayviewPromenadeAt(4352,3808),false,'Original Marina starts at x4352, not x4400');
assert(!source.includes('[2800,3460],[3630,4400]'),'The old road-erasing walkway strips must never return');
const view={x:2850,y:3400,w:1500,h:840};
city.base(g,{view,zoom:1});const before=tileDraws;
city.walkways(g,{view,zoom:1});
assert(tileDraws-before>30,'Real Marina-sourced brick texture and frontage must draw');
assert(clipped>0&&detailRects>40,'Promenade is shoreline-clipped with original 16-bit detail');
const bayview={id:'southbay',x:2800,y:3220,w:1600,h:1100,
 map:{base:'#86a860',ground:[],decors:[],spots:[],pedSolids:[]}};
const objects=city.depthProps(view,[bayview]),furniture=objects.filter(x=>x.object.bayviewExtension);
assert.equal(furniture.length,20,'Keep exactly 20 hand-positioned premium furnishings');
for(const p of furniture){
 const foot={x:p.district.x+p.object.x,y:p.district.y+p.object.y};
 assert(foot.x>=2800&&foot.x<4352,'No authored prop in protected Marina');
 assert(!((foot.y>=3681&&foot.y<=3807)),'No furnishing in the active Bayview street');
 assert(Number.isFinite(p.depthY),'All props live in the original sorted actor queue');
 city.drawDepthProp(g,p);
}
assert(city.scenicBlocked(3890,3900,12,[bayview]),'Southbay palm trunk must have real collision');
assert(city.scenicBlocked(3175,3891,12,[bayview]),'Premium bench foot must block walking through furniture');
assert(!city.scenicBlocked(4050,3744,12,[bayview]),'Native cross-street must remain clear of new fixtures');
assert(!city.scenicBlocked(4400,3825,12,[bayview]),'No hidden props/solids inside Marina');
assert(!city.waterBlocked(5100,3950),'Native Marina water and piers remain authoritative');
assert(camera.includes('city.walkways(g,'),'Draw expanded promenade inside existing native world renderer');
assert(camera.includes('window.ROOKIE_V127_CITY.depthProps(view,districtEntries)'),
 'Render fixtures within original scene character/prop depth ordering');
assert(!/requestAnimationFrame|localStorage|sessionStorage|fetch\s*\(/.test(source),
 'Promenade cannot add a simulation, saved data or network calls');
assert(!/outbreak\.|zombie|Academy.*renderer/.test(source),
 'Zombie Outbreak and Academy source remain untouched');
console.log('PASS Bayview recording fix: full 127px horizontal street, coast-clipped premium stone, 20 tangible depth-sorted furnishings, protected Marina', {tileDraws,detailRects});

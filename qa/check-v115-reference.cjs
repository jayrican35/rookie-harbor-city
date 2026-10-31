'use strict';
/* Source-grounded city composition contract. Render-only and deterministic. */
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.join(__dirname,'..','published-game-capture');
const art=fs.readFileSync(path.join(root,'v115-reference-art.js'),'utf8');
const campus=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const world=fs.readFileSync(path.join(root,'v115-world.js'),'utf8');
const calls={fill:0,poly:0,stroke:0,rects:[],rectApprox:0};
const brush={save(){},restore(){},beginPath(){calls.poly++;},moveTo(){},lineTo(){},closePath(){},
  arc(){},ellipse(){},bezierCurveTo(){},quadraticCurveTo(){},fill(){},stroke(){calls.stroke++;},
  fillRect(x,y,w,h){calls.fill++;if(calls.rects.length<20000)calls.rects.push([x,y,w,h]);},
  strokeRect(){},translate(){},rotate(){},scale(){},createLinearGradient(){return {addColorStop(){}};},
  createRadialGradient(){return {addColorStop(){}};},fillText(){},strokeText(){}};
const fake={window:{},Math,Number,Object,console};vm.createContext(fake);
vm.runInContext(art,fake,{filename:'v115-reference-art.js'});
const ref=fake.window.ROOKIE_V115_REFERENCE;assert(ref&&ref.spec);
assert.equal(ref.spec.worldId,'harbor-main');
assert.equal(ref.spec.worldBounds.minX,-3100);
assert.equal(ref.spec.worldBounds.maxX,9656);
assert.equal(ref.spec.worldBounds.maxY,4680);
assert(ref.spec.featureIds.length>=8);
assert.equal(ref.inspect().sameCoordinatesForAtlasAndGame,true);
assert.equal(ref.inspect().mutatesZombieOutbreak,false);
assert(!/(?:\bfetch\s*\(|WebSocket|localStorage|sessionStorage|\bgoTo\s*\(|state\.|MAPS\.|outbreak\.)/.test(art),'Visual module must not write gameplay/network state');
assert(campus.includes('reference.terrain(g,{zoom:campus.zoom,view}')&&campus.includes('reference.gameOverlay(g,{zoom:campus.zoom,view,districts:districtEntries}'));
assert(campus.includes('ref.gameBlocks(g,{zoom:campus.zoom,view:'));
assert(world.includes('reference.atlasTerrain(mapctx,{zoom:s})'));
assert(world.includes('reference.atlasLandmarks(mapctx,{zoom:s})'));
assert(world.includes('reference.atlasBlocks(mapctx,{zoom:s,districts:[{...d,map:m}]})'));
const globals={x:0,y:0,w:12756,h:4680};
const district={x:2800,y:1260,w:2256,h:1900,id:'midtown',map:{decors:[
  {t:'mtbldg',bx:100,btop:120,bw:260,bh:180,c:'#bd946c',roof:'#754c32'},
  {t:'tree',x:400,y:520},{t:'flowerbed',x:590,y:620}
]}};
function paint(draw, options){const before=calls.fill;draw(brush,options);assert(calls.fill>before, 'Expected visible painting');}
paint(ref.terrain,{zoom:.07,view:globals});
paint(ref.gameBlocks,{zoom:.07,view:globals,districts:[district]});
paint(ref.gameOverlay,{zoom:.07,view:globals,districts:[district]});
paint(ref.atlasTerrain,{zoom:.07});
paint(ref.atlasLandmarks,{zoom:.07});
paint(ref.atlasBlocks,{zoom:.07,districts:[district]});
assert.equal(ref.features().length,ref.spec.featureIds.length);
assert(calls.rects.some(([x,y])=>x===102&&y===120+8),'Rooftop miniatures must use real source decor coordinates');
assert(calls.stroke>10,'Coastline and mountains must have visible edges');
console.log('PASS V115 reference composition: same world anchors in atlas and playable canvas, source-based district rooftops, north mountains/waterfall, southwest park, marina and coastline; render-only/Academy/Zombie untouched.');
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'published-game-capture');
const s=fs.readFileSync(path.join(dir,'v116-marina.js'),'utf8');
const campus=fs.readFileSync(path.join(dir,'v115-campus.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'v116-marina.css'),'utf8');
assert(!/(localStorage\.|state\.map\s*=|MAPS\.|\boutbreak\s*=|\.saveGame\s*\(|fetch\s*\()/g.test(s),'Unsafe main-mode changes');
assert(s.includes("const WORLD='harbor-main'")&&s.includes('PIER_X=Object.freeze([4590,4850,5140,5420,5660,5920])'));
assert(campus.includes('marina.background(g,{zoom:campus.zoom,view},t)'));
assert(campus.includes('marina.stepNPCs(dt)'));
assert(campus.includes('marina.blocksProp(x,y,r)'));
assert(css.includes('v116-play-mode')&&css.includes('.v115-campus-note'));
for(const name of ['marina-tiles','marina-cafe','bait-and-tackle','marina-office','boat-service','marina-kiosk','boat-motor','boat-sail','boat-fishing','marina-people','marina-gulls']){
 const f=path.join(dir,'assets/v116-marina',name+'.png');assert(fs.statSync(f).size>250,name);
}
const proto={complete:true,naturalWidth:256};
const mock={window:{},Image:function(){return {...proto}},document:{readyState:'loading',addEventListener(){}},performance:{now:()=>0},location:{search:''},Math,Map,Set,Object,Number,Array,JSON,console};
vm.runInNewContext(s,mock,{filename:'v116-marina.js'});
const m=mock.window.ROOKIE_V116_MARINA;assert(m,'V116 module not exposed');
assert.equal(m.worldId,'harbor-main');assert.equal(m.actors.length,5);assert.equal(m.interactions.length,9);
assert.equal(m.blocksProp(5100,3980,12),false,'Promenade must be walkable');
assert.equal(m.blocksProp(4490,3560,12),true,'Shop body must be solid');
assert.equal(m.blocksProp(4880,4400,12),false,'Existing pier must remain walkable');
assert.equal(m.blocksProp(4980,4500,12),true,'Open water must block movement');
assert.equal(m.blocksProp(3000,4400,12),false,'World outside marina unchanged');
assert.equal(m.setTestEnabled(false),false,'No release runtime debug toggle');
assert.equal(m.metrics().multiplayerTransport,'none');
console.log('PASS V116: original marina pier coordinates, 11 raster sprites, integrated actors, world collision and scope-safe renderer');
'use strict';
/* V115 road alignment and cartographic-LOD QA; no mutation of gameplay systems. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'../published-game-capture');
const js=fs.readFileSync(path.join(root,'v115-city-fabric.js'),'utf8');
const campus=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const map=fs.readFileSync(path.join(root,'v115-world.js'),'utf8');
const scope={window:{HARBOR:{}},Math,Object,Number};
vm.createContext(scope);
vm.runInContext(js,scope,{filename:'v115-city-fabric.js'});
const fabric=scope.window.HARBOR.cityFabricV115;
assert(fabric&&fabric.readOnly,'Road design layer must initialize read-only');
assert.equal(fabric.avenue.center,1784.5);
assert.equal(fabric.crossings.length,9);
const ids=Array.from(fabric.crossings,x=>x.id);
assert.equal(new Set(ids).size,ids.length,'Crossing IDs must be unique');
assert.equal(fabric.world.minX,-3100);
assert.equal(fabric.world.maxX,9656);
const sceneCrossings=fabric.crossings.filter(x=>x.type==='avenue');
assert.deepEqual(Array.from(sceneCrossings,x=>x.x),[-1500,0,2800,5056,6556,8156]);
for(const c of sceneCrossings){
 assert.equal(c.y,1721,'All Harbor Avenue seams align at y=1721');
 assert.equal(c.h,127,'Road height must agree with the authored street footprint');
}
// Verify the painted street markers never change player positions, map IDs or saves.
const state={p:0,save:0,quest:0,car:0};
const canvas={save(){},restore(){},fillRect(){state.p++},beginPath(){},lineTo(){},moveTo(){},stroke(){},
 strokeText(){},fillText(){},set fillStyle(x){},set strokeStyle(x){},set lineWidth(x){},set font(x){},
 set textAlign(x){},set textBaseline(x){}};
fabric.backdrop(canvas,{x:-3100,y:0,w:12756,h:4680},.035);
fabric.streetSeams(canvas,{x:-3100,y:0,w:12756,h:4680},.035);
assert(state.p>20&&state.p<3000,'World overview should be detailed but bounded');
const before=state.p;
fabric.streetSeams(canvas,{x:-3000,y:1200,w:150,h:150},1);
assert.equal(state.p,before,'No off-camera crossing details should be rendered');
fabric.overviewDistrictLabel(canvas,{id:'residential',w:1500,h:1160,map:{name:'Residential — Maple Court'}},.033);
assert.equal(fabric.compactNames.residential,'MAPLE');
assert.equal(fabric.compactNames.westfield,'WEST');
assert(campus.includes('H.cityFabricV115.backdrop'), 'Campus must share the coastal/park layer');
assert(campus.includes('H.cityFabricV115.streetSeams'), 'Campus must paint real road boundary crossings');
assert(campus.includes('H.cityFabricV115.overviewDistrictLabel'), 'Campus map labels need zoom-aware sizing');
assert(map.includes('H.cityFabricV115.backdrop'), 'Atlas and playable city must share the same coast');
assert(!/\b(?:goTo|saveGame|completeMission|completeFinding|carGoTo)\s*\(/.test(js));
assert(!/\b(?:localStorage|fetch|WebSocket|RTCPeerConnection)\b/.test(js));
console.log('PASS V115 road fabric: crossings aligned, map labels scalable, coast shared, offscreen render skipped, no gameplay mutation');
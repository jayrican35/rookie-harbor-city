'use strict';
/* V115 Phase 3B: actual-world street data and label/crossing QA. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..','published-game-capture');
const world=fs.readFileSync(path.join(base,'v115-world.js'),'utf8');
const campus=fs.readFileSync(path.join(base,'v115-campus.js'),'utf8');
const game=fs.readFileSync(path.join(base,'game.js'),'utf8');
const start=world.indexOf('  const STREET_NETWORK = Object.freeze({');
const end=world.indexOf('  const INDOOR_PARENT = Object.freeze({');
assert(start>=0 && end>start, 'Missing canonical street topology');
const context={Object};vm.createContext(context);
vm.runInContext(world.slice(start,end)+'\nthis.net = STREET_NETWORK;',context);
const net=context.net;
assert.equal(net.worldId,'harbor-main');
assert.equal(net.primary.centerY,1784);
assert.equal(net.primary.laneWidth,127);
assert.equal(net.version,'115-phase3b-roads-1');
assert.equal(net.segments.length,8);
assert.equal(net.crossings.length,11);
for (const r of net.segments) {
  assert(r.w>0&&r.h>0&&Number.isFinite(r.x)&&Number.isFinite(r.y),r.id);
  assert(Object.isFrozen(r),'Road segment should be immutable');
}
for (const c of net.crossings){
  assert(['h','v'].includes(c.axis));
  assert(Number.isFinite(c.x)&&Number.isFinite(c.y));
  assert(Object.isFrozen(c),'Crossing should be immutable');
}
const pick=id=>net.crossings.find(c=>c.id===id);
for(const [name,x] of [['westfield-residential',-1500],['residential-precinct',0],
 ['precinct-midtown',2800],['midtown-downtown',5056],['downtown-eastside',6556],
 ['eastside-industrial',8156]]){
  const c=pick(name);assert(c,'Missing main avenue crossing '+name);
  assert.equal(c.x,x);assert.equal(c.y,1784);assert.equal(c.axis,'h');
}
assert(world.includes('northgate:   [5086, 183]'));
assert(world.includes('waterfront:  [4400, 3220]'));
assert(campus.includes('northgate:{x:5086,y:183}'));
assert(campus.includes('waterfront:{x:4400,y:3220}'));
assert(campus.includes('const roadNetwork=H.worldV115.roadNetwork()'));
assert(world.includes('roadNetwork:()=>STREET_NETWORK'));
assert(!campus.includes('const links=Object.freeze(['),'Duplicated road geometry');
assert(campus.includes('function drawCrossing(c)'));
assert(campus.includes('overviewDistrictLabel(d)'));
assert(campus.includes('districtGround(d);'));
assert(campus.includes('districtDecor(d);'));
// Preserve gameplay engine and forbidden mode exclusion: V115 may not mutate either.
assert(!/(?:WebSocket|RTCPeerConnection|\bfetch\s*\()/.test(campus));
assert(!/(?:goTo|carGoTo|saveGame|completeMission)\s*\(/.test(campus));
assert(game.includes('m.w = 2256; m.h = 1100;') && game.includes('m.h=1900;'));
console.log('PASS V115 Phase 3B: one immutable street plan, 11 grounded junctions, 8 shared links, aligned Northgate/Marina edges, overview LOD, no game or Zombie changes');
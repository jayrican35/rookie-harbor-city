'use strict';
/* V115 Phase 3 source graph, real road continuity and scope regression.
 * Run after check-v115-campus.cjs. Does not modify any game files.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..','published-game-capture');
const campus=fs.readFileSync(path.join(base,'v115-campus.js'),'utf8');
const world=fs.readFileSync(path.join(base,'v115-world.js'),'utf8');
const engine=fs.readFileSync(path.join(base,'game.js'),'utf8');
const match=campus.match(/const DISTRICT_ORIGINS=Object\.freeze\((\{[\s\S]*?\})\);/);
assert(match,'Connected district origin table is absent');
const origins=vm.runInNewContext('('+match[1]+')');
const names=['westfield','residential','midtown','downtown','eastside','industrial','northgate','southbay','waterfront'];
assert.deepEqual(Object.keys(origins).sort(),names.slice().sort(),'All nine outdoor regions must be present');
assert(engine.includes('m.w = 2256; m.h = 1100;') && engine.includes('m.h=1900;'),
  'This world layout was designed for the CURRENT larger Midtown; source size changed');
const sizes={westfield:[1600,1100],residential:[1500,1160],midtown:[2256,1900],
 downtown:[1500,1000],eastside:[1600,1100],industrial:[1500,1000],
 northgate:[1600,1100],southbay:[1600,1100],waterfront:[1500,1000]};
function right(id){return origins[id].x+sizes[id][0]}
assert.equal(right('westfield'),origins.residential.x);
assert.equal(right('residential'),0,'Residential must touch campus west');
assert.equal(origins.midtown.x,2800,'Midtown must touch campus east');
assert.equal(right('midtown'),origins.downtown.x,'Midtown to Downtown must meet at the TRUE expanded map edge');
assert.equal(right('downtown'),origins.eastside.x);
assert.equal(right('eastside'),origins.industrial.x);
const roadCenters={westfield:524,residential:524,midtown:524,
 downtown:501,eastside:524,industrial:781};
for(const [id,center] of Object.entries(roadCenters)){
 assert.equal(origins[id].y+center,1784,`Harbor Avenue lane center does not align in ${id}`);
}
// Network IDs must remain independent from local preview / save keys.
assert(campus.includes("instanceId:'harbor-main:district:'+id"));
assert(campus.includes("transport:'none',authoritativeServer:false,committedToSave:false"));
assert(!/\b(?:goTo|carGoTo|saveGame|completeFinding|completeMission)\s*\(/.test(campus),
  'Connected preview must not teleport, mutate story, or change saved positions');
assert(!/fetch\s*\(|WebSocket\s*\(|RTCPeerConnection\s*\(/.test(campus),
  'No unfinished multiplayer transport may be started');
assert(world.includes("version:'115-phase3-connected-district-atlas'"));
assert(world.includes('physical-1:1-precinct-campus'));
assert(world.includes('const MIN_X=-3100, W = 9656, HGT = 4680;'));
assert(campus.includes('drawLinkedDistricts(t)'));
assert(campus.includes('districtSolids'));
assert(campus.includes('worldSpots.push'));
const testBounds=[['midtown','downtown'],['downtown','eastside'],['eastside','industrial']];
for(const [a,b] of testBounds){assert.equal(right(a),origins[b].x,`${a}>${b} road crossing`);}
assert(campus.includes('const W=')===false || !/\bW=2800,HGT=1950\b/.test(campus));
console.log('PASS V115 Phase 3: ten connected exterior/campus regions, aligned authentic Harbor Avenue exits, real Midtown runtime extents, stable multiplayer-ready coordinate IDs; core game and survival exclusions preserved.');
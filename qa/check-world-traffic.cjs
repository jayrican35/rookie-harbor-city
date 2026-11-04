// The single-artery pilot was replaced in-place by surface-derived routing.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('published-game-capture/v115-campus.js','utf8');
const navigation=fs.readFileSync('published-game-capture/connected-traffic.js','utf8');
assert(!/requestAnimationFrame|setInterval|setTimeout|localStorage|fetch\s*\(|new Image/.test(navigation),'Navigation has no competing clock, assets, audio or saves');
assert.equal((source.match(/    stepStreetTraffic\(dt\);/g)||[]).length,1,'Exactly one existing simulation step');
assert(source.includes('fleet:streetTraffic'),'Reuse one original fleet');
assert(source.includes('entries.push({y:car.y,trafficCar:car})'),'Reuse depth queue');
require('./check-connected-traffic.cjs');

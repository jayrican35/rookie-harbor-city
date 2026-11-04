'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const current=fs.readFileSync('published-game-capture/v115-campus.js','utf8').replace(/\r\n/g,'\n');
const prior=cp.execFileSync('git',['show','3984435:published-game-capture/v115-campus.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const extract=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
const begin='  function circleHitsRect(',end='  // Read-only browser QA aid:';
let seed=1709;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const boxes=Array.from({length:1800},(_,i)=>({x:rand()*12756-3100,y:rand()*4680,w:5+rand()*350,h:5+rand()*250,id:i%4?'other':'owned'}));
let calls=0,ownedEnabled=true;const env={Math,Map,window:{ROOKIE_V116_MARINA:{ownsSolid:b=>{calls++;return ownedEnabled&&b.id==='owned'},blocksProp:(x,y,r)=>x>8000&&y>4200},ROOKIE_V127_CITY:{waterBlocked:(x,y)=>x>9300,scenicBlocked:(x,y,r)=>x< -2000&&y<100}},
 districtSolids:boxes,vehicleOnlySolids:boxes.slice(0,350),collision:boxes.slice(100,130),districtEntries:[],MIN_X:-3100,MIN_Y:0,W:9656,HGT:4680,
 cruiser:{blocksWalker:(x,y,r)=>Math.abs(x-1760)<r+48&&Math.abs(y-1568)<r+24},districtAt:(x,y)=>x>2300||y>1800,trafficBlocked:(x,y,r)=>Math.abs(x-5500)<r+40&&Math.abs(y-1750)<r+20};
const old=vm.runInNewContext(extract(prior,begin,end)+';blocked',env),now=vm.runInNewContext(extract(current,begin,end)+';blocked',env);
let oldCalls=0,newCalls=0,queries=0;
for(let i=0;i<40000;i++){
 ownedEnabled=i%3!==0;const x=rand()*12900-3150,y=rand()*4780-50,r=[0,1,9,12,24,80][i%6],ignore=i%2===0,vehicle=i%4===0;
 calls=0;const a=old(x,y,r,ignore,vehicle);oldCalls+=calls;calls=0;const b=now(x,y,r,ignore,vehicle);newCalls+=calls;assert.equal(b,a,JSON.stringify({x,y,r,ignore,vehicle}));queries++;
}
assert(newCalls<oldCalls/20,'Far rectangles never require ownership scans');
const result={queries,oldOwnershipCalls:oldCalls,indexedOwnershipCalls:newCalls,geometryUnchanged:true,dynamicOwnershipChecked:true};
fs.mkdirSync('cruiser-turning-evidence',{recursive:true});fs.writeFileSync('cruiser-turning-evidence/collision-index.json',JSON.stringify(result,null,2));console.log('PASS exact baseline collision equivalence',result);

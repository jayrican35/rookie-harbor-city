'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),norm=s=>s.replace(/\r\n/g,'\n');
const protectedFiles={};
for(const name of ['game.js','outbreak.css','v115-world.js','v116-marina.js','v116-marina-walk.js','v117-jay.js','civilian-connected.js','precinct-cruiser.js','connected-traffic.js','cruiser-visuals.js']){
 const path='published-game-capture/'+name,now=fs.readFileSync(path,'utf8'),before=cp.execFileSync('git',['show','bb06c32:'+path],{encoding:'utf8',maxBuffer:10*1024*1024});assert.equal(norm(now),norm(before),'Protected '+path);protectedFiles[path]=hash(norm(now));
}
cp.execFileSync('git',['diff','--exit-code','bb06c32','--','published-game-capture/assets'],{stdio:'pipe'});
const raw=norm(fs.readFileSync('published-game-capture/game.js','utf8')),build=norm(fs.readFileSync('site/preview/civilian-updated/game-v115.bundle.js','utf8')).replace(/\s+/g,'');
for(const [start,end] of [['function showLines(','function showFeedback('],['function showChoices(','function doTag(']]){
 const a=raw.indexOf(start),b=raw.indexOf(end,a);assert(a>=0&&b>a);assert(build.includes(raw.slice(a,b).replace(/\s+/g,'')),'Native callbacks and branching stay intact: '+start);
}
const moduleSource=fs.readFileSync('published-game-capture/comic-dialogue.js','utf8');assert(!/requestAnimationFrame\(|setInterval\(|setTimeout\(|localStorage|\.save\(/.test(moduleSource),'Presentation adds no clock or save writes');
fs.writeFileSync('docs/comic-dialogue/isolation.json',JSON.stringify({baseline:'bb06c32',protectedFiles,existingAssetsUnchanged:true,nativeBranchingUnchanged:true,noAdditionalClock:true,noSaveWrites:true},null,2));console.log('PASS canonical dialogue callbacks, campaign/world/cast/vehicle/Zombie sources and all existing assets unchanged; no new clock or save writes');

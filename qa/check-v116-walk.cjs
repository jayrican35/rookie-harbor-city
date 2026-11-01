'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'published-game-capture/v116-marina-walk.js'),'utf8');
const window={},images=[];let decoded=true;
vm.runInNewContext(source,{window,Image:function(){const im={complete:true,naturalWidth:384,naturalHeight:512};images.push(im);return im;},Math,Object,Number});
const walk=window.ROOKIE_V116_WALK;assert(walk.ready());
for(const [dir,row] of [['down',0],['left',1],['right',2],['up',3]]){
 const frames=[];for(const distance of [0,25,50,75]){const p=walk.pose({npcStyle:0,moving:true,dir,distance});assert.equal(p.row,row);frames.push(p.frame);}
 assert.deepEqual(frames,[0,1,2,3],'Every direction must use the complete walk cycle');
}
assert.equal(walk.pose({moving:false,distance:25}).frame,walk.pose({moving:false,distance:550}).frame,'Idle cannot keep pedaling');
assert.equal(walk.pose({moving:true,distance:0}).frame,walk.pose({moving:true,distance:0}).frame,'No elapsed-time animation at walls');
assert.equal(walk.pose({npcStyle:1}).key,'fisher');assert.equal(walk.pose({npcStyle:3}).key,'visitor');
const calls=[],g={drawImage(...a){calls.push(a);}};
walk.draw(g,{x:500,y:600,dir:'left',moving:true,distance:50});
assert.deepEqual(calls[0].slice(1,5),[192,128,96,128]);assert.deepEqual(calls[0].slice(5),[476,543,48,64],'All poses share one fixed ground anchor');
images[0].complete=false;assert(!walk.draw(g,{npcStyle:0}),'Missing sheet must retain fallback sprite');
const marina=fs.readFileSync(path.join(root,'published-game-capture/v116-marina.js'),'utf8');
const campus=fs.readFileSync(path.join(root,'published-game-capture/v115-campus.js'),'utf8');
assert(marina.includes('a.distance=(a.distance||0)+step'));assert(campus.includes('distance:campus.stride/.055'));
assert(!/requestAnimationFrame|localStorage|fetch\(|MAPS\.|\.save\(/.test(source),'Animation must remain a render-only module');
for(const key of ['officer','fisher','visitor'])assert(fs.statSync(path.join(root,'published-game-capture/assets/v116-marina/walk-'+key+'.webp')).size>5000);
console.log('PASS walk animation: all four facings and phases, idle freeze, distance lock, NPC costumes, fixed feet, loading fallback, no protected state changes');

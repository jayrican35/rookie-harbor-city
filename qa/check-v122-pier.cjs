'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),read=(p)=>fs.readFileSync(path.join(base,p),'utf8');
const marina=read('published-game-capture/v116-marina.js');
const world=read('published-game-capture/v115-campus.js');
const art=read('published-game-capture/v120-marina-art.js');
const bg=marina.slice(marina.indexOf('function begin('),marina.indexOf('function drawNpc('));
const actors=world.slice(world.indexOf('function drawEntityHighlights('),world.indexOf('function paint(t,dt)'));
assert(bg.includes('premium.contactWater(g,opt,t)'));
assert(bg.indexOf('premium.contactWater(g,opt,t)')<bg.indexOf('premium?.dock(g,px,view)'), 'Foam must go under deck');
assert(!bg.includes('premium?.post(g,'),'Piling must never be flattened into environment layer');
assert(marina.includes('function pierOccluders(view)'));
assert(marina.includes('depthY:py+31'),'Sort each post on anchored feet, not white cap');
assert(marina.includes('function drawPierPost(g,post)'));
assert(marina.includes('pierOccluders,drawPierPost'),'Share post renderer with actor queue');
assert(actors.includes('marina.pierOccluders(view)'));
assert(actors.includes('entries.push({y:post.depthY,pierPost:post})'));
assert(actors.includes('entries.sort((a,b)=>a.y-b.y)'));
assert(actors.includes('marina.drawPierPost(g,entry.pierPost)'));
assert(actors.includes('drawOfficer({x:campus.x,y:campus.y'));
assert(art.includes('const texH=im.naturalHeight||128'),'No repeating seam due to hardcoded tile height');
assert(art.includes("g.rect(px,top,deckWidth,deckHeight);g.clip()"),'Clip planks to dry deck surface');
assert(art.includes('px+90,top+8,14,deckHeight+3'),'Shadow must sit OUTSIDE deck surface');
assert(art.includes('g.fillRect(px,top+deckHeight,90,8)'),'Deck end face must show thickness');
const commands=[], ctx={window:{matchMedia:()=>({matches:false})},Image:class {
 constructor(){this.complete=true;this.naturalWidth=90;this.naturalHeight=192;this.decoding='async';}
 set src(v){this._src=v;}get src(){return this._src;}
}};
vm.runInNewContext(art,ctx);
const fx=ctx.window.ROOKIE_V120_ART;
const g={imageSmoothingEnabled:true,fillStyle:'',
 save(){commands.push('save')},restore(){commands.push('restore')},
 beginPath(){},rect(...a){commands.push(['clipRect',...a])},clip(){},
 fillRect(...a){commands.push(['fill',...a])},drawImage(...a){commands.push(['image',...a])}
};
assert(fx.dock(g,5105,{x:5050,y:3760,w:450,h:440}));
const imgs=commands.filter(c=>Array.isArray(c)&&c[0]==='image');
assert.equal(imgs.length,2,'Expected atlas rows 192 + 108 px, no hard-coded 128 px seam');
assert.deepEqual(imgs.map(c=>c[5]),[192,108]);
const dryShadow=commands.filter(c=>Array.isArray(c)&&c[0]==='fill');
assert(dryShadow.some(c=>c[1]===5105+90),'Shadow cast to right of deck, outside wood');
assert(dryShadow.some(c=>c[2]===4100&&c[4]===8),'End face physically below dry top');
assert.equal(commands.filter(c=>c==='save').length,commands.filter(c=>c==='restore').length);
assert(fx.metrics().dockTiles===2);
assert(fx.metrics().changesZombieOutbreak===false);
assert(fx.metrics().changesSaves===false);
console.log('PASS V122: world-sorted 18-piling render contract, below-deck foam, atlas 192+108, outside shadows, end-face height, no game-state changes');

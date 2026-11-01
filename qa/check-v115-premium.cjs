'use strict';
/* V115 premium environment unit checks. Node-only; no game code mutations. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..','published-game-capture');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const art=read('v115-premium-art.js'),world=read('v115-world.js'),campus=read('v115-campus.js');
assert(world.includes('premium.atlasTerrain(mapctx,{zoom:s})'));
assert(world.includes('premium.atlasOverlay(mapctx,{zoom:s,districts:zoneIds.map('));
assert(campus.includes('premium.terrain(g,{zoom:campus.zoom,view},t)'));
assert(campus.includes('premium.overlay(g,{zoom:campus.zoom,view,districts:districtEntries},t)'));
assert(!/\b(saveGame|goTo|setPlayerPosition|completeMission|fetch|WebSocket|RTCPeerConnection)\s*\(/.test(art));
const calls={image:0,rect:0};
class ImageMock {constructor(){this.naturalWidth=100;this.complete=true;}set src(s){assert(s.startsWith('./assets/v115-premium/'));this._src=s;if(this.onload)this.onload();}get src(){return this._src;}}
const sandbox={window:{},Image:ImageMock,Math,Number,Object,console};vm.createContext(sandbox);vm.runInContext(art,sandbox);
const api=sandbox.window.ROOKIE_V115_PREMIUM;assert(api,'Premium module not registered');
const actual=api.status();assert.equal(actual.assets,5);assert.equal(actual.decoded,5);assert.equal(actual.failed,0);assert.equal(actual.worldId,'harbor-main');
assert.equal(api.inspect().noZombieOutbreakMutation,true);
assert.equal(api.anchors.lighthouse.x,7270);
assert.equal(api.anchors.mountain.x,7420);
assert.equal(api.anchors.waterfall.x,-2830);
const gradient=()=>({addColorStop(){}});
const g={save(){},restore(){},beginPath(){},closePath(){},arc(){},ellipse(){},moveTo(){},quadraticCurveTo(){},lineTo(){},fill(){},stroke(){},fillText(){},rect(){},translate(){},scale(){},
  createRadialGradient:gradient,createLinearGradient:gradient,drawImage(){calls.image++;},fillRect(){calls.rect++;}};
api.terrain(g,{zoom:.25,view:{x:7420,y:100,w:700,h:1100}});
assert(calls.image>=1,'Mountain sprite expected when viewport contains mountain');
const before=calls.image;api.overlay(g,{zoom:.22,view:{x:4500,y:4150,w:2400,h:550},districts:[]});
assert(calls.image>before,'Marina sailing sprites expected');
api.atlasTerrain(g,{zoom:.09});
api.atlasOverlay(g,{zoom:.09,districts:[{id:'downtown',x:5100,y:1300,w:500,h:400,map:{decors:[{t:'bldg',x:15,y:80,w:120,h:115}]}}]});
assert(calls.rect>100,'Repeatable docks, shore, roof textures and coastline should paint');
for(const f of ['mountain-north.svg','waterfall-cliff.svg','marina-lighthouse.svg','marina-sailboat-1.svg','marina-sailboat-2.svg']){
  const file=path.join(root,'assets','v115-premium',f),txt=fs.readFileSync(file,'utf8');
  assert(txt.startsWith('<svg ') && txt.includes('</svg>'),f+' SVG missing');
  assert(!/<script|<foreignObject|javascript:/i.test(txt),'Unsafe image source');
}
console.log('PASS premium art: handcrafted 5 SVGs, source-derived distant rooftops, atlas/playfield coordinates, viewport culling and survival-mode safeguards.');
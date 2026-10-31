'use strict';
/* Read-only V115 showcase art tests. Never runs the real game or writes saves. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..','published-game-capture');
const art=fs.readFileSync(path.join(root,'v115-showcase.js'),'utf8');
const canvasSource=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const css=fs.readFileSync(path.join(root,'v115-showcase.css'),'utf8');
assert(!/\b(fetch|WebSocket|RTCPeerConnection|localStorage|sessionStorage|saveGame|goTo|completeMission|setTimeout)\s*\(/.test(art),'visual addon must never access networking or game/save APIs');
assert(!/zombie|outbreak|academy/i.test(css.replace(/\/\*[\s\S]*?\*\//g,'')),'visual styles must not target other modes');
assert(canvasSource.includes('const art=window.ROOKIE_V115_SHOWCASE;'),'showcase must have a dedicated optional renderer hook');
assert(canvasSource.includes('if(art)art.ground('));
assert(canvasSource.includes('if(art)art.precinct('));
assert(canvasSource.includes('if(art)art.atmosphere('));
assert(canvasSource.includes('window.ROOKIE_V115_SHOWCASE.buildingFallback('));
let calls={rect:0,gradients:0,fill:0};
const g={
 save(){},restore(){},beginPath(){},arc(){},ellipse(){},fill(){calls.fill++},
 createPattern(){return 'pattern'},createRadialGradient(){calls.gradients++;return{addColorStop(){}}},
 fillRect(){calls.rect++},strokeRect(){},stroke(){},fillText(){},
 moveTo(){},lineTo(){},setTransform(){},translate(){},rotate(){},scale(){},
 set fillStyle(v){},set strokeStyle(v){},set globalAlpha(v){},set globalCompositeOperation(v){},
 set font(v){},set lineWidth(v){},set textAlign(v){},set textBaseline(v){}
};
const modal={appendChild(){},querySelector(q){return {textContent:''}}};
const doc={createElement(tag){return tag==='canvas'?{width:0,height:0,getContext:()=>g}:{id:'',textContent:''}},getElementById(id){return id==='v115Campus'?modal:null}};
const window={};
vm.runInNewContext(art,{window,document:doc,Math,Object,Number,console},{filename:'v115-showcase.js'});
const artApi=window.ROOKIE_V115_SHOWCASE;
assert(artApi&&artApi.inspection().renderingOnly);
const view={x:700,y:950,w:2000,h:1000};
artApi.ground(g,{view,zoom:.9},0);
artApi.streets(g,{view,zoom:.9},0);
artApi.precinct(g,{view,zoom:.9,STX:380,STY:96,alpha:.85},0);
artApi.atmosphere(g,{view,zoom:.9},0);
const originalCount=calls.rect;
assert(originalCount>150,'expected rich grounds/roof/streets details');
assert(calls.gradients>0,'expected restrained static light-pool shading');
const box={t:'mtbldg',bx:35,btop:40,bw:150,bh:130,img:'pizza_shop',name:'Pizza'};
assert.equal(artApi.buildingFallback(g,box,.95),true,'missing Midtown art needs detailed fallback');
assert.equal(artApi.buildingFallback(g,{t:'house',bx:1,btop:1,bw:120,bh:120},.95),false,'do not change other district buildings');
const before=calls.rect;
artApi.ground(g,{view,zoom:.07},0);
artApi.streets(g,{view,zoom:.07},0);
artApi.precinct(g,{view,zoom:.07,STX:380,STY:96,alpha:.85},0);
artApi.atmosphere(g,{view,zoom:.07},0);
assert.equal(before,calls.rect,'low-detail whole-city view should not draw fine details');
console.log('PASS V115 visual showcase: scoped street/campus rendering, richer Midtown sprite fallback, mobile LOD, original-world/survival scope safe');
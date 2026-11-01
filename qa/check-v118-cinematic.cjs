'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(base,'published-game-capture/v118-cinematic.js'),'utf8');
const campus=fs.readFileSync(path.join(base,'published-game-capture/v115-campus.js'),'utf8');
const css=fs.readFileSync(path.join(base,'published-game-capture/v118-cinematic.css'),'utf8');
assert(!/requestAnimationFrame|localStorage|sessionStorage|fetch\s*\(|new\s+Image|MAPS\s*=/.test(source),
 'Visual effects must not own engine loops, saves, network, maps or assets');
assert.equal(campus.match(/cinematic\.ground\(/g)?.length,1);
assert.equal(campus.match(/cinematic\.atmosphere\(/g)?.length,1);
assert(css.includes('prefers-reduced-motion'));
assert(css.includes('v118-team-open'));
const objects=[
 {id:'marina:cafe',type:'building',x:4460,y:3227,w:183,h:125},
 {id:'marina:shade-west',type:'tree',x:4480,y:3510,w:100,h:110},
 {id:'marina:palm-a',type:'palm',x:4480,y:3650,w:90,h:91}
];
const room={id:'marina:cafe',roof:1};
let active=true,ops=[],saved=0,restored=0;
const marina={objects,interiors:[room],active:()=>active};
const gradient=()=>({addColorStop:(a,b)=>ops.push(['stop',a,b])});
const g={
 save(){saved++;},restore(){restored++;},beginPath(){ops.push('path');},
 moveTo(){},lineTo(){},closePath(){},fill(){ops.push('fill');},
 rect(){ops.push('rect');},clip(){ops.push('clip');},
 ellipse(){ops.push('ellipse');},fillRect(){ops.push('rectfill');},
 createLinearGradient:gradient,createRadialGradient:gradient
};
const context={window:{matchMedia:()=>({matches:false}),ROOKIE_V116_MARINA:marina},
 document:{readyState:'loading',addEventListener(){}},console};
vm.runInNewContext(source,context,{filename:'v118-cinematic.js'});
const fx=context.window.ROOKIE_V118_CINEMATIC;
assert(fx&&Object.isFrozen(fx));
const near={zoom:1,view:{x:4400,y:3220,w:450,h:700}};
const far={zoom:1,view:{x:1,y:1,w:100,h:100}};
fx.ground(g,far,0);fx.atmosphere(g,far,0);
assert.equal(ops.length,0,'Non-visible district must not paint');
fx.ground(g,{zoom:.1,view:near.view},0);
assert.equal(ops.length,0,'Low-zoom effect should be culled');
fx.ground(g,near,100);fx.atmosphere(g,near,100);
assert(ops.includes('clip')&&ops.includes('fill')&&ops.includes('rectfill'));
assert.equal(saved,restored,'Canvas save/restore must be balanced');
assert.equal(fx.metrics().groundPasses,1);
assert.equal(fx.metrics().lightPasses,1);
assert.equal(fx.metrics().changesCampaignSaves,false);
assert.equal(fx.metrics().changesZombieOutbreak,false);
const count=ops.length;active=false;fx.ground(g,near,500);fx.atmosphere(g,near,500);
assert.equal(ops.length,count,'Disabled marina must not paint');
active=true;room.roof=0;ops=[];
fx.ground(g,near,600);
assert(!ops.includes('shadow-via-third-renderer'));
assert.equal(saved,restored);
assert.equal(fx.metrics().groundPasses,2);
console.log('PASS V118 cinematic effects: viewport/zoom culling, stable overlays, balanced Canvas state, existing loop only, protected modes unaffected');

'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../published-game-capture');
const src=fs.readFileSync(path.join(root,'v132-precinct-heritage.js'),'utf8');
const campus=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const build=fs.readFileSync(path.resolve(__dirname,'../tools/build_v132_precinct_preview.py'),'utf8');
assert(!/requestAnimationFrame|setInterval|localStorage|sessionStorage|\.npcs\.push|MAPS\s*=|window\.state\s*=/.test(src),
 'The V132 painter may not add loops, AI, storage or mutate world state');
assert(src.includes('precinctExterior?.art?.roof')&&src.includes('H.cast?.spec')&&
 src.includes("'./assets/precinct-cast/'+spec.file"),
 'Both visual layers MUST use exact original legacy sources');
assert(campus.includes("if(window.ROOKIE_V132_PRECINCT?.roof(g,{x:STX,y:STY,alpha,zoom:campus.zoom}))return;"));
assert(campus.includes('window.ROOKIE_V132_PRECINCT?.npc(g,{...npc,showLabel:campus.zoom>.54})'));
assert(campus.includes("if(r.label==='GARAGE')")&&campus.includes("const previous=window.ROOKIE_V131_PRECINCT_BRIDGE"));
assert(build.includes("build_v131_precinct_preview.py")&&build.includes('v132-precinct-heritage.js'));
for(const n of ['game.js','outbreak.css','v116-marina.js','v127-citywide-art.js',
 'assets/precinct-exterior-v1/roof.png','assets/precinct-cast/brooks.webp',
 'assets/precinct-cast/chen.webp','assets/precinct-cast/rivera.webp',
 'assets/precinct-cast/diaz.webp'])
 assert(fs.existsSync(path.join(root,n)),'Missing ORIGINAL art/protected file '+n);
const called=[];
const g={save(){},restore(){},beginPath(){},fill(){},ellipse(){},fillRect(...a){called.push(['fill',...a]);},
 drawImage(...a){called.push(['draw',...a]);},fillText(...a){called.push(['text',...a]);},
 createPattern(im){called.push(['pattern',im.asset]);return 'roofPattern';}};
const source={complete:true,naturalWidth:128,asset:'roof.png'};
const specs={brooks:{file:'brooks.webp',heightInWorld:66,frames:
 Array.from({length:12},(_,i)=>({rect:[i*100,0,100,300]}))},
 diaz:{file:'diaz.webp',heightInWorld:66,frames:
 Array.from({length:12},(_,i)=>({rect:[i*100,0,100,300]}))}};
const window={HARBOR:{precinctExterior:{art:{roof:source}},
 cast:{spec:specs,identity(name){return /BROOKS/.test(name)?'brooks':/DIAZ/.test(name)?'diaz':null;}}}};
const Image=function(){this.complete=true;this.naturalWidth=1254;};
const document={createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext(){return g;}}}};
vm.runInNewContext(src,{window,Image,document,Math,Number,Object});
const v=window.ROOKIE_V132_PRECINCT;
assert.equal(v.worldId,'harbor-main');
assert.equal(v.roof(g,{x:380,y:96,alpha:.95}),true);
assert(called.some(x=>x[0]==='pattern'&&x[1]==='roof.png'),
 'Original 128px precinct roof material must actually paint');
assert(called.some(x=>x[0]==='draw'&&x[2]===380&&x[3]===96),
 'Original world coordinates and existing roof layer must be respected');
assert.equal(v.roof(g,{x:380,y:96,alpha:.04}),true);
assert.equal(v.stats().roofBuilds,1,'Static roof must be cached, not reallocated per frame');
assert.equal(v.npc(g,{id:'station-npc:0',name:'SGT. BROOKS',x:620,y:755,dir:'up'}),true);
assert.equal(v.npc(g,{id:'campus-npc:diaz',name:'OFCR. DIAZ',x:1040,y:1230,dir:'down'}),true);
assert.equal(v.npc(g,{id:'midtown:npc:0',name:'OFCR. DIAZ',x:620,y:755}),false,
 'Officers in other districts must preserve the original renderer');
assert.equal(v.npc(g,{id:'station-npc:1',name:'UNMAPPED VISITOR',x:620,y:755}),false,
 'Unknown station characters retain current fallback');
assert(called.some(x=>x[0]==='draw'&&x[1]?.src?.endsWith('/brooks.webp')),
 'Must draw actual legacy officer art instead of an invented block NPC');
assert(v.stats().castFrames>=2);
assert(v.stats().castNames.brooks>=1&&v.stats().castNames.diaz>=1);
console.log('PASS V132 authentic roof source material, original named cast sprites, native world coords, static cache, fallback, isolated scope and existing original/Zombie files');

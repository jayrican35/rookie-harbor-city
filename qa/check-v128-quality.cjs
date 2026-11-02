'use strict';
// V128 isolated source regression: no asset generation or browser required.
// Final native Android FPS and look still need user/device validation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','published-game-capture');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const jayCode=read('v117-jay.js'),artCode=read('v127-citywide-art.js'),world=read('v115-campus.js');
const drawing=[];
const g={draws:0,save(){},restore(){},beginPath(){},rect(){},clip(){},
 fillRect(){},strokeRect(){},ellipse(){},fill(){},stroke(){},moveTo(){},lineTo(){},
 scale(){},translate(){},clearRect(){},arc(){},drawImage(...args){this.draws++;drawing.push(args);}};
const images=[];
const Image=function(){
 const img={complete:true,naturalWidth:0,naturalHeight:512,addEventListener(){},decoding:'async'};
 Object.defineProperty(img,'src',{set(url){img.url=url;img.naturalWidth=url.includes('jay-walk')?1152:url.includes('jay-run')?1024:256;img.naturalHeight=url.includes('marina-detail-tiles')?128:512;}});
 images.push(img);return img;
};
const jayWindow={HARBOR:{profiles:{current:()=> 'jay'},outbreak:{active:()=>false},academy:{active:()=>false}},addEventListener(){}};
const jayDoc={querySelectorAll:()=>[],querySelector:()=>null,getElementById:()=>null,addEventListener(){}};
vm.runInNewContext(jayCode,{window:jayWindow,document:jayDoc,Image,Math,Map,Object});
const jay=jayWindow.ROOKIE_JAY;
const walkDraw=()=>{
 jay.draw(g,'connected-jay',{mode:'idle',phase:0,map:'harbor-main',x:400,y:500,dir:'down'});
 return drawing.at(-1);
};
const runDraw=()=>{
 jay.draw(g,'connected-jay',{mode:'run',phase:0,map:'harbor-main',x:400,y:500,dir:'down'});
 return drawing.at(-1);
};
const walk=walkDraw(),run=runDraw();
assert(walk[0].url.includes('jay-walk'),'Standing must use original walking sheet');
assert(run[0].url.includes('jay-run-clean'),'Connected running must use isolated cleaned sheet');
assert(Math.abs(walk[8]-run[8])<2,'Running painted silhouette should be equal height to walking');
assert(Math.abs((walk[6]+walk[8])-(run[6]+run[8]))<1,'Foot anchor cannot bounce between idle and RUN');
const runCenter=run[5]+run[7]/2;
assert(Math.abs(runCenter-400)<15,'RUN must not jump horizontally');
jay.draw(g,'original-jay',{mode:'run',phase:0,map:'station',x:400,y:500,dir:'down'});
const original=drawing.at(-1);
assert(original[0].url.includes('/jay-run.webp'),'Original campaign sheet stays authoritative');
assert(Math.abs(original[8]-93*.5)<.01,'Original run art/scale must remain byte-behavior identical');
assert(!/requestAnimationFrame|localStorage|sessionStorage|new Audio/.test(jayCode),'No extra loop, save, or sound system in Jay');
let canvases=0;
const artWindow={HARBOR:{worldV115:{areas:()=>[],roadNetwork:()=>({segments:[]})}}};
const artDoc={createElement(tag){assert.equal(tag,'canvas');canvases++;return{width:0,height:0,getContext:()=>g};}};
vm.runInNewContext(artCode,{window:artWindow,document:artDoc,Image,Math,Map,Set,Number,Object,Array});
const city=artWindow.ROOKIE_V127_CITY;assert(city&&city.worldId==='harbor-main');
const view={x:0,y:0,w:940,h:740};
const before=g.draws;
city.base(g,{view,zoom:1});
const district={id:'residential',x:0,y:0,w:1000,h:1000,map:{base:'#68994d',
 ground:[{x:0,y:0,w:280,h:190,c:'#3d4148'},{x:290,y:190,w:550,h:210,c:'#c2b8a4'}]}};
city.districtGround(g,district,view);
city.walkways(g,{view:{x:100,y:3630,w:850,h:200},zoom:.9});
assert(g.draws>before,'Terrain still uses cached shared texture images');
assert(city.metrics().details>0,'Empty residential grass must receive fine world-seeded detail');
assert(city.metrics().chunks>0&&city.metrics().chunks<=112,'Ground texture cache remains bounded');
assert(city.building(g,{x:15,y:30,w:150,h:155,district:'residential',kind:'house'},1));
assert(city.building(g,{x:400,y:50,w:200,h:155,district:'industrial',kind:'bldg'},1));
assert(world.includes('paintedBuilding(o,d.id)'),'District identity must reach the existing building painter');
assert(world.includes('city.districtGround(g,d,'),'Keep single existing native canvas renderer');
assert(!/requestAnimationFrame|localStorage|sessionStorage|fetch\s*\(/.test(artCode));
assert(!/outbreak\.|zombie|Academy.*renderer/.test(artCode));
console.log('PASS V128 equal-size RUN and idle with planted foot anchor; original campaign separate; all-city ground dressing, district architecture, bounded art cache and Zombie isolation');

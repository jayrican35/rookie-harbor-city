'use strict';
// Real file + original B2/craft/cinematic/garage API mocks, not paper QA.
// No new assets, maps, colliders or mode changes. Test old source imagery is
// DRAWN in connected precinct at the authentic native world coordinates.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'../published-game-capture');
const src=fs.readFileSync(path.join(root,'v131-precinct-legacy-bridge.js'),'utf8');
const v115=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const built=fs.readFileSync(path.join(__dirname,'../tools/build_v131_precinct_preview.py'),'utf8');
assert(!/requestAnimationFrame|setInterval|localStorage|sessionStorage|window\.MAPS\s*=/.test(src),
 'Bridge must never create a game loop, persistent state or collision changes');
assert(src.includes("const classicFiles=Object.freeze({") &&
 src.includes("lockers:'f330a30836b8ab16d8e3.webp'") &&
 src.includes("board:'642e392a9f180d575f32.webp'") &&
 src.includes("im.src='./assets/embedded/'+file"),
 'B2 fallback must decode only the SAME user-authored original repository sprites');
assert(built.includes('v131-precinct-legacy-bridge.js?v='));
assert(!src.includes('canvas.addEventListener')&&!src.includes('worldId='));
assert(v115.includes('const previous=window.ROOKIE_V131_PRECINCT_BRIDGE;'));
assert(v115.includes('if(cacheValid&&cache&&legacyAssetEpoch===epoch)return cache;'));
const load=(tag)=>({tag,complete:true,naturalWidth:256,naturalHeight:128});
const imgs={};for(const key of ['carpet','cream','cool','wood','wall','interview','crate','visitorTable','typing',
'bench','board','terminal','counter','evidence','cabinet','lockers','desk','chair','wallH',
'clock','sconce','workbench','reception','plant','plate','sofa'])imgs[key]=load(key);
const images={carpet:imgs.carpet,cream:imgs.cream,cool:imgs.cool,wood:imgs.wood,
wall:imgs.wall,interview:imgs.interview,crate:imgs.crate,visitorTable:imgs.visitorTable,typing:imgs.typing};
const calls=[],g={
 fillStyle:'#000',strokeStyle:'#000',font:'',lineWidth:1,textAlign:'',textBaseline:'',
 save(){calls.push(['save']);},restore(){calls.push(['restore']);},
 beginPath(){},closePath(){},clip(){},rect(){},translate(){},rotate(){},
 moveTo(){},lineTo(){},stroke(){},
 strokeRect(){},fillRect(){},fillText(){},
 createPattern(im,type){calls.push(['pattern',im.tag,type]);return 'pattern:'+im.tag;},
 drawImage(...args){calls.push(['draw',args[0]?.tag,args.slice(1)]);}
};
let cinematicCalls=0;
const harbor={precinctCraft:{art:images},
 precinctCinematic:{art:{clock:imgs.clock,sconce:imgs.sconce,workbench:imgs.workbench},
 floor(r,ctx){cinematicCalls++;ctx.drawImage(imgs[({BRIEFING:'carpet',LOBBY:'cream','LOCKER ROOM':'cool'})[r.label]||'cool'],r.x,r.y);}},
 receptionRoom:{art:imgs.reception,plant:imgs.plant},
 worldFurniture:{art:{sofa:imgs.sofa}}};
const window={HARBOR:harbor,B2:{
 bench:imgs.bench,board:imgs.board,terminal:imgs.terminal,
 counter:imgs.counter,evidence:imgs.evidence,cabinet:imgs.cabinet,
 lockers:imgs.lockers,desk:imgs.desk,chair:imgs.chair,wallH:imgs.wallH
 },__GARAGE:{img:{plate:imgs.plate}}};
vm.runInNewContext(src,{window,Math,Number,Object,Array,console});
const bridge=window.ROOKIE_V131_PRECINCT_BRIDGE;
assert(bridge&&bridge.worldId==='harbor-main');
const initial=bridge.assetEpoch();
assert(Number.isSafeInteger(initial));
const artCases=[
 {type:'locker',x:1180,y:400,w:132,h:24,im:'lockers'},
 {type:'desk',x:430,y:56,w:124,h:42,im:'terminal'},
 {type:'desk',x:880,y:380,w:170,h:48,im:'desk'},
 {type:'cabinet',x:660,y:52,w:80,h:22,im:'cabinet'},
 {type:'shelf',x:28,y:52,w:76,h:22,im:'evidence'},
 {type:'board',x:1240,y:26,w:220,h:16,im:'board'},
 {type:'counter',x:52,y:730,w:196,h:36,im:'counter'},
 {type:'hcReception',x:534,y:746,w:184,h:32,im:'reception'},
 {type:'hcLobbyPlant',x:418,y:694,w:24,h:24,im:'plant'},
 {type:'hcWaitingPair',x:416,y:744,w:84,h:26,im:'bench'},
 {type:'hcChangingBench',x:1184,y:550,w:108,h:18,im:'bench'},
 {type:'table',x:880,y:110,w:140,h:40,im:'interview'},
 {type:'table',x:60,y:170,w:100,h:38,im:'workbench'},
 {type:'crate',x:28,y:240,w:56,h:20,im:'crate'},
 {type:'hcLobbyTable',x:430,y:859,w:48,h:28,im:'visitorTable'},
 {type:'hcReceptionWing',x:516,y:704,w:24,h:42,im:null}
];
for(const f of artCases){
 const before=calls.length;
 assert.equal(bridge.furniture(g,f),true,'Original '+f.type+' should use source sprite');
 if(f.im)assert(calls.slice(before).some(v=>v[0]==='draw'&&v[1]===f.im),
  'No old asset '+f.im+' drawn for '+f.type);
}
assert.equal(bridge.furniture(g,{type:'nonexistent',x:0,y:0,w:20,h:20}),false);
const rooms=[{label:'BRIEFING',x:1156,y:12,w:392,h:288,lx:1170,ly:40},
{label:'LOBBY',x:388,y:648,w:376,h:380,lx:706,ly:1016},
{label:'LOCKER ROOM',x:1156,y:308,w:392,h:332,lx:1170,ly:336},
{label:'GARAGE',x:1156,y:648,w:768,h:512,lx:1170,ly:676}];
for(const room of rooms)assert.equal(bridge.room(g,room),true);
assert.equal(cinematicCalls,3,'All original interior rooms use old cinematic painter when loaded');
assert(calls.some(v=>v[0]==='draw'&&v[1]==='plate'&&v[2].length===8&&v[2][0]===696),
 'Original actual garage tool cabinet crop must render');
assert(bridge.wallSkins(g,[{x:372,y:12,w:24,h:130},{x:12,y:288,w:134,h:32}]));
assert(calls.some(v=>v[0]==='draw'&&v[1]==='wall'),
 'User-authored wall source must render on real source wall segment');
const count=bridge.stats();
assert(count.furniture>=artCases.length-1&&count.floors>=3&&count.garage>0&&count.walls>0,
 'Recovered art was not actually painted: '+JSON.stringify(count));
const prev=window.B2.lockers.complete;window.B2.lockers.complete=false;
assert.notEqual(bridge.assetEpoch(),initial,'Real browser cache must invalidate when original images decode');
window.B2.lockers.complete=prev;
assert.equal(bridge.assetEpoch(),initial);
for(const pathName of ['game.js','v116-marina.js','v127-citywide-art.js']){
 assert(fs.existsSync(path.join(root,pathName)),'Upstream protected source is missing '+pathName);
}
console.log('PASS actual B2 floor/locker/briefing/records/reception/garage legacy-art images; source-gated cache, real door/wall span, original modes preserved');

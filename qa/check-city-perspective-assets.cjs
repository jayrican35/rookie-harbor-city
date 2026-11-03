'use strict';
const fs=require('fs'),assert=require('assert/strict');
const src=fs.readFileSync('published-game-capture/v135-precinct-wallkit-test.js','utf8'),begin=src.indexOf('let pilotManifest='),end=src.indexOf('window.ROOKIE_V135_WALL_KIT=Object.freeze(');
const manifest=JSON.parse(fs.readFileSync('published-game-capture/assets/perspective-pilot/manifest.json','utf8'));
let calls=0,open=true,academy=false,zombie=false;
const window={ROOKIE_PERSPECTIVE_PILOT_ACTIVE:true,HARBOR:{seamlessCampusV115:{isOpen:()=>open},academy:{active:()=>academy},outbreak:{active:()=>zombie}}};
class Image{set src(v){this.width=this.naturalWidth=this.height=this.naturalHeight=512;queueMicrotask(()=>this.onload());}}
const api=new Function('window','fetch','Image',src.slice(begin,end)+'return {preparePerspectivePilot,drawPilotVehicle};')(window,async()=>{calls++;return{ok:true,json:async()=>manifest}},Image);
(async()=>{api.preparePerspectivePilot({x:4000,y:1700,w:300,h:300});assert.equal(calls,0,'Pilot remains bounded');window.ROOKIE_CITY_PERSPECTIVE_ACTIVE=true;api.preparePerspectivePilot({x:4000,y:1700,w:300,h:300});for(let i=0;i<10;i++)await Promise.resolve();assert.equal(calls,1);
const draws=[],g={save(){},restore(){},beginPath(){},ellipse(...a){assert(a.every(Number.isFinite))},fill(){},drawImage(...a){draws.push(a)},rotate(){throw Error('Never rotate directional art')}};
for(const kind of ['patrol','civilian','delivery'])for(const dir of ['up','down','left','right']){assert(api.drawPilotVehicle(g,{x:6000,y:1784,dir,kind,color:'#557e9a'}));}
assert.equal(draws.length,12);for(const a of draws){assert(a.slice(1).every(Number.isFinite));assert(a[7]>0&&a[8]>0);assert(Math.abs(a[7]/a[8]-a[3]/a[4])<.12,'Native aspect preserved');}
assert.equal(calls,1,'Single shared atlas request');for(const mode of ['closed','academy','zombie']){open=mode!=='closed';academy=mode==='academy';zombie=mode==='zombie';assert.equal(api.drawPilotVehicle({}, {x:6000,y:1784}),false,mode+' cannot paint');}
assert.equal(Object.keys(manifest.frames).length,52);console.log('PASS bounded pilot/city scope, protected-mode guards, single atlas, all family directions and uniform aspect');})().catch(e=>{console.error(e);process.exitCode=1});

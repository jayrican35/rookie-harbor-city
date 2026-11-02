'use strict';
// Integration contract for a bounded, family-friendly living city.
// Exercise the *actual* pedestrian functions extracted from the V115 engine.
// No second loop or newly invented sprite sheet may be introduced.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const world=fs.readFileSync(path.resolve(__dirname,'../published-game-capture/v115-campus.js'),'utf8');
const art=fs.readFileSync(path.resolve(__dirname,'../published-game-capture/v127-citywide-art.js'),'utf8');
const begin=world.indexOf('  const ambientRoutes=[],ambientSpeech={');
const end=world.indexOf('  function interiorRoom(x,y){',begin);
assert(begin>0&&end>begin,'Pedestrian routines must use the canonical connected-world engine');
const segment=world.slice(begin,end);
assert(!/requestAnimationFrame|setInterval|setTimeout|new Image|localStorage|\.save\(/.test(segment),
 'Pedestrians must not create a competing engine, animation, assets or save writes');
assert.equal((world.match(/stepAmbientPedestrians\(dt\);/g)||[]).length,1,'One native simulation integration only');
assert(world.includes("if(marina)marina.stepNPCs(dt);"),'Marina routines retained');
assert(world.includes('marina.drawNpc(g,'),'Use the same cleaned NPC sprite renderer');
assert(world.includes("if(sp?.ambientActor){"),'Pedestrians use existing interaction UI');
assert(world.includes('ambientPedestrians:ambientRoutes.length'),'Expose inspectable live count');
const ids=['westfield','residential','midtown','downtown','eastside','industrial','northgate','southbay','waterfront'];
const districts=ids.map((id,i)=>({id,x:i*1250,y:0,w:1100,h:980}));
let blockAll=false;
const blocked=(x,y,r)=>blockAll||!Number.isFinite(x)||!Number.isFinite(y)||r<0;
const npcs=[],spots=[];
const logic=new Function('blocked','districtEntries','npcActors','worldSpots',
 segment+'\nreturn {stepAmbientPedestrians,ambientRoutes};');
const {stepAmbientPedestrians,ambientRoutes}=logic(blocked,districts,npcs,spots);
for(let i=0;i<9;i++)stepAmbientPedestrians(1/30);
assert.equal(ambientRoutes.length,16,'Two pedestrians for each non-Marina district');
assert.equal(npcs.length,16);assert.equal(spots.length,16);
assert(ambientRoutes.every(a=>a.id.startsWith('ambient:')&&a.id.indexOf('waterfront')===-1));
assert(ambientRoutes.every(a=>a.route.length===2&&a.npcStyle>=2&&a.npcStyle<=3));
assert(ambientRoutes.every(a=>typeof a.interaction.text==='string'&&a.interaction.text.length>12));
const initial=ambientRoutes.map(a=>[a.x,a.y,a.distance]);
for(let i=0;i<18;i++)stepAmbientPedestrians(1/30);
assert(ambientRoutes.some((a,i)=>a.distance>initial[i][2]+3),'Pedestrians must actually walk');
for(const a of ambientRoutes){
 const area=districts.find(d=>a.id.includes(':'+d.id+':'));assert(area);
 assert(a.x>=area.x+70&&a.x<=area.x+area.w-70);
 assert(a.y>=area.y+70&&a.y<=area.y+area.h-70);
 assert(Math.abs(a.x-a.interaction.x)<.00001&&Math.abs(a.y-a.interaction.y)<.00001,'Talk spots follow NPC');
 assert(['up','down','left','right'].includes(a.dir));
}
const stopped=ambientRoutes.map(a=>[a.x,a.y]);
blockAll=true;for(let i=0;i<10;i++)stepAmbientPedestrians(1/30);
assert(ambientRoutes.every((a,i)=>a.x===stopped[i][0]&&a.y===stopped[i][1]),
 'Moving crowds must respect the same native collision gate');
assert(!/requestAnimationFrame|localStorage|sessionStorage|fetch\s*\(/.test(art),
 'Shared city art has no second loop, saves or web fetch');
console.log('PASS Harbor living city: 16 bounded native-sim pedestrians, cleaned 4-way sprite routing, dialogue, collision & untouched Marina');

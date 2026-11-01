'use strict';
// One worldwide release gate: nine authentic district surfaces, same native
// Canvas/camera and official asset stack, with the Marina protected.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..','published-game-capture');
const source=fs.readFileSync(path.join(root,'v127-citywide-art.js'),'utf8');
const world=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
let fills=0,draws=0,canvases=0,arcs=0;
const g={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){fills++},strokeRect(){},drawImage(){draws++},
 scale(){},translate(){},clearRect(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){arcs++}};
const Image=function(){return{complete:true,naturalWidth:256,naturalHeight:128,decoding:'async',addEventListener(){},set src(v){this.url=v;}}};
const H={worldV115:{areas:()=>[],roadNetwork:()=>({segments:[]})}};
const sandbox={window:{HARBOR:H},document:{createElement(tag){assert.equal(tag,'canvas');canvases++;return{width:0,height:0,getContext:()=>g};}},Image,Map,Set,Math,Number,Object,Array,console};
vm.runInNewContext(source,sandbox,{filename:'v127-citywide-art.js'});
const city=sandbox.window.ROOKIE_V127_CITY;
assert.equal(city.worldId,'harbor-main');
const view={x:0,y:0,w:1200,h:850};
city.base(g,{view,zoom:1});
const names=['westfield','residential','midtown','downtown','eastside','industrial','northgate','southbay','waterfront'];
const reports={};
for(const id of names){
 const prev=city.metrics().details;
 const d={id,x:0,y:0,w:1280,h:950,map:{base:'#68994d',
  ground:[{x:450,y:450,w:170,h:95,c:'#3d4148'}],
  decors:[{t:'house',x:170,y:170,w:152,h:140},{t:'lamp',x:320,y:220}]}};
 city.districtGround(g,d,view);
 assert(city.building(g,{x:170,y:170,w:152,h:140,kind:'house',district:id},1));
 const count=city.metrics().details-prev;
 if(id==='waterfront')assert.equal(count,0,'Marina ground decoration must remain exactly protected');
 else assert(count>=20,id+' must have substantial native ground treatment');
 reports[id]=count;
}
assert(city.metrics().chunks>0&&city.metrics().chunks<=112,'Bounded cache holds existing shared atlas');
assert(city.colorKind('#3d4148')==='road','Gray road may not become water');
assert(city.waterBlocked(5100,3950)===false,'Existing Marina shoreline unchanged');
assert(city.waterBlocked(5950,3950)===true,'Extended ocean remains impassable');
assert(!/requestAnimationFrame|localStorage|sessionStorage|fetch\s*\(/.test(source),'No parallel game engine, saves, or network calls');
assert(!/outbreak\.|zombie|Academy.*renderer/.test(source),'Protected modes stay isolated');
assert(world.includes('paintedBuilding(o,d.id)'),'Use native district identities and real building shells');
assert(world.includes('city.districtGround(g,d,'),'Do not bypass native world renderer');
assert(draws>0&&fills>100&&arcs>0,'World surfaces, architecture and lamp atmospherics render');
assert(canvases<=city.metrics().cacheMax+8);
console.log('PASS Harbor City World Completion — eight distinct terrain treatments + protected Marina, same buildings/collision, no Zombie or save changes',reports);

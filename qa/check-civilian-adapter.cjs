'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync('published-game-capture/civilian-connected.js','utf8');
const manifest=JSON.parse(fs.readFileSync('published-game-capture/assets/civilian-approved/manifest.json','utf8'));
assert(!/requestAnimationFrame|setInterval|localStorage|sessionStorage/.test(s));
const images=[],draws=[];
const mock={window:{ROOKIE_CONNECTED_CIVILIANS_ACTIVE:true,HARBOR:{seamlessCampusV115:{isOpen:()=>true},cast:{identity:n=>n==='CHEN'?'chen':null}}},
 Image:function(){const im={complete:true,naturalWidth:512,naturalHeight:640};images.push(im);return im;},Object,Map,Math,Number,String};
vm.runInNewContext(s,mock);const api=mock.window.ROOKIE_CIVILIANS;
const g={save(){},restore(){},beginPath(){},ellipse(){},fill(){},drawImage(...a){draws.push(a)}};
for(const a of [{id:'station-npc:1',name:'MAYA'},{id:'campus-npc:diaz',name:'OFCR. DIAZ'},
 {id:'v133-precinct:lane',name:'LANE'},{id:'player',name:'Jay'},{id:'family',name:'Rosa'},
 {id:'n',name:'CHEN'},{id:'banana',name:'Banana'},{id:'family',name:'SARITAH'},{id:'story',name:'ELIAS REED'},{id:'x',npcStyle:0}])assert.equal(api.draw(g,a),false);
assert.equal(images.length,0,'Protected actors must not request civilian atlases');
for(const role of api.roles)for(const [dir,row] of Object.entries({down:0,left:1,right:2,up:3}))for(let frame=0;frame<4;frame++){
 const actor={id:'test:'+role,name:'Citizen',civilianRole:role,dir,moving:true,distance:frame*6,x:100,y:200};
 const before=JSON.stringify(actor);const p=api.pose(actor);assert.equal(p.frame,frame);assert.equal(p.row,row);assert.equal(p.role,role);assert(api.draw(g,actor));assert.equal(JSON.stringify(actor),before);
 const d=draws.at(-1);assert.equal(d[1],frame*128);assert.equal(d[2],row*160);assert.equal(d[5],Math.round(100-25.6));assert.equal(d[6],Math.round(200-61.2));
}
assert.equal(api.roles.length,30);assert.equal(images.length,30);assert.equal(draws.length,480);
assert.deepEqual([...api.roles].sort(),Object.keys(manifest.characters||manifest.roles).sort());
const stopped={id:'ambient:midtown:1',moving:false,distance:999,dir:'left'};assert.equal(api.pose(stopped).frame,0);
assert.equal(api.roleFor({id:'v116:workshop-staff'}),'mechanic');assert.equal(api.roleFor({id:'v116:cafe-staff'}),'barista');
mock.window.ROOKIE_CONNECTED_CIVILIANS_ACTIVE=false;assert.equal(api.draw(g,{id:'a',name:'Citizen'}),false);
mock.window.ROOKIE_CONNECTED_CIVILIANS_ACTIVE=true;mock.window.HARBOR.outbreak={active:()=>true};assert.equal(api.draw(g,{id:'a',name:'Citizen'}),false);
console.log('PASS 30 role mappings, 480 frame samples, fixed feet anchor, idle hold, immutable actors, protected cast and mode guards');

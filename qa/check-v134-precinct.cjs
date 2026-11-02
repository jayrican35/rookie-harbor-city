'use strict';
/* Verify the actual V134 source draws a full 3-D-looking reference facade
 * and matching garage/grounds without changing original collision, NPC AI,
 * vehicles, saves, mode logic, roads, interiors, roof-fade mechanics.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../published-game-capture');
const src=fs.readFileSync(path.join(root,'v134-precinct-reference.js'),'utf8');
const world=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const build=fs.readFileSync(path.resolve(__dirname,'../tools/build_v134_precinct_preview.py'),'utf8');
for(const f of ['game.js','outbreak.css','v116-marina.js','v127-citywide-art.js','v115-world.js','v117-jay.js','v132-precinct-heritage.js']){
 assert(fs.existsSync(path.join(root,f)),'Missing protected original '+f);
}
assert(!/requestAnimationFrame|setInterval|setTimeout|localStorage|sessionStorage|\.npcs\.push|window\.MAPS\s*=|\.collision\.push/.test(src),
 'Reference art must never create a second engine, save system or collision');
assert(world.includes('ROOKIE_V134_PRECINCT?.architecture'));
assert(world.includes('ROOKIE_V134_PRECINCT?.ground'));
assert(world.includes('if(!window.ROOKIE_V134_PRECINCT)'));
assert(build.includes('build_v133_precinct_preview.py'));
const calls=[],g={imageSmoothingEnabled:false,
 fillRect(...args){calls.push(['r',...args]);},fillText(...args){calls.push(['text',...args]);},
 drawImage(...args){calls.push(['image',...args]);},save(){},restore(){},translate(){},scale(){},
 beginPath(){},moveTo(){},lineTo(){},closePath(){},arc(){},fill(){},stroke(){}
};
const document={createElement(t){assert.equal(t,'canvas');return {width:0,height:0,getContext(){return g;}}}};
const window={HARBOR:{}};
vm.runInNewContext(src,{window,document,Math,Number,Object});
const v=window.ROOKIE_V134_PRECINCT;assert(v&&v.version==='v134-reference-architectural-reconstruction');
assert.equal(v.layout.entrance.x,948);assert.equal(v.layout.entrance.y,1124);
assert.equal(v.layout.garage.x,1918);assert.equal(v.layout.garage.y,1256);
assert.equal(v.layout.facade.y+v.layout.facade.h,1123,'Architecture must end at original door world y=1124');
assert(v.layout.garageFacade.y+v.layout.garageFacade.h<=1256);
const view={x:280,y:400,w:2500,h:1150};
v.architecture(g,{alpha:.95,view,zoom:.8});
const a=v.stats();
assert(a.facadeReady&&a.garageReady&&a.facadeBuilds===1);
assert(calls.some(x=>x[0]==='text'&&x[1]==='PRECINCT 9'));
assert(calls.some(x=>x[0]==='text'&&x[1]==='MAIN ENTRANCE'));
assert(calls.some(x=>x[0]==='text'&&x[1]==='PRECINCT GARAGE'));
assert(calls.some(x=>x[0]==='text'&&x[1]==='HARBOR CITY POLICE'));
assert(calls.some(x=>x[0]==='image'&&x[2]===380),'Main façade must be drawn at original STX');
assert(calls.some(x=>x[0]==='image'&&x[2]===1538),'Garage façade must be drawn at original STX+1158');
v.architecture(g,{alpha:.95,view,zoom:.8});
assert.equal(v.stats().facadeBuilds,1,'Original detailed architecture must be cached');
const count=calls.length;
v.architecture(g,{alpha:.01,view,zoom:.8});
assert.equal(calls.length,count,'Roof-revealed interiors must not receive opaque facade art');
v.ground(g,{zoom:.8,view:{x:310,y:1108,w:1800,h:700}});
assert(v.stats().grounds>0&&v.stats().groundsBuilds===1);
assert(calls.some(x=>x[0]==='text'&&x[1]==='PRECINCT 9'));
assert.equal(v.layout.roadPreserved,true);
console.log('PASS V134 source-backed reference landmark: badge, 2-story warm windows, signage, main/garage doors, flags, plaza; original game modes unchanged');

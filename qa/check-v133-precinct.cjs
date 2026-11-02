'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../published-game-capture');
const src=fs.readFileSync(path.join(root,'v133-precinct-campus.js'),'utf8');
const world=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const cast=fs.readFileSync(path.join(root,'v132-precinct-heritage.js'),'utf8');
const build=fs.readFileSync(path.join(__dirname,'../tools/build_v133_precinct_preview.py'),'utf8');
for(const name of ['game.js','outbreak.css','v116-marina.js','v127-citywide-art.js',
 'v115-world.js','v117-jay.js','assets/precinct-exterior-v1/stone.png',
 'assets/precinct-cast/lane.webp','assets/precinct-cast/okafor.webp'])
 assert(fs.existsSync(path.join(root,name)),name+' must exist and remain source-backed');
assert(!/requestAnimationFrame|setInterval|setTimeout|localStorage|sessionStorage|new Audio|MAPS\s*=|\.npcs\.push|window\.state\s*=/.test(src),
 'V133 has to remain in native graphics and depth layers; no fake extra engine/save/AI');
assert(world.includes('ROOKIE_V133_PRECINCT?.ground(g,')&&
 world.includes('ROOKIE_V133_PRECINCT?.facade(g,')&&
 world.includes('ROOKIE_V133_PRECINCT.actors(t)'));
assert(cast.includes("!id.startsWith('v133-precinct:')"));
assert(build.includes('build_v132_precinct_preview.py')&&build.includes('v133-precinct-campus.js'));
const events=[];
const g={
 save(){},restore(){},translate(){},scale(){},beginPath(){},clip(){},
 ellipse(){},fill(){},fillRect(...a){events.push(['rect',...a]);},
 drawImage(...a){events.push(['draw',...a]);},
 fillText(...a){events.push(['text',...a]);},
 createPattern(){return 'original-stone-material';}
};
const canvas={width:0,height:0,getContext(){return g;}};
const stone={complete:true,naturalWidth:128};
const window={HARBOR:{precinctExterior:{art:{stone}}}};
const document={createElement(name){assert.equal(name,'canvas');return canvas;}};
vm.runInNewContext(src,{window,document,Math,Number,Object});
const api=window.ROOKIE_V133_PRECINCT;
assert.equal(api.worldId,'harbor-main');
const geometry=api.geometry;
assert.equal(geometry.front.x,948);assert.equal(geometry.front.y,1124);
assert.equal(geometry.garage.x,1918);assert.equal(geometry.garage.y,1256);
assert.equal(geometry.road.y,1721);assert.equal(geometry.road.h,127);
assert(geometry.south.y>=geometry.road.y+geometry.road.h,
 'The civic green must never paint over true Harbor Avenue asphalt');
assert.equal(geometry.lot.x,1328);assert.equal(geometry.lot.y,1268);
const view={x:300,y:1000,w:2500,h:1800};
api.ground(g,{zoom:.8,view});
const count=events.length;
assert(count>100,'Actual original world tiles/curbs/planters/park must be authored and painted');
assert.equal(api.metrics().groundBuilds,1);
api.ground(g,{zoom:.8,view});
assert.equal(api.metrics().groundBuilds,1,'Static landscape atlas must be cached across frames');
assert(events.some(e=>e[0]==='text'&&/CIVIC GREEN/.test(e[1])),
 'New south city block requires clearly authored civic-square signage');
api.facade(g,{alpha:.95,zoom:.8,view});
assert.equal(api.metrics().facade,1);
assert(events.some(e=>e[0]==='text'&&e[1]==='MAIN ENTRANCE'));
assert(events.some(e=>e[0]==='text'&&e[1]==='FLEET ACCESS'));
const before=events.length;api.facade(g,{alpha:.04,zoom:.8,view});
assert.equal(events.length,before,'Interior room must not receive opaque outside facade');
const actors=api.actors(1200);
assert.equal(actors.length,3);
assert(actors.every(a=>a.id.startsWith('v133-precinct:')));
assert(actors.some(a=>/LANE/.test(a.name))&&actors.some(a=>/OKAFOR/.test(a.name)));
assert(actors.every(a=>a.y>1268&&a.y<1710));
const moved=api.actors(9000);
assert(moved[0].x!==actors[0].x,'Grounded bounded officer patrol should animate');
assert.equal(api.version,'v133-precinct-campus-art-1');
console.log('PASS source-backed V133 graphics, foreground, entrance, parking, arcade, animated police, static cache, old road/doors and protected modes');

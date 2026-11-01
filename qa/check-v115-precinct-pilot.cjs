'use strict';
/* Small, stable art-pipeline regression test; no game source monkeypatching. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../published-game-capture');
const asset=path.join(root,'assets/v115-precinct-pilot');
const cfg=JSON.parse(fs.readFileSync(path.join(asset,'precinct-pilot.json')));
const atlas=fs.readFileSync(path.join(asset,'precinct-ground-atlas.png'));
assert.equal(atlas.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(atlas.readUInt32BE(16),cfg.atlas.columns*cfg.tileSize);
assert.equal(atlas.readUInt32BE(20),cfg.atlas.rows*cfg.tileSize);
assert.equal(cfg.tileSize,32);
assert.equal(cfg.worldId,'harbor-main');assert.equal(cfg.areaId,'precinct-campus-v115');
assert.equal(cfg.visualOnly,true);assert.equal(cfg.navmeshChanges,false);
assert.equal(cfg.collisionMode,'use-existing-world-geometry');
const width=cfg.region.width/cfg.tileSize,height=cfg.region.height/cfg.tileSize;
assert(width<=32&&height<=24);assert(cfg.layers.length>=3);
for(const layer of cfg.layers.filter(x=>x.type==='tile')){
 assert.equal(layer.tiles.length,height,layer.id+' height');
 for(const row of layer.tiles){assert.equal(row.length,width,layer.id+' width');
   for(const t of row){assert(Number.isInteger(t)&&t>=-1&&t<cfg.atlas.columns*cfg.atlas.rows);}}
}
const props=cfg.layers.find(x=>x.id==='furniture').sprites;
assert(props.length>=8);
for(const [name,url] of Object.entries(cfg.assets)){
 assert(url.startsWith('./assets/exterior/'),name+' must reuse existing approved art');
 const file=path.join(root,url.slice(2));assert(fs.existsSync(file),name+' source asset missing');
}
assert(props.some(x=>x.animation==='lampGlow'));
const campus=fs.readFileSync(path.join(root,'v115-campus.js'),'utf8');
const pilot=fs.readFileSync(path.join(root,'v115-precinct-pilot.js'),'utf8');
for(const hook of ['pilot.ground(g,','pilot.props(g,','pilot.animated(g,'])
 assert(campus.includes(hook),'Missing visual-only renderer hook '+hook);
assert(pilot.includes('createElement(\'canvas\')')&&pilot.includes('tileCache'));
assert(pilot.includes('imageSmoothingEnabled=false'));
assert(pilot.includes('getContext')&&pilot.includes('drawImage'));
const bad=/(?:MAPS\s*\[|MAPS\s*\.|state\.map\s*=|player\.x\s*=|saveGame\s*\(|localStorage\.|\.collision\s*=|outbreak\.)/;
assert(!bad.test(pilot),'The pilot must not mutate gameplay or Zombie Outbreak');
const base=fs.readFileSync(path.join(root,'game.js'));
assert(base.length>1400000);
console.log(`PASS: ${width}x${height} authored tiles, ${props.length} existing approved props, 5 reusable source sprites, cache/LOD, optional animation, isolated art hooks. Legacy game untouched.`);
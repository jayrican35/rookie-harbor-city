'use strict';
// Verify every *canonical* Harbor City road connects to the same continuous
// drivable topology. This uses actual source rectangles, not an invented map.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../published-game-capture');
const roadCode=fs.readFileSync(path.join(dir,'v115-world.js'),'utf8');
const campus=fs.readFileSync(path.join(dir,'v115-campus.js'),'utf8');
const match=roadCode.match(/segments:Object\.freeze\(\[([\s\S]*?)\]\.map\(r=>Object\.freeze\(r\)\)\)/);
assert(match,'Canonical road graph and native road segments must exist');
const segments=Function('return ['+match[1]+']')();
assert(segments.length>=18,'The corrected native road grid must include the western and southern bypasses');
const ids=new Set(segments.map(s=>s.id));
assert.equal(ids.size,segments.length,'Never create duplicate lane/road IDs');
const expected=['harbor-ave-west','harbor-precinct-link','harbor-ave-east','harbor-east-through',
 'south-connector','southbay-loop','bayview-link','midtown-south','midtown-east-spine',
 'midtown-lower-avenue','bayview-native-east-spine','westfield-native-spine',
 'westfield-south-extension','westfield-south-connector',
 'northgate-downtown','northgate-through-link','downtown-waterfront'];
for(const name of expected)assert(ids.has(name),'Missing road link '+name);
function touching(a,b){return a.x<=b.x+b.w&&a.x+a.w>=b.x&&a.y<=b.y+b.h&&a.y+a.h>=b.y;}
const visited=new Set(),queue=[segments[0]];visited.add(segments[0].id);
for(let i=0;i<queue.length;i++)for(const s of segments){
 if(!visited.has(s.id)&&touching(queue[i],s)){visited.add(s.id);queue.push(s);}
}
assert.equal(visited.size,segments.length,'Road network contains detached stubs: '+segments.filter(s=>!visited.has(s.id)).map(s=>s.id));
function pointOnRoad(x,y){return segments.some(s=>x>=s.x&&x<s.x+s.w&&y>=s.y&&y<s.y+s.h);}
for(let x=-3099;x<9656;x+=31)assert(pointOnRoad(x,1784),'Main cross-city Harbor Avenue breaks at x='+x);
for(let x=-1926;x<4388;x+=29)assert(pointOnRoad(x,3744),'Southbay and Maple route breaks at x='+x);
for(let y=945;y<3220;y+=23)assert(pointOnRoad(5855,y),'Northgate-Downtown to Marina approach breaks at y='+y);
for(let y=1800;y<3758;y+=23)assert(pointOnRoad(80,y),'Maple eastern bypass breaks at y='+y);
for(let x=4193;x<6686;x+=23)assert(pointOnRoad(x,948),'Midtown-Northgate avenue breaks at x='+x);
for(let y=1848;y<2604;y+=19)assert(pointOnRoad(4932,y),'Actual Midtown east spine breaks at y='+y);
for(let y=2477;y<3680;y+=19)assert(pointOnRoad(4050,y),'Midtown-to-Bayview feeder breaks at y='+y);
for(let y=1848;y<3744;y+=19)assert(pointOnRoad(-1850,y),'Westfield southern ring breaks at y='+y);
const protectedMarina={x:4400,y:3220,w:1500,h:1000};
assert(segments.filter(s=>s.newRoad).every(s=>!touching(s,protectedMarina)),
 'New road geometry cannot touch the approved Marina');
const cross=roadCode.match(/crossings:Object\.freeze\(\[([\s\S]*?)\]\.map\(r=>Object\.freeze\(r\)\)\)/);
assert(cross,'Shared road crossings must remain present');
const crossings=Function('return ['+cross[1]+']')();
for(const id of ['midtown-harbor-junction','midtown-lower-junction','midtown-southbay-junction','westfield-south-junction','northgate-harbor-junction']){
 const c=crossings.find(x=>x.id===id);assert(c&&pointOnRoad(c.x,c.y),'Missing painted crossing on real joined asphalt '+id);
}
// All decorative through-roads that were already authored must remain
// visually owned by the original tilemaps; only real missing pavement is drawn.
for(const id of ['southbay-loop','bayview-native-east-spine','midtown-lower-avenue',
 'midtown-east-spine','northgate-through-link','westfield-native-spine']){
 assert(segments.find(s=>s.id===id).underNative===true,'Native art road repainted: '+id);
}
assert(!segments.some(s=>s.id==='midtown-through-link'||s.id==='midtown-south-link'),
 'Do not revive the obsolete fictional Midtown dead-end');
assert(campus.includes('!link.newRoad')&&campus.includes('link.newRoad&&!link.underNative'),
 'Real connectors must render after terrain, old district asphalt retained');
assert(campus.includes('roadNetwork.primary.centerY!==1784'),'Original road world alignment cannot change');
assert(!/\b(?:saveGame|goTo|carGoTo)\s*\(/.test(campus),'Do not move cars or player between maps');
console.log('PASS World Completion roads:',segments.length,'verified connected street segments, Westfield ring, original Southbay/Midtown road alignments and preserved Marina');

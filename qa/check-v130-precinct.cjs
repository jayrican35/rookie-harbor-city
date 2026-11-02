'use strict';
/* User-approved precinct first: native geometry, not procedural city overlays.
 * Check the REAL V130 renderer bounds and preserve all V128 engine contracts.
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../published-game-capture');
const art=fs.readFileSync(path.join(dir,'v130-precinct-art.js'),'utf8');
const engine=fs.readFileSync(path.join(dir,'v115-campus.js'),'utf8');
const [draws,fillLog]=[[],[]];
const g={save(){},restore(){},beginPath(){},closePath(){},rect(){},clip(){},
 fillRect(x,y,w,h){fillLog.push({x,y,w,h,c:this.fillStyle});},strokeRect(){},
 drawImage(){draws.push('image');},scale(){},translate(){},clearRect(){},
 moveTo(){},lineTo(){},fill(){},stroke(){},arc(){},ellipse(){},rotate(){},
 fillText(t,x,y){draws.push({text:t,x,y});}
};
const mock={window:{},Math,Number,Object,Array,console};vm.runInNewContext(art,mock);
const p=mock.window.ROOKIE_V130_PRECINCT;
assert(p&&p.worldId==='harbor-main');
assert.equal(p.version,'precinct9-visual-foundation-1');
assert.deepEqual([p.bounds.front.x,p.bounds.front.y],[948,1124]);
assert.deepEqual([p.bounds.garage.x,p.bounds.garage.y],[1918,1256]);
const visible={x:300,y:950,w:2500,h:970};
p.ground(g,{view:visible,zoom:.96},0);
p.frontage(g,{view:visible,zoom:.96,roofAlpha:.95},0);
assert(fillLog.length>100,'Real existing parking/entrance marking details must be rendered');
assert(draws.length>3,'Accessible street signs are present at playable zoom');
const copy=fillLog.slice();
const road={x:149,y:1721,w:1920,h:127};
const pilot={x:352,y:1300,w:640,h:384};
const marina={x:4400,y:3220,w:1500,h:1000};
function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
const bad=copy.filter(v=>v.w<=0||v.h<=0||v.w>600||v.h>420||overlaps(v,marina));
assert.equal(bad.length,0,'No enormous opaque paints or Marina intrusion: '+JSON.stringify(bad));
assert(copy.some(v=>overlaps(v,road)),'Pedestrian crossing must mark authentic Harbor Avenue');
for(const v of copy.filter(v=>overlaps(v,road))){
 assert(v.x>=880&&v.x+v.w<=1015,'No paint across vehicle lane outside narrow original entrance crosswalk');
 assert(v.y>=1721&&v.y+v.h<=1848,'Crossing must stay inside original existing asphalt');
}
assert.equal(copy.filter(v=>overlaps(v,pilot)).length,0,
 'Respect original premium precinct art pilot tilemap x352..992, y1300..1684');
assert(copy.some(v=>v.x>=1328&&v.y>=1268&&v.x<1908),
 'North lot should be detailed within existing original asphalt footprint');
assert(copy.some(v=>v.x>=2325&&v.y>=1280&&v.x<2705),
 'Secondary parking area must gain detail where original asphalt exists');
const n=fillLog.length;
p.ground(g,{view:{x:4500,y:3200,w:900,h:850},zoom:1},0);
p.frontage(g,{view:{x:4500,y:3200,w:900,h:850},zoom:1,roofAlpha:.94},0);
assert.equal(fillLog.length,n,'Out-of-view Marina scene cannot draw precinct art');
p.ground(g,{view:visible,zoom:.10},0);
p.frontage(g,{view:visible,zoom:.10,roofAlpha:.95},0);
assert.equal(fillLog.length,n,'No precinct detail at tiny overview zoom');
p.frontage(g,{view:visible,zoom:1,roofAlpha:.04},0);
assert.equal(fillLog.length,n,'Entrance architecture fades with real interior roof');
assert(engine.includes('precinctVisual.ground(g,'),'Precinct uses existing Canvas world-ground pipeline');
assert(engine.includes('precinctVisual.frontage(g,'),'Precinct uses existing roof fade and actor order');
assert(engine.includes('const FRONT={x:STX+568,y:STY+1028}'),'Actual V115 front doorway coordinate unchanged');
assert(engine.includes('GARAGE={x:STX+1538,y:STY+1160}'),'Actual V115 garage door unchanged');
assert(!/requestAnimationFrame|setInterval|setTimeout|localStorage|sessionStorage|fetch\s*\(/.test(art),
 'No parallel engine/network/save behaviour');
assert(!/outbreak|zombie|Academy|MAPS\s*\./i.test(art),
 'The small precinct artwork adapter cannot touch excluded modes or legacy maps');
console.log('PASS Precinct 9: two real parking surfaces, narrow live-road crossing, aligned roof fade/doors, earlier authored pilot + Marina guarded; no engine/save changes');

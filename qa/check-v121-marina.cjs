'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const renderer=fs.readFileSync(path.join(root,'published-game-capture/v120-marina-art.js'),'utf8');
const marina=fs.readFileSync(path.join(root,'published-game-capture/v116-marina.js'),'utf8');
const generator=fs.readFileSync(path.join(root,'tools/generate_v121_marina_art.py'),'utf8');
assert(renderer.includes("const ROOT='./assets/v121-marina/'"));
assert(renderer.includes("'water-glints'"));
assert(renderer.includes("material(g,'water-caustics',view,sx,sy,.44,bounds)"));
assert(renderer.includes('waterGlints(g,view,time,bounds)'));
assert(renderer.includes('Golden reflections are sparse broken *sparkles*'));
assert(!renderer.includes('const width=34*(1-k/15)'),'No recurring horizontal reflection bars');
assert(renderer.includes('const frame=reduced?0:Math.floor(t/230+seed%31)%4'));
assert(renderer.includes('g.globalAlpha=.95'));
assert(!/requestAnimationFrame|setInterval|localStorage|sessionStorage|fetch\s*\(/.test(renderer));
assert(marina.includes('if(!premium)window.ROOKIE_V119_MOTION?.waterSurface'));
assert(marina.includes('if(!premium){'),'old V116 wave lines must not stack');
assert(generator.includes('water-body.png')&&generator.includes('water-caustics.png'));
const fakeAssets=[];
class MockImage {
 constructor(){this.complete=true;this.naturalWidth=512;this.naturalHeight=512;fakeAssets.push(this);}
 set src(url){this._src=url;}
 get src(){return this._src;}
}
let saves=0,paints=0;
const g={
 save(){saves++},restore(){saves--},beginPath(){},rect(){},clip(){},fillRect(){paints++},
 drawImage(){paints++},createLinearGradient(){return{addColorStop(){}};},
 createRadialGradient(){return{addColorStop(){}};},
 ellipse(){},stroke(){},
};
const context={window:{matchMedia:()=>({matches:false})},Image:MockImage};
vm.runInNewContext(renderer,context,{filename:'v120-marina-art.js'});
const m=context.window.ROOKIE_V120_ART;
assert(Object.isFrozen(m));
assert.equal(m.metrics().assets,9);
assert(m.ready());
const opt={zoom:.85,view:{x:5000,y:3800,w:420,h:550}};
m.water(g,opt,1000);m.contactWater(g,opt,1000);m.dock(g,5105,opt.view);
m.post(g,5112,3930);m.waterReflections(g,opt,1000);m.promenade(g,{view:{x:5000,y:3570,w:420,h:210}},1000);
assert.equal(saves,0);
assert(m.metrics().waterFrames>0);
assert(m.metrics().sparkleDraws>0);
assert(m.metrics().dockTiles>0);
assert(m.metrics().postDraws>0);
assert(m.metrics().foamDraws>0);
assert(m.metrics().shadows>0);
const count=paints;m.water(g,{zoom:1,view:{x:0,y:0,w:10,h:10}},1300);assert.equal(count,paints);
assert.equal(m.metrics().changesSaves,false);
assert.equal(m.metrics().changesZombieOutbreak,false);
console.log('PASS V121: actual atlas-backed 9-material renderer, moving sun glints, foam, dock and directional sunlight, no duplicate engine');

'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),js=fs.readFileSync(path.join(root,'published-game-capture/v120-marina-art.js'),'utf8');
const marina=fs.readFileSync(path.join(root,'published-game-capture/v116-marina.js'),'utf8');
const campus=fs.readFileSync(path.join(root,'published-game-capture/v115-campus.js'),'utf8');
assert(!/requestAnimationFrame|setInterval|localStorage|sessionStorage|fetch\s*\(/.test(js),'No new loop, storage or network');
assert(marina.includes('if(y>=3800&&window.ROOKIE_V120_ART)continue'),'Existing water tiles must be disabled');
assert(marina.includes('if(!premium)window.ROOKIE_V119_MOTION?.waterSurface'),'V119 lines must not stack');
assert(marina.includes('premium.water(g,opt,t)'),'Existing V116 world canvas must own material pass');
assert(marina.includes('premium?.dock(g,px,view)'),'Same three native piers need replacement material');
assert(marina.includes('if(premium)premium.boat(g,o,t)'),'Real boats get water interaction');
assert(marina.includes('if(!premium){'),'Legacy wave scribbles disabled');
assert(campus.includes('const cinematic=window.ROOKIE_V118_CINEMATIC'),'No scene rewrite');
const names=[];
const images={};
class FakeImage{
 constructor(){this.complete=true;this.naturalWidth=512;this.naturalHeight=512;names.push(this);}
 set src(s){this._src=s;}
 get src(){return this._src;}
}
let saved=0,painted=0,gradients=0;
const g={
 save(){saved++},restore(){saved--},beginPath(){},rect(){},clip(){},fillRect(x,y,w,h){
  assert([x,y,w,h].every(Number.isFinite),'All draw coordinates must be finite');painted++;
 },drawImage(){painted++},createLinearGradient(){gradients++;return{addColorStop(){}};},
 createRadialGradient(){gradients++;return{addColorStop(){}};},
};
const ctx={window:{matchMedia:()=>({matches:false})},Image:FakeImage};
vm.runInNewContext(js,ctx,{filename:'v120-marina-art.js'});
const fx=ctx.window.ROOKIE_V120_ART;
assert(fx&&Object.isFrozen(fx));
assert.equal(fx.metrics().assets,8);
assert(fx.ready());
const opt={zoom:1,view:{x:5050,y:3810,w:360,h:450}};
fx.water(g,opt,600);
fx.contactWater(g,opt,600);
fx.dock(g,5105,opt.view);
fx.post(g,5110,3820);
fx.boat(g,{x:5270,y:3890,w:82,h:150,p:2},600);
fx.seawall(g,opt,600);
fx.waterReflections(g,opt,600);
assert.equal(saved,0,'Every layer must restore Canvas state');
assert(gradients>=2);
assert(fx.metrics().materialsDrawn>3);
assert(fx.metrics().foamDraws>0);
assert.equal(fx.metrics().dockTiles,3);
assert(fx.metrics().postDraws>0);
assert(fx.metrics().waterFrames>0);
const count=painted;
fx.water(g,{zoom:1,view:{x:0,y:0,w:10,h:10}},600);
assert.equal(count,painted,'Camera-cull all offscreen water');
assert.equal(fx.metrics().changesSaves,false);
assert.equal(fx.metrics().changesZombieOutbreak,false);
console.log('PASS V120 source and material pipeline: 8 assets, textured sea/foam/dock, camera culling, no new loop, balanced canvas and protected systems');

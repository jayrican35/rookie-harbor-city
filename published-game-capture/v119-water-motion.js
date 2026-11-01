/* ROOKIE: Harbor City V119 — Visible Waterfront + Character Motion
 * Called exclusively by the existing V116 marina canvas pass. No RAF, assets,
 * player state changes, maps, collision, campaign saves, or combat mode edits.
 */
(function(){
'use strict';
const PIER=[4655,5105,5555];
const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const state={waterFrames:0,waveCrests:0,boatWakes:0,footstepFrames:0};
function visible(r,v){return r.x<v.x+v.w&&r.x+r.w>v.x&&r.y<v.y+v.h&&r.y+r.h>v.y;}
function hash(x,y){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;}
function waterSurface(g,view,t){
 if(!view||!visible({x:4400,y:3800,w:1500,h:856},view))return;
 const time=reduced?0:t,lowX=Math.max(4400,Math.floor(view.x)-30),highX=Math.min(5900,Math.ceil(view.x+view.w)+30);
 const lowY=Math.max(3800,Math.floor(view.y)-30),highY=Math.min(4656,Math.ceil(view.y+view.h)+30);
 if(highX<=lowX||highY<=lowY)return;
 state.waterFrames++;
 g.save();g.beginPath();g.rect(4400,3800,1500,856);g.clip();
 // Clear near-shore turquoise and deeper offshore navy over the existing tile grain.
 const color=g.createLinearGradient(0,3800,0,4656);
 color.addColorStop(0,'rgba(15,156,177,.28)');
 color.addColorStop(.30,'rgba(25,101,164,.21)');
 color.addColorStop(1,'rgba(3,27,79,.48)');
 g.fillStyle=color;g.fillRect(lowX,lowY,highX-lowX,highY-lowY);
 // Wide rolling trough bands make the sea visibly move even on a phone.
 for(let row=Math.floor((lowY-3800)/80);3800+row*80<highY;row++){
  const y=3818+row*80,shift=Math.sin(time*.0007+row*1.13)*16;
  g.fillStyle='rgba(3,35,92,.21)';g.fillRect(lowX+shift,y,highX-lowX+18,10);
  g.fillStyle='rgba(84,204,215,.14)';g.fillRect(lowX-shift,y+11,highX-lowX+18,3);
 }
 // Big crisp turquoise + pearl wave crests, world-locked; bounded to viewport.
 for(let y=Math.floor(lowY/46)*46;y<highY;y+=46){
  for(let x=Math.floor(lowX/114)*114;x<highX;x+=114){
   const seed=hash(x,y),dx=Math.sin(time*.0012+(seed%20))*17;
   const wx=x+seed%27+dx,wy=y+seed%18,w=29+seed%28;
   g.fillStyle='rgba(9,45,99,.38)';g.fillRect(wx+6,wy+5,w+9,3);
   g.fillStyle=seed%3===0?'rgba(207,248,240,.74)':'rgba(102,221,230,.66)';
   g.fillRect(wx,wy,w,3);
   g.fillStyle='rgba(237,253,239,.52)';g.fillRect(wx+8,wy-3,Math.max(8,w*.48),2);
   g.fillStyle='rgba(35,159,210,.46)';g.fillRect(wx+w*.67,wy+3,17,2);
   state.waveCrests++;
  }
 }
 // Sea foam along the existing seawall, never over the three open dock mouths.
 for(const [a,b] of [[4400,4655],[4745,5105],[5195,5555],[5645,5900]]){
  if(b<lowX||a>highX||lowY>3830)continue;
  const pulse=Math.sin(time*.0016+a*.022)*2.6;
  for(let x=Math.max(a,Math.floor(lowX/22)*22);x<Math.min(b,highX);x+=22){
   const w=Math.min(17,b-x),dy=Math.sin(x*.067+time*.002)*2;
   g.fillStyle='rgba(194,247,233,.70)';g.fillRect(x,3804+pulse+dy,w,2);
   g.fillStyle='rgba(231,254,247,.39)';g.fillRect(x+4,3810+pulse+dy,Math.max(2,w-8),2);
  }
 }
 // Rich under-pier shadows before the original pier planks are painted.
 for(const px of PIER)if(px<highX+25&&px+90>lowX-25&&lowY<4120){
  g.fillStyle='rgba(2,19,55,.44)';g.fillRect(px-13,3800,13,302);
  g.fillStyle='rgba(2,19,55,.36)';g.fillRect(px+90,3800,19,302);
  g.fillStyle='rgba(122,237,228,.36)';g.fillRect(px-18,3800,3,302);
 }
 g.restore();
}
function boatWake(g,boat,t){
 if(!boat)return;
 const time=reduced?0:t,phase=time*.0016+boat.p;
 const x=boat.x+boat.w*.5,y=boat.y+boat.h*.65;
 g.save();
 for(let i=0;i<3;i++){
  const cycle=((phase*.42+i/3)%1+1)%1;
  g.strokeStyle=i===0?'rgba(214,252,242,.75)':'rgba(97,221,230,.55)';
  g.lineWidth=i===0?2.5:2;
  g.beginPath();
  g.ellipse(x,y+3,boat.w*(.30+.25*cycle),9+cycle*21,0,0,Math.PI*2);
  g.stroke();state.boatWakes++;
 }
 for(let i=0;i<5;i++){
  const shift=Math.sin(phase+i*.9)*(14+i*3);
  g.fillStyle=i%2?'rgba(200,246,235,.57)':'rgba(82,207,225,.63)';
  g.fillRect(x-18+shift,boat.y+boat.h*(.78+i*.038),14-i,2);
 }
 g.restore();
}
function footsteps(g,a,t){
 if(!a?.moving||!Number.isFinite(a.x)||!Number.isFinite(a.y))return;
 const distance=Number.isFinite(a.distance)?a.distance:0;
 const phase=((distance/15)%1+1)%1,alpha=((1-phase)*.56).toFixed(3);
 const wood=a.y>=3800&&PIER.some(px=>a.x>=px&&a.x<=px+90);
 const side=Math.floor(distance/15)%2?1:-1;
 const dx=(a.dir==='left'?7:a.dir==='right'?-7:side*9);
 const dy=a.dir==='up'?8:a.dir==='down'?-5:3;
 g.save();g.fillStyle=wood?'rgba(195,235,236,'+alpha+')':'rgba(252,213,145,'+alpha+')';
 g.fillRect(Math.round(a.x+dx-2),Math.round(a.y+dy+5),8,3);
 g.fillRect(Math.round(a.x+dx+4),Math.round(a.y+dy+3),4,2);
 if(a.run){g.fillStyle='rgba(244,227,173,'+(alpha*.8)+')';g.fillRect(a.x+dx-side*9,a.y+dy+8,12,2);}
 g.restore();state.footstepFrames++;
}
function characterBob(a,t){
 const time=reduced?0:t;
 return a?.moving?Math.abs(Math.sin((a.distance||0)*.25))*2.3:Math.max(0,Math.sin(time*.002+(a?.x||0)*.1))*.8;
}
window.ROOKIE_V119_MOTION=Object.freeze({
 version:'119-water-character-motion',waterSurface,boatWake,footsteps,characterBob,
 metrics:()=>Object.freeze({...state,reduced,worldStateChanged:false,zombieOutbreakChanged:false})
});
})();
/* ROOKIE V118: optional cinematic presentation for the existing connected marina.
 * Pure canvas overlays + a progressive HUD enhancement. No RAF, map, physics,
 * save, mission, asset, or Zombie Outbreak modification.
 */
(function(){
'use strict';
const BOUNDS=Object.freeze({x:4400,y:3220,w:1500,h:1000});
const motionReduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const lamps=[4473,4773,5073,5373,5673];
let groundPasses=0,lightPasses=0;
function visible(o,v,p=0){
 return !!v&&o.x<v.x+v.w+p&&o.x+(o.w||0)>v.x-p&&o.y<v.y+v.h+p&&o.y+(o.h||0)>v.y-p;
}
function crop(g){
 g.beginPath();g.rect(BOUNDS.x,BOUNDS.y,BOUNDS.w,BOUNDS.h);g.clip();
}
function inView(opt){return !!opt&&opt.zoom>=.30&&visible(BOUNDS,opt.view);}
function ground(g,opt,t){
 if(!inView(opt))return;
 const marina=window.ROOKIE_V116_MARINA;
 if(!marina||!marina.active())return;
 groundPasses++;
 g.save();crop(g);
 // Directional, grounded shadows: never a second texture or scenery renderer.
 // Building roof shadows vanish naturally when that building is revealed.
 for(const o of marina.objects){
  if((o.type!=='building'&&o.type!=='kiosk')||!visible(o,opt.view,45))continue;
  const room=marina.interiors.find(b=>b.id===o.id);
  if(room&&room.roof<.1)continue;
  const offset=Math.min(18,Math.max(7,o.h*.10)),base=o.y+o.h-3;
  g.fillStyle='rgba(19,38,51,.12)';
  g.beginPath();
  g.moveTo(o.x+5,base);g.lineTo(o.x+o.w-6,base);
  g.lineTo(o.x+o.w+offset,base+offset*.60);
  g.lineTo(o.x+offset,base+offset*.60);
  g.closePath();g.fill();
  g.fillStyle='rgba(16,36,43,.13)';
  g.fillRect(o.x+7,base-2,Math.max(0,o.w-14),3);
 }
 // Warm sun dapples on the pavement, with stable world positions.
 // Reduced-motion setting freezes the phase rather than disabling visibility.
 if(opt.zoom>=.52){
  const phase=motionReduced?0:Math.sin((t||0)*.00032)*1.4;
  for(const o of marina.objects){
   if((o.type!=='tree'&&o.type!=='palm')||!visible(o,opt.view,40))continue;
   const cx=o.x+o.w*.54,cy=o.y+o.h*.93;
   for(let k=0;k<3;k++){
    const xx=cx+(k-1)*o.w*.19+phase,yy=cy+(k%2)*7;
    g.fillStyle=k===1?'rgba(246,215,140,.105)':'rgba(245,222,159,.075)';
    g.beginPath();g.ellipse(xx,yy,Math.max(3,o.w*.09),2.3,-.25,0,Math.PI*2);g.fill();
   }
  }
 }
 g.restore();
}
function atmosphere(g,opt,t){
 if(!inView(opt))return;
 const marina=window.ROOKIE_V116_MARINA;
 if(!marina||!marina.active())return;
 lightPasses++;
 const phase=motionReduced?0:Math.sin((t||0)*.0011);
 g.save();crop(g);
 // A gentle amber/blue color-grade only on Southbay. Keeps tiles crisp and
 // leaves the larger connected city, interiors and all HUD controls untouched.
 if(typeof g.createLinearGradient==='function'){
  const grade=g.createLinearGradient(BOUNDS.x,BOUNDS.y,BOUNDS.x,BOUNDS.y+BOUNDS.h);
  grade.addColorStop(0,'rgba(255,199,105,.055)');
  grade.addColorStop(.58,'rgba(255,220,155,.025)');
  grade.addColorStop(1,'rgba(12,62,104,.055)');
  g.fillStyle=grade;g.fillRect(BOUNDS.x,BOUNDS.y,BOUNDS.w,BOUNDS.h);
 }
 // Local lamp bloom, clipped to world bounds, camera-culled and very subtle:
 // the original lantern pixel art remains the sharp visual focal point.
 if(opt.zoom>=.43&&typeof g.createRadialGradient==='function'){
  for(const x of lamps){
   const y=3673;if(!visible({x:x-75,y:y-75,w:150,h:150},opt.view))continue;
   const intensity=(.115+phase*.012).toFixed(3);
   const glow=g.createRadialGradient(x,y,3,x,y,76);
   glow.addColorStop(0,'rgba(255,228,148,'+intensity+')');
   glow.addColorStop(.36,'rgba(255,190,100,.064)');
   glow.addColorStop(1,'rgba(255,180,95,0)');
   g.fillStyle=glow;g.fillRect(x-76,y-76,152,152);
  }
 }
 g.restore();
}
function enhanceHUD(){
 const hud=document.getElementById('v116MarinaHUD');
 if(!hud||hud.classList.contains('v118-ready'))return;
 const team=hud.querySelector('.v116-team');
 if(!team)return;
 const button=document.createElement('button');
 button.type='button';
 button.className='v118-team-toggle';
 button.textContent='Family';
 button.setAttribute('aria-label','Show or hide family portraits');
 button.setAttribute('aria-controls','v118FamilyQuickList');
 button.setAttribute('aria-expanded','false');
 team.id='v118FamilyQuickList';
 hud.appendChild(button);hud.classList.add('v118-ready');
 const close=()=>{hud.classList.remove('v118-team-open');button.setAttribute('aria-expanded','false');};
 button.addEventListener('click',()=>{
  const expanded=!hud.classList.contains('v118-team-open');
  hud.classList.toggle('v118-team-open',expanded);
  button.setAttribute('aria-expanded',String(expanded));
 });
 hud.addEventListener('click',e=>{
  if(e.target.closest('[data-action],[data-profile],.v116-identity'))close();
 });
 hud.addEventListener('keydown',e=>{if(e.key==='Escape'&&hud.classList.contains('v118-team-open')){close();button.focus();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceHUD,{once:true});else enhanceHUD();
window.ROOKIE_V118_CINEMATIC=Object.freeze({
 version:'v118-cinematic-foundation',ground,atmosphere,
 metrics:()=>Object.freeze({groundPasses,lightPasses,motionReduced,
  changesWorldState:false,changesCampaignSaves:false,changesZombieOutbreak:false})
});
})();
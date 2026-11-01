/* Jay's single locomotion renderer: shared by campaign and connected city.
   Frame preparation belongs in tools/, never in the animation loop. */
(function(){
 'use strict';
 const rows={down:0,left:1,right:2,up:3},actors=new Map(),images={};
 for(const mode of ['walk','run']){const im=new Image();im.src='./assets/jay-v117/jay-'+mode+'.webp?v=1';images[mode]=im;}
 let shift=false,toggle=false;
 function excluded(){const h=window.HARBOR;return !!(h?.outbreak?.active()||h?.academy?.active());}
 function eligible(){return !excluded()&&(!window.HARBOR?.profiles||window.HARBOR.profiles.current()==='jay');}
 function controls(){document.querySelectorAll('[data-jay-run]').forEach(b=>{b.setAttribute('aria-pressed',String(toggle));b.textContent=toggle?'WALK':'RUN';});}
 function resetInput(){shift=false;toggle=false;controls();for(const a of actors.values()){a.moving=false;a.mode='idle';}}
 window.addEventListener('keydown',e=>{if(e.key==='Shift'&&eligible())shift=true;});
 window.addEventListener('keyup',e=>{if(e.key==='Shift')shift=false;});
 window.addEventListener('blur',resetInput);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();});
 function update(id,input,dt){
  dt=Math.max(0,Math.min(.05,dt||0));let a=actors.get(id);
  const step=a?Math.hypot(input.x-a.x,input.y-a.y):0;
  if(!a||a.map!==input.map||step>Math.max(36,dt*1300)){a={...input,phase:0,mode:'idle',moving:false};actors.set(id,a);return a;}
  const moving=dt>0&&step>.015,mode=moving?(input.run&&step/dt>235?'run':'walk'):'idle';
  if(moving)a.phase+=step/(mode==='run'?22:18);
  Object.assign(a,input,{mode,moving});return a;
 }
 function pose(a){const row=rows[a.dir]??0;return {mode:a.mode==='run'?'run':'walk',row,col:a.mode==='idle'?0:Math.floor(a.phase||0)%8+(a.mode==='run'?0:1)};}
 function draw(g,id,input){
  const prior=actors.get(id),a={...(prior?.map===input.map?prior:{mode:'idle',phase:0}),...input};
  let p=pose(a),im=images[p.mode];
  if(!im.complete||!im.naturalWidth){p={mode:'walk',row:rows[a.dir]??0,col:0};im=images.walk;}
  // Claim the player slot while decoding: never switch Jay's identity to a legacy sprite.
  if(!im.complete||!im.naturalWidth)return true;
  const w=im.naturalWidth/(p.mode==='walk'?9:8),h=im.naturalHeight/4;
  g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(6,15,24,.28)';g.beginPath();g.ellipse(a.x,a.y+2,14,5,0,0,Math.PI*2);g.fill();
  g.drawImage(im,p.col*w,p.row*h,w,h,a.x-32,a.y-61,64,64);g.restore();return true;
 }
 function advanceSpeed(speed,target,dt){dt=Math.max(0,Math.min(.05,dt||0));const e=Math.exp(-dt/.10);return {speed:target+(speed-target)*e,distance:target*dt+(speed-target)*.10*(1-e)};}
 function addButton(parent,id){if(!parent||document.getElementById(id))return;const b=document.createElement('button');b.type='button';b.id=id;b.dataset.jayRun='';b.textContent='RUN';b.setAttribute('aria-label','Toggle running');b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{toggle=!toggle;controls();});parent.appendChild(b);if(id==='v117CampaignRun')b.hidden=true;}
 function ready(){addButton(document.querySelector('.v115-campus-tools'),'v117ConnectedRun');addButton(document.getElementById('walkJoystick')?.parentElement,'v117CampaignRun');}
 document.addEventListener('DOMContentLoaded',ready);
 window.ROOKIE_JAY={eligible,excluded,requestRun:()=>eligible()&&(shift||toggle),update,draw,pose,advanceSpeed,
  control(id,show){let b=document.getElementById(id);if(!b){ready();b=document.getElementById(id);}if(b)b.hidden=!show;},reset:resetInput,
  snapshot:id=>actors.has(id)?{...actors.get(id)}:null,
  ready:()=>Object.values(images).every(im=>im.complete&&im.naturalWidth),setup:ready};
})();

/* V116 marina presentation. Reads profile/objective state; writes no campaign saves. */
(function(){
'use strict';
let root,map,context,lastPaint=-Infinity,current='',panel,mapArt=null;
const names={jay:'Jay',rosa:'Rosa',kaleb:'Kaleb',gigi:'Gigi',lingling:'LingLing'};
function star(g,x,y){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?4:9;const xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;if(i)g.lineTo(xx,yy);else g.moveTo(xx,yy);}g.closePath();g.fillStyle='#ffe376';g.strokeStyle='#493c26';g.lineWidth=2;g.fill();g.stroke();}
function openPanel(type){
 panel.hidden=false;
 const title=panel.querySelector('h2'),body=panel.querySelector('.v116-panel-body');
 if(type==='case'){
  title.textContent='CASE 001 · THE GREAT SANDWICH CAPER';body.textContent='';
  const summary=document.createElement('p');summary.textContent='Current assignment';body.appendChild(summary);
  const objectives=document.querySelector('#objList');const text=document.createElement('p');text.textContent=objectives?.innerText||'Visit Sergeant Brooks at Precinct 9 for your briefing.';body.appendChild(text);
 }else{
  title.textContent='MARINA MAP';body.textContent='Explore the promenade and the three original fishing piers. The gold marker on the minimap shows your current location.';
  const b=document.createElement('button');b.type='button';b.textContent='Open full city map';b.onclick=()=>{window.HARBOR.seamlessCampusV115.close();document.getElementById('btnMap')?.click();};body.appendChild(b);
 }
 panel.querySelector('.v116-panel-close').focus();
}
const icon=(kind)=>{
 const shapes={case:'<path d="M10 8h23v31H10z" fill="#f3e7be"/><path d="M17 5h10v6H17z" fill="#9baba8"/><path d="M15 17h13M15 22h13M15 27h10M15 32h10" stroke="#566c78" stroke-width="2"/>',map:'<path d="m3 13 13-5 12 5 12-5v29l-12 5-12-5-13 5z" fill="#d3dfb3"/><path d="m16 8 12 5v29l-12-5z" fill="#86b8d0"/><path d="m8 29 10-8 9 10 7-11" fill="none" stroke="#d5bd69" stroke-width="4"/><path d="M35 12c0 5-6 11-6 11s-6-6-6-11a6 6 0 1 1 12 0" fill="#db6551"/><circle cx="29" cy="12" r="2" fill="#ffdfb2"/>',gear:'<path d="M17 9V5h12v4" fill="none" stroke="#e6bf6e" stroke-width="3"/><rect x="5" y="10" width="35" height="28" rx="4" fill="#a76a35"/><path d="M6 23h34M14 10v28M31 10v28" stroke="#ebba69" stroke-width="3"/><path d="M20 20h6v7h-6z" fill="#f2cf79"/>',team:'<circle cx="22" cy="13" r="7" fill="#cd8bea"/><circle cx="8" cy="18" r="5" fill="#9f6acf"/><circle cx="36" cy="18" r="5" fill="#9f6acf"/><path d="M11 39V30a11 11 0 0 1 22 0v9z" fill="#bb79df"/><path d="M1 36v-7a7 7 0 0 1 11-6M43 36v-7a7 7 0 0 0-11-6" fill="#8d58bb"/>'};
 return '<svg viewBox="0 0 44 44" aria-hidden="true" stroke="#263543" stroke-width="1.6" stroke-linejoin="round">'+shapes[kind]+'</svg>';
};
function ready(){
 const campus=document.getElementById('v115Campus');if(!campus)return;
 root=document.createElement('div');root.id='v116MarinaHUD';root.innerHTML=`
 <button class="v116-identity" type="button" aria-label="Open family profiles"><img alt="" src="./assets/family-v1/jay-portrait.webp"><span><strong>JAY</strong><small>ON DUTY</small><i>SOUTHBAY MARINA</i></span></button>
 <nav class="v116-team" aria-label="Family profiles">${Object.entries(names).map(([id,name])=>`<button type="button" data-profile="${id}" aria-label="Open profiles — ${name}"><img alt="" src="./assets/family-v1/${id}-portrait.webp"><span>${name}</span></button>`).join('')}</nav>
 <button class="v116-minimap" type="button" aria-label="Open marina map"><span>Harbor City</span><canvas width="176" height="112" aria-label="Live marina map with player location"></canvas></button>
 <button class="v116-case" type="button" aria-label="Open current case file"><span class="v116-case-icon" aria-hidden="true">▱</span><span><strong>CASE 001</strong><small>The Great<br>Sandwich Caper</small></span></button>
 <nav class="v116-actions" aria-label="Adventure controls"><button type="button" data-action="case">${icon('case')}Case File</button><button type="button" data-action="map">${icon('map')}Map</button><button type="button" data-action="gear">${icon('gear')}Gear</button><button type="button" data-action="team">${icon('team')}Team</button></nav>
 <section class="v116-panel" role="dialog" aria-modal="true" aria-labelledby="v116PanelTitle" hidden><button class="v116-panel-close" type="button" aria-label="Close marina panel">×</button><h2 id="v116PanelTitle"></h2><div class="v116-panel-body"></div></section>`;
 campus.appendChild(root);panel=root.querySelector('.v116-panel');map=root.querySelector('canvas');context=map.getContext('2d');
 // Upgrade THIS existing HUD in place; no second UI renderer or interaction bus.
 root.classList.add?.('v125-ready');
 const menuToggle=document.createElement('button');menuToggle.type='button';menuToggle.id='v125HudMenu';
 menuToggle.textContent='☰ Menu';menuToggle.setAttribute?.('aria-expanded','false');
 menuToggle.setAttribute?.('aria-label','Open Case File, Map, Gear, Team and Settings');
 menuToggle.setAttribute?.('aria-controls','v125HudActions');root.appendChild(menuToggle);
 const nav=root.querySelector('.v116-actions');if(nav)nav.id='v125HudActions';
 const settings=document.createElement('button');settings.type='button';settings.id='v125HudSettings';
 settings.textContent='⚙ Settings';root.appendChild(settings);
 const exit=document.createElement('button');exit.type='button';exit.id='v125HudExit';
 exit.textContent='↩ Main Game';root.appendChild(exit);
 exit.onclick=()=>{window.HARBOR.seamlessCampusV115.close();};
 let menuOpen=false;
 const closeMenu=()=>{
   menuOpen=false;root.classList.toggle('v125-menu-open',false);
   menuToggle.setAttribute?.('aria-expanded','false');
 };
 menuToggle.onclick=()=>{
   // Derive from real DOM, so closing/reopening the preview never leaves
   // stale menu-open state in an invisible JavaScript variable.
   menuOpen=!root.classList?.contains?.('v125-menu-open');
   root.classList.toggle('v125-menu-open',menuOpen);
   menuToggle.setAttribute?.('aria-expanded',String(menuOpen));
 };
 settings.onclick=()=>{
   closeMenu();
   // Native settings in the original game—not a duplicate options screen.
   window.HARBOR.seamlessCampusV115.close();document.getElementById('btnMenu')?.click();
 };
 const profiles=()=>{window.HARBOR.seamlessCampusV115.close();window.HARBOR.profiles?.open();};
 root.querySelector('.v116-identity').onclick=profiles;
 for(const b of root.querySelectorAll('[data-profile]'))b.onclick=profiles;
 root.querySelector('.v116-minimap').onclick=()=>openPanel('map');root.querySelector('.v116-case').onclick=()=>openPanel('case');
 root.querySelector('.v116-panel-close').onclick=()=>{panel.hidden=true;root.querySelector('[data-action="case"]').focus();};
 panel.addEventListener('keydown',e=>{if(e.key==='Tab'){const f=Array.from(panel.querySelectorAll('button,[href],input,[tabindex]')).filter(e=>!e.disabled);const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if(e.key==='Escape'){e.stopPropagation();panel.hidden=true;root.querySelector('[data-action="case"]').focus();}});
 for(const b of root.querySelectorAll('[data-action]'))b.onclick=()=>{
  closeMenu();
  const action=b.dataset.action;
  if(action==='case'||action==='map')return openPanel(action);
  if(action==='team')return profiles();
  window.HARBOR.seamlessCampusV115.close();document.getElementById('btnInv')?.click();
 };
}
function paint(state,t){
 if(!root||t-lastPaint<120)return;lastPaint=t;
 root.hidden=!window.ROOKIE_V116_MARINA.inMarina(state.x,state.y);if(root.hidden)return;
 const id=window.HARBOR.profiles?.current()||'jay';
 if(id!==current){current=id;root.querySelector('.v116-identity img').src='./assets/family-v1/'+id+'-portrait.webp';root.querySelector('.v116-identity strong').textContent=(names[id]||id).toUpperCase();
 root.querySelector('.v116-identity small').textContent=['kaleb','gigi','lingling'].includes(id)?'ACADEMY SIMULATION':'ON DUTY';
 for(const b of root.querySelectorAll('[data-profile]'))b.classList.toggle('selected',b.dataset.profile===id);}
 const g=context,marina=window.ROOKIE_V116_MARINA,metrics=marina.metrics();
 if(!mapArt&&metrics.decoded===metrics.assets){
  mapArt=document.createElement('canvas');mapArt.width=176;mapArt.height=112;
  const mg=mapArt.getContext('2d');mg.imageSmoothingEnabled=false;mg.fillStyle='#508839';mg.fillRect(0,0,176,112);
  mg.save();mg.scale(176/1500,112/1000);mg.translate(-4400,-3220);
  const view={x:4400,y:3220,w:1500,h:1000};
  marina.background(mg,{zoom:.18,view},0);marina.foreground(mg,{zoom:.18,view},0);mg.restore();
 }
 g.clearRect(0,0,176,112);
 if(mapArt)g.drawImage(mapArt,0,0);else {g.fillStyle='#12649b';g.fillRect(0,0,176,112);}
 const x=Math.max(6,Math.min(170,(state.x-4400)/1500*176)),y=Math.max(9,Math.min(103,(state.y-3220)/1000*112));star(g,x,y);
}
window.ROOKIE_V116_HUD=Object.freeze({paint,
 blocked:()=>!!panel&&!panel.hidden||!!root?.classList?.contains?.('v125-menu-open'),
 close:()=>{if(panel){const opened=!panel.hidden;panel.hidden=true;
   if(root){root.classList.toggle('v125-menu-open',false);
     root.querySelector('#v125HudMenu')?.setAttribute?.('aria-expanded','false');}
   if(opened)root.querySelector('[data-action="case"]').focus();}}
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();

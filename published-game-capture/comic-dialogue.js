/* Comic presentation for the existing H.speech renderer. No simulation clock,
 * narrative engine, save writes, character art or gameplay state lives here. */
(()=>{'use strict';
 const query=new URLSearchParams(location.search),stage=query.get('comicStage')||'full';
 const NS='http://www.w3.org/2000/svg',cream='#fff9e9',ink='#18283b';
 const shapes=Object.freeze({
  normal:'M24 39 Q16 8 100 15 Q173 0 242 14 Q330 0 389 28 Q425 48 406 113 Q426 185 380 206 Q307 231 220 213 Q128 234 48 210 Q0 200 15 141 Q-1 83 24 39Z',
  excited:'M23 35 Q57 3 121 16 Q185 -3 244 14 Q324 1 390 25 Q424 59 405 116 Q431 179 385 207 Q305 230 225 212 Q129 236 44 210 Q-4 183 15 126 Q0 73 23 35Z',
  angry:'M23 48 L7 20 L73 27 L101 4 L147 22 L198 5 L242 23 L295 4 L324 26 L393 15 L386 49 L417 77 L397 111 L420 150 L390 173 L404 208 L339 201 L303 225 L253 209 L198 227 L153 208 L97 226 L71 204 L12 212 L26 175 L2 146 L23 110 L5 78Z',
  whisper:'M25 44 Q16 12 108 17 Q200 4 290 17 Q406 4 405 70 Q425 150 395 198 Q323 223 223 211 Q122 231 37 207 Q2 178 17 120 Q4 74 25 44Z',
  thought:'M32 63 C-4 28 39 2 81 23 C102 -6 150 -2 166 15 C202 -7 243 -3 256 17 C298 -5 342 4 346 24 C404 7 429 45 402 73 C432 110 425 149 400 155 C421 197 380 224 345 205 C317 236 269 221 257 209 C215 235 177 226 165 210 C121 235 80 219 77 204 C24 224 -3 191 23 158 C-8 134 -2 86 32 63Z',
  surprise:'M210 0 L244 30 L300 7 L309 47 L378 30 L366 76 L420 95 L383 124 L418 161 L364 169 L379 211 L312 198 L290 230 L243 208 L203 230 L171 205 L112 226 L103 193 L37 214 L50 168 L0 148 L38 117 L2 77 L65 70 L52 25 L120 43 L148 4 L179 32Z',
  confusion:'M45 30 Q10 8 104 15 Q208 -5 310 14 Q418 7 405 86 Q431 172 384 205 Q302 235 207 211 Q105 233 31 198 Q-1 163 16 98 Q0 55 45 30Z',
  laughter:'M28 44 Q16 4 110 17 Q178 -4 237 15 Q327 -1 390 32 Q429 66 403 119 Q427 181 380 207 Q303 232 223 212 Q125 234 41 207 Q-2 175 17 119 Q0 71 28 44Z'
 });
 let context=null,meta=null,lastAmbient=0,ambientSerial=0,decorated=null,lastTail='',cameraKey='',originalHome=null,lastFrame=-1000;
 const cooldowns=new WeakMap(),art=new WeakMap();
 const mascots=[{id:'comic:chicken',name:'Chicken',x:732,y:1376,head:24,asset:'chicken'},
  {id:'comic:banana',name:'Banana',x:698,y:1300,head:24,asset:'bananas'}];
 function enabled(){const h=window.HARBOR;return !query.has('comicLegacy')&&!!h&&!h.outbreak?.active?.()&&!h.academy?.active?.()&&window.ROOKIE?.state?.()?.map!=='training';}
 function connected(){return enabled()&&!!context&&!!window.HARBOR?.seamlessCampusV115?.isOpen();}
 function modalActive(){return connected()&&!!window.HARBOR?.speech?.current();}
 function node(tag,attrs){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));return n;}
 function balloon(el){if(art.has(el))return art.get(el);const svg=node('svg',{viewBox:'0 0 420 230',preserveAspectRatio:'none',class:'comic-shell','aria-hidden':'true'});
  const shadow=node('path',{fill:'#15253955',transform:'translate(3 5)'}),body=node('path',{fill:cream,stroke:ink,'stroke-width':4,'vector-effect':'non-scaling-stroke','stroke-linejoin':'round'});
  svg.append(shadow,body);el.prepend(svg);const tail=node('svg',{class:'comic-tail','aria-hidden':'true'}),path=node('path',{fill:cream,stroke:ink,'stroke-width':3,'stroke-linejoin':'round'});tail.append(path);el.prepend(tail);
  const item={svg,shadow,body,tail,path};art.set(el,item);return item;}
 function style(el,type){const a=balloon(el);if(el.dataset.comicStyle===type)return;a.shadow.setAttribute('d',shapes[type]||shapes.normal);a.body.setAttribute('d',shapes[type]||shapes.normal);a.body.setAttribute('stroke',type==='angry'?'#933e29':ink);a.body.setAttribute('stroke-dasharray',type==='whisper'?'2 7':'none');el.dataset.comicStyle=type;}
 function settings(){if(!enabled())return null;const v=viewport(),width=Math.min(354,Math.max(160,(v?.right||innerWidth-8)-(v?.left||8)));return{width,lines:innerHeight<420?2:innerWidth<500?3:4};}
 function viewport(){if(!connected())return null;const r=context.canvas.getBoundingClientRect(),v=window.visualViewport;return{r,left:Math.max(8,r.left+8,v?.offsetLeft+6||0),top:Math.max(8,r.top+8,v?.offsetTop+6||0),right:Math.min(innerWidth-8,r.right-8),bottom:Math.min(innerHeight-8,r.bottom-8)};}
 function screen(p){if(!connected()||!p.connected)return null;const r=context.canvas.getBoundingClientRect(),v=context.view;return{x:r.left+(p.x-v.x)/v.w*r.width,y:r.top+(p.y-v.y)/v.h*r.height,head:p.head/v.h*r.height};}
 function resolve(name){if(!connected())return null;const actor=meta?.actors?.find(a=>a.name===name)||context.actors.find(a=>a.name===name);return actor?{ref:actor,kind:'connected'}:null;}
 function present(a){return connected()&&(mascots.includes(a.ref)||context.actors.includes(a.ref))&&context.visible(a.ref);}
 function point(a){return{x:a.ref.x,y:a.ref.y,head:a.ref.head||58,connected:true};}
 function decorate(active,panel){if(!enabled()){panel.classList.remove('comic-balloon');return;}if(!active)return;
  if(connected()&&panel.parentElement!==context.host){originalHome={parent:panel.parentNode,next:panel.nextSibling};context.host.appendChild(panel);}
  panel.classList.add('comic-balloon');document.body.classList.add('comic-dialogue-enabled');
  const type=meta?.stylesByText?.[active.full]||meta?.styles?.[active.speaker]||meta?.style||(/!{2,}|^[A-Z\s!?.]{8,}$/.test(active.full)?'excited':'normal');style(panel,type);
  const portrait=window.ROOKIE_CHICKEN?.portrait(active,type)||window.ROOKIE_BANANA?.portrait(active,type);let pic=panel.querySelector('.comic-npc-portrait');if(portrait){if(!pic){pic=document.createElement('img');pic.className='comic-npc-portrait';pic.alt='';pic.width=pic.height=44;panel.querySelector('#dlgSpeaker').prepend(pic);}if(pic.getAttribute('src')!==portrait)pic.src=portrait;}else pic?.remove();
  if(decorated!==active){decorated=active;lastTail='';panel.classList.remove('comic-pop');void panel.offsetWidth;panel.classList.add('comic-pop');}
 }
 function obstacles(focus){const faces=connected()?[context.player,...context.actors.filter(a=>context.visible(a)&&Math.hypot(a.x-focus.x,a.y-focus.y)<160)].map(a=>{const p=screen({x:a.x,y:a.y,head:a.head||58,connected:true});return{x:p.x-16,y:p.y-p.head,w:32,h:28,weight:12}}):[];return faces.concat(['#v116MarinaHUD .v116-identity','#v116MarinaHUD .v116-minimap','#v125HudMenu','#v115CampusPad','#v115CampusInteract','#v125CampusSprint','#walkJoystick','#btnInteract','#zoomControls'].flatMap(s=>{const n=document.querySelector(s);if(!n)return[];const r=n.getBoundingClientRect();return r.width&&r.height?[{x:r.x-5,y:r.y-5,w:r.width+10,h:r.height+10,weight:8}]:[];}));}
 function tail(el,p,pos){const a=balloon(el),r=el.getBoundingClientRect();if(!p){a.tail.style.display='none';return;}const x=p.x-pos.x,y=p.y-p.head-10-pos.y;
  const bx=x<0?14:x>r.width?r.width-14:Math.max(32,Math.min(r.width-32,x)),by=x<0||x>r.width?Math.max(24,Math.min(r.height-24,y)):y<0?14:r.height-14;
  const key=[Math.round(x),Math.round(y),Math.round(bx),Math.round(by),el.dataset.comicStyle].join(',');if(el.id==='dlgPanel'&&key===lastTail)return;if(el.id==='dlgPanel')lastTail=key;
  a.tail.style.display='block';a.tail.setAttribute('viewBox',`-200 -300 ${r.width+400} ${r.height+600}`);a.tail.style.cssText+=`;left:-200px;top:-300px;width:${r.width+400}px;height:${r.height+600}px`;
  a.path.setAttribute('d',el.dataset.comicStyle==='thought'?`M${x-3} ${y}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M${(x+bx)/2-7} ${(y+by)/2}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`:x<0||x>r.width?`M${bx} ${by-11} Q${(bx+x)/2} ${by-16} ${x} ${y} Q${(bx+x)/2} ${by+12} ${bx} ${by+11}`:`M${bx-11} ${by} Q${bx-16} ${(by+y)/2} ${x} ${y} Q${bx+12} ${(by+y)/2} ${bx+11} ${by}`);
 }
 function afterLayout(active,ambient){const panel=document.getElementById('dlgPanel');if(!enabled()){panel?.classList.remove('comic-balloon');document.body.classList.remove('comic-dialogue-enabled');return;}document.body.classList.add('comic-dialogue-enabled');
  if(active&&panel){decorate(active,panel);
   // Native H.speech owns pagination, measurement and collision-aware placement.
   // This pass only attaches the curved artwork to that authoritative anchor.
   if(connected())panel.style.visibility=active.actor&&!present(active.actor)?'hidden':'visible';
   const r=panel.getBoundingClientRect();tail(panel,active.comicAnchor||null,{x:r.x,y:r.y});
  }
  const small=document.getElementById('hcAmbientSpeech');if(ambient&&small){if(connected()&&small.parentNode!==context.host)context.host.appendChild(small);small.classList.add('comic-reaction');style(small,ambient.actor.ref.comicMood||'thought');small.style.visibility=ambient.actor.kind==='connected'&&!present(ambient.actor)?'hidden':'visible';const p=ambient.actor.kind==='connected'?screen(point(ambient.actor)):null;const r=small.getBoundingClientRect();tail(small,p,{x:r.x,y:r.y});}
 }
 function dismiss(){document.querySelectorAll('.comic-dismiss').forEach(n=>n.remove());const panel=document.getElementById('dlgPanel');if(panel?.classList.contains('comic-balloon')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const ghost=document.createElement('div'),r=panel.getBoundingClientRect();ghost.className='comic-dismiss';ghost.style.cssText=`left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px`;ghost.appendChild(balloon(panel).svg.cloneNode(true));(connected()?context.host:document.body).appendChild(ghost);ghost.addEventListener('animationend',()=>ghost.remove(),{once:true});}
  meta=null;decorated=null;cameraKey='';if(panel)panel.style.visibility='';}
 function converse(sp,actors){if(!connected())return false;if(modalActive()){advance();return true;}if(context.driving)return false;const a=sp?.ambientActor||actors?.find(a=>a.id===sp?.id);if(!a||!sp.text)return false;meta={actors:[a],style:'normal'};window.HARBOR.comicDialogue.lines([[a.name,sp.text]]);return true;}
 function advance(){const h=window.HARBOR;if(!h?.speech.current())return;if(!h.speech.advancePage()){const n=document.getElementById('dlgNext')||document.getElementById('dlgContinue');n?.click();}}
 function comedyActors(){return[window.ROOKIE_CHICKEN?.actor()||mascots[0],window.ROOKIE_BANANA?.actor()||mascots[1]];}
 function comedy(){if(!connected()||modalActive()||context.driving||stage==='civilian')return false;meta={actors:comedyActors(),styles:{Chicken:'angry',Banana:'normal'},stylesByText:{'OFFICER! ARREST THIS FRUIT!':'excited'}};window.HARBOR.comicDialogue.lines([['Chicken','I DEMAND RESPECT!'],['Banana',"You're dressed like lunch."],['Chicken','OFFICER! ARREST THIS FRUIT!']],()=>{meta=null;});return true;}
 function reaction(a,text,mood='thought'){if(!connected()||modalActive()||context.driving||!context.visible(a))return false;a.comicMood=mood;return window.HARBOR.speech.say({ref:a,kind:'connected'},text,3,true);}
 function frame(ctx,t){context=ctx;if(!enabled()||t-lastFrame<30)return;lastFrame=t;const h=window.HARBOR;h?.speech?.layout();afterLayout(h?.speech?.current(),h?.speech?.ambient());
  if(stage==='civilian'||stage==='comedy'||modalActive()||context.driving||window.ROOKIE_V116_HUD?.blocked()||t-lastAmbient<14000||h?.speech?.ambient())return;
  const a=ctx.actors.find(a=>!window.ROOKIE_CIVILIANS?.protectedActor(a)&&ctx.visible(a)&&Math.hypot(a.x-ctx.player.x,a.y-ctx.player.y)<220&&t-(cooldowns.get(a)||-1e6)>60000);
  if(!a)return;const role=window.ROOKIE_CIVILIANS?.roleFor(a)||a.name.toLowerCase(),options=/fish|angler/.test(role)?['🐟','thought']:/music/.test(role)?['♫ ♪','laughter']:/tourist|visitor/.test(role)?['!','surprise']:ambientSerial%3===0?['?','confusion']:ambientSerial%3===1?['Zzz…','thought']:['Ha!','laughter'];
  if(reaction(a,...options)){lastAmbient=t;cooldowns.set(a,t);ambientSerial++;}
 }
 function drawProps(g){if(!enabled()||stage==='civilian')return;const living=window.HARBOR?.livingCity;for(const a of mascots){if(a.asset==='chicken'&&window.ROOKIE_CHICKEN?.actor())continue;if(a.asset==='bananas'&&window.ROOKIE_BANANA?.actor())continue;const im=living?.art?.[a.asset];if(im?.complete&&im.naturalWidth){g.drawImage(im,a.x-im.naturalWidth,a.y-im.naturalHeight*2,im.naturalWidth*2,im.naturalHeight*2);}}}
 function close(){window.HARBOR?.comicDialogue?.close();const panel=document.getElementById('dlgPanel');if(originalHome&&panel){originalHome.parent.insertBefore(panel,originalHome.next?.isConnected?originalHome.next:null);originalHome=null;}const small=document.getElementById('hcAmbientSpeech');if(small){small.style.display='none';document.body.appendChild(small);}context=null;meta=null;}
 window.ROOKIE_COMIC=Object.freeze({enabled,modalActive,settings,viewport,screen,resolve,present,point,decorate,afterLayout,dismiss,converse,advance,comedy,reaction,frame,drawProps,close,
  blocks:a=>connected()?obstacles(a?.ref||context.player):null,
  cameraChanged:()=>{if(!connected())return false;const v=context.view,key=[v.x,v.y,v.w,v.h].join(',');if(key===cameraKey)return false;cameraKey=key;return true;},
  ambientAllowed:()=>connected()&&!context.driving&&!window.ROOKIE_V116_HUD?.blocked(),
  font:()=>enabled()?'700 18px "Trebuchet MS", sans-serif':null,inset:()=>enabled()?68:32,
  preview:(type,actor)=>{if(!query.has('pilotQA')||!enabled())return false;meta={actors:actor?[actor]:[],style:type};window.HARBOR.comicDialogue.lines([[actor?.name||'Presentation test','A little personality goes a long way!']]);return true;},
  nearComedy:(x,y)=>enabled()&&stage!=='civilian'&&comedyActors().some(a=>Math.hypot(x-a.x,y-a.y)<80),
  qa:()=>query.has('pilotQA')?{stage,connected:connected(),active:modalActive(),mascots:comedyActors().map(a=>({id:a.id,name:a.name,x:a.x,y:a.y,head:a.head})),styles:Object.keys(shapes),ambientSerial}:null});
})();

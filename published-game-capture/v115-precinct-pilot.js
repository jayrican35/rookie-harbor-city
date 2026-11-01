/* ROOKIE V115 — Precinct 9 visual-quality pilot.
 * Authored tilemap + real approved sprite assets; rendering only.
 * Never writes MAPS/state, collision, movement, saves or Zombie Outbreak.
 */
(function () {
 'use strict';
 const VERSION='115-precinct-sprite-pilot-1';
 const base='./assets/v115-precinct-pilot/';
 const state={enabled:true,loaded:false,failed:null,manifest:null,atlas:null,
   images:Object.create(null),tileCache:null,draws:0,frames:0,loadStart:0,loadEnd:0};
 const ready=()=>state.loaded&&state.tileCache;
 const bounds=(r,v,pad=0)=>!v||r.x<v.x+v.w+pad&&r.x+r.width>v.x-pad&&r.y<v.y+v.h+pad&&r.y+r.height>v.y-pad;
 const imageLoad=(url)=>new Promise((resolve,reject)=>{
   const img=new Image();img.decoding='async';
   img.onload=()=>img.naturalWidth&&img.naturalHeight?resolve(img):reject(new Error('Zero-sized sprite'));
   img.onerror=()=>reject(new Error('Cannot load '+url));img.src=url;
 });
 function schema(m){
   if(!m||m.worldId!=='harbor-main'||m.visualOnly!==true||m.navmeshChanges!==false)
     throw new Error('The precinct pilot refuses an unsafe map schema');
   const r=m.region,t=m.tileSize;
   if(t!==32||r.width%t||r.height%t||r.width>1024||r.height>768)
     throw new Error('Invalid fixed tilemap dimensions');
   const width=r.width/t,height=r.height/t;
   for(const layer of m.layers.filter(x=>x.type==='tile')){
     if(layer.tiles.length!==height||layer.tiles.some(row=>row.length!==width))
       throw new Error('Tile rows do not match authored region');
     if(layer.tiles.some(row=>row.some(id=>!Number.isInteger(id)||id<-1||id>=m.atlas.columns*m.atlas.rows)))
       throw new Error('Out-of-range tile sprite');
   }
   return m;
 }
 function makeCache(){
   const m=state.manifest;const r=m.region,cache=document.createElement('canvas');
   cache.width=r.width;cache.height=r.height;
   const ctx=cache.getContext('2d');ctx.imageSmoothingEnabled=false;
   for(const layer of m.layers.filter(x=>x.type==='tile').sort((a,b)=>a.drawOrder-b.drawOrder)){
     for(let y=0;y<layer.tiles.length;y++)for(let x=0;x<layer.tiles[y].length;x++){
       const id=layer.tiles[y][x];if(id<0)continue;
       ctx.drawImage(state.atlas,(id%m.atlas.columns)*m.tileSize,Math.floor(id/m.atlas.columns)*m.tileSize,
        m.tileSize,m.tileSize,x*m.tileSize,y*m.tileSize,m.tileSize,m.tileSize);
     }
   }
   state.tileCache=cache;
 }
 async function load(){
   state.loadStart=Date.now();
   try{
     const response=await fetch(base+'precinct-pilot.json',{cache:'force-cache'});
     if(!response.ok)throw new Error('Missing precinct visual manifest '+response.status);
     state.manifest=schema(await response.json());
     state.atlas=await imageLoad(state.manifest.atlas.path);
     // Existing sprite art is authoritative. Missing optional props fail independently.
     const entries=Object.entries(state.manifest.assets);
     await Promise.all(entries.map(async ([name,url])=>{
       try{state.images[name]=await imageLoad(url);}catch(e){state.images[name]=null;}
     }));
     makeCache();state.loaded=true;state.loadEnd=Date.now();
   }catch(e){state.failed=String(e.message||e);state.loaded=false;}
   return state.loaded;
 }
 const promise=load();
 function ground(g,opt){
   if(!state.enabled||!ready()||!bounds(state.manifest.region,opt.view,24))return;
   const r=state.manifest.region;
   g.save();g.imageSmoothingEnabled=false;
   g.drawImage(state.tileCache,r.x,r.y,r.width,r.height);
   g.restore();state.draws++;
 }
 function props(g,opt,t){
   if(!state.enabled||!ready()||!bounds(state.manifest.region,opt.view,70)||opt.zoom<.18)return;
   const sprites=state.manifest.layers.find(layer=>layer.id==='furniture').sprites;
   // Back-to-front sorting by authored world foot position, stable across frames.
   for(const prop of sprites.slice().sort((a,b)=>a.baseline-b.baseline)){
     if(opt.view&&!bounds({x:prop.x,y:prop.y,width:prop.w,height:prop.h},opt.view,20))continue;
     const img=state.images[prop.asset];if(!img)continue;
     g.save();g.imageSmoothingEnabled=false;g.drawImage(img,prop.x,prop.y,prop.w,prop.h);g.restore();
   }
   state.frames++;
 }
 function animated(g,opt,t){
   if(!state.enabled||!ready()||opt.zoom<.35||!bounds(state.manifest.region,opt.view,32))return;
   const anim=state.manifest.animations.lampGlow;
   const frame=anim.frames[Math.floor(t/1000*anim.fps)%anim.frames.length];
   const sprites=state.manifest.layers.find(l=>l.id==='furniture').sprites;
   for(const s of sprites){
     if(s.animation!=='lampGlow'||!state.images[s.asset])continue;
     if(opt.view&&!bounds({x:s.x,y:s.y,width:s.w,height:s.h},opt.view,16))continue;
     // The lamp itself is an approved art sprite; this animation is a tiny accent.
     const x=s.x+s.w*.5,y=s.y+13;
     const rad=g.createRadialGradient(x,y,1,x,y,40);
     rad.addColorStop(0,'rgba(255,222,145,'+frame+')');
     rad.addColorStop(1,'rgba(255,222,145,0)');
     g.save();g.fillStyle=rad;g.fillRect(x-40,y-40,80,80);g.restore();
   }
 }
 const api=Object.freeze({version:VERSION,ready:()=>ready(),loadPromise:promise,
   setEnabled:value=>{state.enabled=!!value;return state.enabled;},
   enabled:()=>state.enabled,ground,props,animated,
   inspect:()=>({version:VERSION,ready:ready(),enabled:state.enabled,
     region:state.manifest&&{...state.manifest.region},
     sourceAssetCount:state.manifest?Object.keys(state.manifest.assets).length:0,
     loadedSpriteCount:Object.values(state.images).filter(Boolean).length,
     tileCacheSize:state.tileCache?state.tileCache.width*state.tileCache.height*4:0,
     loadingMs:state.loadEnd?state.loadEnd-state.loadStart:null,
     groundDraws:state.draws,propFrames:state.frames,
     collisionModified:false,savesModified:false,zombieModified:false,error:state.failed})});
 window.ROOKIE_V115_PRECINCT_PILOT=api;
})();
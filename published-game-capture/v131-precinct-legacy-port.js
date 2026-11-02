/* ROOKIE: Harbor City — original precinct art restoration in 1:1 connected world.
 * Source: original classic MAPS.station, B2 pixel sprites, H.precinctCraft,
 * H.precinctCinematic, H.receptionRoom, and __GARAGE's existing art.
 * Only paints offscreen station room texture. NO new geometry, physics, assets,
 * tick loop, saves, maps, world snapshots, Academy, or Zombie Outbreak changes.
 */
(function(){
'use strict';
const H=window.HARBOR||{};
const ready=im=>!!(im&&im.complete&&im.naturalWidth>0);
const count={floors:0,litFloors:0,garage:0,furniture:0,wall:0,failures:0};
const resolve=()=>({
 batch:window.B2||{},
 craft:H.precinctCraft||null,
 cinema:H.precinctCinematic||null,
 reception:H.receptionRoom||null,
 garage:window.__GARAGE||null
});
const material=r=>{
 const n=r.label;
 if(n==='GARAGE')return 'garage';
 if(['LOBBY','RECORDS','INTAKE'].includes(n))return 'cream';
 if(['OPERATIONS','SGT. BROOKS — OFFICE'].includes(n))return 'wood';
 if(['INTERVIEW','BRIEFING'].includes(n))return 'carpet';
 return 'cool';
};
function signature(){
 const a=resolve(),p=[];
 const set=a.craft?.art||{};
 for(const k of ['cream','cool','wood','carpet','wall','visitorTable','interview','crate'])p.push(ready(set[k])?1:0);
 for(const k of ['board','terminal','counter','evidence','cabinet','interview','bench','lockers','chair','desk','wall','wallH','bars','door'])p.push(ready(a.batch[k])?1:0);
 for(const k of ['plate','patrol'])p.push(ready(a.garage?.img?.[k])?1:0);
 p.push(ready(a.reception?.art)?1:0,ready(a.reception?.plant)?1:0);
 for(const k of ['sconce','clock','workbench','counterCrest'])p.push(ready(a.cinema?.art?.[k])?1:0);
 return p.join('');
}
const mark=(g,r,color)=>{g.fillStyle=color;g.fillRect(r.x,r.y,r.w,r.h);};
function drawGarage(g,a){
 const im=a.garage?.img?.plate;
 if(!ready(im))return false;
 // Original, user-authored garage source plate already includes floor
 // tile and equipment. Reuse only OPEN center-floor pixels from the
 // classic 2026-10-14 garage extraction: no baked walls at room entrances.
 g.save();g.imageSmoothingEnabled=false;g.beginPath();g.rect(1156,648,768,512);g.clip();
 for(let y=648;y<1160;y+=64)for(let x=1156;x<1924;x+=64)
   g.drawImage(im,510,510,128,128,x,y,64,64);
 // Original tool-cabinet / utility shelf exactly from legacy plate.
 g.drawImage(im,696,76,146,108,1690,656,124,70);
 // Real pre-existing parking slots. They are paint only, not phantom cars.
 g.strokeStyle='#d6cdb7';g.lineWidth=4;
 for(const x of [1331,1571]){
   g.beginPath();g.moveTo(x,885);g.lineTo(x,755);
   g.lineTo(x+180,755);g.lineTo(x+180,885);g.stroke();
   mark(g,{x:x+30,y:758,w:120,h:9},'#b7b3a7');
 }
 g.fillStyle='#d6cdb7';g.font='600 12px sans-serif';g.textAlign='center';
 g.fillText('UNIT 9',1421,909);g.fillText('SERVICE BAY',1661,909);
 g.restore();
 count.garage++;return true;
}
function floor(g,r){
 const a=resolve();if(r.label==='GARAGE')return drawGarage(g,a);
 const key=material(r),im=a.craft?.art?.[key];
 if(!ready(im))return false;
 g.save();g.imageSmoothingEnabled=false;
 // Use original 64px user-authored material and cached cinematic
 // light/occlusion pass directly; no substitute random pattern.
 const painter=a.cinema?.floor;
 if(typeof painter==='function'){
   try{painter(r,g);count.litFloors++;}catch(e){
     count.failures++;
     // Preserve the source-authored material even if optional cinematic
     // internals differ in a particular recovered legacy version.
     a.craft.floor(r,g);
   }
 }else a.craft.floor(r,g);
 g.restore();count.floors++;return true;
}
function sourceArt(a,im,cx,base,w,h){
 if(!ready(im))return false;
 a.g.drawImage(im,Math.round(cx-w/2),Math.round(base-h),Math.round(w),Math.round(h));
 return true;
}
function furniture(g,f){
 const a=resolve(),b=a.batch,craft=a.craft?.art||{},c=a.cinema?.art||{};
 const cx=f.x+f.w/2,base=f.y+f.h+2,x=f.x,y=f.y;
 let im=null,w=0,h=0,targetBase=base;
 switch(f.type){
  case 'hcReceptionWing':return true; // drawn as part of original source desk
  case 'hcReception':{
    const image=a.reception?.art;
    if(!ready(image))return false;
    g.save();g.imageSmoothingEnabled=false;
    g.drawImage(image,90,150,1601,591,516,704,202,75);
    if(ready(c.counterCrest))g.drawImage(c.counterCrest,620,757);
    g.restore();count.furniture++;return true;
  }
  case 'hcLobbyPlant':{
    im=a.reception?.plant;
    if(!ready(im))return false;
    g.drawImage(im,91,82,842,1351,x-8,y-40,40,64);
    count.furniture++;return true;
  }
  case 'hcLobbyTable':{
    im=craft.visitorTable;
    if(!ready(im))return false;
    g.drawImage(im,x-2,y+f.h-38);
    count.furniture++;return true;
  }
  case 'hcWaitingPair':
    im=b.bench;w=84;h=62;targetBase=y+f.h+2;break;
  case 'hcChangingBench':
    im=b.bench;w=f.w;h=Math.round(f.w*40/72);break;
  case 'reception':im=b.counter;w=Math.max(f.w+24,180);h=Math.min(w*.5,base-16);break;
  case 'counter':im=b.counter;w=Math.max(f.w,120);h=Math.min(w*.5,120,base-16);break;
  case 'desk':{
    const terminal=f.x===430&&f.y===56||f.x===600&&f.y===150||f.x===880&&f.y===380;
    im=terminal&&ready(b.terminal)?b.terminal:b.desk;
    w=terminal&&ready(b.terminal)?86:Math.min(Math.max(f.w,96),150);
    h=terminal&&ready(b.terminal)?86:w*.75;break;
  }
  case 'table':{
    if(f.x===880&&f.y===110&&ready(craft.interview)){
      im=craft.interview;w=150;h=112;
    }else if(f.x===60&&f.y===170&&ready(c.workbench)){
      im=c.workbench;w=104;h=72;
    }else if(f.w>=120){im=b.interview;w=150;h=120;}
    break;
  }
  case 'shelf':
    if(y<300){im=b.evidence;w=f.w+8;h=Math.min(w,base-2);}
    break;
  case 'cabinet':im=b.cabinet;w=54;h=108;break;
  case 'locker':
    im=b.lockers;w=Math.min(Math.max(f.w,130),Math.max(60,(base-14)*1.5));h=w*2/3;break;
  case 'bench':im=b.bench;w=Math.max(f.w,110);h=Math.min(w*40/72,base-14);break;
  case 'board':im=b.board;w=84;h=84;targetBase=y+62;break;
  case 'crate':im=craft.crate;w=56;h=44;break;
  case 'hcReceptionSign':
    g.fillStyle='#19364d';g.fillRect(x,y,f.w,f.h);
    g.fillStyle='#f1e7c5';g.font='bold 8px sans-serif';g.textAlign='center';
    g.fillText('PRECINCT 9 · RECEPTION',x+f.w/2,y+12);
    count.furniture++;return true;
  default:return false;
 }
 if(!ready(im))return false;
 g.save();g.imageSmoothingEnabled=false;
 if(f.solid){
   g.fillStyle='rgba(10,16,26,.12)';
   g.fillRect(f.x+3,f.y+f.h-2,f.w,5);
 }
 if(!sourceArt({g},im,cx,targetBase,w,h)){g.restore();return false;}
 if(f.type==='desk'&&ready(b.chair)&&f.y<850&&f.x<1400)
   g.drawImage(b.chair,Math.round(cx-15),Math.round(base+1),30,40);
 g.restore();count.furniture++;return true;
}
function wall(g,w){
 // Existing collision/wall segments are authoritative. Use real
 // 96x48 wall skin only on these exact spans, NEVER a solid rect bridging
 // the legacy horizontal 52/72/96px door apertures.
 const a=resolve(),p=a.craft;
 if(!p||!ready(p.art?.wall)||w.y<=0||w.x<=0)return false;
 if(w.h>32||w.w<=w.h)return false;
 const val=p.wall(w);
 if(!val)return false;
 g.save();g.imageSmoothingEnabled=false;
 g.drawImage(val.c,val.x,val.y);
 g.restore();count.wall++;return true;
}
function details(g,rooms){
 const art=resolve().cinema?.art||{};
 if(ready(art.clock))g.drawImage(art.clock,698,695);
 if(ready(art.sconce))for(const r of rooms){
  if(r.label==='GARAGE')continue;
  for(const x of [r.x+34,r.x+r.w-36])g.drawImage(art.sconce,x-9,r.y+r.h-14);
 }
}
function indicators(){return{...count,signature:signature(),source:'Original B2/precinct-craft/cinematic/reception/garage',gameplayStateTouched:false};}
window.ROOKIE_V131_PRECINCT_IMPORT=Object.freeze({
 version:'v131-recovered-classic-precinct-art',floor,furniture,wall,details,signature,
 metrics:indicators
});
})();

/* ROOKIE: Harbor City — V132 protected Precinct 9 roof + named legacy cast.
 * Reuses ORIGINAL precinct-exterior-v1/roof.png and precinct-cast/*.webp
 * through the existing HARBOR legacy specifications. Strictly visual:
 * no maps, geometry, NPC routes, interaction state, driving or game loops.
 * Used only in the separately built precinct-v132 review.
 */
(function(){
'use strict';
const H=window.HARBOR;
if(!H||window.ROOKIE_V132_PRECINCT)return;
const stats={roofFrames:0,roofBuilds:0,castFrames:0,castNames:Object.create(null),fallbacks:0};
const imageReady=im=>!!(im&&im.complete&&im.naturalWidth>0);
const sourceRoof=()=>H.precinctExterior?.art?.roof;
const legacySpecs=()=>H.cast?.spec||{};
const officerImages=Object.create(null);
let staticRoof=null,staticSourceReady=false;

function rect(g,x,y,w,h,color){
  g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function rim(g,x,y,w,h){
  rect(g,x+9,y+14,w,h,'rgba(5,18,25,.30)');
  rect(g,x,y,w,h,'#213d51');
  rect(g,x+5,y+5,w-10,h-11,'#577489');
  rect(g,x+8,y+8,w-16,h-17,'#263f53');
  rect(g,x+10,y+10,w-20,3,'#90a6ac');
  rect(g,x+10,y+h-13,w-20,4,'#0d293a');
  rect(g,x+10,y+13,4,h-26,'#6b8894');
  rect(g,x+w-14,y+13,4,h-26,'#142d3e');
}
function panel(g,x,y,w,h){
  rect(g,x+7,y+9,w,h,'rgba(9,24,34,.30)');
  rect(g,x,y,w,h,'#526b79');
  rect(g,x+4,y+4,w-8,h-8,'#2b485c');
  rect(g,x+5,y+5,w-10,3,'#8fa6ac');
  rect(g,x+5,y+h-10,w-10,4,'#1b3144');
  for(let yy=y+18;yy<y+h-13;yy+=22){
    rect(g,x+13,yy,w-26,2,'#78909c');
    rect(g,x+13,yy+3,w-26,2,'#203c50');
  }
  for(let xx=x+23;xx<x+w-15;xx+=59){
    rect(g,xx,y+10,3,3,'#bac2b4');
    rect(g,xx,y+h-12,3,3,'#122a3a');
  }
}
function unit(g,x,y,w,h){
  // Actual rooftop equipment scale, ducting, bolts and cast shadows;
  // no synthetic building or collision rectangle is added to the world.
  rect(g,x+14,y+16,w,h,'rgba(7,22,29,.34)');
  rect(g,x,y,w,h,'#172e3d');
  rect(g,x+5,y+4,w-10,h-10,'#718591');
  rect(g,x+9,y+9,w-18,h-18,'#324c5c');
  for(let i=0;i<4;i++){
    rect(g,x+16,y+16+i*(h-38)/4,w-32,4,'#91a8a9');
    rect(g,x+16,y+21+i*(h-38)/4,w-32,3,'#203a4a');
  }
  for(const px of [x+5,x+w-9])for(const py of [y+5,y+h-9])rect(g,px,py,4,4,'#c6c4a9');
}
function vent(g,x,y,w=54){
  rect(g,x+6,y+9,w,24,'rgba(8,22,34,.27)');
  rect(g,x,y,w,23,'#9aada8');rect(g,x+3,y+3,w-6,17,'#324958');
  for(let v=0;v<4;v++)rect(g,x+9+v*(w-17)/4,y+5,4,13,'#92a5a7');
  rect(g,x+4,y+3,w-8,2,'#bdc6b7');
}
function stripe(g,x,y,w,h,step=64){
  rect(g,x,y,w,1,'rgba(149,175,183,.36)');
  for(let yy=y+step;yy<y+h;yy+=step)
    rect(g,x+6,yy,w-12,2,'rgba(13,30,45,.31)');
}
function roofing(g,x,y,w,h,pattern){
  rect(g,x+10,y+15,w,h,'rgba(4,20,30,.38)');
  rect(g,x,y,w,h,'#20394e');
  if(pattern){
    g.save();g.globalAlpha=.56;g.fillStyle=pattern;
    g.fillRect(x+10,y+10,w-20,h-20);g.restore();
  }
  // Large separate roof bays instead of one full-screen smooth blue slab.
  rect(g,x+12,y+12,w-24,9,'#4e687c');
  rect(g,x+12,y+21,w-24,3,'#0f2939');
  rect(g,x+12,y+h-25,w-24,9,'#38586c');
  rect(g,x+12,y+h-16,w-24,3,'#102b3e');
  rect(g,x+12,y+24,8,h-48,'#47697b');
  rect(g,x+w-20,y+24,8,h-48,'#122e42');
  stripe(g,x+24,y+35,w-48,h-70,76);
  // Authentic parapet edge / directional sunlight, only on existing roof.
  rect(g,x,y,w,9,'#9a9f97');
  rect(g,x,y+9,w,6,'#546e81');
  rect(g,x,y+15,w,3,'#122d42');
  rect(g,x,y,9,h,'#8498a0');
  rect(g,x+9,y,5,h,'#29475a');
  rect(g,x+w-13,y,13,h,'#152f43');
  rect(g,x+w-12,y+9,3,h-18,'#42647a');
  rect(g,x,y+h-12,w,12,'#1a3247');
  rect(g,x+11,y+h-12,w-22,4,'#658194');
  rect(g,x+11,y+h-7,w-22,3,'#b7b399');
}
function drawRoofTexture(){
 const src=sourceRoof(),isReady=imageReady(src);
 if(staticRoof&&staticSourceReady===isReady)return staticRoof;
 const c=document.createElement('canvas');
 c.width=1936;c.height=1168;
 const g=c.getContext('2d');if(!g)return null;
 g.imageSmoothingEnabled=false;
 const tex=isReady?g.createPattern(src,'repeat'):null;
 // True footprint: original west station shell + east/south garage annex.
 // Keep the 10-unit gap and all physical door passages untouched.
 roofing(g,8,8,1140,1023,tex);
 roofing(g,1158,652,754,504,tex);
 // Source-based roof surface is articulated in restrained bay geometry.
 panel(g,56,49,480,177);
 panel(g,602,49,492,177);
 panel(g,58,278,352,185);
 panel(g,454,278,618,185);
 panel(g,58,645,492,208);
 panel(g,614,645,452,208);
 // Skylight glazing: painted into the roof only, not a walkable opening.
 for(const a of [[128,94,320,63],[704,92,288,72],[690,339,248,61]]){
   rect(g,a[0]+9,a[1]+10,a[2],a[3],'rgba(9,28,38,.4)');
   rect(g,...a,'#81939a');
   rect(g,a[0]+7,a[1]+7,a[2]-14,a[3]-14,'#263e4e');
   rect(g,a[0]+13,a[1]+11,a[2]-26,12,'#547989');
   rect(g,a[0]+13,a[1]+27,a[2]-26,4,'#9db2b1');
   for(let x=a[0]+69;x<a[0]+a[2]-11;x+=76)rect(g,x,a[1]+7,6,a[3]-14,'#8b9c9c');
 }
 // Existing ventilation equipment receives physical shadows and grading.
 unit(g,80,495,154,109);unit(g,305,497,130,108);
 unit(g,831,495,164,109);unit(g,100,889,168,95);
 unit(g,820,883,155,90);
 for(const [x,y] of [[518,86],[524,342],[1008,294],[547,720],[1000,895],[745,916]])vent(g,x,y);
 // Restrained roof-level utility runs and cable supports, aligned to bays.
 rect(g,483,497,12,149,'#82949a');rect(g,495,497,4,149,'#1a3446');
 rect(g,485,638,335,11,'#577485');rect(g,485,638,335,3,'#adada0');
 rect(g,245,956,545,7,'#8d9f9f');rect(g,245,963,545,4,'#1b3546');
 for(let x=266;x<790;x+=110)rect(g,x,950,8,20,'#253f51');
 // Integral civic identity replaces the illegible billboard-floating effect.
 rect(g,338,481,450,111,'#162f43');
 rect(g,347,488,432,5,'#a9aa96');
 rect(g,347,580,432,4,'#6e8190');
 g.fillStyle='#ebd6a0';g.textAlign='center';
 g.font='bold 63px Barlow Condensed, sans-serif';g.fillText('PRECINCT 9',563,555);
 g.font='bold 23px Barlow Condensed, sans-serif';g.fillText('HARBOR CITY POLICE',563,577);
 // Garage: service-bay roof, hatch, equipment, painted wayfinding.
 panel(g,1190,688,336,220);
 panel(g,1549,688,326,220);
 panel(g,1201,947,662,160);
 unit(g,1240,721,151,97);unit(g,1666,725,152,104);
 for(const [x,y] of [[1440,721],[1590,845],[1250,1035],[1733,1034]])vent(g,x,y,62);
 rect(g,1350,923,365,83,'#192f42');rect(g,1358,930,349,4,'#9fa596');
 g.textAlign='center';g.fillStyle='#e8d39b';
 g.font='bold 48px Barlow Condensed, sans-serif';g.fillText('GARAGE',1537,986);
 g.font='bold 17px Barlow Condensed, sans-serif';g.fillText('FLEET • SERVICE • PATROL',1537,1008);
 // Existing front/garage physical doorway lines remain supplied by V115.
 staticRoof=c;staticSourceReady=isReady;stats.roofBuilds++;
 return c;
}
function roof(g,opts){
 if(!opts||!Number.isFinite(opts.alpha))return false;
 const art=drawRoofTexture();if(!art)return false;
 const x=opts.x,y=opts.y,alpha=Math.max(0,Math.min(.95,opts.alpha));
 if(alpha>.02){
   g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;
   g.drawImage(art,x,y);g.restore();
 }
 stats.roofFrames++;
 return true;
}
function npc(g,actor){
 // Only the original physical precinct cast, NOT pedestrians, city NPCs,
 // the player's Jay sprite or Marina/Zombie/Academy actors.
 const id=String(actor?.id||'');
 if(!id.startsWith('station-npc:')&&id!=='campus-npc:diaz')return false;
 const key=H.cast?.identity?.(actor.name,false);
 const spec=key&&legacySpecs()[key];
 if(!spec||!Array.isArray(spec.frames)||spec.frames.length<12)return false;
 let im=officerImages[key];
 if(!im){
   im=new Image();im.decoding='async';
   im.src='./assets/precinct-cast/'+spec.file;
   officerImages[key]=im;
 }
 if(!imageReady(im)){stats.fallbacks++;return false;}
 const dir=actor.dir==='up'?1:actor.dir==='left'?2:actor.dir==='right'?3:0;
 const frame=spec.frames[dir*3];
 if(!frame||!Array.isArray(frame.rect))return false;
 const [sx,sy,sw,sh]=frame.rect,scale=(spec.heightInWorld||66)/spec.frames[0].rect[3];
 const w=sw*scale,h=sh*scale;
 g.save();g.imageSmoothingEnabled=false;
 g.fillStyle='rgba(6,15,24,.29)';g.beginPath();
 g.ellipse(actor.x,actor.y+2,14,5,0,0,Math.PI*2);g.fill();
 g.drawImage(im,sx,sy,sw,sh,Math.round(actor.x-w/2),Math.round(actor.y-h),Math.round(w),Math.round(h));
 if(actor.showLabel){
   g.font='bold 13px Barlow Condensed, sans-serif';g.textAlign='center';
   g.fillStyle='#f8ebc4';g.fillText(actor.name,actor.x,actor.y-h-7);
 }
 g.restore();
 stats.castFrames++;stats.castNames[key]=(stats.castNames[key]||0)+1;
 return true;
}
window.ROOKIE_V132_PRECINCT=Object.freeze({
 version:'v132-heritage-exterior-and-named-officers-1',
 worldId:'harbor-main',
 roof,npc,
 stats:()=>({...stats,castNames:{...stats.castNames},
  legacyRoofReady:imageReady(sourceRoof()),
  officerSpritesReady:Object.fromEntries(Object.entries(officerImages).map(([k,im])=>[k,imageReady(im)]))}),
 scope:'Only original Precinct 9 roof painter and original named station NPC sprite art. No geometry, state, AI, missions, modes or world changes.'
});
})();
/* ROOKIE: HARBOR CITY — V133 Precinct 9 architecture and civic grounds.
 * Existing 1936x1168 station, two real entrances, camera, movement, collisions,
 * all game modes and Marina remain authoritative. No new image assets, save
 * state, roads, interiors, render loop or interaction layer. Review build only.
 */
(function(){
'use strict';
if(!window.HARBOR||window.ROOKIE_V133_PRECINCT)return;
const roof={x:380,y:96,w:1936,h:1168},front={x:948,y:1124};
const garage={x:1918,y:1256},lot={x:1328,y:1268,w:580,h:412};
const road={x:149,y:1721,w:1920,h:127};
const south={x:304,y:1852,w:2290,h:820};
const m={ground:0,facade:0,actors:0,groundBuilds:0,styleVersion:'v133-precinct-campus-art-1'};
const ink=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const seen=(v,b)=>!v||b.x<v.x+v.w+30&&b.x+b.w>v.x-30&&b.y<v.y+v.h+30&&b.y+b.h>v.y-30;
const hash=(a,b)=>((a*73856093)^(b*19349663))>>>0;
let cachedGround=null,cacheReady=false;
// All Phase-5 tiles are drawn INTO this same original cached V133 ground
// composition via the already-loaded V135 asset/manifest pipeline.
const groundKit=()=>window.ROOKIE_V139_GROUND_ACTIVE?window.ROOKIE_V135_WALL_KIT:null;
const fillT=(g,id,x,y,w,h)=>!!groundKit()?.fillGround?.(g,id,x,y,w,h);
const drawT=(g,id,x,y,w,h)=>!!groundKit()?.drawGroundSprite?.(g,id,x,y,w,h);
const terrainReady=()=>!!groundKit()?.stats?.().groundAtlas;
const texture=()=>window.HARBOR?.precinctExterior?.art?.stone;
const ready=im=>!!(im&&im.complete&&im.naturalWidth);
function pavers(g,x,y,w,h,tile=24){
  if(terrainReady()&&fillT(g,'paver_stone',x,y,w,h)){
    // Preserve existing authored path widths and their readable stone edges.
    ink(g,x,y,w,3,'rgba(251,230,206,.87)');
    ink(g,x,y+h-5,w,5,'rgba(110,108,114,.74)');
    return;
  }
  const src=texture();
  ink(g,x+4,y+8,w,h,'rgba(8,27,38,.19)');
  ink(g,x,y,w,h,'#b7ad94');
  if(ready(src)){
    g.save();g.globalAlpha=.24;g.fillStyle=g.createPattern(src,'repeat');
    g.fillRect(x+4,y+4,w-8,h-8);g.restore();
  }
  for(let yy=y+4;yy<y+h-4;yy+=tile){
    const row=Math.floor((yy-y)/tile),shift=(row%2)*tile*.5;
    ink(g,x+3,yy,w-6,2,'rgba(65,79,71,.27)');
    for(let xx=x+4+shift;xx<x+w-7;xx+=tile){
      ink(g,xx,yy+2,2,Math.min(tile-3,y+h-yy-6),'rgba(78,77,67,.20)');
      if((hash(xx,yy)%7)===0)ink(g,xx+5,yy+7,5,2,'rgba(242,226,179,.38)');
    }
  }
  ink(g,x,y,w,4,'#e6d8b6');
  ink(g,x,y+h-6,w,6,'#7e8580');
}
function curb(g,x,y,w,h){
  ink(g,x+3,y+4,w,h,'rgba(13,31,34,.24)');
  ink(g,x,y,w,h,'#aeb8b2');
  ink(g,x,y,w,3,'#e3dfc4');
  ink(g,x,y+h-4,w,4,'#647d7c');
  for(let xx=x+32;xx<x+w;xx+=96)ink(g,xx,y+3,2,h-6,'#8c9690');
}
function hedge(g,x,y,w,h){
  if(terrainReady()&&fillT(g,'hedge',x,y,w,Math.max(24,h))){
    return;
  }
  // Low landscape edging: it is decoration, not an invented hard collision.
  ink(g,x+3,y+7,w,h,'rgba(15,38,30,.22)');
  ink(g,x,y,w,h,'#3c6146');
  ink(g,x+2,y+2,w-4,4,'#83a460');
  for(let xx=x+7;xx<x+w-3;xx+=12){
    ink(g,xx,y+5,8,6,(hash(xx,y)%2)?'#477d4c':'#5d9151');
    ink(g,xx+3,y+2,3,2,'#adc67a');
  }
}
function light(g,x,y){
  if(terrainReady()&&drawT(g,'lamp',x-16,y-83,32,96))return;
  ink(g,x+5,y+5,15,7,'rgba(17,38,36,.25)');
  ink(g,x-3,y-4,6,8,'#233c46');
  ink(g,x-8,y-43,16,43,'#344b52');
  ink(g,x-7,y-43,3,39,'#92a4a0');
  ink(g,x-16,y-51,32,11,'#e5cf95');
  ink(g,x-12,y-48,24,3,'#fff0bb');
  ink(g,x-9,y-38,18,3,'#1c3948');
}
function crown(g,x,y,size){
  // Source sprite when decoded: original city trees; restrained source-free
  // pixel outline fallback. Trees sit on edge lawns, not middle of pathways.
  const im=window.ROOKIE_V127_CITY?.spriteImage?.('tree');
  if(ready(im)){
    g.save();g.imageSmoothingEnabled=false;
    g.drawImage(im,x-size*.68,y-size*.95,size*1.36,size*1.30);g.restore();
    return;
  }
  ink(g,x-5,y,10,size*.52,'#735941');
  const pieces=[[0,-.49,.57,.55],[-.38,-.25,.43,.38],[.17,-.33,.43,.45],
    [-.37,-.62,.40,.32],[.08,-.69,.43,.38]];
  for(const [dx,dy,w,h]of pieces){
    ink(g,x+size*dx,y+size*dy,size*w,size*h,'#284f3b');
    ink(g,x+size*dx+5,y+size*dy+4,size*w-11,size*h-9,'#437a4c');
  }
  ink(g,x-size*.23,y-size*.57,size*.23,6,'#86ad63');
}
function tree(g,x,y,r=82){
  ink(g,x-r*.47,y+4,r*.94,11,'rgba(13,35,30,.24)');
  ink(g,x-22,y-15,44,40,'#65543e');
  crown(g,x,y-34,r);
}
function sign(g,x,y,w,title,sub){
  ink(g,x+6,y+5,w,46,'rgba(15,30,38,.3)');
  ink(g,x,y,w,46,'#233b48');
  ink(g,x+4,y+4,w-8,3,'#b8a781');
  ink(g,x+6,y+9,w-12,27,'#344f5b');
  g.fillStyle='#f5dea6';g.textAlign='center';
  g.font='bold 22px Barlow Condensed, sans-serif';g.fillText(title,x+w/2,y+29,w-14);
  if(sub){g.font='bold 11px Barlow Condensed, sans-serif';g.fillText(sub,x+w/2,y+42,w-14);}
}
function line(g,x,y,w){
  ink(g,x,y,w,3,'rgba(243,229,193,.75)');
  ink(g,x+3,y+5,w-6,2,'rgba(21,43,52,.26)');
}
function lotArt(g){
  if(terrainReady()){
    // Exactly the ORIGINAL parking lot footprint/aisles. Lane markings are
    // repainted on the new asphalt material at the same earlier coordinates.
    fillT(g,'asphalt',lot.x,lot.y,lot.w,lot.h);
    for(const xx of [1368,1456,1544,1632,1720,1808]){
      ink(g,xx,1295,3,112,'rgba(246,233,210,.90)');
      ink(g,xx,1530,3,110,'rgba(246,233,210,.90)');
    }
    fillT(g,'parking_accessible',1355,1364,82,64);
    drawT(g,'parking_access_symbol',1370,1328,64,64);
    fillT(g,'curb_top',lot.x,lot.y-11,lot.w,25);
  }
  // V130's authentic original asphalt and stalls remain; this is a finish
  // layer, never an opaque replacement for a connected street or sidewalk.
  const b=lot;
  ink(g,b.x+11,b.y+13,b.w-23,3,'rgba(235,221,194,.30)');
  for(let i=0;i<28;i++){
    const x=b.x+25+(hash(i,7)%(b.w-50)),y=b.y+20+(hash(i,17)%(b.h-45));
    ink(g,x,y,10+(i%3)*5,2,'rgba(210,204,173,.08)');
  }
  // Wheel stops are intentionally within existing parking stalls.
  for(const yy of [1320,1614]){
    for(const x of [1372,1460,1548,1636,1724,1812]){
      ink(g,x+5,yy+3,52,9,'rgba(13,30,33,.28)');
      ink(g,x+5,yy,52,7,'#b5b4a3');
      ink(g,x+5,yy,52,2,'#e4d9b8');
      ink(g,x+7,yy+6,48,2,'#627476');
    }
  }
  // Accessible space and boarding aisle, positioned on existing asphalt.
  ink(g,1355,1375,82,3,'#a9d7d6');
  ink(g,1355,1403,82,3,'#a9d7d6');
  for(let x=1364;x<1428;x+=18){
    for(let j=0;j<9;j++)ink(g,x+j*2,1379+j*3,4,2,'rgba(118,188,194,.76)');
  }
  ink(g,1350,1265,102,6,'#e2c98f');
  g.fillStyle='#d8e5e0';g.font='bold 20px Barlow Condensed, sans-serif';g.textAlign='left';
  g.fillText('VISITORS',1485,1691);
  g.fillText('PATROL',1765,1691);
  // Sight line along staff lot and curb edge — keep north/south aisle open.
  curb(g,1329,1695,577,12);
  for(const [x,y]of [[1320,1327],[1902,1622]])light(g,x,y);
}
function northGround(g){
  // Historic centered public entry path. Do not place an opaque gate over
  // real 72px doorway x=912..984 at world y=1124.
  pavers(g,878,1139,139,528,34);
  ink(g,902,1135,92,5,'#d9d1b9');
  for(let y=1178;y<1634;y+=73){
    ink(g,885,y,12,19,'rgba(236,221,181,.64)');
    ink(g,1002,y,8,19,'rgba(28,60,63,.26)');
  }
  curb(g,865,1655,162,14);
  // Precinct plaza: modular paving, memorial/community zone, structural
  // planter beds. Real base scene's benches and NPCs remain on top.
  pavers(g,450,1300,365,359,30);
  pavers(g,450,1662,470,23,28);
  hedge(g,462,1360,88,17);
  hedge(g,475,1560,73,13);
  hedge(g,708,1410,92,13);
  sign(g,524,1305,217,'PRECINCT 9','COMMUNITY SERVICES');
  lotArt(g);
  // Garage-side service apron remains outside the actual garage door and
  // does not cover an existing world road.
  ink(g,1716,1300,440,3,'rgba(247,208,115,.65)');
  ink(g,1716,1307,440,2,'rgba(21,48,56,.46)');
  for(const x of [1730,1810,2143])ink(g,x,1313,6,42,'rgba(225,203,143,.39)');
}
function southGround(g){
  if(terrainReady()){
    // This existing precinct lawn is the ONLY area receiving new green
    // material. Paths/hedges below overwrite it inside the same cache.
    fillT(g,'grass',330,1905,2180,754);
  }
  const {x,y,w,h}=south;
  // Grass currently runs empty for hundreds of world units. This is a
  // composed civilian precinct park on the SAME uninterrupted walkable plane.
  // The original city grass is still the base, with no synthetic solids.
  curb(g,324,1855,2195,18);
  pavers(g,332,1875,2183,75,31);
  // Gap in planting aligns exactly with original Harbor Avenue crosswalk.
  for(const [xx,ww] of [[345,465],[1090,950],[2120,366]])
    hedge(g,xx,1955,ww,21);
  // Parallel promenade and centered pedestrian spine.
  pavers(g,884,1953,144,720,32);
  pavers(g,543,2130,880,84,28);
  pavers(g,585,2325,796,72,28);
  pavers(g,577,2206,46,130,23);
  pavers(g,1341,2206,45,120,23);
  // Secondary plaza/fitness lawn + formal green courts. Do not place
  // trees or plaza walls on its continuous walkable pedestrian routes.
  ink(g,635,2230,683,87,'rgba(224,212,184,.14)');
  line(g,668,2260,240);line(g,1050,2260,230);
  sign(g,707,2191,430,'HARBOR CITY CIVIC GREEN','PRECINCT 9 · COMMUNITY WALK');
  // Ground-level ornamental planting; decoration requires no new collisions.
  for(const [xx,yy,ww]of [[362,2033,230],[1185,2042,150],
    [1448,2051,300],[1856,2055,430],[362,2411,240],[1435,2440,620]]){
    hedge(g,xx,yy,ww,20);
    for(let px=xx+15;px<xx+ww-8;px+=37){
      ink(g,px,yy-4,7,6,'#a6b66e');
      ink(g,px+11,yy+3,4,4,'#d5ad7c');
    }
  }
  // Original V127 city tree atlas, spaced away from street and center walk.
  for(const [xx,yy,size]of [[419,2095,100],[1545,2168,95],[1775,2220,101],
    [2160,2215,107],[455,2502,98],[1520,2583,94],[1930,2550,108]])
    tree(g,xx,yy,size);
  // Surface treatment uses controlled occasional motes, not full-frame noise.
  for(let i=0;i<90;i++){
    const xx=360+(hash(i,31)%2100),yy=1994+(hash(i,97)%670);
    if(xx>850&&xx<1064||xx>540&&xx<1420&&yy>2110&&yy<2410)continue;
    ink(g,xx,yy,4+(i%4),2,i%3===0?'rgba(202,218,122,.27)':'rgba(29,78,48,.18)');
  }
  for(const [x,y] of [[720,1918],[1228,1918],[1815,1918],[2280,1918]])light(g,x,y);
  // Embedded public wayfinding by the existing pedestrian crossing, clear
  // of the true vehicle asphalt at y=1721..1848.
  ink(g,859,1958,190,34,'#203b49');
  ink(g,866,1961,176,3,'#9fbdba');
  g.fillStyle='#f5e1ae';g.textAlign='center';g.font='bold 21px Barlow Condensed, sans-serif';
  g.fillText('COMMUNITY GREEN',954,1983,185);
}
function roadPhase5(g){
 if(!terrainReady())return;
 // Real connected Harbor Avenue (V115 topology): x149..2069, y1721..1848.
 // Use existing road rectangle only; NO new road geometry or side streets.
 const x=road.x,y=road.y,w=road.w,h=road.h;
 g.save();
 // Texture full street, taper its lateral ends into the existing citywide
 // material so road connectors cannot become harsh visual dead-ends.
 for(const [xx,ww,a]of [[x,80,.10],[x+80,80,.28],[x+160,w-320,.90],
                         [x+w-160,80,.28],[x+w-80,80,.10]]){
  g.globalAlpha=a;fillT(g,'asphalt',xx,y,ww,h);
 }
 g.globalAlpha=1;
 // Preserve the original single center-lane markings and crosswalk axis.
 for(let xx=x+20;xx<x+w-32;xx+=76){
  if(xx>878&&xx<1040)continue;
  drawT(g,'road_center_dashes',xx,1752);
 }
 fillT(g,'curb_bottom',x,y-10,w,20);
 fillT(g,'curb_top',x,y+h-9,w,20);
 // Signed pedestrian crossing aligned with the original sidewalk x948.
 fillT(g,'crosswalk_vertical',899,1741,108,90);
 g.restore();
}
function makeGround(){
 const imageReady=ready(texture());
 const targetVersion=(imageReady?'heritage':'fallback')+'|'+(terrainReady()?'phase5':'original');
 if(cachedGround&&cacheReady===targetVersion)return cachedGround;
 const cv=document.createElement('canvas');
 cv.width=2410;cv.height=1720;
 const g=cv.getContext('2d');if(!g)return null;
 g.imageSmoothingEnabled=false;g.translate(-300,-1110);
 northGround(g);southGround(g);roadPhase5(g);
 cachedGround=cv;cacheReady=targetVersion;m.groundBuilds++;
 return cv;
}
function ground(g,opt){
 if(!opt||opt.zoom<.17||!seen(opt.view,{x:300,y:1110,w:2410,h:1720}))return;
 const art=makeGround();if(!art)return;
 g.save();g.imageSmoothingEnabled=false;g.drawImage(art,300,1110);g.restore();
 m.ground++;
}
function facadePanel(g,x,y,w,h,label){
 ink(g,x+6,y+7,w,h,'rgba(8,21,29,.32)');
 ink(g,x,y,w,h,'#b1b9ad');
 ink(g,x+4,y+4,w-8,h-8,'#435d6a');
 ink(g,x+7,y+10,w-14,7,'#9eafa9');
 ink(g,x+6,y+h-12,w-12,9,'#1b3646');
 if(label){
   ink(g,x+14,y+22,w-28,25,'#233c4a');
   g.fillStyle='#ebd5a4';g.font='bold 18px Barlow Condensed,sans-serif';
   g.textAlign='center';g.fillText(label,x+w/2,y+42,w-35);
 }
}
function windowBay(g,x,y,w){
 ink(g,x+7,y+7,w,37,'rgba(9,25,35,.34)');
 ink(g,x,y,w,38,'#b5b8a9');
 ink(g,x+4,y+4,w-8,30,'#223d4c');
 ink(g,x+8,y+8,w-16,14,'#5c8191');
 ink(g,x+8,y+24,w-16,6,'#314e60');
 ink(g,x+w/2-3,y+4,6,29,'#b5bbad');
 ink(g,x+10,y+10,w*.32,4,'rgba(186,223,218,.38)');
}
function facade(g,opt){
 if(!opt||!seen(opt.view,{x:375,y:1045,w:1946,h:250}))return;
 const alpha=Math.max(0,Math.min(.95,opt.alpha||0));
 if(alpha<.10)return;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 // Main wing facing south: preserve the walkable front gap at x~912-984.
 // Shadow/paint only, no new occluder rectangles in collision graph.
 for(const [x,w] of [[390,520],[989,530]]){
   ink(g,x+8,1128,w,16,'rgba(4,17,29,.26)');
   ink(g,x,1083,w,42,'#a9aca0');
   ink(g,x+3,1086,w-6,33,'#364f61');
   ink(g,x+6,1087,w-12,5,'#93a8a9');
   ink(g,x+6,1113,w-12,5,'#233b4e');
   for(let xx=x+25;xx<x+w-85;xx+=155)windowBay(g,xx,1072,109);
 }
 // Station threshold is x=948, y=1124; canopy has two masonry columns
 // outside the entrance gap, with the entire pedestrian opening still clear.
 ink(g,786,1034,326,13,'rgba(6,25,38,.24)');
 ink(g,781,1023,330,18,'#233f50');
 ink(g,786,1026,320,6,'#9fb3af');
 ink(g,790,1037,312,6,'#192f41');
 facadePanel(g,792,1045,78,85,'');
 facadePanel(g,1026,1045,79,85,'');
 ink(g,873,1058,152,45,'#243b49');
 ink(g,878,1063,142,4,'#b4ad91');
 g.fillStyle='#f0daaa';g.textAlign='center';
 g.font='bold 31px Barlow Condensed,sans-serif';g.fillText('MAIN ENTRANCE',949,1090,145);
 ink(g,906,1103,84,4,'#e4c78d'); // exact clear walking path
 // Garage service facade: main gate x=1746..2090 retains wide opening.
 for(const [x,w]of [[1540,206],[2092,205]]){
   ink(g,x+4,1252,w,11,'rgba(8,22,30,.27)');
   ink(g,x,1212,w,40,'#a5afa8');
   ink(g,x+4,1216,w-8,31,'#364e5f');
   for(let xx=x+12;xx<x+w-47;xx+=68)windowBay(g,xx,1212,50);
 }
 ink(g,1737,1220,361,10,'#162f43');
 ink(g,1745,1221,345,4,'#d1b982');
 g.font='bold 20px Barlow Condensed,sans-serif';g.fillStyle='#f7dfa2';
 g.fillText('FLEET ACCESS',1918,1208,270);
 // True threshold is painted by V115; stripes are OUTSIDE the clear
 // opening and cannot introduce a false opaque gate.
 for(const x of [1725,2110]){
   ink(g,x,1240,10,28,'#cbb371');ink(g,x+3,1240,3,28,'#2e3e48');
 }
 g.restore();m.facade++;
}
function actors(t){
 // Only V133 pedestrian scenery inside existing open precinct grounds.
 // Existing world NPC registry, pathfinding, traffic, saves remain unchanged.
 // One officer is on a bounded foot patrol; two are at staffed approaches.
 const q=Number.isFinite(t)?t/1000:0;
 const patrol=Math.sin(q*.42);
 const r=[
   {id:'v133-precinct:lane',name:'OFCR. LANE',dir:patrol>=0?'right':'left',
    x:1049+patrol*75,y:1372,hat:true,color:'#455977',hideName:false},
   {id:'v133-precinct:okafor',name:'OFCR. OKAFOR',dir:'down',
    x:2097,y:1349,hat:true,color:'#3e566a',hideName:false},
   {id:'v133-precinct:rivera',name:'RIVERA',dir:'right',
    x:647,y:1615,hat:false,color:'#566b65',hideName:false}
 ];
 m.actors+=r.length;return r;
}
window.ROOKIE_V133_PRECINCT=Object.freeze({
 version:'v133-precinct-campus-art-1',worldId:'harbor-main',
 ground,facade,actors,
 geometry:Object.freeze({roof,front,garage,lot,road,south}),
 metrics:()=>({...m,stoneReady:ready(texture()),groundAtlas:terrainReady()}),
 scope:'Original 1:1 precinct exterior and existing civic grounds only. Nonblocking visual landscape and 3 bounded station-role ambience actors; no new roads, solids, modes or loops.'
});
})();
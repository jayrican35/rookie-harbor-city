/* ROOKIE: Harbor City — Precinct 9 visual foundation.
 * Source-authored localized markings on the existing precinct footprint.
 * No new surfaces over roads/buildings, no saves, no physics, no game loop.
 * Its three phases attach to the current V115 Canvas painter and only
 * affect existing open station-front / parking coordinates.
 */
(function(){
'use strict';
const CAMPUS=Object.freeze({
  front:{x:948,y:1124},garage:{x:1918,y:1256},
  frontage:{x:810,y:1095,w:1100,h:650},
  publicLot:{x:1328,y:1268,w:580,h:412},
  visitorLot:{x:2325,y:1280,w:380,h:378},
  nativePilot:{x:352,y:1300,w:640,h:384},
  road:{x:149,y:1721,w:1920,h:127},
  marina:{x:4400,y:3220,w:1500,h:1000}
});
const STALLS=Object.freeze([1368,1456,1544,1632,1720,1808]);
const metrics={ground:0,entrance:0,visibleScans:0};
function visible(b,v,pad=24){return !v||b.x<v.x+v.w+pad&&b.x+b.w>v.x-pad&&b.y<v.y+v.h+pad&&b.y+b.h>v.y-pad;}
const ink=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
function seam(g,x,y,w){
 ink(g,x,y,w,2,'rgba(245,226,177,.37)');
 ink(g,x,y+3,w,1,'rgba(41,64,72,.28)');
}
function route(g,opt){
 const view=opt.view,zoom=opt.zoom;
 // Preserve the original V115 pavement and the authentic V115 precinct
 // 32px authored tile pilot. Draw details ONLY on existing surfaces.
 if(zoom<.19||!visible({x:817,y:1110,w:1910,h:750},view))return;
 g.save();g.imageSmoothingEnabled=false;
 // The entrance walk's exposed northern segment terminates exactly at the
 // start of the earlier approved tile pilot (y=1300). No overlay beyond it.
 if(visible({x:890,y:1126,w:118,h:174},view)){
   for(let y=1144;y<1300;y+=36)seam(g,901,y,93);
   ink(g,893,1129,4,171,'rgba(242,221,170,.46)');
   ink(g,1002,1129,4,171,'rgba(73,94,102,.46)');
   for(const x of [904,990])for(let y=1164;y<1290;y+=62)
     ink(g,x,y,6,7,'rgba(244,215,145,.45)');
   // Entry threshold tiles form a precise 72-unit open passage, not an
   // opaque gate across the two original doors.
   ink(g,911,1133,74,4,'rgba(249,229,173,.58)');
 }
 // The original 580x780 police parking area contains real asphalt.
 // Draw stall separators and tire stops, never another road rectangle.
 const publicLot=CAMPUS.publicLot;
 if(visible(publicLot,view)){
   ink(g,publicLot.x+9,1273,publicLot.w-18,3,'rgba(212,218,199,.54)');
   ink(g,publicLot.x+10,1670,publicLot.w-20,4,'rgba(153,177,171,.65)');
   for(const x of STALLS){
     ink(g,x,1295,3,112,'rgba(238,233,197,.74)');
     ink(g,x,1530,3,110,'rgba(238,233,197,.74)');
     ink(g,x+9,1293,53,7,'rgba(36,57,66,.35)');
     ink(g,x+9,1641,53,6,'rgba(40,58,61,.36)');
   }
   // Keep a 100px traversable aisle between rows and an accessible
   // entry bay directly beside the lobby path.
   ink(g,1358,1443,524,2,'rgba(249,216,135,.48)');
   for(let i=0;i<3;i++){
     ink(g,1387+i*22,1459,12,3,'rgba(241,224,188,.50)');
   }
   // Blue accessible bay icon on actual existing parking asphalt.
   ink(g,1392,1349,25,4,'#76bfc6');ink(g,1392,1350,4,25,'#76bfc6');
   ink(g,1414,1350,4,25,'#76bfc6');ink(g,1392,1371,25,4,'#76bfc6');
   ink(g,1399,1356,10,10,'#76bfc6');
   // Handcrafted parking wayfinding, restrained and readable in play.
   if(zoom>.48){
     g.font='700 18px Barlow Condensed,system-ui,sans-serif';
     g.textAlign='center';g.fillStyle='rgba(246,224,181,.78)';
     g.fillText('VISITORS',1462,1658);
     g.fillText('PATROL STAFF',1723,1658);
   }
 }
 // Existing garage-side parking east of the 1,936px station shell.
 const aux=CAMPUS.visitorLot;
 if(visible(aux,view)){
   for(const x of [2350,2420,2490,2560,2630]){
     ink(g,x,1308,3,107,'rgba(242,236,211,.68)');
     ink(g,x,1522,3,112,'rgba(242,236,211,.68)');
     ink(g,x+10,1314,49,6,'rgba(43,56,63,.34)');
     ink(g,x+10,1634,49,6,'rgba(43,56,63,.34)');
   }
   seam(g,2334,1283,348);
   ink(g,2337,1647,344,5,'rgba(207,181,127,.62)');
   if(zoom>.52){
     g.fillStyle='rgba(240,226,196,.82)';
     g.textAlign='center';g.font='700 18px Barlow Condensed,system-ui,sans-serif';
     g.fillText('STAFF / FLEET PARKING',2512,1611);
   }
 }
 // Original Harbor Avenue is y=1721..1848. Paint just the authentic
 // existing asphalt at the public walkway's center, never any opaque
 // paving strip across the street (the V129 Bayview error).
 if(visible({x:887,y:1721,w:125,h:127},view)){
   for(let x=901;x<=995;x+=18){
     ink(g,x,1740,9,34,'rgba(250,246,222,.76)');
     ink(g,x,1800,9,29,'rgba(250,246,222,.76)');
   }
   ink(g,893,1727,114,3,'rgba(240,206,125,.55)');
   ink(g,893,1838,114,3,'rgba(240,206,125,.55)');
 }
 g.restore();metrics.ground++;
}
function frontage(g,opt){
 const v=opt.view,z=opt.zoom,alpha=opt.roofAlpha;
 // Stay OFF the full station interior when the roof fades. All geometry
 // sits on the existing roof/entrance façade, never an invented building.
 if(z<.29||!Number.isFinite(alpha)||alpha<.20||!visible(CAMPUS.frontage,v))return;
 g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=Math.min(.95,alpha);
 // Entrance canopy is carefully aligned around the existing FRONT gap at
 // (948,1124); it doesn't block the original 72px walkable doorway.
 ink(g,852,1081,191,9,'#20394f');
 ink(g,857,1084,181,4,'#7a98a8');
 ink(g,860,1090,175,5,'#c6b995');
 ink(g,866,1095,161,3,'#263f51');
 // Doorway side piers, completely outside open threshold.
 ink(g,860,1100,17,39,'#3d586b');
 ink(g,1018,1100,17,39,'#3d586b');
 ink(g,864,1100,5,39,'#819da9');
 ink(g,1021,1100,5,39,'#819da9');
 ink(g,873,1113,10,17,'rgba(132,193,210,.46)');
 ink(g,1012,1113,10,17,'rgba(132,193,210,.46)');
 // Single restrained facade identity, existing roof already owns the
 // much larger PRECINCT 9 title; do not create a second billboard.
 if(z>.52){
   g.textAlign='center';g.font='800 19px Barlow Condensed,system-ui,sans-serif';
   g.fillStyle='#f7e4b0';g.fillText('PUBLIC ENTRANCE',948,1075);
 }
 // Garage volume already exists at STX+1156..1936. Add narrow operational
 // caution lines above door; keep wide vehicle opening visually unobstructed.
 ink(g,1750,1235,342,6,'rgba(245,212,134,.79)');
 for(let x=1767;x<=2070;x+=37){
   ink(g,x,1237,19,3,'rgba(34,48,57,.58)');
 }
 if(z>.52){
   g.font='700 17px Barlow Condensed,system-ui,sans-serif';
   g.fillStyle='rgba(247,230,189,.95)';
   g.fillText('VEHICLE ACCESS',1918,1229);
 }
 g.restore();metrics.entrance++;
}
window.ROOKIE_V130_PRECINCT=Object.freeze({
 version:'precinct9-visual-foundation-1',worldId:'harbor-main',
 bounds:CAMPUS,ground:route,frontage,
 metrics:()=>({...metrics}),
 scope:'Only station frontage, native parking marks and public crosswalk. No new colliders or roads.'
});
})();

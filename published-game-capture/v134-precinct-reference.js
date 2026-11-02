/* ROOKIE: Harbor City — V134: Reference-quality Precinct 9 architecture.
 * Art-directed from the owner's supplied front-elevation police precinct reference.
 * This is rendered in the ORIGINAL native 2D Canvas at the original world x/y.
 * Existing floors, walls, collision, door portals, camera, actor loop, HUD,
 * roads, missions, Academy and Zombie Outbreak remain the source of truth.
 * No parallel scene, image of the whole world, or fake building transitions.
 */
(function(){
'use strict';
if(window.ROOKIE_V134_PRECINCT||!window.HARBOR)return;
const STX=380,STY=96,FRONT={x:948,y:1124},GARAGE={x:1918,y:1256};
const TOP=377,WIDTH=1144,HEIGHT=650; // local roof face ends at STY+1027 (existing entry)
const M={facadeFrames:0,grounds:0,facadeBuilds:0,groundsBuilds:0,occluded:0};
const C={
 navy:'#17314d',navy2:'#214468',navy3:'#294f72',stone:'#cdbd9e',
 stoneDark:'#8e8e82',stoneLight:'#e4d7bd',gold:'#e6b454',warm:'#edbb6d',
 shadow:'#112539',pane:'#3a6984',olive:'#64804a'};
const px=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const visible=(v,r)=>!v||v.x<v.x+v.w+64&&v.y<v.y+v.h+64&&r.x<v.x+v.w+64&&r.y<v.y+v.h+64&&v.x<r.x+r.w+64&&v.y<r.y+r.h+64;
const seed=(a,b)=>((a*73856093)^(b*19349663))>>>0;
function bevel(g,x,y,w,h){
 px(g,x+9,y+11,w,h,'rgba(9,19,29,.4)');
 px(g,x,y,w,h,C.stoneDark);
 px(g,x+4,y+3,w-8,h-7,C.stoneLight);
 px(g,x+7,y+6,w-14,h-14,C.stone);
 px(g,x+7,y+h-10,w-14,6,'#908c7e');
 px(g,x+7,y+7,w-14,3,'#f3e6c9');
}
function bricks(g,x,y,w,h,dim=false){
 const main=dim?'#1b3555':'#23436c';
 px(g,x,y,w,h,main);
 for(let j=0,yy=y+3;yy<y+h-3;j++,yy+=12){
   px(g,x+2,yy,w-4,2,'rgba(4,17,40,.40)');
   const off=(j%2)*17;
   for(let xx=x+off+4;xx<x+w-5;xx+=35){
     px(g,xx,yy+3,2,7,'rgba(92,137,166,.23)');
     if((seed(xx,yy)%13)===0)px(g,xx+4,yy-2,13,3,'rgba(119,164,194,.17)');
   }
 }
}
function column(g,x,y,w,h){
 px(g,x+8,y+15,w,h,'rgba(5,18,29,.30)');
 bevel(g,x,y,w,h);
 for(let yy=y+32;yy<y+h-15;yy+=55){
   px(g,x+7,yy,w-14,3,'#8f8c7c');
   px(g,x+9,yy+4,w-18,2,'#efe2c9');
 }
 px(g,x-7,y+3,w+14,14,'#eadabd');
 px(g,x-8,y+17,w+16,5,'#8a8b7e');
 px(g,x-5,y+h-18,w+10,12,'#e3d4b7');
 px(g,x-8,y+h-7,w+16,8,'#948d7c');
}
function lamp(g,x,y,scale=1){
 g.save();g.translate(x,y);g.scale(scale,scale);
 px(g,-16,0,32,5,'rgba(9,26,39,.4)');
 px(g,-8,-57,16,57,'#18344b');
 px(g,-6,-55,4,48,'#7895a0');
 px(g,-19,-65,38,11,'#9c8051');
 px(g,-15,-83,30,22,'#e4ad5a');
 px(g,-10,-79,20,15,'#fff1b5');
 px(g,-20,-87,40,6,'#b9a16f');
 px(g,-14,-92,28,5,'#2b4054');
 px(g,-4,-98,8,8,'#e9c777');
 g.restore();
}
function windowPane(g,x,y,w,h){
 // This branch changes only the pane itself, inside the SAME cached V134
 // building sprite. Existing architectural bay coordinates, surrounding
 // masonry, stone pilasters and roof-alpha/collision stay authoritative.
 if(window.ROOKIE_V136_WINDOW_KIT_ACTIVE &&
    window.ROOKIE_V135_WALL_KIT?.drawFacadeWindow(g,x,y,w,h))return;
 // Navy mullions, warm interior, actual pixel-scale venetian blinds and
 // stone lintels. Four depth planes; no full-screen source-image overlay.
 px(g,x+7,y+14,w,h,'rgba(4,17,24,.35)');
 bevel(g,x-6,y-7,w+12,h+15);
 px(g,x,y,w,h,'#0e263e');
 px(g,x+5,y+5,w-10,h-10,'#c89549');
 px(g,x+8,y+8,w-16,h-17,'#f2c77c');
 px(g,x+10,y+10,w-20,Math.floor(h*.31),'#5b7d89');
 px(g,x+10,y+14,w-20,Math.floor(h*.16),'#a7adb0');
 for(let yy=y+34;yy<y+h-9;yy+=13){
   px(g,x+10,yy,w-20,4,'#395169');
   px(g,x+10,yy+4,w-20,3,'#deaf67');
   px(g,x+10,yy+8,w-20,2,'#16314c');
 }
 px(g,x+w/2-4,y+5,8,h-10,'#1d344e');
 px(g,x+4,y+h/2-2,w-8,5,'#1d344e');
 px(g,x+3,y+4,5,h-8,'#9bb2b6');
 px(g,x+w-7,y+4,4,h-8,'#3c5264');
 px(g,x-9,y+h+3,w+18,9,'#e5d7bc');
 px(g,x-10,y+h+11,w+20,6,'#7d8989');
}
function finial(g,x,y){
 px(g,x-19,y-3,38,6,'#1b3c5b');px(g,x-15,y-11,30,8,'#e1c488');
 px(g,x-6,y-29,12,19,'#b98a3a');px(g,x-4,y-39,8,11,'#efdb93');
}
function crest(g,x,y,r){
 // Source-reference gold eight-point badge, wholly authored and reusable.
 g.save();g.translate(x,y);
 g.fillStyle='rgba(9,19,30,.35)';g.beginPath();
 for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2,rr=i%2===0?r+5:r*.67;
  if(i===0)g.moveTo(Math.cos(a)*rr+5,Math.sin(a)*rr+7);
  else g.lineTo(Math.cos(a)*rr+5,Math.sin(a)*rr+7);}
 g.closePath();g.fill();
 function starPath(outer,inner){
  g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2;
   const rr=(i%2===0)?outer:inner;
   if(i===0)g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
   else g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  g.closePath();
 }
 starPath(r,r*.68);g.fillStyle='#de9c2f';g.fill();g.lineWidth=5;g.strokeStyle='#f7dd7e';g.stroke();
 g.beginPath();g.arc(0,0,r*.62,0,Math.PI*2);g.fillStyle='#1e4466';g.fill();
 g.lineWidth=4;g.strokeStyle='#ffe1a0';g.stroke();
 g.beginPath();g.arc(0,0,r*.51,0,Math.PI*2);g.strokeStyle='#dca84c';g.lineWidth=3;g.stroke();
 g.beginPath();
 for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=(i%2===0)?r*.45:r*.19;
  if(i===0)g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}
 g.closePath();g.fillStyle='#ffdc72';g.fill();g.strokeStyle='#a36925';g.lineWidth=2;g.stroke();
 g.restore();
}
function flag(g,x,y,dir=1){
 if(window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
  // Approved two modest flags; no oversized solid horizontal block strips.
  g.save();g.translate(x,y);g.imageSmoothingEnabled=false;
  const d=dir<0?-1:1;
  px(g,3,8,7,160,'rgba(7,22,32,.24)');
  px(g,-2,-9,6,158,'#b8c6c7');px(g,-2,-9,2,158,'#f0e9d6');
  px(g,-7,-15,16,6,'#d6bd7f');px(g,-3,-22,7,8,'#f8e6a3');
  for(let i=0;i<11;i++){
    const wave=Math.round(Math.sin(i*.61)*4),len=66+(i%3)*2;
    px(g,4+(d<0?-len:0)+wave*d,12+i*7,len,7,
       i%2?'#eee6d9':'#b82f46');
  }
  px(g,d<0?-29:4,12,33,35,'#264a76');
  for(let yy=0;yy<4;yy++)
    for(let xx=0;xx<4;xx++)
      px(g,(d<0?-26:9)+xx*7,17+yy*8,2,2,'#f8f2df');
  g.restore();return;
 }

 px(g,x+6,y+10,8,210,'rgba(6,16,25,.32)');
 px(g,x,y-12,7,228,'#d6ddce');
 px(g,x+2,y-12,3,228,'#667f8c');
 px(g,x-4,y-18,14,8,'#f8db97');
 for(let i=0;i<11;i++){
  const y1=y+13+i*8,aa=i<5?8:16;
  px(g,x+8,y1,dir*(77+((i%3)*4)),7,i%2?'#f0ebe0':'#b63442');
 }
 px(g,x+8,y+13,dir*36,44,'#244d80');
 for(let yy=0;yy<5;yy++)for(let xx=0;xx<4;xx++)
  px(g,x+12+xx*7*dir,y+19+yy*7,3,3,'#f2e7cf');
}
function blueCanopy(g){
 // Cross-section/folded roof at y=479: intentional 3D perspective.
 const x=410,y=470,w=325;
 px(g,x+8,y+27,w,72,'rgba(5,14,26,.4)');
 px(g,x-12,y+16,w+24,44,'#102a46');
 px(g,x-12,y,w+24,19,'#4f7bad');
 for(let xx=x-4;xx<x+w+4;xx+=52){
  px(g,xx,y+4,3,16,'#78a1bd');px(g,xx+4,y+8,2,8,'#24567c');
 }
 px(g,x-12,y+22,w+24,21,'#2e5e91');
 px(g,x-11,y+42,w+22,13,'#0e233c');
 px(g,x+46,y+33,w-92,33,'#1d344d');
 px(g,x+52,y+36,w-104,4,'#b99b69');
 g.textAlign='center';g.fillStyle='#f7df9f';
 g.font='900 27px Barlow Condensed, sans-serif';
 g.fillText('MAIN ENTRANCE',WIDTH/2,y+59,w-100);
 for(const xx of [x+34,x+w-37]){
  px(g,xx,y+58,17,72,'#e3d4b6');
  px(g,xx+3,y+60,4,65,'#b09d7c');
  px(g,xx-6,y+55,28,9,'#f3ddbd');
 }
 for(let xx=x+60;xx<x+w-56;xx+=28)px(g,xx,y+68,12,6,'#f8d793');
}
function doorway(g){
 const x=475,y=535,w=194,h=110;
 px(g,x-12,y-7,w+24,h+20,'#d0b996');
 px(g,x,y,w,h,'#101f31');
 // Warmly lit lobby (the same real portal underneath it).
 px(g,x+10,y+8,w-20,h-13,'#c28e43');
 px(g,x+15,y+12,w-30,h-20,'#285575');
 for(let yy=y+19;yy<y+82;yy+=18)px(g,x+15,yy,w-30,6,'rgba(248,187,103,.72)');
 px(g,x+w/2-4,y+8,8,h-13,'#aeb1aa');
 px(g,x+7,y+7,8,h-14,'#94a6b2');
 px(g,x+w-16,y+7,8,h-14,'#94a6b2');
 px(g,x+40,y+55,7,23,'#dcbf79');
 px(g,x+w-46,y+55,7,23,'#dcbf79');
 px(g,x-10,y+h, w+20,11,'#d7c5a5');
 px(g,x-21,y+h+11,w+42,9,'#a7a19a');
}
function cornice(g,y){
 px(g,0,y,WIDTH,11,'#7b7777');
 px(g,0,y+4,WIDTH,5,'#d8c6a4');
 px(g,0,y+10,WIDTH,15,'#eee0bd');
 px(g,0,y+25,WIDTH,9,'#8f9291');
 px(g,6,y+34,WIDTH-12,7,'#304c66');
 px(g,0,y+42,WIDTH,4,'#e7d8b3');
}
function renderArchitecture(){
 const cv=document.createElement('canvas');cv.width=WIDTH;cv.height=HEIGHT;
 const g=cv.getContext('2d');if(!g)return null;
 g.imageSmoothingEnabled=false;
 // Opaque façade cover eliminates the blue/grey V132 giant roof slab from
 // the frontal elevation while the true roof still exists farther north.
 px(g,0,39,WIDTH,HEIGHT-50,'#172d4a');
 bricks(g,8,105,WIDTH-16,HEIGHT-160);
 // Silhouette: raised central civic pediment, wing parapets and cupolas.
 px(g,8,31,330,67,'#173354');
 px(g,806,31,330,67,'#173354');
 px(g,0,55,WIDTH,13,'#ded0b2');
 px(g,0,68,WIDTH,7,'#77899b');
 px(g,0,76,WIDTH,5,'#f2dfbc');
 px(g,348,0,449,80,'#c8bb9e');
 px(g,353,6,439,69,'#294766');
 px(g,371,17,405,49,'#15365c');
 for(const [xx,ww]of [[0,352],[796,348]]){
  px(g,xx,92,ww,17,'#c0b299');
  px(g,xx,109,ww,14,'#8d8e88');
  px(g,xx,123,ww,13,'#e3d3b5');
 }
 for(let x=34;x<1126;x+=124){
  px(g,x,83,19,21,'#b1a48c');
  px(g,x+5,85,9,17,'#f3e1c4');
 }
 // Vertical stone pilasters at wing corners and paired central towers.
 for(const x of [8,337,779,1090])column(g,x,113,46,475);
 // Carved second-floor window courses — 3 bays per wing.
 for(const x of [86,193,258,861,951,1040]){
  windowPane(g,x,157,72,123);
  windowPane(g,x,361,72,150);
 }
 // A prominent civic second story rather than mere little roof panels.
 cornice(g,305);
 // Central entrance projection and strong contrast.
 bricks(g,388,76,358,530,true);
 px(g,376,91,13,510,'#b4a98f');px(g,743,91,13,510,'#9b9f95');
 px(g,380,97,372,14,'#e2d0af');
 px(g,383,111,365,9,'#6c8499');
 // Crest/logo and true integrated precinct sign, visibly above entrance.
 crest(g,WIDTH/2,154,52);
 px(g,412,218,321,93,'#0d2744');
 px(g,417,223,311,4,'#dfbd74');
 px(g,417,294,311,4,'#8d887b');
 g.textAlign='center';g.fillStyle='#091e33';g.font='900 55px Barlow Condensed,sans-serif';
 g.fillText('PRECINCT 9',WIDTH/2+3,279,307);
 g.fillStyle='#f7d891';g.fillText('PRECINCT 9',WIDTH/2,276,307);
 g.font='900 21px Barlow Condensed,sans-serif';
 g.fillStyle='#e9dabc';g.fillText('HARBOR CITY POLICE',WIDTH/2,300,300);
 // Central second-story illuminated atrium with visible mullions.
 for(const [x,w]of [[408,106],[520,105],[632,107]]){
  windowPane(g,x,351,w,100);
 }
 // Accent stone arches and dark iron under each window.
 for(const x of [74,181,246,849,938,1028]){
  px(g,x,133,89,12,'#e1cfae');px(g,x+5,129,79,6,'#f4e5c7');
  px(g,x,529,89,9,'#bdb59c');
 }
 // Real, scaled stars-and-stripes flags on central columns.
 flag(g,375,172,-1);flag(g,770,172,1);
 // Public ground-floor lobby and architectural entry canopy.
 px(g,392,460,358,137,'#17344e');
 // Preserve the exact original one-world entrance geometry, placing
 // assembled atlas components into THIS cached facade rather than overlaying
 // a full-window mural or building another renderer.
 if(!(window.ROOKIE_V137_ENTRANCE_ACTIVE &&
      window.ROOKIE_V135_WALL_KIT?.drawEntranceStatic(g,WIDTH/2))){
   blueCanopy(g);
   doorway(g);
 }
 for(const x of [22,1110])lamp(g,x,486,.85);
 for(const x of [344,799])lamp(g,x,486,.85);
 // Reflected glints and deeply recessed warm-lit offices.
 for(const [x,y]of [[135,203],[253,402],[884,192],[1044,406]]){
   px(g,x,y,13,3,'rgba(247,220,148,.42)');
   px(g,x+8,y+10,5,2,'rgba(192,227,233,.52)');
 }
 // Stone ground datum and 3 shallow visual steps end at true door edge.
 px(g,0,615,WIDTH,9,'#e6d4b6');
 px(g,0,624,WIDTH,8,'#968e81');
 px(g,0,632,WIDTH,8,'#d6c5a5');
 px(g,0,640,WIDTH,10,'#887e72');
 // x=568 local -> world x=948; y=647 local -> world y=1120.
 // Paint only: no collision rectangle or trigger created here.
 M.facadeBuilds++;
 return cv;
}
const GX=STX+1158,GY=STY+630,GW=754,GH=524;
function renderGarage(){
 const cv=document.createElement('canvas');cv.width=GW;cv.height=GH;
 const g=cv.getContext('2d');if(!g)return null;g.imageSmoothingEnabled=false;
 bricks(g,8,51,GW-16,GH-63,true);
 px(g,1,28,GW-2,15,'#d2c2a4');
 px(g,1,43,GW-2,9,'#6d818a');
 px(g,0,52,GW,8,'#f0dfbd');
 // Industrial garage at matching architectural resolution.
 for(const x of [7,239,507,706])column(g,x,84,37,393);
 for(const x of [94,334,573])windowPane(g,x,112,110,105);
 px(g,50,266,656,13,'#d8c6a7');
 px(g,50,279,656,9,'#7e8990');
 px(g,54,293,651,8,'#e8d4ad');
 // Three deep fleet bay recesses, matching reference navy + stone palette.
 for(const [x,w] of [[55,199],[283,192],[503,192]]){
   bevel(g,x-6,317,w+12,166);
   px(g,x,330,w,141,'#101f32');
   px(g,x+5,333,w-10,137,'#304f66');
   for(let i=0;i<7;i++){
     const yy=338+i*18;
     px(g,x+7,yy,w-14,5,i%2===0?'#476c7f':'#24445b');
     px(g,x+7,yy+5,w-14,3,'#10283f');
   }
   px(g,x+3,330,6,140,'#b0b6ad');
   px(g,x+w-9,330,6,140,'#9facaa');
   px(g,x+18,447,w-36,4,'#e5c57d');
 }
 // The real native garage exit at world x1918 is in CENTER BAY:
 // virtual artwork fades at exact existing garage approach and doorway.
 crest(g,GW/2,90,38);
 px(g,274,224,208,50,'#112b48');
 px(g,280,229,196,4,'#e8bd79');
 g.fillStyle='#f7dfaa';g.textAlign='center';
 g.font='900 30px Barlow Condensed,sans-serif';
 g.fillText('PRECINCT GARAGE',GW/2,255,194);
 px(g,0,482,GW,13,'#e2d0b1');
 px(g,0,495,GW,9,'#9a9890');
 px(g,0,504,GW,17,'#1c384e');
 // fleet curb safety stripes are visual and never block street traffic.
 for(let x=18;x<GW-22;x+=53){
   px(g,x,510,26,7,'#e1b35f');
 }
 for(const x of [35,GW-37])lamp(g,x,398,.8);
 return cv;
}
let face=null,garageFace=null;
let doorRatio=0,doorApproaches=0,doorWasNear=false,doorChanges=0;
function stepEntrance(player,dt){
 if(!window.ROOKIE_V137_ENTRANCE_ACTIVE||!player)return;
 const near=Math.abs(player.x-FRONT.x)<86 && player.y>960 && player.y<1240;
 if(near&&!doorWasNear)doorApproaches++;
 doorWasNear=near;
 // Sensor opens BEFORE Jay reaches the original 72px walkable threshold.
 // The existing simulation and collision response continue unchanged.
 const to=near?1:0,from=doorRatio;
 const speed=Math.min(.2,Math.max(0,Math.min(.05,dt))*4);
 doorRatio+=Math.sign(to-doorRatio)*Math.min(Math.abs(to-doorRatio),speed);
 if(Math.abs(from-doorRatio)>.0001)doorChanges++;
}
function entranceState(){
 return {open:doorRatio,near:doorWasNear,approaches:doorApproaches,
   updates:doorChanges,front:{x:FRONT.x,y:FRONT.y},worldSpace:true};
}
function architecture(g,o){
 if(!o)return;
 const mainBox={x:STX,y:STY+TOP,w:WIDTH,h:HEIGHT};
 const garageBox={x:GX,y:GY,w:GW,h:GH};
 const mainVisible=o.section!=='garage'&&visible(o.view,mainBox);
 const garageVisible=o.section!=='main'&&visible(o.view,garageBox);
 if(!mainVisible&&!garageVisible)return;
 const alpha=Math.max(0,Math.min(.95,Number(o.alpha)||0));
 if(alpha<.025)return;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 if(mainVisible){
   if(!face)face=renderArchitecture();
   if(face){g.drawImage(face,STX,STY+TOP);M.facadeFrames++;}
   // Animated glass leaf poses drawn on the existing single Canvas with
   // the EXACT same fade as the roof; no duplicate animation tick.
   if(window.ROOKIE_V137_ENTRANCE_ACTIVE)
     window.ROOKIE_V135_WALL_KIT?.drawEntranceDoors(g,STX+WIDTH/2,
       STY+TOP+543,doorRatio);
   // Phase-1 wall-kit smoke assembly: rendered in THIS existing V134 facade
   // layer and the SAME roofAlpha(), not a second precinct or render pass.
   // A single southwest 320×128 sample, outside the real lobby/garage door.
   if(!window.ROOKIE_V136_WINDOW_KIT_ACTIVE)
     window.ROOKIE_V135_WALL_KIT?.drawTest(g,{x:STX+32,y:STY+TOP+512});
 }
 if(garageVisible){
   if(!garageFace)garageFace=renderGarage();
   if(garageFace){g.drawImage(garageFace,GX,GY);M.facadeFrames++;}
 }
 g.restore();
}
function basket(g,x,y,w=120){
 px(g,x+5,y+9,w,19,'rgba(12,31,30,.26)');
 px(g,x,y,w,22,'#94745b');
 px(g,x+4,y+4,w-8,12,'#3e613f');
 px(g,x,y,w,5,'#c0ac84');
 for(let i=0;i<w-12;i+=16){
  const xx=x+8+i,yy=y-5-((i*17)%9);
  px(g,xx,yy,16,10,(i%3===0)?'#659b4a':'#437f49');
  px(g,xx+4,yy-2,5,5,(i%4===0)?'#ebc251':'#f6cc80');
  px(g,xx+10,yy+3,4,4,'#f1a057');
 }
}
function palm(g,x,y,sz=85){
 // Bright Florida palms at precisely the planted civic side, clear of
 // real entry trigger and walk route. World-distance scales naturally.
 px(g,x-19,y+8,52,9,'rgba(8,29,25,.22)');
 px(g,x-10,y-43,19,58,'#8c653c');
 for(let yy=y-40;yy<y+10;yy+=12){px(g,x-10,yy,19,4,'#c4995c');px(g,x-5,yy+3,8,3,'#73552c');}
 const roots=[[0,-1],[-1,-.45],[1,-.45],[-.72,.15],[.72,.15]];
 for(let i=0;i<roots.length;i++){
  const [dx,dy]=roots[i];
  const a=(i-2)*.66-Math.PI/2;
  for(let j=0;j<9;j++){
   const xx=x+Math.sin(a+j*.18)*sz*.12*j,yy=y-45-Math.cos(a+j*.18)*sz*.10*j;
   px(g,xx-10,yy-3,24,8,j%2?'#367642':'#68a149');
   px(g,xx-8,yy-5,16,4,'#a2c75d');
  }
 }
}
function bollard(g,x,y){
 px(g,x+6,y+4,10,7,'rgba(15,34,40,.28)');
 px(g,x-7,y-20,14,26,'#3a5263');
 px(g,x-8,y-21,16,6,'#e5d6b6');
 px(g,x-5,y-30,10,9,'#f7d988');
 px(g,x-2,y-27,4,5,'#fff2c9');
}
function plaque(g,x,y,w=257){
 px(g,x+7,y+8,w,64,'rgba(14,30,35,.31)');
 px(g,x,y,w,64,'#bdad90');
 px(g,x+6,y+5,w-12,50,'#294665');
 px(g,x+9,y+7,w-18,4,'#e4c17f');
 crest(g,x+35,y+30,21);
 g.fillStyle='#f3dfa7';g.textAlign='center';
 g.font='900 23px Barlow Condensed,sans-serif';
 g.fillText('PRECINCT 9',x+w*.60,y+29,w*.67);
 g.font='bold 12px Barlow Condensed,sans-serif';
 g.fillText('HARBOR CITY POLICE',x+w*.60,y+45,w*.67);
}
function plazaPavers(g,x,y,w,h){
  // Use the SAME existing PNG atlas loader and cached world-space V134
  // forecourt. Terrain remains underfoot, never over Jay or the entrances.
  if(window.ROOKIE_V139_GROUND_ACTIVE &&
      window.ROOKIE_V135_WALL_KIT?.fillGround?.(g,'paver_stone',x,y,w,h)){
    if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
      px(g,x,y,w,4,'rgba(252,233,204,.83)');
      px(g,x,y+h-5,w,5,'rgba(99,107,116,.74)');
    }
    return;
  }
 // Native-world pixel-crafted civic forecourt; the formerly huge dark-blue
 // strip outside the main doorway becomes warm stone public paving.
 // Still entirely passable: this is a draw layer, NOT a collision surface.
 px(g,x+7,y+7,w,h,'rgba(6,29,37,.30)');
 px(g,x,y,w,h,'#c6bba3');
 px(g,x,y,w,5,'#e5d7b8');
 px(g,x,y+h-7,w,7,'#8f9792');
 for(let row=0,yy=y+8;yy<y+h-8;yy+=28,row++){
  px(g,x+5,yy,w-10,2,'#9f9c90');
  const shift=(row%2)*21;
  for(let xx=x+6+shift;xx<x+w-6;xx+=42){
    px(g,xx,yy+2,2,24,'rgba(99,104,98,.40)');
    if(seed(xx,yy)%7===0)px(g,xx+6,yy+7,10,3,'rgba(245,225,180,.55)');
    if(seed(xx,yy)%13===0)px(g,xx+19,yy+18,4,3,'rgba(112,115,98,.17)');
  }
 }
 // Two precisely bordered planting strips are off the 72px public walkway.
 px(g,x+10,y+h-19,246,9,'#a99d86');
 px(g,x+w-211,y+h-19,192,9,'#a99d86');
}
let grounds=null,groundAtlasWasReady=false;
function makeGround(){
 const cv=document.createElement('canvas');cv.width=1710;cv.height=647;
 const g=cv.getContext('2d');if(!g)return null;
 g.imageSmoothingEnabled=false;g.translate(-310,-1108);
 if(window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
   // The owner requested an entirely clear paved plaza. Keep the civic
   // marker and lights, but no inherited flower boxes, palms or shrubs.
   // V133 owns the continuous floor; this cache contributes no paving.
   plaque(g,488,1554,287);
   for(const [x,y]of [[853,1288],[1036,1288],[853,1633],[1036,1633]])bollard(g,x,y);
   for(const [x,y]of [[820,1455],[1075,1455],[580,1619],[1250,1619]])lamp(g,x,y,1);
   M.groundsBuilds++;return cv;
 }
 // Replace the under-designed dark asphalt band south of the main public
 // entrance. The original lobby remains at x=948,y=1124 and its passage is
 // exactly the same. Do not paint on the public parking/road to the east.
 plazaPavers(g,387,1127,931,169);
 basket(g,426,1256,210);
 basket(g,1108,1256,173);
 // Original central promenade and visitor parking remain real geography.
 // Public facing stone plaza between the physical station entry and road.
 // In 133, frontage tiles/roads already exist: this is fine detail atop them.
 for(const [x,y,w]of [[379,1320,360],[1060,1292,330]]){
  // Flower borders on each side; NOT across the central x948 path.
  basket(g,x,y,w);
 }
 const plantedBorders=window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE?
   [[462,1623,140],[646,1623,145],[1092,1623,170],[1340,1623,194]]:
   [[425,1480,131],[652,1540,97],[1085,1498,114],[1134,1625,176]];
 for(const [x,y,w]of plantedBorders)
  basket(g,x,y,w);
 // Matching original-reference palms and city bench/vantage boundaries.
 palm(g,422,1301,72);palm(g,1300,1340,77);
 plaque(g,488,1554,287);
 // Actual pavement edges retain original visual road alignment.
 for(const [x,y]of [[853,1288],[1036,1288],[853,1633],[1036,1633]])bollard(g,x,y);
 // Inviting central walk illuminated without obstructing the original portal.
 for(const [x,y]of [[820,1455],[1075,1455],[580,1619],[1250,1619]])lamp(g,x,y,1);
 // Secondary civic flags on the real pedestrian plaza, all presentation.
 // Retain two restrained facade-mounted flags; remove duplicate plaza poles.
 if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
  flag(g,510,1411,1);flag(g,1306,1411,-1);
 }
 // Border to emphasize existing sidewalk to the road.
 for(let x=483;x<1415;x+=81){
  px(g,x,1659,63,3,'rgba(242,214,165,.35)');
 }
 // Keep the actual road crossing, crossing geometry and yellow dashes fully
 // untouched. Flowers and palms are static scenery, not colliders.
 M.groundsBuilds++;
 return cv;
}
function ground(g,o){
 if(!o||o.zoom<.23||!visible(o.view,{x:310,y:1108,w:1710,h:647}))return;
 const phase5Ready=!!(window.ROOKIE_V139_GROUND_ACTIVE &&
    window.ROOKIE_V135_WALL_KIT?.stats?.().groundAtlas);
 if(!grounds||phase5Ready!==groundAtlasWasReady){
   grounds=makeGround();groundAtlasWasReady=phase5Ready;
 }
 if(!grounds)return;
 g.save();g.imageSmoothingEnabled=false;g.drawImage(grounds,310,1108);g.restore();
 M.grounds++;
}
let forecourtArt=null,forecourtGroundReady=false;
function forecourt(g,o){
 // Station grounds render a shaded street apron AFTER the global ground
 // pass. Draw ONLY this underfoot civic paving after drawStation(), before
 // the existing depth-sorted actors. This prevents the original blank navy
 // entrance apron from obscuring the new architecture's pedestrian plaza.
 if(!o||o.zoom<.23||!visible(o.view,{x:387,y:1127,w:931,h:169}))return;
 const phase5Ready=!!(window.ROOKIE_V139_GROUND_ACTIVE &&
    window.ROOKIE_V135_WALL_KIT?.stats?.().groundAtlas);
 if(!forecourtArt||forecourtGroundReady!==phase5Ready){
   forecourtGroundReady=phase5Ready;
  const cv=document.createElement('canvas');cv.width=931;cv.height=169;
  const art=cv.getContext('2d');if(!art)return;
  art.imageSmoothingEnabled=false;
  art.translate(-387,-1127);
  plazaPavers(art,387,1127,931,169);
  if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
    basket(art,426,1256,210);
    basket(art,1108,1256,173);
  }
  forecourtArt=cv;
 }
 g.save();g.imageSmoothingEnabled=false;
 g.drawImage(forecourtArt,387,1127);g.restore();
}
window.ROOKIE_V134_PRECINCT=Object.freeze({
 stepEntrance,entranceState,
 invalidateFacade:()=>{
   // Recreate approved V134 canvases once after the EXISTING atlas loader
   // finishes. Never add a scene or draw loop.
   face=null;garageFace=null;
 },
 version:'v134-reference-architectural-reconstruction',
 architecture,ground,forecourt,
 layout:Object.freeze({facade:{x:STX,y:STY+TOP,w:WIDTH,h:HEIGHT},
  garageFacade:{x:GX,y:GY,w:GW,h:GH},
  entrance:FRONT,garage:GARAGE,roadPreserved:true}),
 stats:()=>({...M,facadeReady:!!face,garageReady:!!garageFace,groundsReady:!!grounds}),
 scope:'Architectural and civic grounds art only; original 1:1 connected world, existing roof fade and no gameplay changes'
});
})();

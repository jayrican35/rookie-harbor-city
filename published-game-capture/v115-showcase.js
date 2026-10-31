/* ROOKIE: Harbor City — V115 Precinct 9 / Midtown visual showcase.
 * Visual-only renderer: deterministic scenery, materials, architectural detail,
 * fallback building art, and restrained light. Does not own simulation, input,
 * collisions, quests, saves, networking, Academy or Zombie Outbreak.
 * This module is only loaded in /preview/v115-showcase/.
 */
(function () {
  'use strict';
  const TILE = 96;
  const COLORS = Object.freeze({
    road:'#3d4851', curb:'#c5c4b5', curbEdge:'#78828a',
    sandstone:'#d4c4a1', grout:'#b0ae99', gold:'#eecb7a',
    forest:'#295944', leaf:'#5eac72', teal:'#376d79', navy:'#17324a'
  });
  const planters=[
    {x:476,y:1335,w:196,h:43},{x:1240,y:1328,w:250,h:43},
    {x:1665,y:1405,w:192,h:42},{x:2085,y:1390,w:178,h:46},
    {x:2378,y:1510,w:160,h:38},{x:2878,y:1615,w:136,h:36}
  ];
  const trees=[
    [286,1340,31],[360,1510,34],[575,1570,34],[750,1374,28],
    [1182,1490,35],[1435,1556,36],[1712,1494,31],[1993,1530,33],
    [2170,1350,31],[2550,1410,29],[2755,1570,25],[3080,1580,25],
    [3315,1582,26],[3565,1585,31],[3865,1582,28]
  ];
  const lights=[
    [645,1583],[1332,1560],[1910,1600],[2355,1664],
    [2736,1680],[2920,1677],[3316,1690],[3750,1670],[4260,1670]
  ];
  const wasteBins=[[1180,1660],[2450,1690],[3018,1694]];
  const benches=[[500,1610],[1575,1638],[2540,1642],[3200,1637]];
  const keepers=Object.freeze({roadMaterial:true,precinctArchitecture:true,streetFurniture:true,ambientLight:true,buildingFallback:true});
  const tileCache=Object.create(null);
  function hash(x,y,s=1){let t=(Math.imul(x|0,73856093)^Math.imul(y|0,19349663)^Math.imul(s|0,83492791))>>>0;t^=t>>>13;t=Math.imul(t,1274126177);return (t^(t>>>16))>>>0;}
  function tile(which) {
    if(tileCache[which]) return tileCache[which];
    const c=document.createElement('canvas');c.width=TILE;c.height=TILE;
    const g=c.getContext('2d');
    const isRoad=which==='road', isPave=which==='stone';
    g.fillStyle=isRoad?'#46515b':isPave?'#c2b9a5':'#63875b';g.fillRect(0,0,TILE,TILE);
    if(isRoad){
      for(let i=0;i<440;i++){
        const h=hash(i,29),x=h%TILE,y=(h>>>8)%TILE;
        g.fillStyle=i%4===0?'rgba(207,216,204,.11)':'rgba(13,28,41,.13)';
        g.fillRect(x,y,1+(h%2),1+(h%2));
      }
      for(let i=0;i<9;i++){
        const x=hash(i,101)%96,y=hash(i,329)%96;
        g.fillStyle='rgba(17,31,43,.12)';g.fillRect(x,y,5,1);
      }
    }else if(isPave){
      for(let y=0;y<TILE;y+=24){
        g.fillStyle='rgba(39,61,68,.21)';g.fillRect(0,y,TILE,1);
        for(let x=(y/24%2)?0:24;x<TILE;x+=48)g.fillRect(x,y,1,24);
      }
      for(let i=0;i<85;i++){
        const h=hash(i,16);g.fillStyle=i%2?'rgba(252,240,212,.18)':'rgba(52,70,72,.09)';
        g.fillRect(h%96,(h>>>8)%96,3,2);
      }
    }else{
      for(let i=0;i<140;i++){
        const h=hash(i,51),x=h%TILE,y=(h>>>8)%TILE;
        g.fillStyle=i%3?'rgba(34,90,60,.11)':'rgba(191,207,124,.16)';
        g.fillRect(x,y,2+(h%3),2);
      }
    }
    tileCache[which]=c;return c;
  }
  function visible(r,view,pad=40){return !view||r.x<view.x+view.w+pad && r.x+r.w>view.x-pad && r.y<view.y+view.h+pad && r.y+r.h>view.y-pad;}
  function patterned(g,kind,x,y,w,h,opacity=1){
    const p=tile(kind);g.save();g.globalAlpha*=opacity;
    g.fillStyle=g.createPattern(p,'repeat');g.fillRect(x,y,w,h);g.restore();
  }
  function strip(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
  function shadow(g,x,y,w,h){
    g.fillStyle='rgba(11,27,37,.24)';g.fillRect(x+8,y+12,w,h);
  }
  function roofTile(g,x,y,w,h,c1,c2){
    strip(g,x,y,w,h,c1);g.fillStyle=c2;
    for(let row=y+7;row<y+h-4;row+=16)g.fillRect(x+5,row,w-10,2);
    g.fillStyle='rgba(247,242,209,.17)';g.fillRect(x+5,y+4,w-10,3);
  }
  function planter(g,r,step){
    shadow(g,r.x,r.y,r.w,r.h);
    strip(g,r.x,r.y,r.w,r.h,'#7c6551');
    strip(g,r.x+5,r.y+5,r.w-10,r.h-10,'#294d3b');
    strip(g,r.x+2,r.y+2,r.w-4,4,'#c5a47e');
    strip(g,r.x+2,r.y+r.h-5,r.w-4,3,'#554c45');
    const n=Math.floor((r.w-12)/17);
    for(let i=0;i<n;i++){
      const px=r.x+10+i*17,py=r.y+13+(hash(i,r.x)%11);
      g.fillStyle=i%3===0?'#9ed085':'#397c57';g.fillRect(px-4,py,9,8);
      g.fillStyle=i%4===0?'#ebc476':i%4===1?'#e9a2a1':'#9ebccd';g.fillRect(px,py-3,4,4);
    }
  }
  function tree(g,x,y,r){
    g.fillStyle='rgba(11,43,33,.24)';g.beginPath();g.ellipse(x+9,y+12,r*1.25,r*.45,0,0,Math.PI*2);g.fill();
    strip(g,x-6,y-3,12,25,'#604b40');
    strip(g,x-3,y-8,6,23,'#aa805a');
    const leaves=[[-.48,-.18,.70],[-.04,-.53,.84],[.45,-.18,.65],[-.27,.31,.72],[.27,.30,.69]];
    for(let i=0;i<leaves.length;i++){
      const [a,b,k]=leaves[i];const h=hash(x|0,y|0,i),rr=r*k;
      g.fillStyle=['#224c3b','#397955','#4f9967','#74af72','#37755a'][i];
      g.beginPath();g.arc(x+a*r,y+b*r,rr,0,Math.PI*2);g.fill();
      g.fillStyle='rgba(209,229,153,.20)';g.fillRect(x+a*r-rr*.42,y+b*r-rr*.45,Math.max(3,rr*.42),4+h%3);
    }
    g.fillStyle='rgba(17,64,47,.26)';g.fillRect(x-r*.6,y+r*.33,r*1.2,3);
  }
  function bench(g,x,y){
    g.fillStyle='rgba(9,34,42,.24)';g.fillRect(x+4,y+8,84,16);
    strip(g,x,y,86,11,'#875c46');strip(g,x,y+2,86,2,'#ca9870');
    for(let i=0;i<3;i++)strip(g,x,y+13+i*4,86,2,i%2?'#8f654c':'#b78358');
    strip(g,x+10,y+21,6,9,'#38515b');strip(g,x+70,y+21,6,9,'#38515b');
  }
  function bin(g,x,y){strip(g,x-8,y-14,16,19,'#203e4d');strip(g,x-10,y-18,20,5,'#aeb1a1');strip(g,x-4,y-13,8,11,'#376979');}
  function lamp(g,x,y,t,glow=false){
    strip(g,x-4,y-41,8,45,'#1f3948');strip(g,x-6,y-44,12,5,'#708c91');
    strip(g,x-11,y-50,22,9,'#b09b72');strip(g,x-8,y-47,16,6,'#ffe3a6');
    if(glow){
      g.save();g.globalCompositeOperation='screen';
      const rad=g.createRadialGradient(x,y-32,5,x,y-32,82);
      rad.addColorStop(0,'rgba(255,225,153,.16)');rad.addColorStop(.45,'rgba(245,201,137,.065)');rad.addColorStop(1,'rgba(255,216,139,0)');
      g.fillStyle=rad;g.fillRect(x-82,y-114,164,164);g.restore();
    }
  }
  function campusGround(g,opt){
    const z=opt.zoom,view=opt.view;if(z<.14)return;
    // Small exposed garden and plaza parcels, avoiding the original buildings.
    for(const r of [{x:226,y:1290,w:550,h:360},{x:1090,y:1338,w:620,h:310},
                    {x:1770,y:1370,w:500,h:320},{x:2330,y:1300,w:438,h:420}]){
      if(visible(r,view))patterned(g,'grass',r.x,r.y,r.w,r.h,.24);
    }
    // Public walkway's alternating paving rows and polished edge stones.
    const path={x:891,y:1127,w:115,h:557};
    if(visible(path,view)){
      patterned(g,'stone',path.x,path.y,path.w,path.h,.78);
      strip(g,891,1127,6,555,'#e7d5af');strip(g,1000,1127,6,555,'#a59f8d');
      for(let yy=1146;yy<1660;yy+=48)strip(g,899,yy,100,2,'rgba(255,246,211,.32)');
      for(let yy=1168;yy<1670;yy+=60){strip(g,896,yy,8,8,'#d4c079');strip(g,991,yy,8,8,'#d4c079');}
    }
    // Entrance plaza and marked accessible pedestrian crossing.
    const entry={x:826,y:1630,w:247,h:96};
    if(visible(entry,view)){
      patterned(g,'stone',826,1630,247,96,.82);
      strip(g,828,1630,243,5,'#f4deb2');strip(g,828,1717,243,6,'#858f8c');
      for(let xx=860;xx<1060;xx+=22)strip(g,xx,1680,13,28,'#edebd6');
    }
    // Richer grounds landscaping, all non-collidable visual objects.
    if(z>.23){
      for(const r of planters)if(visible(r,view))planter(g,r);
      for(const [x,y,r] of trees)if(visible({x:x-r*2,y:y-r*2,w:r*4,h:r*4},view))tree(g,x,y,r);
      for(const [x,y] of benches)if(visible({x,y,w:90,h:33},view))bench(g,x,y);
    }
    // Parking plan with differentiated asphalt, bays and accessible marking.
    const lot={x:2306,y:1340,w:440,h:330};
    if(visible(lot,view)){
      patterned(g,'road',lot.x,lot.y,lot.w,lot.h,.25);
      strip(g,lot.x,lot.y,lot.w,4,'#a6b2b4');
      for(let xx=2340;xx<2710;xx+=78){
        strip(g,xx,1373,3,115,'rgba(250,244,210,.56)');
        strip(g,xx,1504,3,116,'rgba(250,244,210,.56)');
      }
      strip(g,2400,1420,31,3,'#7bc1c9');strip(g,2414,1407,3,29,'#7bc1c9');
      if(z>.37){g.font='700 23px system-ui,sans-serif';g.fillStyle='#e0c98d';g.fillText('VISITOR PARKING',2360,1649);}
    }
  }
  function streets(g,opt){
    const z=opt.zoom,view=opt.view;if(z<.13)return;
    // Seam corridor between precinct and first block of Midtown.
    const segment={x:2050,y:1721,w:1850,h:127};
    if(visible(segment,view)){
      patterned(g,'road',segment.x,segment.y,segment.w,segment.h,.21);
      strip(g,segment.x,1722,segment.w,3,'rgba(240,238,211,.23)');
      strip(g,segment.x,1845,segment.w,3,'rgba(39,60,70,.45)');
      strip(g,segment.x,1706,segment.w,5,'rgba(226,217,188,.28)');
      strip(g,segment.x,1852,segment.w,5,'rgba(248,228,191,.24)');
      // Repaint centerline with a warmer, restrained pixel-art reflectance.
      for(let x=2065;x<3900;x+=84)strip(g,x,1782,38,3,'rgba(248,211,129,.44)');
      for(const cx of [2068,2800,3300,3690]){
        if(!visible({x:cx-26,y:1718,w:52,h:134},view))continue;
        for(let k=0;k<5;k++)strip(g,cx-22+k*10,1732,6,101,'rgba(245,237,212,.78)');
        strip(g,cx-29,1718,58,3,'rgba(218,190,128,.64)');
        strip(g,cx-29,1844,58,3,'rgba(218,190,128,.64)');
      }
      for(let x=2180;x<3810;x+=236){
        const h=hash(x,111);strip(g,x+((h%23)-11),1740+(h%45),4,2,'rgba(18,30,44,.19)');
      }
    }
    if(z>.32){
      // Ornamental lampposts, pedestrian-friendly benches and planter rows.
      for(const [x,y] of lights)if(visible({x:x-85,y:y-94,w:170,h:170},view))lamp(g,x,y,0,false);
      for(const [x,y] of wasteBins)if(visible({x:x-20,y:y-26,w:40,h:40},view))bin(g,x,y);
      // Street names on the public-facing sidewalk, not over store facades.
      if(visible({x:2193,y:1660,w:380,h:45},view)){
        // A small real-world street-name placard rather than a giant overlay.
        strip(g,2576,1631,5,31,'#34576a');
        strip(g,2515,1605,133,25,'#264e60');
        g.strokeStyle='#d4b878';g.lineWidth=2;g.strokeRect(2516,1606,131,23);
        g.fillStyle='#ffe9bb';g.font='700 12px Barlow Condensed,system-ui,sans-serif';
        g.textAlign='center';g.fillText('HARBOR AVE EAST',2581,1622);
      }
    }
  }
  function vent(g,x,y,w=82,h=48){
    shadow(g,x,y,w,h);
    strip(g,x,y,w,h,'#52677b');strip(g,x+5,y+5,w-10,h-10,'#9bb0b8');
    strip(g,x+9,y+9,w-18,h-18,'#263d4d');
    for(let yy=y+12;yy<y+h-10;yy+=9)strip(g,x+13,yy,w-26,3,'#617c87');
    strip(g,x+5,y+4,w-9,3,'#e3dfc6');
  }
  function skylight(g,x,y,w=145,h=48){
    shadow(g,x,y,w,h);strip(g,x,y,w,h,'#8198a2');strip(g,x+7,y+7,w-14,h-14,'#203f5a');
    strip(g,x+12,y+9,w-24,5,'rgba(144,215,226,.41)');
    strip(g,x+w/2-2,y+7,4,h-14,'#788f9e');
  }
  function architecture(g,opt){
    const z=opt.zoom;if(z<.14)return;
    const sx=opt.STX,sy=opt.STY,alpha=opt.alpha;
    if(alpha<.14)return;g.save();g.globalAlpha*=Math.min(.94,alpha);
    // The current full-size precinct's roof becomes a real architectural
    // landmark with insulated metal seams, HVAC, skylights and entrance canopy.
    const main={x:sx+18,y:sy+18,w:1127,h:996};
    g.strokeStyle='rgba(190,208,216,.48)';g.lineWidth=9;g.strokeRect(main.x,main.y,main.w,main.h);
    strip(g,main.x+9,main.y+9,main.w-18,9,'rgba(190,210,222,.22)');
    strip(g,main.x+9,main.y+main.h-27,main.w-18,9,'rgba(16,34,52,.33)');
    for(let yy=main.y+78;yy<main.y+main.h-56;yy+=72){
      strip(g,main.x+25,yy,main.w-50,2,'rgba(189,213,221,.24)');
      strip(g,main.x+25,yy+4,main.w-50,3,'rgba(7,30,52,.16)');
    }
    if(z>.23){
      vent(g,sx+190,sy+175,96,64);
      vent(g,sx+850,sy+170,90,54);
      vent(g,sx+835,sy+830,94,68);
      skylight(g,sx+425,sy+145,165,54);
      skylight(g,sx+570,sy+820,146,53);
      strip(g,sx+75,sy+305,6,233,'#718594');strip(g,sx+80,sy+305,5,233,'#263e51');
      for(const k of [336,400,464]){strip(g,sx+79,sy+k,95,7,'#788b92');}
      // Smaller upper garage volume: coherent with the same world footprint.
      for(let yy=sy+725;yy<sy+1135;yy+=62)strip(g,sx+1178,yy,699,4,'rgba(186,211,222,.18)');
      vent(g,sx+1368,sy+760,108,63);vent(g,sx+1645,sy+774,94,55);
    }
    // South entry porch is brightly readable and physically anchored at door.
    shadow(g,sx+460,sy+975,210,64);
    strip(g,sx+465,sy+979,198,48,'#7b8fa0');
    strip(g,sx+472,sy+986,184,29,'#c6d2d4');
    strip(g,sx+471,sy+1011,188,7,'#e0bd7c');
    strip(g,sx+486,sy+1020,10,25,'#263c54');
    strip(g,sx+636,sy+1020,10,25,'#263c54');
    // Original roof signage remains legible; no competing second title.
    g.restore();
  }
  function fallbackBuilding(g,building,zoom){
    if(!building || building.t!=='mtbldg' || zoom<.17) return false;
    const x=Number.isFinite(building.bx)?building.bx:building.x;
    const y=Number.isFinite(building.btop)?building.btop:building.y;
    const w=Number.isFinite(building.bw)?building.bw:building.w;
    const h=Number.isFinite(building.bh)?building.bh:building.h;
    if(![x,y,w,h].every(Number.isFinite)||w<60||h<55)return false;
    shadow(g,x,y,w,h);
    strip(g,x,y+26,w,h-26,'#b6a58e');
    roofTile(g,x-5,y,w+10,Math.max(40,h*.62),'#8b7662','#ab9c83');
    strip(g,x,y+Math.max(42,h*.6),w,11,'#e1cfac');
    const awnY=y+h-47, awnH=18;
    strip(g,x,awnY,w,awnH,'#f2ece0');
    for(let i=0;i<w;i+=24)strip(g,x+i,awnY,12,awnH,((i/24)&1)?'#bd8067':'#477e8d');
    for(let i=16;i<w-15;i+=65){
      strip(g,x+i,awnY+awnH+4,38,30,'#294459');
      strip(g,x+i+4,awnY+awnH+8,30,5,'rgba(130,215,228,.4)');
    }
    strip(g,x+Math.floor(w/2)-19,awnY+awnH+4,38,34,'#5a4b42');
    strip(g,x+Math.floor(w/2)+10,awnY+awnH+14,4,4,'#e6d38b');
    if(zoom>.42){
      g.fillStyle='#fff4d2';g.textAlign='center';g.font='800 18px Barlow Condensed,system-ui,sans-serif';
      g.fillText(String(building.name||building.label||'MIDTOWN').toUpperCase().slice(0,24),x+w/2,awnY-7,w-10);
    }
    return true;
  }
  function atmosphere(g,opt){
    const z=opt.zoom,view=opt.view;if(z<.26)return;
    g.save();g.globalCompositeOperation='screen';
    for(const [x,y] of lights){
      if(!visible({x:x-96,y:y-100,w:192,h:192},view))continue;
      const gradient=g.createRadialGradient(x,y-38,2,x,y-38,88);
      gradient.addColorStop(0,'rgba(255,232,163,.17)');
      gradient.addColorStop(.45,'rgba(248,212,147,.07)');
      gradient.addColorStop(1,'rgba(245,203,138,0)');
      g.fillStyle=gradient;g.fillRect(x-88,y-126,176,176);
    }
    g.restore();
    // Grounded warm shadows create depth; only a few static marks per frame.
    if(z>.42){
      for(const [x,y] of [[905,1709],[2472,1709],[2810,1699]]){
        if(!visible({x:x-32,y:y-8,w:64,h:22},view))continue;
        g.fillStyle='rgba(34,49,61,.22)';g.beginPath();g.ellipse(x,y,28,7,0,0,Math.PI*2);g.fill();
      }
    }
  }
  const modal=document.getElementById('v115Campus');
  if(modal && !document.getElementById('v115ShowcaseTag')){
    const badge=document.createElement('span');badge.id='v115ShowcaseTag';
    badge.textContent='SHOWCASE · PRECINCT → MIDTOWN';modal.appendChild(badge);
    const brand=modal.querySelector('.v115-campus-brand span');
    if(brand)brand.textContent='PRECINCT → MIDTOWN · VISUAL SHOWCASE';
    const note=modal.querySelector('#v115CampusNote');
    if(note)note.textContent='Showcase art pass: detailed roof, streets, foliage and lighting. Mission and patrol driving remain in the classic game.';
  }
  window.ROOKIE_V115_SHOWCASE=Object.freeze({
    version:'115-precinct-midtown-visual-benchmark-1',
    extent:Object.freeze({minX:180,maxX:3900,minY:85,maxY:1900}),
    phases:Object.keys(keepers),
    ground:campusGround,streets,precinct:architecture,buildingFallback:fallbackBuilding,atmosphere,
    inspection:()=>({version:'115-visual-showcase-1',originalAssetsPreferred:true,
      renderingOnly:true,gameplayUnchanged:true,multiplayerDataUnchanged:true,
      zombieOutbreakUntouched:true,detailTileSize:TILE})
  });
})();
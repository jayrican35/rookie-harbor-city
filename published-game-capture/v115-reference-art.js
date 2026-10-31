/* ROOKIE Harbor City — V115 reference-guided city composition, pass 1.
 * Render-only world features for the user's city panorama reference.
 * The exact same objects/coordinates paint the playable exploration canvas
 * and the atlas. No mutation to game state, collision, maps, saves, vehicle,
 * Academy, multiplayer transport or Zombie Outbreak.
 */
(function () {
  'use strict';
  const WORLD=Object.freeze({minX:-3100,minY:0,maxX:9656,maxY:4680});
  const DESIGN=Object.freeze({
    waterfall:{x:-2550,y:560}, mountains:{x:8480,y:630},
    southPark:{x:-1900,y:3430}, marina:{x:5130,y:4290},
    precinct:{x:948,y:1160}, downtown:{x:5820,y:1770},
    lighthouse:{x:7400,y:4430}
  });
  const FORESTS=Object.freeze([
    {id:'waterfall-woods',x:-2970,y:90,w:1980,h:1030,count:116,seed:7},
    {id:'midtown-north-woods',x:2700,y:60,w:2250,h:940,count:123,seed:19},
    {id:'mountain-woods',x:7200,y:40,w:2450,h:890,count:115,seed:31},
    {id:'southwest-park-woods',x:-3020,y:2760,w:2140,h:1440,count:120,seed:43},
    {id:'east-coast-woods',x:7060,y:3110,w:2280,h:1000,count:94,seed:61},
    {id:'south-bay-woods',x:400,y:3000,w:1360,h:1100,count:62,seed:79}
  ]);
  const BUILDING_LOD_COLORS=Object.freeze(['#da9a60','#d7c2a4','#7d8f9c','#c27f70','#e4bf75','#899bb0','#a87f8c']);
  function hash(n){n|=0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return (n^(n>>>16))>>>0;}
  function random(n,s=1){return hash(Math.imul(n,s)+0x9e3779b9)/4294967295;}
  function visible(r,v,pad=120){return !v||r.x<v.x+v.w+pad&&r.x+r.w>v.x-pad&&r.y<v.y+v.h+pad&&r.y+r.h>v.y-pad;}
  function poly(g,pts,fill,stroke,width=2){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
  function line(g,pts,color,width){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  const shore=[[-3100,4270],[-2770,4330],[-2440,4220],[-2170,4338],[-1870,4264],[-1490,4370],[-1050,4240],[-780,4368],[-400,4275],[-50,4300],[310,4200],[690,4294],[1080,4222],[1410,4320],[1810,4220],[2140,4345],[2510,4225],[2820,4280],[3160,4240],[3500,4322],[3880,4222],[4280,4268],[4750,4230],[5270,4235],[5650,4200],[6030,4305],[6420,4160],[6820,4240],[7200,4165],[7650,4265],[8050,4140],[8420,4280],[8880,4100],[9300,4270],[9656,4180]];
  function water(g,opt){
    const view=opt.view,z=opt.zoom;
    if(!visible({x:-3100,y:4110,w:12756,h:570},view))return;
    // Continuous shore spans the playable world from WEST to INDUSTRIAL.
    let grad=g.createLinearGradient(0,4050,0,4680);
    grad.addColorStop(0,'#2ca6b9');grad.addColorStop(.37,'#127caa');grad.addColorStop(1,'#12496e');
    poly(g,shore.concat([[WORLD.maxX,4680],[WORLD.minX,4680]]),grad);
    const beach=shore.map(([x,y])=>[x,y-64-18*Math.sin(x*.0018)]);
    poly(g,beach.concat(shore.slice().reverse()),'#e9d397','#fbf1bc',4);
    line(g,shore.map(([x,y])=>[x,y+10]),'rgba(228,255,246,.91)',12);
    line(g,shore.map(([x,y])=>[x,y+24]),'rgba(108,236,230,.42)',16);
    // High-contrast surf and sparkling water should still read at full zoom.
    const skip=z<.11?15:1;
    for(let i=0;i<115;i+=skip){
      const x=-3020+random(i,19)*12480,y=4370+random(i,41)*295;
      if(!visible({x,y,w:65,h:16},view,30))continue;
      const size=z<.11?40:14+random(i,7)*35;
      g.strokeStyle=i%3?'rgba(147,244,241,.42)':'rgba(246,255,234,.64)';g.lineWidth=z<.1?9:3;
      g.beginPath();g.moveTo(x-size/2,y);g.quadraticCurveTo(x,y-4,x+size/2,y);g.stroke();
    }
  }
  function mountains(g,opt){
    if(!visible({x:7350,y:20,w:2180,h:1000},opt.view))return;
    poly(g,[[7370,960],[7590,650],[7750,530],[7920,760],[8250,240],[8480,535],[8750,160],[9040,565],[9350,380],[9600,980]],'#24475a','#162f46',17);
    poly(g,[[7620,945],[7920,685],[8135,745],[8360,360],[8530,780],[8765,300],[8930,650],[9280,420],[9590,970]],'#486b77','#183d56',6);
    poly(g,[[8070,570],[8250,240],[8430,540],[8340,506],[8260,400],[8170,536]],'#cad4c4','#dee2d3',3);
    poly(g,[[8620,505],[8750,160],[8940,555],[8815,450],[8760,337],[8710,442]],'#e2ddd0','#fcf8df',3);
    poly(g,[[9175,550],[9350,380],[9530,620],[9360,530]],'#d5cdbd','#eee7dc',2);
    if(opt.zoom>.12){
      for(let i=0;i<35;i++){
        const x=7550+random(i,5)*1900,y=510+random(i,3)*430;
        const r=10+random(i,8)*31;
        poly(g,[[x-r,y+r],[x,y-r],[x+r,y+r]],i%3?'#254d47':'#398361');
      }
    }
  }
  function waterfall(g,opt){
    if(!visible({x:-3070,y:110,w:1550,h:1000},opt.view))return;
    poly(g,[[-3100,400],[-2800,485],[-2650,605],[-2360,655],[-2030,830],[-1620,1000],[-1630,1160],[-2150,1030],[-2500,910],[-2830,810],[-3100,750]],'#245c69','#173e4f',18);
    line(g,[[-3100,594],[-2860,640],[-2630,745],[-2360,795],[-2100,940],[-1610,1070]],'#1989a1',155);
    line(g,[[-3100,594],[-2860,640],[-2630,745],[-2360,795],[-2100,940],[-1610,1070]],'#60d3cc',77);
    line(g,[[-3100,582],[-2870,610],[-2600,715],[-2350,766],[-2080,902],[-1640,1035]],'#c6f7eb',16);
    poly(g,[[-2830,330],[-2450,340],[-2410,645],[-2520,820],[-2680,774],[-2820,580]],'#887c67','#5b605a',14);
    poly(g,[[-2670,365],[-2500,360],[-2470,702],[-2580,750]],'#eff5e8','#d7edf1',10);
    for(let i=0;i<12;i++){
      const x=-2655+(i%4)*40,y=450+Math.floor(i/4)*90;
      g.fillStyle=i%3?'rgba(124,228,245,.55)':'rgba(246,254,250,.84)';g.fillRect(x,y,17,92);
    }
    for(let i=0;i<40;i++){
      const x=-2640+random(i,15)*330,y=740+random(i,9)*140;
      g.fillStyle=i%3?'rgba(224,255,247,.66)':'rgba(92,221,232,.55)';g.fillRect(x,y,9+random(i,13)*17,4);
    }
  }
  function tree(g,x,y,r,detail,seed){
    if(detail<.1){g.fillStyle=seed%3?'#1b6b4f':'#3f9968';g.beginPath();g.arc(x,y,r*1.18,0,Math.PI*2);g.fill();return;}
    g.fillStyle='rgba(18,40,34,.30)';g.beginPath();g.ellipse(x+8,y+13,r*.96,r*.48,0,0,Math.PI*2);g.fill();
    g.fillStyle='#574c3e';g.fillRect(x-4,y-5,8,r+17);
    for(let k=0;k<4;k++){
      const xx=x+Math.sin(k*2.8+seed)*r*.43, yy=y+Math.cos(k*2.4+seed)*r*.36;
      g.fillStyle=['#1e6748','#277e51','#369b58','#64b66b'][k];
      g.beginPath();g.arc(xx,yy,r*(.74+(k%3)*.12),0,Math.PI*2);g.fill();
    }
    g.fillStyle='rgba(216,246,129,.38)';g.beginPath();g.arc(x-r*.4,y-r*.42,r*.31,0,Math.PI*2);g.fill();
  }
  function woodland(g,opt){
    const z=opt.zoom, v=opt.view;
    for(const group of FORESTS){
      if(!visible(group,v))continue;
      // A large forest canopy mass gives broad color composition at overview.
      const wide=g.createRadialGradient(group.x+group.w*.48,group.y+group.h*.48,20,
          group.x+group.w*.48,group.y+group.h*.48,Math.max(group.w,group.h)*.62);
      wide.addColorStop(0,'rgba(20,91,57,.70)');wide.addColorStop(.70,'rgba(31,106,62,.55)');wide.addColorStop(1,'rgba(37,94,49,0)');
      g.fillStyle=wide;g.fillRect(group.x,group.y,group.w,group.h);
      const count=z<.095?Math.floor(group.count*.45):group.count;
      for(let i=0;i<count;i++){
        const x=group.x+26+random(i+group.seed,17)*(group.w-52);
        const y=group.y+25+random(i+group.seed,29)*(group.h-50);
        const size=17+random(i+group.seed,31)*24;
        if(!visible({x:x-size,y:y-size,w:size*2,h:size*2},v,10))continue;
        tree(g,x,y,z<.095?size*1.6:size,z,i+group.seed);
      }
    }
  }
  function park(g,opt){
    if(!visible({x:-2820,y:2650,w:1830,h:1450},opt.view))return;
    poly(g,[[-2870,2750],[-2200,2610],[-1510,2680],[-1110,2990],[-1130,3940],[-2080,4080],[-2910,3900]],'#548d55','#306948',22);
    // District-scale park trail — visible from both zoom levels.
    g.strokeStyle='#d6bc86';g.lineWidth=67;g.beginPath();g.moveTo(-2790,3260);g.bezierCurveTo(-2640,2770,-1750,2750,-1680,3230);g.bezierCurveTo(-1450,3800,-2250,3940,-2780,3680);g.stroke();
    g.strokeStyle='rgba(255,249,205,.43)';g.lineWidth=8;g.stroke();
    poly(g,[[-2180,3070],[-1920,2960],[-1700,3080],[-1650,3430],[-1950,3540],[-2260,3360]],'#2386a0','#d1eadc',14);
    if(opt.zoom>.15){
      // Playful field / gazebo feels like a family city without adding a mission.
      g.fillStyle='#e1cda4';g.fillRect(-2690,3630,310,220);
      g.fillStyle='#53925c';g.fillRect(-2660,3660,250,160);
      g.strokeStyle='#f4eacb';g.lineWidth=6;g.strokeRect(-2610,3680,150,120);
      g.fillStyle='#c17b5a';g.beginPath();g.arc(-1290,3600,69,0,7);g.fill();
      g.fillStyle='#efc980';g.beginPath();g.arc(-1290,3600,55,0,7);g.fill();
      g.fillStyle='#9a5539';g.fillRect(-1295,3580,10,90);
    }
  }
  function palm(g,x,y,z,k){
    if(z<.1){g.fillStyle='#1b825e';g.beginPath();g.arc(x,y,22,0,7);g.fill();return;}
    g.strokeStyle='#a77753';g.lineWidth=9;g.beginPath();g.moveTo(x+6,y+32);g.lineTo(x,y-25);g.stroke();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+(k%3)*.06,dx=Math.cos(a),dy=Math.sin(a);
      g.strokeStyle=i%2?'#1e754b':'#41985b';g.lineWidth=12;
      g.beginPath();g.moveTo(x,y-25);g.quadraticCurveTo(x+dx*32,y-40+dy*20,x+dx*58,y-25+dy*42);g.stroke();
    }
  }
  function marina(g,opt){
    const z=opt.zoom;
    if(!visible({x:4250,y:4000,w:3400,h:660},opt.view))return;
    const piers=[4590,4850,5140,5420,5660,5920];
    for(let i=0;i<piers.length;i++){
      const x=piers[i];
      g.fillStyle='rgba(18,46,60,.55)';g.fillRect(x+15,4240,55,385);
      g.fillStyle='#916c49';g.fillRect(x,4210,58,365);
      g.fillStyle='#d7a56b';g.fillRect(x+7,4230,9,335);g.fillRect(x+42,4230,8,335);
      for(let n=0;n<3;n++){
        const y=4330+n*94;
        if(z<.09)continue;
        boat(g,x+(n%2?90:-48),y,n%2?1:-1);
      }
    }
    for(let i=0;i<11;i++){
      const x=3950+i*280, y=4160+40*Math.sin(i*.9);
      if(!visible({x:x-60,y:y-60,w:120,h:120},opt.view,35))continue;
      palm(g,x,y,z,i);
    }
    // Landmark lighthouse uses the same world coordinate at every zoom.
    lighthouse(g,DESIGN.lighthouse.x,DESIGN.lighthouse.y,z);
  }
  function boat(g,x,y,dir){
    g.save();g.translate(x,y);g.rotate(dir*.15);
    poly(g,[[-24,-45],[24,-45],[31,22],[0,42],[-31,22]],'#f9efe0','#355b65',5);
    g.fillStyle='#447d9b';g.fillRect(-20,-14,40,30);g.fillStyle='#fffaf2';g.fillRect(-10,-28,20,24);
    g.restore();
  }
  function lighthouse(g,x,y,z){
    g.fillStyle='#c3bb94';g.beginPath();g.ellipse(x,y+50,110,62,0,0,7);g.fill();
    g.fillStyle='#7a664d';g.fillRect(x-41,y-92,88,120);
    g.fillStyle='#f7eee0';g.fillRect(x-33,y-105,69,123);
    for(let j=0;j<3;j++)g.fillStyle='#b85551',g.fillRect(x-33,y-92+j*42,69,16);
    poly(g,[[x-47,y-112],[x,y-157],[x+51,y-112]],'#ad4e4b','#e3c99c',4);
    g.fillStyle='#feeaa6';g.fillRect(x-18,y-131,39,15);
    if(z>.18){g.fillStyle='#fff7c1';g.beginPath();g.arc(x,y-124,14,0,7);g.fill();}
  }
  function sourceBuildingBox(o){
    const t=o.t||'';
    if(t==='mtbldg')return {x:o.bx??o.x,y:o.btop??o.y,w:o.bw??o.dw,h:o.bh??o.dh};
    if(t==='mchouse')return {x:o.dx??o.x,y:o.dyTop??o.y,w:o.dw??o.w,h:o.dh??o.h};
    if(t==='worldBuilding'||t==='dtBuilding'||t==='bldg'||t==='house')
      return {x:o.x,y:o.y,w:o.w,h:o.h};
    return null;
  }
  function districtBlocks(g,opt){
    // Distant city art must be *derived from the actual playable building
    // footprint*, not an invented screenshot that disappears when zooming.
    if(opt.zoom>.19)return;
    for(const d of opt.districts||[]){
      if(!d||!d.map||!visible({x:d.x,y:d.y,w:d.w,h:d.h},opt.view))continue;
      g.save();g.translate(d.x,d.y);
      let i=0;
      for(const item of d.map.decors||[]){
        const b=sourceBuildingBox(item);i++;
        if(!b||![b.x,b.y,b.w,b.h].every(Number.isFinite)||b.w<20||b.h<20)continue;
        const x=b.x,y=b.y,w=b.w,h=b.h;
        const roof=item.roof||(['#965c4c','#547c91','#cd8e53','#87596e','#6c9a85','#98845f'][i%6]);
        g.fillStyle='rgba(12,33,45,.64)';g.fillRect(x+13,y+11,w,h);
        g.fillStyle=item.c||'#c5a47d';g.fillRect(x+2,y+8,w,h-8);
        g.fillStyle=roof;g.fillRect(x,y,w,h*.80);
        g.fillStyle='rgba(255,232,176,.50)';g.fillRect(x,y+2,w,Math.max(8,Math.min(20,h*.13)));
        g.fillStyle='rgba(16,39,61,.36)';g.fillRect(x+w*.12,y+h*.82,w*.76,h*.09);
        if(opt.zoom>.075){
          g.strokeStyle='rgba(24,49,61,.44)';g.lineWidth=4;
          for(let t=1;t<4;t++){
            g.beginPath();g.moveTo(x+w*t/4,y+8);g.lineTo(x+w*t/4,y+h*.72);g.stroke();
          }
          g.fillStyle='#cadbd0';g.fillRect(x+w*.25,y+h*.79,w*.12,h*.13);
          g.fillRect(x+w*.68,y+h*.79,w*.12,h*.13);
        }
      }
      // Tiny existing flowerbeds and planted trees become lush spot color at
      // citywide zoom rather than disappearing with the normal detail LOD.
      for(const d0 of d.map.decors||[]){
        if(!Number.isFinite(d0.x)||!Number.isFinite(d0.y))continue;
        const t=d0.t||'';
        if(!/tree|palm|flowerbed|planter|fountain/.test(t))continue;
        const r=t==='fountain'?35:t==='flowerbed'?20:29;
        g.fillStyle=t==='fountain'?'#59bfd3':t==='flowerbed'?'#db8db3':'#2e9a60';
        g.beginPath();g.arc(d0.x,d0.y,r,0,Math.PI*2);g.fill();
        g.fillStyle='rgba(255,229,168,.27)';g.beginPath();g.arc(d0.x-r*.18,d0.y-r*.28,r*.36,0,Math.PI*2);g.fill();
      }
      g.restore();
    }
  }
  function skyline(g,opt){
    // City-scale signal: original Downtown buildings remain authoritative at
    // close zoom. The miniature canopy is only a distant LOD embellishment.
    if(opt.zoom>.16||!visible({x:5170,y:1300,w:1300,h:1100},opt.view))return;
    for(let i=0;i<15;i++){
      const x=5190+((i*137)%1150),y=1400+((i*67)%380),w=60+(i%4)*25,h=140+(i%5)*35;
      const c=BUILDING_LOD_COLORS[i%BUILDING_LOD_COLORS.length];
      g.fillStyle='rgba(13,37,57,.50)';g.fillRect(x+14,y+10,w,h);
      g.fillStyle=c;g.fillRect(x,y,w,h);
      g.fillStyle='#253e61';g.fillRect(x,y,w,35);
      g.fillStyle='#d2ecdc';for(let wy=y+50;wy<y+h-14;wy+=28)for(let wx=x+12;wx<x+w-10;wx+=26)g.fillRect(wx,wy,9,13);
    }
  }
  function roadsAndNature(g,opt){
    const z=opt.zoom;
    // Visible parts of coastline and civic landmarks overlay the imported
    // district background but do not move roads, intersections or collisions.
    // Ocean and mountain forest render beneath district art in terrain().
    park(g,opt);marina(g,opt);skyline(g,opt);
    // Park-adjacent palms connect the user's dense coastal concept to gameplay.
    const palms=[[2380,4020],[2720,4120],[3050,4070],[3460,4020],[3950,4080],[6650,4040],[6880,4000]];
    for(let i=0;i<palms.length;i++){
      const [x,y]=palms[i];if(visible({x:x-66,y:y-95,w:132,h:135},opt.view,15))palm(g,x,y,z,i);
    }
  }
  function terrain(g,opt){
    const view=opt.view;
    if(view&&!visible({x:-3100,y:0,w:12756,h:4680},view))return;
    mountains(g,opt);waterfall(g,opt);woodland(g,opt);water(g,opt);
  }
  function gameOverlay(g,opt){roadsAndNature(g,opt);}
  function gameBlocks(g,opt){districtBlocks(g,opt);}
  function atlasTerrain(g,opt){terrain(g,{view:null,zoom:opt.zoom||.12});}
  function atlasLandmarks(g,opt){roadsAndNature(g,{view:null,zoom:opt.zoom||.12});}
  function atlasBlocks(g,opt){districtBlocks(g,{view:null,zoom:opt.zoom||.12,districts:opt.districts});}
  // Distinct preview labelling: this is NOT the classic home-screen game.
  if(typeof document!=='undefined'){
    const modal=document.getElementById('v115Campus');
    if(modal && !document.getElementById('v115ReferenceTag')){
      const tag=document.createElement('span');tag.id='v115ReferenceTag';
      tag.textContent='WORLD ART · REFERENCE PASS 01';modal.appendChild(tag);
      const brand=modal.querySelector('.v115-campus-brand span');
      if(brand)brand.textContent='HARBOR CITY · REFERENCE-GUIDED COMPOSITION';
      const note=modal.querySelector('#v115CampusNote');
      if(note)note.textContent='Citywide art pass: waterfall, mountains, forests, coast, park, marina and actual building footprints. Missions and vehicles remain in the classic game.';
    }
  }
  const FROZEN=Object.freeze({version:'115-reference-composition-1',worldId:'harbor-main',worldBounds:WORLD,
    anchors:DESIGN,referenceName:'user-supplied Harbor City finished-map image',
    renderOnly:true,noCollisionChanges:true,multiplayerTransport:'none',
    featureIds:Object.freeze(['coastal-surf','marina-piers','lighthouse','north-mountains','northwest-waterfall','civic-park','district-forests','downtown-lod'])});
  window.ROOKIE_V115_REFERENCE=Object.freeze({spec:FROZEN,terrain,gameOverlay,gameBlocks,atlasTerrain,atlasLandmarks,atlasBlocks,
    features:()=>FROZEN.featureIds.slice(),
    inspect:()=>({version:FROZEN.version,worldId:FROZEN.worldId,worldBounds:FROZEN.worldBounds,
      sameCoordinatesForAtlasAndGame:true,mutatesGame:false,mutatesZombieOutbreak:false})});
})();
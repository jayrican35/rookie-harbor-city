/* ROOKIE V115 — Seamless Precinct Campus, Phase 2 construction preview.
 * Purpose: physically contiguous 1:1 station rooms, grounds and street with
 * one simulation, one camera, and no screen/map swap at entrance thresholds.
 * This is a connected preview; the optional cruiser reuses the original controller.
 * Never mutates MAPS, the campaign car, Academy or Zombie Outbreak.
 */
(function () {
  'use strict';
  if (!window.HARBOR || !window.HARBOR.worldV115 ||
      typeof MAPS === 'undefined' || !MAPS.station || !MAPS.plaza ||
      !document.querySelector('#mapOverlay .maptools')) return;
  const H=window.HARBOR, ST=MAPS.station, PL=MAPS.plaza;
  let cruiser=null,story=null,storyDispatch=false;
  const WORLD_ID='harbor-main', AREA_ID='precinct-campus-v115';
  const MIN_X=-3100, MIN_Y=0, W=9656,HGT=4680, TILE=32, CHUNK=512;
  // A single authored city graph, derived from the original district MAPS.
  // East/west main-street edges share the same world y=1784. Nothing swaps
  // MAPS or game-state on crossing a neighborhood boundary.
  const DISTRICT_ORIGINS=Object.freeze({
    westfield:{x:-3100,y:1260},residential:{x:-1500,y:1260},
    midtown:{x:2800,y:1260},downtown:{x:5056,y:1283},
    eastside:{x:6556,y:1260},industrial:{x:8156,y:1003},
    northgate:{x:5086,y:183},southbay:{x:2800,y:3220},waterfront:{x:4400,y:3220}
  });
  const districtEntries=Object.entries(DISTRICT_ORIGINS).filter(([id])=>MAPS[id]).map(([id,pos])=>({
    id,x:pos.x,y:pos.y,w:MAPS[id].w,h:MAPS[id].h,map:MAPS[id],
    instanceId:'harbor-main:district:'+id
  }));
  // Road completion: the legacy Midtown landscaping pass placed a 80px
  // bench at (1210,1690). Its real 65.6px collider crossed the newly
  // connected Bayview feeder at world (4050,2950). In the CONNECTED
  // prototype only, move that bench and its matching collider to the open
  // plaza at x=900. Never mutate MAPS.midtown, campaign art, quests or saves.
  const connectedMidtown=districtEntries.find(d=>d.id==='midtown');
  if(connectedMidtown){
    const original=connectedMidtown.map,benchWidth=80*.82;
    const originalColliderX=1210-benchWidth/2,relocatedX=900;
    const oldBench=(original.decors||[]).filter(o=>
      o.t==='landscapeV1'&&o.role==='bench'&&o.x===1210&&o.y===1690);
    const oldSolid=(original.pedSolids||[]).filter(b=>
      Math.abs(b.x-originalColliderX)<.1&&b.y===1680&&
      Math.abs(b.w-benchWidth)<.1&&b.h===12);
    if(oldBench.length!==1||oldSolid.length!==1)
      throw new Error('Midtown bench/road alignment changed: verify connected feeder before release');
    connectedMidtown.map={
      ...original,
      decors:original.decors.map(o=>o===oldBench[0]?{...o,x:relocatedX}:o),
      pedSolids:original.pedSolids.map(b=>b===oldSolid[0]?{...b,x:relocatedX-benchWidth/2}:b)
    };
  }
  // The live Maple collector divides the lower residential block. Keep No. 13
  // east of the road and give all six homes the same visible body width.
  // Move the corresponding foundations and doorstep with their artwork.
  const maple=districtEntries.find(d=>d.id==='residential');
  if(maple){
    const m=maple.map,scale=.75,houseWidth=352;
    const decorMoves=new Map(),solidMoves=new Map();
    const moveSolid=(x,y,w,h,newBox)=>solidMoves.set([x,y,w,h].join(','),newBox);
    for(const house of m.decors.filter(o=>o.t==='mchouse')){
      const {cx,dy,bx,btop}=house,relocate=house.num==='13';
      const center=relocate?1160:cx,front=relocate?1000:dy;
      const placeX=x=>center+(x-cx)*scale,placeY=y=>front+(y-dy)*scale;
      const oldFoot=house.bodyH?Math.round(dy-house.bodyH*.55):btop+4;
      const foot=placeY(oldFoot);
      moveSolid(bx+4,oldFoot,houseWidth-8,dy-oldFoot,{x:placeX(bx)+4,y:foot,w:houseWidth*scale-8,h:front-foot});
      decorMoves.set(house,{...house,x:placeX(house.dx),dx:placeX(house.dx),y:placeY(house.dyTop),
        dyTop:placeY(house.dyTop),dw:house.dw*scale,dh:house.dh*scale,cx:center,dy:front,bx:placeX(bx),btop:placeY(btop),
        ...(house.bodyH?{bodyH:house.bodyH*scale}:{})});
      for(const o of m.decors){
        if(o.t!=='mcprop'||o.x<bx||o.x>=bx+houseWidth)continue;
        const hedge=o.img==='hedge'&&o.y===dy-36;
        const planter=o.img==='planter'&&o.y===(house.bodyH?dy-30:dy-32);
        if(!hedge&&!planter)continue;
        const [anchor,w,h]=hedge?[48,88,12]:[32,54,10];
        const x=placeX(o.x+anchor)-anchor,delta=front-dy;
        const oldY=o.y+(hedge?24:22),oldX=o.x+anchor-w/2;
        moveSolid(oldX,oldY,w,h,{x:x+anchor-w/2,y:oldY+delta,w,h});
        decorMoves.set(o,{...o,x,y:o.y+delta,dy:o.dy+delta});
      }
    }
    for(const [match,dx,dy,solid] of [
      [o=>o.t==='bigtree'&&o.x===1240&&o.y===760,132,36,[1232,754,16,14]],
      [o=>o.t==='mcprop'&&o.img==='bench'&&o.x===1260&&o.y===900,140,-30,[1264,922,56,10]]
    ]){
      const o=m.decors.find(match);
      if(!o)continue;
      const [x,y,w,h]=solid;
      decorMoves.set(o,{...o,x:o.x+dx,y:o.y+dy,...(Number.isFinite(o.dy)?{dy:o.dy+dy}:{})});
      moveSolid(x,y,w,h,{x:x+dx,y:y+dy,w,h});
    }
    const relocateSolids=solids=>solids?.map(b=>solidMoves.get([b.x,b.y,b.w,b.h].join(','))||b);
    maple.map={...m,decors:m.decors.map(o=>decorMoves.get(o)||o),
      solids:relocateSolids(m.solids),pedSolids:relocateSolids(m.pedSolids),
      spots:m.spots.map(o=>o.id==='door13'?{...o,x:1160,y:1020}:o),
      ground:m.ground.map(r=>{
        if(r.x===856&&r.y===636&&r.w===364)return {...r,x:1004,w:304};
        if(r.x===820&&r.y===600&&r.w===36)return {...r,x:1004,y:621,w:28,h:378};
        if(r.x===820&&r.y===962&&r.w===396)return {...r,x:1004,y:982,w:304};
        return r;
      })};
  }
  function inDistrict(d,x,y){return x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h;}
  function districtAt(x,y){
    for(const d of districtEntries)if(inDistrict(d,x,y))return d;
    return null;
  }
  // The atlas and walkable city now use the same authored road plan.
  const roadNetwork=H.worldV115.roadNetwork();
  if(roadNetwork.worldId!==WORLD_ID || roadNetwork.primary.centerY!==1784)
    throw new Error('Connected-road coordinate contract mismatch');
  // The owner-approved west Midtown connection closes the empty boundary
  // between the existing Harbor Avenue, lower avenue and Bayview road.
  // Keep canonical geography immutable: this connected-only link is appended
  // to a copy and feeds the SAME material painter and traffic graph.
  const links=roadNetwork.segments.concat([{id:'midtown-west-connection',x:2644,y:1721,w:156,h:2087,kind:'collector',newRoad:true}]);
  // Recover native district streets omitted by the inter-district graph.
  // These are read-only authored asphalt rectangles, not new roads. Broad
  // parking pads and the protected waterfront are deliberately excluded.
  // Normalize the duplicated Midtown avenue to the canonical curb lines.
  // Its former 192px pad extended through the southern sidewalk and gave
  // the material painter a second, offset lane centre.
  if(connectedMidtown){
    connectedMidtown.map={...connectedMidtown.map,ground:connectedMidtown.map.ground.map(r=>{
      if(r.x===0&&r.y===494&&r.w===2256&&r.h===192)return {...r,y:461,h:127};
      if(r.x===1392&&r.y===686&&r.w===168&&r.h===394)return {...r,y:588,h:492};
      return r;
    }).concat([{x:0,y:588,w:2256,h:98,c:'#b9bec4'}])};
    // Restore street strips after the shared sidewalk band, not beneath it.
    connectedMidtown.map.ground.push({x:1392,y:588,w:168,h:492,c:'#43474e'},
      {x:2048,y:588,w:168,h:512,c:'#43474e'});
  }
  const connectedNorthgate=districtEntries.find(d=>d.id==='northgate');
  if(connectedNorthgate)connectedNorthgate.map={...connectedNorthgate.map,ground:connectedNorthgate.map.ground.map(r=>
    r.x===695&&r.y===843&&r.w===156&&r.h===257?{...r,x:665}:r)};
  const nativeRoadSurfaces=districtEntries.filter(d=>d.id!=='waterfront').flatMap(d=>(d.map.ground||[])
    .filter(r=>['#3d4148','#45484f'].includes(String(r.c).toLowerCase())||String(r.c).toLowerCase()==='#43474e'&&Math.min(r.w,r.h)<=168&&Math.max(r.w,r.h)>=380&&Math.max(r.w,r.h)>=Math.min(r.w,r.h)*2)
    .map((r,i)=>({id:'native:'+d.id+':'+i,x:d.x+r.x,y:d.y+r.y,w:r.w,h:r.h,native:true})));
  const crossings=roadNetwork.crossings;
  const streetRelocations=[];
  // Repair only identified lane intrusions, moving the visible object AND
  // its collider in connected-map copies. Never make buildings passable.
  for(const fix of [
    {id:'midtown',box:[984,472,56,10],match:o=>o.t==='mtprop'&&o.img==='bench'&&o.x===980&&o.y===450},
    {id:'midtown',box:[2012,474,30,10],match:o=>o.t==='rpgProp'&&o.role==='tires'&&o.x===2027},
    {id:'midtown',box:[1653,470,34,10],match:o=>o.t==='rpgProp'&&o.role==='crates'&&o.x===1670&&o.y===480},
    {id:'midtown',box:[1222,1474,16,12],match:o=>o.t==='landscapeV1'&&o.role==='tree'&&o.x===1230&&o.y===1484},
    {id:'downtown',box:[1157,507,96,48],match:o=>o.t==='car'&&o.x===1157&&o.y===507},
    {id:'industrial',box:[307,731,96,48],match:o=>o.t==='car'&&o.x===307&&o.y===731}
  ]){
    const d=districtEntries.find(d=>d.id===fix.id);if(!d)continue;
    const m=d.map,o=m.decors.find(fix.match);
    const [x,y,w,h]=fix.box,equals=s=>s.x===x&&s.y===y&&s.w===w&&s.h===h;
    if(!o||!(m.pedSolids||m.solids).some(equals))throw Error('Street repair source changed: '+fix.id);
    const solids=m.pedSolids||m.solids,roads=[...links,...nativeRoadSurfaces];
    let move=null;
    for(let radius=32;radius<=512&&!move;radius+=32)for(let dy=-radius;dy<=radius&&!move;dy+=32)for(let dx=-radius;dx<=radius;dx+=32){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
      const b={x:x+dx,y:y+dy,w,h},pad=18;
      if(b.x<24||b.y<120||b.x+w>d.w-24||b.y+h>d.h-24)continue;
      const hit=(a,c,p=0)=>a.x<c.x+c.w+p&&a.x+a.w>c.x-p&&a.y<c.y+c.h+p&&a.y+a.h>c.y-p;
      if(roads.some(r=>hit({x:d.x+b.x,y:d.y+b.y,w,h},r,24)))continue;
      if(solids.some(s=>!equals(s)&&hit(b,s,pad)))continue;
      if(m.decors.some(s=>{if(!['worldBuilding','mchouse','mtbldg','dtBuilding','sbart'].includes(s.t))return false;
        return hit(b,{x:s.dx??s.bx??s.x,y:s.dyTop??s.btop??s.y,w:s.dw??s.bw??s.w,h:s.dh??s.bh??s.h},24);}))continue;
      if((m.spots||[]).some(s=>Math.hypot(b.x+w/2-s.x,b.y+h/2-s.y)<80))continue;
      move={dx,dy};break;
    }
    if(!move)throw Error('No safe off-street placement: '+fix.id);
    const shift=s=>equals(s)?{...s,x:s.x+move.dx,y:s.y+move.dy}:s;
    d.map={...m,decors:m.decors.map(s=>s===o?{...s,x:s.x+move.dx,y:s.y+move.dy,...(Number.isFinite(s.dy)?{dy:s.dy+move.dy}:{})}:s),
      pedSolids:m.pedSolids?.map(shift),solids:m.solids?.map(shift)};
    streetRelocations.push({district:d.id,type:o.t,from:{x:d.x+x,y:d.y+y,w,h},to:{x:d.x+x+move.dx,y:d.y+y+move.dy,w,h}});
  }
  // First-block Midtown pilot only. Clone decor AND its exact native collider;
  // original MAPS and all other districts keep their authored definitions.
  if(connectedMidtown){
    let m=connectedMidtown.map;
    const edits=[
      {t:'mtprop',key:'img',role:'lamp',x:1450,y:680,box:[1458,746,8,6]},
      {t:'mtprop',key:'img',role:'bollard',x:1490,y:420,box:[1494,438,8,6]},
      {t:'mtprop',key:'img',role:'bollard',x:2030,y:470,box:[2034,488,8,6]},
      {t:'landscapeV1',key:'role',role:'planter',x:780,y:450,box:[752.12,440,55.76,12],to:[780,414]},
      {t:'rpgProp',key:'role',role:'bicycle',x:960,y:455,box:[930,445,60,10],to:[1340,390]},
      {t:'rpgProp',key:'role',role:'planter',x:1280,y:460,box:[1235,448,90,12],to:[1280,430]},
      {t:'rpgProp',key:'role',role:'planter',x:1625,y:464,box:[1582,452,86,12],to:[1625,432]},
      {t:'rpgProp',key:'role',role:'planter',x:2020,y:464,box:[2000,452,40,12],to:[2020,432]},
      {t:'mtprop',key:'img',role:'bench',x:820,y:610,box:[824,632,56,10],to:[820,680]},
      {t:'rpgProp',key:'role',role:'hedge',x:1480,y:1080,box:[1425,1068,110,12]},
      {t:'rpgProp',key:'role',role:'hedge',x:1370,y:1080,box:[1315,1068,110,12]},
      {t:'rpgProp',key:'role',role:'hedge',x:1480,y:1108,box:[1425,1096,110,12]},
      {t:'rpgProp',key:'role',role:'hedge',x:1370,y:1108,box:[1315,1096,110,12]},
      {t:'rpgProp',key:'role',role:'shade',x:1200,y:1054,box:[1193,1042,14,12]},
      {t:'rpgProp',key:'role',role:'shade',x:1890,y:1040,box:[1883,1028,14,12]},
      {t:'rpgProp',key:'role',role:'shade',x:1170,y:1000,box:[1163,988,14,12],to:[1260,1050]},
      {t:'rpgProp',key:'role',role:'shade',x:1834,y:1018,box:[1827,1006,14,12],to:[1870,1050]},
      {t:'rpgProp',key:'role',role:'planter',x:1220,y:1048,box:[1174,1036,92,12],to:[1340,1052]},
      {t:'car',x:1314,y:822,box:[1314,822,48,96],to:[1202,774]},
      {t:'car',x:1578,y:822,box:[1578,822,48,96],to:[1858,1008],size:[96,48]}
    ];
    for(const e of edits){
      const obj=m.decors.find(o=>o.t===e.t&&o.x===e.x&&o.y===e.y&&(!e.key||o[e.key]===e.role));
      if(!obj)throw Error('Midtown pilot source changed: '+JSON.stringify(e));
      const equal=s=>e.box.every((v,i)=>v===s[['x','y','w','h'][i]]);
      const shift=s=>e.to?{...s,x:s.x+e.to[0]-e.x,y:s.y+e.to[1]-e.y,...(e.size?{w:e.size[0],h:e.size[1]}:{})}:null;
      const solids=arr=>arr?.flatMap(s=>equal(s)?(e.to?[shift(s)]:[]):[s]);
      m={...m,decors:m.decors.flatMap(o=>o!==obj?[o]:e.to?[{...o,x:e.to[0],y:e.to[1],...(e.size?{w:e.size[0],h:e.size[1]}:{}),...(Number.isFinite(o.dy)?{dy:o.dy+e.to[1]-e.y}:{})}]:[]),solids:solids(m.solids),pedSolids:solids(m.pedSolids)};
    }
    // Replace the former overlapping parking greenery with authored beds.
    // Exact native footprints are retired with their corresponding objects.
    const retired=[];
    m={...m,decors:m.decors.filter(o=>{
      if(o.t==='rpgProp'&&((o.role==='hedge'&&o.y>=1080&&o.y<=1108&&o.x>=1200&&o.x<=1900)||
        (['shade','planter'].includes(o.role)&&o.y>=760&&o.y<=1080&&o.x>=1160&&o.x<=1900))){
        retired.push({x:o.x-(o.role==='shade'?7:o.w/2),y:o.y-12,w:o.role==='shade'?14:o.w,h:12});return false;
      }return true;
    })};
    const isRetired=s=>retired.some(r=>['x','y','w','h'].every(k=>Math.abs(r[k]-s[k])<.001));
    m={...m,solids:m.solids.filter(s=>!isRetired(s)),pedSolids:m.pedSolids.filter(s=>!isRetired(s))};
    const props=[],newSolids=[];
    function civic(file,x,y,w,h,fw,fh=12,banner=false){
      props.push({t:'midtownProp',file,x,y,w,h,dy:y,banner});
      if(fw)newSolids.push({x:x-fw/2,y:y-fh,w:fw,h:fh});
    }
    // Reuse the approved warm lamp/bench sprites at the original native feet.
    m.decors=m.decors.map(o=>{
      if(o.t==='mtprop'&&o.img==='lamp'&&o.y<1100)return {t:'midtownProp',file:'community-walk/lamp.png',x:o.x+12,y:o.y+70,w:30,h:117,dy:o.y+70};
      if(o.t==='rpgProp'&&o.role==='lamp'&&o.y<1100)return {t:'midtownProp',file:'community-walk/lamp.png',x:o.x,y:o.y,w:30,h:117,dy:o.y};
      if(o.t==='mtprop'&&o.img==='bench'&&o.y>588&&o.y<750)return {t:'midtownProp',file:'community-walk/bench.png',x:o.x+32,y:o.y+30,w:92,h:62,dy:o.y+30};
      return o;
    });
    civic('community-walk/tree_flowering.png',1120,714,92,160,38,14);
    civic('community-walk/tree.png',1780,714,120,163,40,14);
    civic('community-walk/tree_flowering.png',1976,720,88,153,36,14);
    for(const [x,y,w]of [[1256,712,144],[1768,724,144],[1900,704,104],[1198,1110,100],[1312,1110,96],[1648,1110,100],[1932,1110,96]])
      civic('community-walk/planter.png',x,y,w,Math.round(w*52/188),w-10,12);
    for(const [x,y]of [[1360,438],[1592,438],[2016,438],[1356,704],[1632,704],[1936,704]])civic('community-walk/lamp.png',x,y,30,117,10,8,true);
    // Corner planting frames the new street without narrowing its sidewalk.
    civic('community-walk/tree_flowering.png',56,760,88,153,30,12);
    civic('community-walk/tree.png',56,1060,100,136,32,12);
    for(const y of [626,1150])civic('community-walk/lamp.png',56,y,30,117,10,8);
    for(const x of [1250,1310,1690,1780,1870])civic('community-walk/hedge.png',x,1110,90,30,82,10);
    for(const x of [1162,1986])for(let y=790;y<=1060;y+=34)civic('community-walk/shrub.png',x,y,32,30,28,10);
    civic('community-walk/tree.png',1788,942,112,152,0);
    civic('community-walk/flower_patch.png',1788,948,90,36,0);
    civic('community-walk/lamp_short.png',1748,940,22,58,0);
    civic('community-walk/lamp_short.png',1828,940,22,58,0);
    civic('midtown/cafe_patio_set.webp',454,1102,128,121,100,54);
    civic('midtown/cafe_patio_set.webp',636,1102,128,121,100,54);
    for(const [x,y]of [[454,1120],[636,1120]])civic('community-walk/planter.png',x,y,124,34,114,12);
    // Additional parked cars use the same existing vehicle sprites and depth queue.
    for(const o of [{t:'car',x:1288,y:982,w:48,h:96,c:'#5a5a52'},
      {t:'car',x:1858,y:746,w:96,h:48,c:'#c5a975'}]){props.push(o);newSolids.push({x:o.x,y:o.y,w:o.w,h:o.h});}
    const island={x:1732,y:894,w:112,h:62};newSolids.push({...island});
    m={...m,decors:m.decors.concat(props),solids:m.solids.concat(newSolids),pedSolids:m.pedSolids.concat(newSolids)};
    // Keep 48px pedestrian strips and an unobstructed side entrance to each
    // half of the existing shared lot; the through-road is never repurposed.
    m={...m,ground:[...m.ground.filter(r=>!(r.x===1500&&r.y===686&&r.w===150&&r.h===104)&&!(r.x===1180&&r.y===790&&r.w===780&&r.h===270)),
        {x:1392,y:1080,w:168,h:136,c:'#43474e'},
        {x:1376,y:1080,w:16,h:136,c:'#b9bec4'},{x:1560,y:1080,w:16,h:136,c:'#b9bec4'}],
      connectedParking:{reference:true,lots:[{x:1180,y:758,w:180,h:326,side:'right'},{x:1608,y:730,w:360,h:354,side:'left'}],
        bays:[...[1190,1274].flatMap(x=>[{x,y:768,w:72,h:104},{x,y:976,w:72,h:104,angle:Math.PI}]),
          ...[746,826,1002].map(y=>({x:1856,y,w:100,h:68,angle:Math.PI/2})),
          ...[746,1002].map(y=>({x:1620,y,w:100,h:68,angle:-Math.PI/2}))],
        entrances:[{x:1360,y:880,w:32,h:96},{x:1560,y:880,w:48,h:124}],
        islands:[island],terraces:[{x:1168,y:676,w:196,h:54},{x:1608,y:676,w:400,h:54}],
        crossings:[{x:1476,y:524},{x:2132,y:524}]}};
    connectedMidtown.map=m;
    // The source street stopped 136px short of the existing southern road.
    // Register only that missing asphalt so rendering and routing agree.
    nativeRoadSurfaces.push({id:'native:midtown:parking-connection',x:connectedMidtown.x+1392,y:connectedMidtown.y+1080,w:168,h:136,native:true});
  }
  // These legacy fenceH lines have no painter in the connected presentation.
  // Retire only their exact thin colliders, leaving visible fences, walls,
  // buildings, street furniture and waterfront railings authoritative.
  const retiredSidewalkBarriers=[];
  for(const d of districtEntries){
    if(d.id==='waterfront')continue;
    const fences=(d.map.decors||[]).filter(o=>o.t==='fenceH');
    const retired=b=>fences.some(o=>b.x===o.x&&b.y===o.y-3&&b.w===o.w&&b.h===6);
    for(const b of d.map.pedSolids||[])if(retired(b))retiredSidewalkBarriers.push({district:d.id,x:d.x+b.x,y:d.y+b.y,w:b.w,h:b.h});
    d.map={...d.map,decors:d.map.decors.filter(o=>o.t!=='fenceH'),
      solids:d.map.solids?.filter(b=>!retired(b)),pedSolids:d.map.pedSolids?.filter(b=>!retired(b))};
  }
  const linkCollision = []; // Roads are traversable, never scene exits.
  // Keep the authored parked-car footprint and art, but share its live pose
  // with the impact extension instead of leaving an invisible static copy.
  const parkedBodies=[],movableParked=[],parkedByObject=new WeakMap();let collisionOwner=null;
  if(window.ROOKIE_MAIN_CITY_ACTIVE)for(const d of districtEntries)for(const o of d.map.decors||[]){if(o.t!=='car'||window.ROOKIE_V116_MARINA?.ownsDecor?.(d.id,o))continue;
    const w=o.w||70,h=o.h||36,dir=['up','down','left','right'].includes(o.dir)?o.dir:w>=h?'right':'down',horizontal=dir==='right'||dir==='left';
    const body={id:'parked:'+d.id+':'+parkedBodies.length,x:d.x+(o.x||0)+w/2,y:d.y+(o.y||0)+h/2,angle:({right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[dir]),dir,length:horizontal?w:h,width:horizontal?h:w,kind:o.police?'patrol':o.kind==='delivery'?'delivery':'civilian',color:o.c,parked:true};
    body.cos=Math.cos(body.angle);body.sin=Math.sin(body.angle);body.home={x:body.x,y:body.y,angle:body.angle};parkedBodies.push(body);parkedByObject.set(o,body);
  }
  function parkedSolid(d,b){return window.ROOKIE_MAIN_CITY_ACTIVE&&(d.map.decors||[]).some(o=>parkedByObject.has(o)&&Math.abs((o.x||0)-b.x)<1&&Math.abs((o.y||0)-b.y)<1&&Math.abs((o.w||70)-b.w)<1&&Math.abs((o.h||36)-b.h)<1);}
  const districtSolids=[],vehicleOnlySolids=[];
  for(const d of districtEntries){
    const solids = d.map.pedSolids || d.map.solids || [];
    for(const b of solids){
      if(!b||!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(b.w)||!Number.isFinite(b.h))continue;
      if(b.w<=0||b.h<=0||parkedSolid(d,b))continue;
      districtSolids.push({x:d.x+b.x,y:d.y+b.y,w:b.w,h:b.h,id:d.id});
    }
    // Native vehicle solids also include thin visible posts that walkers may
    // step around. Reuse those existing shapes rather than blocking pavement.
    for(const b of d.map.solids||[])if(!parkedSolid(d,b)&&!solids.some(p=>p.x===b.x&&p.y===b.y&&p.w===b.w&&p.h===b.h))
      vehicleOnlySolids.push({x:d.x+b.x,y:d.y+b.y,w:b.w,h:b.h,id:d.id});
  }
  const STX=380, STY=96, PLX=148, PLY=600;
  const FRONT={x:STX+568,y:STY+1028}, GARAGE={x:STX+1538,y:STY+1160};
  const rect=(r,ox,oy)=>({x:r.x+ox,y:r.y+oy,w:r.w,h:r.h});
  // The canonical first case puts its refrigerator and staff in this wing.
  // Restore a physical room and doorway instead of retaining the old void.
  const stationRooms=ST.rooms.concat([{x:1560,y:12,w:364,h:624,label:'BREAK ROOM',fill:'#d6d0bb'}]);
  const stationWalls=ST.walls.flatMap(r=>r.x===1548&&r.y===0&&r.h===648?
    [{...r,h:194},{...r,y:270,h:378}]:[r]).concat([{x:1924,y:0,w:12,h:648},{x:1560,y:636,w:364,h:12}]);
  const roomRects=stationRooms.map(r=>rect(r,STX,STY));
  const walls=stationWalls.map(r=>rect(r,STX,STY));
  const furniture=ST.furn.filter(f=>f.solid).map(f=>rect(f,STX,STY));
  const collision=walls.concat(furniture,[{x:STX+1780,y:STY+64,w:106,h:30},{x:STX+1600,y:STY+64,w:30,h:26},{x:STX+1690,y:STY+330,w:132,h:52},{x:STX+1785,y:STY+420,w:90,h:34}]);
  const worldSpots=ST.spots.filter(s=>s.id!=='stationDoor'&&s.id!=='garageDoor')
    .map(s=>({id:'station:'+s.id,areaId:'station',x:STX+s.x,y:STY+s.y,label:s.label}));
  worldSpots.push({id:'campus:front',areaId:'precinct-campus',x:FRONT.x,y:FRONT.y+54,label:'Precinct 9 front entrance'},
    {id:'campus:garage',areaId:'precinct-campus',x:GARAGE.x,y:GARAGE.y+60,label:'Precinct garage door'},
    {id:'campus:road',areaId:'precinct-campus',x:948,y:1738,label:'Harbor Avenue — connects through city districts'});
  const npcActors=ST.npcs.map((n,i)=>({...n,id:'station-npc:'+i,source:n,storyStation:true,x:n.x+STX,y:n.y+STY}));
  npcActors.push({id:'campus-npc:diaz',name:'OFCR. DIAZ',color:'#44557a',hat:true,x:PLX+960,y:PLY+640});
  for(const d of districtEntries){
    for(const sp of d.map.spots||[]){
      if(sp.arcChapter!==undefined)continue;
      if(sp.to||!Number.isFinite(sp.x)||!Number.isFinite(sp.y))continue;
      worldSpots.push({id:d.id+':'+sp.id,areaId:d.id,x:d.x+sp.x,y:d.y+sp.y,label:sp.label||sp.id});
    }
    for(const [i,n] of (d.map.npcs||[]).entries()){
      npcActors.push({id:d.id+':npc:'+i,name:n.name,color:n.color,hat:n.hat,x:d.x+n.x,y:d.y+n.y});
    }
  }
  let marinaActorsAdded=false;
  function attachMarinaActors(){
    const marina=window.ROOKIE_V116_MARINA;
    if(!marina||marinaActorsAdded)return;
    for(const a of marina.actors)npcActors.push(a);
    for(const sp of marina.interactions)worldSpots.push(sp);
    marinaActorsAdded=true;
  }
  const idOf=(x,y)=>WORLD_ID+':'+Math.floor(x/CHUNK)+':'+Math.floor(y/CHUNK);
  function chunkAt(x,y){return {id:idOf(x,y),x:Math.floor(x/CHUNK)*CHUNK,y:Math.floor(y/CHUNK)*CHUNK,w:CHUNK,h:CHUNK};}
  function chunkWindow(x,y,viewW,viewH){
    const arr=[];const x0=Math.max(Math.floor(MIN_X/CHUNK),Math.floor(x/CHUNK)),y0=Math.max(0,Math.floor(y/CHUNK));
    const x1=Math.min(Math.floor((W-1)/CHUNK),Math.floor((x+Math.max(0,viewW))/CHUNK));
    const y1=Math.min(Math.floor((HGT-1)/CHUNK),Math.floor((y+Math.max(0,viewH))/CHUNK));
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)arr.push(WORLD_ID+':'+cx+':'+cy);
    return arr;
  }
  function circleHitsRect(x,y,radius,b){
    const px=Math.max(b.x,Math.min(b.x+b.w,x)),py=Math.max(b.y,Math.min(b.y+b.h,y));
    return (x-px)*(x-px)+(y-py)*(y-py) < radius*radius;
  }
  // Static connected geometry is indexed once. Moving traffic, actors, water
  // and Marina ownership remain live checks; no result cache hides changes.
  function buildSolidIndex(boxes){
    const cells=new Map();
    for(const b of boxes)for(let cy=Math.floor(b.y/192);cy<=Math.floor((b.y+b.h)/192);cy++)
      for(let cx=Math.floor(b.x/192);cx<=Math.floor((b.x+b.w)/192);cx++){
        const key=cx+','+cy;let list=cells.get(key);if(!list)cells.set(key,list=[]);list.push(b);
      }
    return cells;
  }
  const districtSolidIndex=buildSolidIndex(districtSolids),vehicleSolidIndex=buildSolidIndex(vehicleOnlySolids);
  function indexedSolidHit(index,x,y,r){
    for(let cy=Math.floor((y-r)/192);cy<=Math.floor((y+r)/192);cy++)
      for(let cx=Math.floor((x-r)/192);cx<=Math.floor((x+r)/192);cx++){
        const boxes=index.get(cx+','+cy);if(!boxes)continue;
        for(const b of boxes)if(circleHitsRect(x,y,r,b)&&!window.ROOKIE_V116_MARINA?.ownsSolid?.(b)&&!story?.ownsSolid(b))return true;
      }
    return false;
  }
  function blocked(x,y,r=12,ignoreCruiser=false,vehicle=false,ignoreTraffic=false){
    if(H.campaignScenes?.vehicleBlocks(x,y,r))return true;
    // Broad rejection first: ownership only matters for an intersecting box.
    // The ownership result and precise circle collision rules are unchanged.
    if(vehicle&&indexedSolidHit(vehicleSolidIndex,x,y,r))return true;
    if(!ignoreCruiser&&cruiser?.blocksWalker(x,y,r))return true;
    if(x<MIN_X+r||y<MIN_Y+r||x>W-r||y>HGT-r)return true;
    // Outside the precinct, preserve each district's original solid geometry.
    // Never let a hidden exterior district building block the rebuilt station.
    if(!districtAt(x,y)){
      for(let i=0;i<collision.length;i++)if(circleHitsRect(x,y,r,collision[i]))return true;
    } else {
      if(indexedSolidHit(districtSolidIndex,x,y,r))return true;
    }
    if(story?.collides(x,y,r))return true;
    // V116 only adds solid coastal structures/water, never replaces legacy solids.
    const marina=window.ROOKIE_V116_MARINA;
    if(marina&&marina.blocksProp(x,y,r))return true;
    // Citywide coastline uses the SAME player collider. No walking on newly
    // extended water just outside the original marina material rectangle.
    if(window.ROOKIE_V127_CITY?.waterBlocked(x,y))return true;
    // World Completion: authored-feeling new groves are physical at their trunk
    // feet, and use the SAME player radius and native collision response.
    if(window.ROOKIE_V127_CITY?.scenicBlocked(x,y,r,districtEntries))return true;
    if(!ignoreTraffic&&trafficBlocked(x,y,r))return true;
    // The blank northeast corner of the irregular station footprint is not
    // usable interior. Existing station west/east/south wall gaps stay real.
    return false;
  }
  // Read-only browser QA aid: explain actual collider ownership when an
  // apparently open new street is impassable. Never used by normal gameplay.
  function roadCollisionDiagnostic(x,y,r=12){
    if(!/[?&]pilotQA=1(?:&|$)/.test(window.location.search))return null;
    const district=districtAt(x,y);
    const raw=(!district?collision:districtSolids).filter(b=>
      (district&&!window.ROOKIE_V116_MARINA?.ownsSolid?.(b))||!district).filter(b=>circleHitsRect(x,y,r,b));
    return {x,y,district:district?.id||null,
      bounds:x<MIN_X+r||y<MIN_Y+r||x>W-r||y>HGT-r,
      solidHits:raw.slice(0,12).map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,id:b.id||'precinct'})),
      vehicleHits:vehicleOnlySolids.filter(b=>circleHitsRect(x,y,r,b)).map(b=>({...b})),
      marina:!!window.ROOKIE_V116_MARINA?.blocksProp(x,y,r),
      water:!!window.ROOKIE_V127_CITY?.waterBlocked(x,y),
      trees:!!window.ROOKIE_V127_CITY?.scenicBlocked(x,y,r,districtEntries),
      traffic:trafficBlocked(x,y,r),result:blocked(x,y,r)};
  }
  // A small set of real pedestrian routines brings life to connected districts.
  // Borrow the already-loaded V123 Marina WALK atlases and the existing actor
  // queue. Movement is advanced inside simulate(dt); no parallel game loop.
  // Marina's own actors, patrols, interiors and mission data are not changed.
  const ambientRoutes=[],ambientSpeech={
    westfield:'Beautiful morning for a walk through Westfield.',
    residential:'Just heading home. Have a good shift, officer.',
    midtown:'Every day there is something new happening on this block.',
    downtown:'The crosswalk was clear when I came through.',
    eastside:'Nice weather for a little walk around the neighborhood.',
    industrial:'Delivery should be around the corner shortly.',
    northgate:'Those trees make this part of town peaceful.',
    southbay:'The waterfront looks beautiful this afternoon.'
  };
  // First comic presentation pilot: one civilian, existing art/routine and remark.
  // No quest, save, collision or named-character data is replaced.
  if(typeof window!=='undefined'&&window.ROOKIE_COMIC?.enabled()){
    const a={id:'ambient:precinct:visitor',name:'Precinct visitor',npcStyle:3,x:1240,y:1355,
      dir:'right',moving:false,distance:0,speed:22,route:[[1240,1355],[1335,1355]]};
    const sp={id:a.id,label:'Talk to precinct visitor',x:a.x,y:a.y,text:ambientSpeech.residential,ambientActor:a};
    a.interaction=sp;ambientRoutes.push(a);npcActors.push(a);worldSpots.push(sp);
  }
  if(typeof window!=='undefined'&&window.ROOKIE_CHICKEN){
    const a=window.ROOKIE_CHICKEN.createActor();
    const sp={id:a.id,label:'Talk to Chicken',x:a.x,y:a.y,text:'I DEMAND RESPECT!',ambientActor:a};
    a.interaction=sp;ambientRoutes.push(a);npcActors.push(a);worldSpots.push(sp);
  }
  if(typeof window!=='undefined'&&window.ROOKIE_BANANA){
    const a=window.ROOKIE_BANANA.createActor();
    const sp={id:a.id,label:'Talk to Banana',x:a.x,y:a.y,text:"You're dressed like lunch.",ambientActor:a};
    a.interaction=sp;ambientRoutes.push(a);npcActors.push(a);worldSpots.push(sp);
  }
  let ambientInit=0;
  function safeStreetSegment(x1,y1,x2,y2){
    const length=Math.hypot(x2-x1,y2-y1);
    if(length<50||length>150)return false;
    for(let i=0;i<=10;i++){
      const t=i/10;
      if(blocked(x1+(x2-x1)*t,y1+(y2-y1)*t,14))return false;
    }
    return true;
  }
  function prepareDistrictPedestrians(d){
    if(!d||d.id==='waterfront'||!ambientSpeech[d.id])return;
    const candidates=[[.26,.36],[.69,.60],[.38,.74],[.56,.28]];
    const offsets=[[0,0],[-78,0],[0,78],[78,0],[0,-78]];
    let added=0;
    for(const [fx,fy] of candidates){
      if(added>=2)break;
      let found=null;
      for(const [ox,oy] of offsets){
        const x=Math.round(d.x+d.w*fx+ox),y=Math.round(d.y+d.h*fy+oy);
        // Remain inside this district; don't spawn pedestrians in Marina.
        if(x<d.x+110||x>d.x+d.w-110||y<d.y+110||y>d.y+d.h-110)continue;
        for(const [rx,ry] of [[95,0],[0,95],[-95,0],[0,-95]]){
          const x2=x+rx,y2=y+ry;
          if(x2<d.x+80||x2>d.x+d.w-80||y2<d.y+80||y2>d.y+d.h-80)continue;
          if(!safeStreetSegment(x,y,x2,y2))continue;
          found={x,y,x2,y2};break;
        }
        if(found)break;
      }
      if(!found)continue;
      const idx=ambientRoutes.length;
      const actor={id:'ambient:'+d.id+':'+added,name:'Pedestrian',npcStyle:(idx%3===0?2:3),
        x:found.x,y:found.y,dir:found.x2>found.x?'right':found.x2<found.x?'left':found.y2>found.y?'down':'up',
        moving:false,distance:idx*13,route:[[found.x,found.y],[found.x2,found.y2]],speed:22+(idx%4)*5};
      const spot={id:actor.id,label:'Talk to pedestrian',x:actor.x,y:actor.y,
        text:ambientSpeech[d.id],ambientActor:actor};
      actor.interaction=spot;
      ambientRoutes.push(actor);npcActors.push(actor);worldSpots.push(spot);added++;
    }
    if(d.id==='midtown'&&!/[?&]banter=off(?:&|$)/.test(location.search))window.ROOKIE_BANTER?.arrange(ambientRoutes.find(a=>a.id==='ambient:midtown:0'),ambientRoutes.find(a=>a.id==='ambient:midtown:1'),safeStreetSegment);
  }
  function stepAmbientPedestrians(dt){
    // Spread district placement across simulation frames to avoid a long
    // initialization hitch on midrange mobile phones.
    if(ambientInit<districtEntries.length)prepareDistrictPedestrians(districtEntries[ambientInit++]);
    for(const a of ambientRoutes){
      if(typeof window!=='undefined'&&window.ROOKIE_PARKING_ENCOUNTER?.holds(a)){a.moving=false;continue;}
      if(a.id==='npc_chicken'&&!window.ROOKIE_PARKING_ENCOUNTER?.controlsActor(a)&&window.ROOKIE_CHICKEN?.talking()){a.moving=false;continue;}
      if(a.id==='npc_banana'&&!window.ROOKIE_PARKING_ENCOUNTER?.controlsActor(a)&&window.ROOKIE_BANANA?.talking()){a.moving=false;continue;}
      // Waypoint zero is the return leg, not an unset target.
      const target=a.route[a.targetIndex??1],vx=target[0]-a.x,vy=target[1]-a.y;
      const remain=Math.hypot(vx,vy),step=Math.min(remain,a.speed*Math.min(.05,Math.max(0,dt)));
      if(remain<1.5){a.targetIndex=a.route.length>2?((a.targetIndex??1)+1)%a.route.length:(a.targetIndex??1)===1?0:1;a.moving=false;continue;}
      const nx=a.x+vx/remain*step,ny=a.y+vy/remain*step;
      // Collision remains authoritative and catches late-loaded scenery.
      if(blocked(nx,ny,13)){a.targetIndex=a.route.length>2?((a.targetIndex??1)+1)%a.route.length:(a.targetIndex??1)===1?0:1;a.moving=false;continue;}
      a.dir=Math.abs(vx)>=Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');
      a.x=nx;a.y=ny;a.distance+=step;a.moving=step>.03;
      a.interaction.x=a.x;a.interaction.y=a.y;
    }
  }
  function interiorRoom(x,y){
    for(let i=0;i<roomRects.length;i++){
      const r=roomRects[i];if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)return stationRooms[i].label;
    }
    return null;
  }

  // World Completion: bounded non-interactive street traffic on the ONE native
  // Harbor Avenue road graph. Existing main-campaign driving is untouched.
  // Cars share this simulation clock and depth queue, with zero new RAF loops.
  const streetTraffic=[];
  let streetTrafficInitialized=false,trafficRouter=null,trafficActors=[],trafficPlayer=null;
  function initializeStreetTraffic(){
    if(streetTrafficInitialized)return;
    streetTrafficInitialized=true;
    if(/[?&]pilotQA=1(?:&|$)/.test(window.location?.search||'')&&/[?&]traffic=off(?:&|$)/.test(window.location?.search||''))return;
    const navigation=window.ROOKIE_CITY_TRAFFIC;if(!navigation)return;
    trafficRouter=navigation.create({roads:[...links,...nativeRoadSurfaces],anchors:crossings,fleet:streetTraffic,
      blocked:(x,y,r)=>blocked(x,y,r,true,true,true),districtAt:(x,y)=>districtAt(x,y)?.id||'precinct',
      actors:()=>trafficActors,player:()=>trafficPlayer,cruiser:()=>cruiser,impacts:()=>H.cityCollisions,parked:()=>movableParked.concat(H.campaignScenes?.vehicles()||[]),
      view:()=>({x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom})});
  }
  function stepStreetTraffic(dt){
    initializeStreetTraffic();
    trafficActors=npcActors.concat(window.ROOKIE_V133_PRECINCT?.actors?.(performance.now()).filter(a=>!story?.duplicate(a))||[]);
    trafficPlayer={x:campus.x,y:campus.y,driving:!!cruiser?.active()};
    trafficRouter?.step(dt);
  }
  function trafficBlocked(x,y,r=12){
    for(const car of streetTraffic.concat(parkedBodies)){
      const dx=x-car.x,dy=y-car.y;if(Math.abs(dx)>car.length/2+19+r||Math.abs(dy)>car.length/2+19+r)continue;
      const c=car.cos,s=car.sin;
      const lx=dx*c+dy*s,ly=-dx*s+dy*c,ex=Math.max(0,Math.abs(lx)-car.length/2),ey=Math.max(0,Math.abs(ly)-(car.width||38)/2);
      if(ex*ex+ey*ey<r*r)return true;
    }
    return false;
  }
  function drawStreetTraffic(g,car){
    if(campus.zoom<.19)return;
    if(window.ROOKIE_V135_WALL_KIT?.drawPilotVehicle?.(g,car))return;
    const dir=car.dir||'right';
    g.save();g.translate(car.x,car.y);
    g.rotate(dir==='left'?Math.PI:dir==='down'?Math.PI/2:dir==='up'?-Math.PI/2:0);
    g.fillStyle='rgba(9,25,36,.34)';g.beginPath();g.ellipse(0,6,48,20,0,0,Math.PI*2);g.fill();
    g.fillStyle='#192b34';for(const px of [-29,24])for(const py of [-19,13])g.fillRect(px,py,13,7);
    const long=car.kind==='delivery',bodyW=long?104:86,half=bodyW/2;
    g.fillStyle='#1f3442';g.fillRect(-half-2,-17,bodyW+4,34);
    g.fillStyle=car.kind==='patrol'?'#e6e4d7':car.color;g.fillRect(-half,-15,bodyW,30);
    g.fillStyle='rgba(255,234,188,.25)';g.fillRect(-half+4,-13,bodyW-8,3);
    g.fillStyle='rgba(20,43,53,.24)';g.fillRect(-half+4,10,bodyW-8,3);
    g.fillStyle='#294957';
    if(long){
      g.fillRect(-half+10,-12,49,24);
      g.fillStyle='#9eb5b6';g.fillRect(-half+60,-10,23,20);
    }else{
      g.fillRect(-17,-12,36,24);
      g.fillStyle='#83abb6';g.fillRect(-14,-9,13,18);g.fillRect(3,-9,13,18);
    }
    if(car.kind==='patrol'){
      g.fillStyle='#193c63';g.fillRect(-half+7,-15,22,30);
      g.fillStyle='#cb333e';g.fillRect(-3,-19,9,4);
      g.fillStyle='#468cca';g.fillRect(6,-19,9,4);
    }else if(car.kind==='delivery'){
      g.fillStyle='#efe0b9';g.fillRect(-half+17,-3,26,5);
      g.fillStyle='#36586a';g.fillRect(-half+18,4,14,3);
    }
    g.fillStyle='#efcc8d';g.fillRect(half-4,-12,5,7);g.fillRect(half-4,5,5,7);
    g.fillStyle='#aa4252';g.fillRect(-half-1,-12,4,7);g.fillRect(-half-1,5,4,7);
    g.restore();
  }

  const campus={open:false,x:FRONT.x,y:FRONT.y+86,dir:'up',stride:0,moved:false,speed:0,
    camX:0,camY:0,zoom:1.15,autoZoom:true,follow:true,keys:new Set(),stick:null,runHeld:false,frame:0,last:0,
    paintCosts:[],paintCount:0,near:null,firstPaint:true,doorCrossings:0,previousRoom:null,visibleChunks:[]};
  const nativeOverlay=overlayOpen;
  const priorOverlay=()=>nativeOverlay()||(window.ROOKIE_MAIN_CITY_ACTIVE&&
    ['shiftOverlay','resetModal'].some(id=>document.getElementById(id)?.classList.contains('show')));
  overlayOpen=function(){return campus.open&&!storyDispatch||priorOverlay();};
  const modal=document.createElement('section');modal.id='v115Campus';modal.hidden=true;
  modal.setAttribute('aria-label','V115 seamless precinct and grounds development preview');
  modal.innerHTML=`<canvas id="v115CampusCanvas" aria-label="Continuous 1:1 Precinct 9 interior, grounds and streets"></canvas>
    <header class="v115-campus-header"><div class="v115-campus-brand">HARBOR CITY <span>CONNECTED STREETS · V115 ROAD PASS</span></div>
    <button type="button" id="v115CampusExit">Return to game</button></header>
    <div class="v115-campus-hud"><strong id="v115CampusRegion">Precinct Grounds</strong>
    <small id="v115CampusCoords">Single continuous world · no loading screens</small></div>
    <div class="v115-campus-tools"><button id="v115CampusZoomOut" aria-label="Zoom out">−</button>
      <button id="v115CampusOverview" aria-label="Toggle full campus overview">ALL</button>
      <button id="v115CampusZoomIn" aria-label="Zoom in">+</button></div>
    <div class="v115-campus-note" id="v115CampusNote">Continuous roads now share one topology with the city map. Unit 9 is parked at Precinct 9. Approach it and choose Drive.</div>
    <div class="v115-campus-pad" id="v115CampusPad" aria-label="Floating movement joystick zone" role="button" tabindex="0">
      <div id="v125CampusBase" aria-hidden="true"><div id="v115CampusKnob"></div></div></div>
    <button id="v125CampusSprint" type="button" aria-label="Hold to run">RUN</button>
    <button id="v115CampusInteract" class="v115-campus-interact" type="button">Action</button>
    <footer class="v115-campus-footer">Continuous city streets · joystick / WASD · all districts one canvas · Unit 9 parking saved per player</footer>`;
  document.body.appendChild(modal);
  cruiser=H.connectedCruiser?.install({campus,modal,blocked,actors:()=>npcActors.concat(window.ROOKIE_V133_PRECINCT?.actors?.(performance.now()).filter(a=>!story?.duplicate(a))||[]),clearInput,
    roadContact:(x,y)=>links.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)});
  const cv=modal.querySelector('canvas'),g=cv.getContext('2d',{alpha:false});
  const storyFurnitureCache=new Map();
  const storyFactory=/* CONNECTED_STORY */null;
  story=storyFactory?.({H,ST,MAPS,STX,STY,PLX,PLY,campus,modal,npcActors,worldSpots,districtEntries,
    canEnter:map=>map==='hale'?currentMission()==='m3'&&state.camp.m3.brief:map==='shedint'?currentMission()==='m5'&&state.camp.m5.brief&&evGot('m3key'):true,
    nativeOverlay:priorOverlay,clearInput,close,openAt:(x,y,z)=>api.openAt(x,y,z),
    dispatch:(map,x,y,id)=>{state.map=map;player.x=x-player.w/2;player.y=y-player.h/2;player.dir=campus.dir;
      nearSpot={id,x,y};storyDispatch=true;try{if(id.startsWith('legacy:')){window.ROOKIE_CONNECTED_STORY_UNREPLACED=true;(id==='legacy:chen'?H.connectedLegacyReception:H.connectedLegacyPark)?.();}else if(id.startsWith('family:'))H.caper?.connectedFamilyTalk(id.slice(7));else interact();}finally{storyDispatch=false;window.ROOKIE_CONNECTED_STORY_UNREPLACED=false;}},
    paintActor:(a,isPlayer=false)=>withOriginalContext(g,()=>{const prior=state.map;state.map='station';g.save();
      try{
        // Family identity is stable even when Saritah's story display name
        // differs from the sprite key and the Sandwich Caper is finished.
        if(a.familyId&&H.family.paint(a.familyId,a.x,a.y,a.dir||'down',0,a.moving?a.distance/22:null))return;
        g.translate(a.x-a.source.x,a.y-a.source.y);drawPerson(a.source.x,a.source.y,a.color,a.hat,a.name,a.dir||'down',isPlayer,true,0,a.moving?a.distance/22:null);
      }
      finally{g.restore();state.map=prior;}}),
    drawFurniture:drawStoryFurniture,nativeProp:nativeDistrictProp,drawDecor:d=>withOriginalContext(g,()=>drawDecor(d,performance.now())),
    actorVisible:n=>npcVisible(n),blocked,circleHitsRect,buildingBox:districtBuildingBox});

  const btn=document.createElement('button');btn.id='v115CampusLaunch';btn.type='button';
  btn.textContent='EXPLORE CONNECTED HARBOR CITY';btn.title='Walk inside and outside one continuous precinct world (experimental preview)';
  document.querySelector('#mapOverlay .maptools').appendChild(btn);
  let tw=960,th=640,dpr=1,oldCtx=null,cache=null,cacheValid=false,roofCanvas=null,legacyAssetEpoch=-1;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function pickZoom(z){campus.autoZoom=false;campus.zoom=clamp(z,.024,2.5);campus.follow=campus.zoom>.09;}
  function clearInput(){cruiser?.reset();window.ROOKIE_JAY?.reset();campus.speed=0;campus.keys.clear();campus.stick=null;campus.runHeld=false;modal.querySelector('#v115CampusKnob').style.transform='translate(-50%,-50%)';modal.querySelector('#v125CampusBase').classList.remove('active');modal.querySelector('#v125CampusSprint').classList.remove('held');}
  function resize(){
    if(!campus.open)return;
    const r=cv.getBoundingClientRect();dpr=Math.min(1.5,window.devicePixelRatio||1);
    const wasLandscape=tw>th;
    tw=Math.max(320,Math.round(r.width));th=Math.max(280,Math.round(r.height));
    if(wasLandscape!==(tw>th)&&campus.autoZoom&&window.ROOKIE_V116_MARINA?.inMarina(campus.x,campus.y)){campus.zoom=tw>th?clamp(tw/1688,.5,1.1):.85;campus.firstPaint=true;}
    cv.width=Math.round(tw*dpr);cv.height=Math.round(th*dpr);
    g.setTransform(dpr,0,0,dpr,0,0);g.imageSmoothingEnabled=false;
    if(campus.firstPaint){campus.camX=campus.x-tw/(2*campus.zoom);campus.camY=campus.y-th/(2*campus.zoom);campus.firstPaint=false;}
  }
  function withOriginalContext(other,fn){
    if(typeof ctx==='undefined')return fn();
    const prior=ctx;ctx=other;try{return fn();}finally{ctx=prior;}
  }
  function tacticalContext(c,fn,draw=false){
    const prior={ctx,cam,worldZoom,VW,VH,x:player.x,y:player.y,dir:player.dir,dispatch:storyDispatch};
    state.map=c.id;player.x=campus.x-c.floor.x-13;player.y=campus.y-c.floor.y-13;player.dir=campus.dir;storyDispatch=true;
    if(draw){ctx=g;cam={x:campus.camX-c.floor.x,y:campus.camY-c.floor.y};worldZoom=campus.zoom;VW=tw;VH=th;g.save();g.setTransform(dpr,0,0,dpr,0,0);g.beginPath();g.rect((c.floor.x-campus.camX)*campus.zoom,(c.floor.y-campus.camY)*campus.zoom,c.floor.w*campus.zoom,c.floor.h*campus.zoom);g.clip();}
    try{const result=fn();if(!draw){const x=c.floor.x+player.x+13,y=c.floor.y+player.y+13;if(!blocked(x,y)){campus.x=x;campus.y=y;}campus.dir=player.dir;}return result;}
    finally{if(draw)g.restore();ctx=prior.ctx;cam=prior.cam;worldZoom=prior.worldZoom;VW=prior.VW;VH=prior.VH;player.x=prior.x;player.y=prior.y;player.dir=prior.dir;storyDispatch=prior.dispatch;}
  }
  function drawStoryFurniture(f){
    const epoch=window.ROOKIE_V131_PRECINCT_BRIDGE?.assetEpoch()||0;
    let item=storyFurnitureCache.get(f.type);
    if(!item||item.epoch!==epoch){const plate=document.createElement('canvas');plate.width=400;plate.height=320;const c=plate.getContext('2d');
      withOriginalContext(c,()=>{const prior=state.map;state.map='station';try{drawFurn({x:128,y:140,w:96,h:36,type:f.type});}finally{state.map=prior;}});
      const pixels=c.getImageData(0,0,400,320).data;let x0=400,y0=320,x1=0,y1=0;
      for(let y=0;y<320;y++)for(let x=0;x<400;x++)if(pixels[(y*400+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      if(x1<=x0||y1<=y0)return;item={epoch,plate,rect:[x0,y0,x1-x0+1,y1-y0+1]};storyFurnitureCache.set(f.type,item);
    }
    const w=Math.min(f.w,48*item.rect[2]/item.rect[3]),h=w*item.rect[3]/item.rect[2];g.imageSmoothingEnabled=false;g.drawImage(item.plate,...item.rect,f.x+(f.w-w)/2,f.y+f.h-h,w,h);
  }
  // Cache the original precinct room geometry at native resolution. Drawing
  // may use original game floor/furniture painters, but never alters them.
  function stationTexture(){
    const previous=window.ROOKIE_V131_PRECINCT_BRIDGE;
    const epoch=previous?.assetEpoch()??0;
    // The classic campaign loads authored room images asynchronously.
    // Rebuild the STATIC station plate when their readiness changes, or
    // the first attempted render traps generic floors for the whole game.
    if(cacheValid&&cache&&legacyAssetEpoch===epoch)return cache;
    const off=document.createElement('canvas');off.width=ST.w;off.height=ST.h;
    const c=off.getContext('2d');c.imageSmoothingEnabled=false;
    c.fillStyle='#253953';c.fillRect(0,0,ST.w,ST.h);
    try{
      withOriginalContext(c,()=>{
        // Original station rooms/furniture keep their physical rectangles.
        // Only their DRAWING is upgraded with cached classic art sources.
        stationRooms.forEach(r=>{
          if(r.label==='GARAGE'){
            // The prior classic garage already owns the correct ramps,
            // door arrow and bay geometry. Only port missing original
            // cabinet/counter art as a small post-paint source crop.
            drawRoom(r);
            previous?.garageDetails?.(c,r);
          }else if(!previous?.room(c,r))drawRoom(r);
        });
        ST.furn.forEach(f=>{
          if(previous?.interiorFurnitureActive?.(f,ST.rooms))return;
          if(!previous?.furniture(c,f))drawFurn(f);
        });
      });
    }catch(e){
      // All-or-nothing recover to the original reliable room painter.
      // Never leave the precinct visually empty on a failed legacy sprite.
      c.clearRect(0,0,ST.w,ST.h);
      c.fillStyle='#253953';c.fillRect(0,0,ST.w,ST.h);
      withOriginalContext(c,()=>{
        stationRooms.forEach(r=>drawRoom(r));
        ST.furn.forEach(f=>{if(!previous?.interiorFurnitureActive?.(f,ST.rooms))drawFurn(f);});
      });
    }
    c.fillStyle='rgba(10,25,44,.36)';
    if(previous?.interiorActive?.()){
      c.beginPath();stationWalls.forEach(r=>c.rect(r.x+2,r.y+7,r.w,r.h));c.fill();
    }else stationWalls.forEach(r=>c.fillRect(r.x+2,r.y+7,r.w,r.h));
    c.fillStyle='#13263d';stationWalls.forEach(r=>c.fillRect(r.x,r.y,r.w,r.h));
    // Reapply the ORIGINAL 96px precinct-craft wall artwork only where
    // the existing real collision wall rectangles are actually solid.
    previous?.wallSkins(c,stationWalls);
    // Replaced after any original bitmap finishes decoding.
    cache=off;cacheValid=true;legacyAssetEpoch=epoch;return off;
  }
  let driveLeadX=0,driveLeadY=0;
  function cameraFollow(dt){
    const shot=H.campaignScenes?.camera()||window.ROOKIE_PARKING_ENCOUNTER?.camera();
    if(shot)campus.zoom+=(shot.zoom-campus.zoom)*(1-Math.exp(-6*Math.max(.001,dt)));
    const zw=tw/campus.zoom,zh=th/campus.zoom;
    if(campus.follow||shot){
      const velocity=!shot&&cruiser?.cameraVelocity();
      const ease=1-Math.exp(-(shot?shot.ease:velocity?14:9)*Math.max(.001,dt));
      if(shot)driveLeadX=driveLeadY=0;
      else{
        const limitX=Math.min(74,zw*.13),limitY=Math.min(64,zh*.13);
        const leadEase=1-Math.exp(-Math.max(0,dt)*9);
        driveLeadX+=(clamp((velocity?.x||0)*.34,-limitX,limitX)-driveLeadX)*leadEase;
        driveLeadY+=(clamp((velocity?.y||0)*.34,-limitY,limitY)-driveLeadY)*leadEase;
      }
      const wantedX=(shot?shot.x:campus.x+driveLeadX)-zw/2,wantedY=(shot?shot.y:campus.y+driveLeadY)-zh/2;
      campus.camX+=(wantedX-campus.camX)*ease;campus.camY+=(wantedY-campus.camY)*ease;
    }else driveLeadX=driveLeadY=0;
    campus.camX=zw>=W-MIN_X?MIN_X+(W-MIN_X-zw)/2:clamp(campus.camX,MIN_X,W-zw);
    campus.camY=zh>=HGT-MIN_Y?MIN_Y+(HGT-MIN_Y-zh)/2:clamp(campus.camY,MIN_Y,HGT-zh);
  }
  function direction(){
    let dx=0,dy=0;
    const k=campus.keys;
    if(k.has('arrowleft')||k.has('a'))dx--;
    if(k.has('arrowright')||k.has('d'))dx++;
    if(k.has('arrowup')||k.has('w'))dy--;
    if(k.has('arrowdown')||k.has('s'))dy++;
    if(campus.stick){dx=campus.stick.x;dy=campus.stick.y;}
    const n=Math.hypot(dx,dy);if(n>1){dx/=n;dy/=n;}
    return {dx,dy};
  }
  function simulate(dt){
    if(H.profiles.isOpen())return;
    attachMarinaActors();story?.sync();
    if(story?.activity())return;
    if(H.campaignScenes?.active()){H.campaignScenes.tick(dt);clearInput();return;}
    H.campaignScenes?.tick(dt);
    story?.step(dt);
    window.ROOKIE_PARKING_ENCOUNTER?.tick({host:modal,player:{x:campus.x,y:campus.y},room:interiorRoom(campus.x,campus.y),driving:!!cruiser?.active(),
      free:!H.speech?.current()&&!H.profiles?.isOpen()&&!window.ROOKIE_V116_HUD?.blocked()&&!(typeof csActive!=='undefined'&&csActive),
      width:tw,height:th,blocked,clearInput,
      camera:()=>({x:campus.camX+tw/campus.zoom/2,y:campus.camY+th/campus.zoom/2,zoom:campus.zoom,follow:campus.follow,autoZoom:campus.autoZoom}),
      restoreCamera:s=>{campus.zoom=s.zoom;campus.follow=s.follow;campus.autoZoom=s.autoZoom;campus.camX=(s.follow?campus.x:s.x)-tw/s.zoom/2;campus.camY=(s.follow?campus.y:s.y)-th/s.zoom/2;}
    },dt);
    const marina=window.ROOKIE_V116_MARINA;
    if(marina)marina.stepNPCs(dt);
    stepAmbientPedestrians(dt);
    stepStreetTraffic(dt);
    if(window.ROOKIE_PARKING_ENCOUNTER?.locked()||window.ROOKIE_COMIC?.modalActive()||story?.blocked()){clearInput();campus.moved=false;return;}
    const isDriving=cruiser?.step(dt);
    if(H.cityCollisions){if(collisionOwner!==state){collisionOwner=state;H.cityCollisions.reset();for(const b of parkedBodies)Object.assign(b,b.home,{cos:Math.cos(b.home.angle),sin:Math.sin(b.home.angle)});}H.cityCollisions.step(dt);cruiser?.syncImpact(dt);}
    if(isDriving)return;
    let {dx,dy}=direction();
    const shared=window.ROOKIE_JAY,run=!!shared?.requestRun()||!!campus.runHeld;
    if(Math.hypot(dx,dy)<.08){dx=0;dy=0;}
    const motion=shared?shared.advanceSpeed(campus.speed||0,(dx||dy)?(run?325:210)*(H.connectedTactics?.quiet()?.5:1):0,dt):{speed:210,distance:clamp(dt,0,.05)*210};
    campus.speed=motion.speed;const step=motion.distance;
    const ox=campus.x,oy=campus.y,r=12;
    const ax=Math.abs(dx),ay=Math.abs(dy),vertical=campus.dir==='up'||campus.dir==='down';
    if(dx||dy){if(ay>ax*1.15||(ay>=ax/1.15&&vertical))campus.dir=dy<0?'up':'down';else campus.dir=dx<0?'left':'right';}
    if(!blocked(campus.x+dx*step,campus.y,r))campus.x+=dx*step;
    if(!blocked(campus.x,campus.y+dy*step,r))campus.y+=dy*step;
    const dist=Math.hypot(campus.x-ox,campus.y-oy);
    campus.moved=dist>.04;if(campus.moved){campus.stride+=dist*.055;dialogue.hidden=true;}
    H.connectedTactics?.step(dt,dist);
    if(shared?.eligible())shared.update('connected-jay',{x:campus.x,y:campus.y,dir:campus.dir,map:WORLD_ID,run},dt);
    marina?.updateInteriors?.({x:campus.x,y:campus.y},dt);
    // Phase-3 glass doors reuse the EXISTING movement simulation clock.
    // No scene, coordinate, player state or collision change.
    window.ROOKIE_V134_PRECINCT?.stepEntrance?.({x:campus.x,y:campus.y},dt);
    const nowRoom=interiorRoom(campus.x,campus.y);
    if((campus.previousRoom===null)!==(nowRoom===null))campus.doorCrossings++;
    campus.previousRoom=nowRoom;
    return nowRoom;
  }
  function drawGrass(){
    // V127: same Southbay pixel-tile materials across the entire 1:1 world,
    // rendered before native roads, districts, buildings and interior layers.
    const city=window.ROOKIE_V127_CITY;
    if(city){city.base(g,{view:{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom},zoom:campus.zoom});return;}
    g.fillStyle='#608d56';g.fillRect(MIN_X,MIN_Y,W-MIN_X,HGT-MIN_Y);
    const x0=Math.max(MIN_X,Math.floor(campus.camX/48)*48),x1=Math.min(W,campus.camX+tw/campus.zoom+60);
    const y0=Math.max(0,Math.floor(campus.camY/48)*48),y1=Math.min(HGT,campus.camY+th/campus.zoom+60);
    for(let x=x0;x<x1;x+=48)for(let y=y0;y<y1;y+=48){
      const h=((x*73856093)^(y*19349663))>>>0;
      g.fillStyle=h%3===0?'rgba(172,207,104,.22)':'rgba(14,58,38,.09)';
      g.fillRect(x+(h%23),y+((h>>5)%23),4,4);
    }
  }
  function drawCampusGround(){
    drawGrass();
    g.save();g.translate(PLX,PLY);
    for(const v of PL.ground){
      const city=window.ROOKIE_V127_CITY;
      if(city)city.surface(g,{x:v.x,y:v.y,w:v.w,h:v.h},city.colorKind(v.c),
        {x:campus.camX-PLX,y:campus.camY-PLY,w:tw/campus.zoom,h:th/campus.zoom});
      else{g.fillStyle=v.c;g.fillRect(v.x,v.y,v.w,v.h);}
    }
    if(PL.dashes){g.fillStyle='rgba(246,208,98,.62)';for(let x=PL.dashes.from;x<PL.dashes.to;x+=52)g.fillRect(x,PL.dashes.at-2,28,4);}
    g.restore();
    // Physical promenade from a full-size precinct front door to the avenue.
    g.fillStyle='#b4bfc1';g.fillRect(FRONT.x-60,FRONT.y,120,650);
    g.fillStyle='#d6c6a7';g.fillRect(FRONT.x-41,FRONT.y,82,650);
    g.fillStyle='rgba(255,255,255,.30)';for(let y=FRONT.y+20;y<1650;y+=36)g.fillRect(FRONT.x-41,y,82,2);
    // The rebuilt building now has room for its entire 1,936-unit interior.
    // The old 640x448 building and its unrelated garage are NOT rendered.
    if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
     g.fillStyle='#535960';g.fillRect(2325,1280,380,378);
    g.fillStyle='#bbc2c5';for(let i=0;i<5;i++)g.fillRect(2337+i*70,1280,60,364);
     g.fillStyle='#d2b77c';g.fillRect(2345,1267,312,16);
    } // V140 paints this obsolete lot as planted buffer in original ground cache
    g.fillStyle='#c9d5d9';g.fillRect(STX-15,STY+1027,1180,28);
  }
  function drawDecorFallback(d){
    g.save();g.translate(PLX+d.x,PLY+d.y);
    if(d.t==='crosswalk'){g.fillStyle='#ddd8c2';for(let i=5;i<(d.w||88);i+=18)g.fillRect(i,0,9,d.h||90);}
    else if(d.t==='sign'){g.fillStyle='#17273e';g.fillRect(-3,-13,7,25);g.fillStyle='#d8b45c';g.fillRect(-49,-40,98,28);g.fillStyle='#142a41';g.font='bold 12px sans-serif';g.textAlign='center';g.fillText(d.text||'PRECINCT',0,-21);}
    else if(d.t==='flowerbed'){g.fillStyle='#31583c';g.fillRect(0,0,d.w||60,d.h||13);g.fillStyle='#e6a36a';for(let i=8;i<(d.w||60);i+=15)g.fillRect(i,4,4,5);}
    else if(d.t==='extgate'){g.fillStyle='#c6d5c9';g.fillRect(0,0,45,7);}
    else if(d.t==='gate'){g.fillStyle='#223d52';g.fillRect(0,0,92,22);}
    else if(d.t==='planter'){g.fillStyle='#8f684d';g.fillRect(-11,-10,22,16);g.fillStyle='#2d7c46';g.fillRect(-15,-19,30,14);}
    else if(d.t==='lamp'){g.fillStyle='#182d3c';g.fillRect(-3,-42,6,42);g.fillStyle='#f8df9a';g.fillRect(-8,-44,16,10);}
    else if(d.t==='tree'||d.t==='bigtree'||d.t==='palm'){drawTree(0,0,25);}
    g.restore();
  }
  function drawTree(x,y,r){
    const premium=window.ROOKIE_V127_CITY?.spriteImage?.('tree');
    if(premium){g.save();g.imageSmoothingEnabled=false;
      g.drawImage(premium,x-r*1.7,y-r*2.4,r*3.4,r*3.15);g.restore();return;}
    g.fillStyle='#695141';g.fillRect(x-5,y+4,10,30);
    g.fillStyle='#214d39';g.beginPath();g.arc(x,y,r+3,0,7);g.fill();
    g.fillStyle='#5da754';g.beginPath();g.arc(x-4,y-5,r,0,7);g.fill();
    g.fillStyle='rgba(194,226,96,.45)';g.beginPath();g.arc(x-10,y-11,r*.35,0,7);g.fill();
  }
  // Same authored world space as precinct. Unlike the legacy side exits,
  // every region below is rendered without changing state.map or the canvas.
  function nearViewport(x,y,w,h){
    return x+w>campus.camX-80 && x<campus.camX+tw/campus.zoom+80 &&
      y+h>campus.camY-80 && y<campus.camY+th/campus.zoom+80;
  }
  function roadRect(r){
    // Draw at world coordinates. Slightly textured gutters and edge lights
    // bridge imported tileset seams without repainting existing buildings.
    const horizontal=r.w>r.h;
    if(window.ROOKIE_V127_CITY)window.ROOKIE_V127_CITY.road(g,r,{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom});
    else {g.fillStyle='#3e4852';g.fillRect(r.x,r.y,r.w,r.h);}
    g.fillStyle='#717c83';
    if(horizontal){
      g.fillRect(r.x,r.y, r.w,4);g.fillRect(r.x,r.y+r.h-4,r.w,4);
      g.fillStyle='#c0bdaf';g.fillRect(r.x,r.y-16,r.w,15);g.fillRect(r.x,r.y+r.h+1,r.w,15);
      g.fillStyle='#d6b879';
      for(let x=r.x+20;x<r.x+r.w-20;x+=76)g.fillRect(x,r.y+r.h/2-2,33,4);
    }else{
      g.fillRect(r.x,r.y,4,r.h);g.fillRect(r.x+r.w-4,r.y,4,r.h);
      g.fillStyle='#c0bdaf';g.fillRect(r.x-16,r.y,15,r.h);g.fillRect(r.x+r.w+1,r.y,15,r.h);
      g.fillStyle='#d6b879';
      for(let y=r.y+20;y<r.y+r.h-20;y+=76)g.fillRect(r.x+r.w/2-2,y,4,33);
    }
  }
  function drawCrossing(c){
    if(window.ROOKIE_V135_WALL_KIT?.stats?.().roadAtlas)return;
    // Readable curb-to-curb zebra crossings at real street intersections,
    // hidden at distant zoom to avoid an aliased citywide overview.
    if(campus.zoom<.18 || !nearViewport(c.x-85,c.y-85,170,170))return;
    const width=c.type==='intersection'?45:31;
    const lane=roadNetwork.primary.laneWidth;
    g.fillStyle='rgba(245,239,218,.83)';
    if(c.axis==='h'){
      const y=c.y-lane/2+10;
      for(let i=-width/2;i<width/2;i+=12)g.fillRect(c.x+i,y,7,lane-20);
      g.fillStyle='rgba(244,208,115,.65)';
      g.fillRect(c.x-width/2-8,y-6,width+16,3);
      g.fillRect(c.x-width/2-8,y+lane-15,width+16,3);
    }else{
      const x=c.x-lane/2+10;
      for(let i=-width/2;i<width/2;i+=12)g.fillRect(x,c.y+i,lane-20,7);
    }
  }
  function districtGround(d){
    const m=d.map,city=window.ROOKIE_V127_CITY;
    if(city)city.districtGround(g,d,{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom});
    else{
      g.fillStyle=m.base||'#7c9a67';g.fillRect(d.x,d.y,m.w,m.h);
      g.save();g.translate(d.x,d.y);
      for(const r of m.ground||[]){g.fillStyle=r.c||'#c2b8a4';g.fillRect(r.x,r.y,r.w,r.h);}
      g.restore();
    }
    g.save();g.translate(d.x,d.y);
    if(m.dashes){const a=m.dashes;g.fillStyle='rgba(237,219,153,.65)';
      if(a.axis==='h')for(let x=a.from;x<a.to;x+=58)g.fillRect(x,a.at-2,30,4);
      else for(let y=a.from;y<a.to;y+=58)g.fillRect(a.at-2,y,4,30);
    }
    g.restore();
  }
  const districtImages=new Map();
  function connectedNativeImage(path,existing){
    if(existing?.complete&&existing.naturalWidth)return existing;
    if(!districtImages.has(path)){
      const im=new Image();im.decoding='async';im.src='./assets/'+path;districtImages.set(path,im);
    }
    return districtImages.get(path);
  }
  function connectedHouseImage(key){
    const files={h8:'house_8_cream.webp',h5:'house_8_cream.webp',h12:'house_12_peach.webp',
      h13:'house_12_peach.webp',h16:'house_16_sage.webp',h9:'house_16_sage.webp',mailbox:'mailbox.webp'};
    return files[key]?connectedNativeImage('maple-court/'+files[key],window.__MC?.img?.[key]):null;
  }
  function sprite(name){
    // Original Midtown decor IDs are abbreviated; use actual recovered WebP names.
    const names={conv:'convenience_store',cafe:'cafe',suds:'laundromat',
      pharm:'pharmacy',pizza:'pizza_shop',garage:'repair_garage',motel:'motel'};
    const filename=names[name]||name, key='midtown/'+filename;
    if(!districtImages.has(key)){
      const img=new Image();img.decoding='async';img.src='./assets/midtown/'+filename+'.webp';
      districtImages.set(key,img);
    }
    const im=districtImages.get(key);return im.complete&&im.naturalWidth>0?im:null;
  }
  function districtTree(x,y,r){
    const key='landscape-v1/tree';
    if(!districtImages.has(key)){
      const img=new Image();img.decoding='async';img.src='./assets/landscape-v1/tree.webp';
      districtImages.set(key,img);
    }
    const tree=districtImages.get(key);
    if(tree.complete&&tree.naturalWidth>0){g.drawImage(tree,x-r*1.25,y-r*2.25,r*2.5,r*2.7);}
    else drawTree(x,y,r);
  }
  function paintedBuilding(d,districtId){
    if(window.ROOKIE_CITY_PERSPECTIVE_ACTIVE){
      const b=districtBuildingBox(d),meta=d.worldBuilding;
      if(b){
        let im=null,crop=null;
        if(d.t==='mchouse')im=connectedHouseImage(d.img);
        else if(meta?.house){im=connectedHouseImage(meta.art.slice(3));crop=meta.rect;}
        else if(d.t==='sbart'){
          im=connectedNativeImage(d.path,H.assets?.[d.path]);const r=connectedSouthbayBodies[d.path];
          if(r)crop=[r[0],r[1],r[2]-r[0],r[3]-r[1]];
        }else if(d.t==='dtBuilding'||d.t==='worldBuilding'||d.rpg)
          im=H.rpg?.image(meta?.art||d.art||d.img,b.w,b.h);
        if(im&&(im.width||im.naturalWidth)&&(!('complete' in im)||im.complete)){
          g.save();g.imageSmoothingEnabled=false;
          if(crop)g.drawImage(im,...crop,b.x,b.y,b.w,b.h);
          else g.drawImage(im,b.x,b.y,b.w,b.h);
          const label=d.label||meta?.label||(d.t==='mchouse'?d.num:null);
          if(label&&campus.zoom>.42){
            const width=Math.min(b.w-12,Math.max(34,String(label).length*6+12));
            const x=(d.doorX??d.cx??(b.x+b.w/2)),y=(d.dy??b.y+b.h)-22;
            g.fillStyle='#173443';g.fillRect(x-width/2,y,width,17);
            g.fillStyle='#f3e4b9';g.font='bold 10px sans-serif';g.textAlign='center';
            g.fillText(String(label),x,y+12,width-6);
          }g.restore();return;
        }
        // Only an unavailable source image uses the established painted shell.
        if(d.t!=='mtbldg'){
          window.ROOKIE_V127_CITY?.building(g,{...b,kind:d.t==='mchouse'||meta?.house?'house':d.t,district:districtId},campus.zoom);return;
        }
      }
    }
    const bx=d.t==='mtbldg'?(d.bx||d.x):(d.x||0),
      by=d.t==='mtbldg'?(d.btop||d.y):(d.y||0),
      bw=d.t==='mtbldg'?(d.bw||d.w):(d.w||200),
      bh=d.t==='mtbldg'?(d.bh||d.h):(d.h||155);
    if(!Number.isFinite(bx)||!Number.isFinite(by)||!Number.isFinite(bw)||!Number.isFinite(bh))return;
    /* District visibility was already tested in world space by the caller. */
    if(d.t==='mtbldg'&&d.img){const im=sprite(d.img);
      if(im){g.drawImage(im,bx,by,bw,bh);return;}}
    // Prefer recovered original storefront sprites; a richer painted fallback
    // is used only when the source sprite is unavailable in this preview.
    if(!window.ROOKIE_CITY_PERSPECTIVE_ACTIVE&&window.ROOKIE_V115_SHOWCASE &&
       window.ROOKIE_V115_SHOWCASE.buildingFallback(g,d,campus.zoom))return;
    // V127: source sprite first; new shared architecture in place of older
    // simple color rectangles, with exactly the original wall footprint.
    if(window.ROOKIE_V127_CITY?.building(g,{x:bx,y:by,w:bw,h:bh,kind:d.t,district:districtId},campus.zoom))return;
    const roof=d.roof||'#615a55',wall=d.c||'#c1a98e';
    g.fillStyle='rgba(12,25,37,.27)';g.fillRect(bx+8,by+9,bw,bh);
    g.fillStyle=wall;g.fillRect(bx,by+18,bw,Math.max(20,bh-18));
    g.fillStyle=roof;g.fillRect(bx-6,by,bw+12,Math.max(14,bh*.70));
    g.fillStyle='rgba(255,255,255,.13)';g.fillRect(bx,by+4,bw,6);
    g.fillStyle='rgba(18,34,55,.5)';g.fillRect(bx+18,by+Math.max(25,bh*.7),Math.max(18,bw-36),Math.max(4,bh*.18));
    if(campus.zoom>.27){g.font='700 18px Barlow Condensed,sans-serif';g.textAlign='center';
      g.fillStyle='#fff2c3';g.fillText(String(d.name||d.label||'HARBOR CITY').slice(0,32),bx+bw/2,by+bh-8);}
  }
  const districtBuildingTypes=new Set(['bldg','house','shed','lighthouse','mtbldg','mchouse','worldBuilding','dtBuilding','sbart']);
  function districtBuildingBox(o){
    if(!districtBuildingTypes.has(o.t))return null;
    const b=o.t==='mtbldg'?{x:o.bx??o.x,y:o.btop??o.y,w:o.bw??o.dw,h:o.bh??o.dh}:
      o.t==='mchouse'?{x:o.dx??o.x,y:o.dyTop??o.y,w:o.dw??o.w,h:o.dh??o.h}:
      {x:o.x,y:o.y,w:o.w||200,h:o.h||155};
    return [b.x,b.y,b.w,b.h].every(Number.isFinite)?b:null;
  }
  // Exact alpha-body bounds already used by the original Southbay painter.
  const connectedSouthbayBodies=/* SOUTH_BAY_NATIVE_CROPS */ {"southbay/bayview_inn.webp":[131,91,1194,1070],"southbay/house_8_cream.webp":[100,56,1302,1051],"southbay/boat_shed.webp":[199,77,1114,1069],"southbay/house_12_peach.webp":[104,44,1216,1112],"southbay/motorboat.webp":[213,34,812,1502],"southbay/cafe.webp":[278,136,1259,843],"southbay/pier_segment.webp":[233,144,793,1390],"southbay-addon/cafe_patio_two_chairs.webp":[158,67,1144,1103],"southbay-addon/coastal_rocks.webp":[89,159,1497,872],"southbay-addon/marina_office.webp":[102,48,1437,926],"southbay-addon/rowboat.webp":[293,42,897,1263],"southbay-addon/tree_canopy_cluster.webp":[75,72,1206,1162],"southbay-addon/seawall_segment.webp":[56,208,2117,530],"southbay-addon/motorboat_blue.webp":[361,60,867,1230],"southbay-addon/seafood_shop.webp":[86,88,1146,1164],"southbay-addon/surfboard.webp":[339,56,686,1456]};
  function nativeDistrictProp(o){
    const t=o.t,x=o.x||0,y=o.y||0;
    if(t==='midtownProp'){
      const im=connectedNativeImage(o.file);
      return im?.complete&&im.naturalWidth?{im,x:x-o.w/2,y:y-o.h,w:o.w,h:o.h,depth:o.dy??y,banner:o.banner}:null;
    }
    if(t==='mcprop'||t==='mtprop'){
      const im=window.__EXT?.img?.[o.img];
      return im?.complete&&im.naturalWidth?{im,x,y,w:im.naturalWidth,h:im.naturalHeight,depth:o.dy??y+im.naturalHeight}:null;
    }
    if(t==='mcmailbox'){
      const im=connectedHouseImage('mailbox');
      return im?.complete&&im.naturalWidth?{im,x:o.dx,y:o.dyTop,w:o.dw,h:o.dh,crop:[o.sx,o.sy,o.sw,o.sh],depth:o.dy??y}:null;
    }
    if(t==='mcfence'){
      const im=window.__EXT?.img?.fenceH;
      return im?.complete&&im.naturalWidth?{im,x,y,w:o.w,h:32,repeat:true,depth:o.dy??y+32}:null;
    }
    if(t==='landscapeV1'){
      const spec=H.landscape?.spec?.[o.role];if(!spec)return null;
      const key='landscape-v1/'+spec.file;
      if(!districtImages.has(key)){const im=new Image();im.src='./assets/'+key;districtImages.set(key,im);}
      const im=districtImages.get(key),r=spec.rect,h=Math.round(o.w*r[3]/r[2]);
      return im?.complete&&im.naturalWidth?{im,x:x-o.w/2,y:y-h,w:o.w,h,crop:r,depth:o.dy??y}:null;
    }
    const role=t==='rpgProp'||t==='dtProp'?o.role:({hydrant:'hydrant',trash:'bin'}[t]);
    if(role){
      const r=H.rpg?.spec?.regions?.[role]?.rect,w=o.w||(role==='hydrant'?18:24);
      if(!r)return null;const h=w*r[3]/r[2],im=H.rpg.image(role,w,h);
      return im?{im,x:x-w/2,y:y-h,w,h,depth:o.dy??y}:null;
    }return null;
  }
  const OVERVIEW_SHORT_NAMES=Object.freeze({
    westfield:'WEST',residential:'MAPLE',midtown:'MIDTOWN',
    downtown:'DOWNTOWN',eastside:'EAST',industrial:'INDUST.',
    northgate:'NORTH',southbay:'SOUTH',waterfront:'MARINA'
  });
  function overviewDistrictLabel(d){
    // At citywide zoom, full-size street sprites become visual static. Use
    // readable, abbreviated neighborhood placards in fixed SCREEN pixel sizes.
    const z=campus.zoom,fs=8.8/z,txt=OVERVIEW_SHORT_NAMES[d.id]||d.id.toUpperCase();
    const x=d.x+d.w/2,y=d.y+d.h*(d.id==='downtown'||d.id==='westfield'?.77:.26);
    const maxW=d.w-36,estimated=txt.length*fs*.57;
    const bw=Math.min(estimated+12/z,maxW),bh=15/z;
    g.save();
    g.fillStyle='rgba(10,33,51,.91)';g.fillRect(x-bw/2,y-bh/2,bw,bh);
    g.strokeStyle='rgba(239,210,140,.77)';g.lineWidth=1.1/z;
    g.strokeRect(x-bw/2,y-bh/2,bw,bh);
    g.font='800 '+fs+'px Barlow Condensed,system-ui,sans-serif';
    g.fillStyle='#fff0c2';g.textAlign='center';g.textBaseline='middle';
    g.fillText(txt,x,y,Math.max(15,maxW-8/z));
    g.restore();
  }
  function districtDecor(d){
    if(campus.zoom<.10){overviewDistrictLabel(d);return;}
    g.save();g.translate(d.x,d.y);
    for(const o of d.map.decors||[]){
      if(window.ROOKIE_V116_MARINA?.ownsDecor?.(d.id,o))continue;
      const x=o.x||0,y=o.y||0;
      if(window.ROOKIE_CITY_PERSPECTIVE_ACTIVE&&(districtBuildingTypes.has(o.t)||nativeDistrictProp(o)))continue;
      if(!nearViewport(d.x+x-130,d.y+y-170,(o.w||240)+260,(o.h||200)+260))continue;
      if(['bldg','house','shed','lighthouse','mtbldg'].includes(o.t)){if(!window.ROOKIE_CITY_PERSPECTIVE_ACTIVE&&!window.ROOKIE_V116_MARINA?.ownsSolid?.({x:d.x+x,y:d.y+y,w:o.w,h:o.h}))paintedBuilding(o,d.id);continue;}
      if(window.ROOKIE_CITY_PERSPECTIVE_ACTIVE&&o.t==='car')continue;
      // Native world decoration sprites now depth-sort with Jay, not underfoot.
      if(window.ROOKIE_V127_CITY?.handlesDecor(o))continue;
      if(o.t==='tree'||o.t==='bigtree'||o.t==='palm'){districtTree(x,y,o.t==='bigtree'?38:26);continue;}
      if(o.t==='lamp'){g.fillStyle='#1b3b50';g.fillRect(x-3,y-35,6,36);g.fillStyle='#f4df97';g.fillRect(x-8,y-40,16,10);continue;}
      if(o.t==='sign'||o.t==='gate'){g.fillStyle='#2a4458';g.fillRect(x-36,y-22,110,28);g.fillStyle='#fff0c3';g.font='700 15px Barlow Condensed,sans-serif';g.textAlign='left';g.fillText(String(o.text||d.id).slice(0,20),x-32,y-4);continue;}
      if(o.t==='bench'){g.fillStyle='#886443';g.fillRect(x,y,o.w||88,10);g.fillRect(x+5,y+10,5,10);continue;}
      if(o.t==='car'){g.fillStyle=o.c||'#587aa1';g.fillRect(x,y,o.w||70,o.h||36);g.fillStyle='#b8d2e3';g.fillRect(x+8,y+8,Math.min(24,(o.w||60)-12),10);continue;}
      if(o.t==='mtprop'||o.t==='rpgProp'){if(o.img==='shade'||o.img==='palm'||o.role==='shade')districtTree(x,y,27);continue;}
      if(o.t==='mailbox'){g.fillStyle='#28476b';g.fillRect(x-8,y-14,16,16);continue;}
      if(o.t==='fountain'){g.fillStyle='#70b9cc';g.beginPath();g.arc(x,y,35,0,Math.PI*2);g.fill();}
    }
    if(campus.zoom>.25&&!(d.id==='waterfront'&&window.ROOKIE_V116_MARINA?.active())){g.font='800 28px Barlow Condensed,sans-serif';g.textAlign='center';
      g.fillStyle='#fff0b5';g.fillText(d.map.name,d.w/2,46);}
    g.restore();
  }
  function drawLinkedDistricts(t){
    // Connected asphalt first; native streets, buildings and natural ground
    // retain their material quality. Crossings seal visibly disjoint seams.
    // Native district pavement remains authoritative on through-roads.
    // Existing links are left exactly as they were. Genuine new connectors
    // render AFTER district ground but BEFORE original buildings and actors.
    for(const link of links)if(!link.newRoad&&nearViewport(link.x,link.y,link.w,link.h))roadRect(link);
    for(const d of districtEntries)if(nearViewport(d.x,d.y,d.w,d.h))districtGround(d);
    for(const link of links)if(link.newRoad&&!link.underNative&&nearViewport(link.x,link.y,link.w,link.h))roadRect(link);
    // V127 extends waterfront-quality pavement, landscaping materials and
    // shoreline across the native regions, without a new scene or map switch.
    const city=window.ROOKIE_V127_CITY;
    if(city){const view={x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom};
      city.boundaryGround?.(g,{view,zoom:campus.zoom});
      city.parkGround(g,{view,zoom:campus.zoom});
      city.walkways(g,{view,zoom:campus.zoom});
      city.coastline(g,{view,zoom:campus.zoom});
    }
    for(const c of crossings)drawCrossing(c);
    const ref=window.ROOKIE_V115_REFERENCE;
    if(ref)ref.gameBlocks(g,{zoom:campus.zoom,view:{x:campus.camX,y:campus.camY,w:tw/campus.zoom,h:th/campus.zoom},districts:districtEntries});
    for(const d of districtEntries)if(nearViewport(d.x,d.y,d.w,d.h))districtDecor(d);
  }

  function drawOutdoorDecor(){
    for(const d of PL.decors){
      if(window.ROOKIE_V135_WALL_KIT?.stats?.().roadAtlas&&['crosswalk','gate','extgate'].includes(d.t))continue;
      // The former visitor lot is now the pedestrian plaza. Its campaign
      // sign remains in MAPS; omit only its obsolete connected-preview copy.
      if(window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE&&d.t==='sign'&&d.text==='VISITOR PARKING')continue;
      if(d.ext==='precinct'||d.ext==='garage'||d.t==='extcar'||d.t==='shed')continue;
      // Existing small-precinct art was designed inside the much larger
      // corrected station footprint. Keep scenery only outside that shell.
      const x=PLX+d.x,y=PLY+d.y;
      if(x>STX-45&&x<STX+ST.w+35&&y>STY-30&&y<STY+ST.h+15)continue;
      if(x<campus.camX-150||x>campus.camX+tw/campus.zoom+150||y<campus.camY-150||y>campus.camY+th/campus.zoom+150)continue;
      drawDecorFallback(d);
    }
    // Scaled landscape composition along the expanded precinct promenade.
    // Earlier decorative trees at 1450/1480,1730/1510,2140/1538
    // physically cover the new parking stalls and garage drive. Do not
    // spawn them in the owner-approved layout; trees stay on perimeter.
    const trees=window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE?
      [[2470,1140,29]]:
      [[440,1310,31],[530,1530,28],[1450,1480,35],
       [1730,1510,36],[2140,1538,38],[2470,1140,29]];
    for(const [x,y,r] of trees)drawTree(x,y,r);
    const lamps=window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE?
      [[2301,1455]]:
      [[690,1325],[1260,1315],[1950,1310]];
    for(const [x,y] of lamps){
      g.fillStyle='#203e49';g.fillRect(x-4,y-34,8,38);g.fillStyle='#fbe0a0';g.fillRect(x-9,y-37,18,10);
    }
    if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
      g.fillStyle='rgba(21,36,55,.58)';g.fillRect(580,1448,345,32);
      g.fillStyle='#fff4c2';g.font='bold 21px Barlow Condensed,sans-serif';g.fillText('PRECINCT 9 · COMMUNITY WALK',591,1470);
    }
  }
  function roofAlpha(){
    // Room labels stop at the floor rectangles, but the 32px wall bands
    // contain walkable doorway gaps. Keep those thresholds in the cutaway
    // instead of briefly treating them as outdoors between adjacent rooms.
    // This margin affects roof visibility only, never collision or room IDs.
    if(roomRects.some(r=>circleHitsRect(campus.x,campus.y,18,r)))return .04;
    const dx=Math.abs(campus.x-FRONT.x),dy=Math.abs(campus.y-FRONT.y);
    if(dx<130&&dy<155)return clamp((dy-30)/180,.12,.94);
    const gd=Math.hypot(campus.x-GARAGE.x,campus.y-(GARAGE.y+30));
    if(gd<175)return clamp((gd-22)/180,.12,.94);
    return .95;
  }
  function drawStation(){
    if(!nearViewport(STX-20,STY-20,ST.w+40,ST.h+60))return;
    const image=stationTexture();
    g.drawImage(image,STX,STY);
    // Foyer, double-wide front entrance and garage threshold share exact world coordinates.
    g.fillStyle='#efcc82';g.fillRect(FRONT.x-34,FRONT.y-5,68,10);
    g.fillStyle='#e4c27e';g.fillRect(GARAGE.x-172,GARAGE.y-3,344,9);
  }
  // Station roof is a separate upper render layer. Original rooms/furniture
  // and all indoor NPCs are first drawn in the same world depth ordering,
  // THEN the roof covers them when Jay is outdoors. While Jay crosses the
  // real doorway its alpha naturally fades, revealing the identical inside.
  function drawStationRoof(section='main'){
    if(!nearViewport(STX-20,STY-20,ST.w+40,ST.h+60))return;
    const alpha=roofAlpha();
    if(section==='break') {g.save();g.globalAlpha=alpha;g.fillStyle='#253c57';g.fillRect(STX+1560,STY+12,364,624);g.strokeStyle='#61788b';g.lineWidth=3;g.strokeRect(STX+1560,STY+12,364,624);for(let y=STY+40;y<STY+620;y+=56){g.beginPath();g.moveTo(STX+1572,y);g.lineTo(STX+1912,y);g.stroke();}g.restore();return;}
    // Roof artwork remains the existing V132 texture, but the two original
    // footprints have different street-facing foot-depths. A world-space
    // clip lets the ONE existing painter sort each portion with characters.
    g.save();g.beginPath();
    if(section==='garage')g.rect(STX+1156,STY-40,ST.w-1116,ST.h+120);
    else g.rect(STX-40,STY-40,1196,ST.h+120);
    g.clip();
    // V132 swaps the FLAT V115 roof paint with original roof-material art,
    // while retaining the exact geometry, fade and NPC depth ordering.
    if(window.ROOKIE_V132_PRECINCT?.roof(g,{x:STX,y:STY,alpha,zoom:campus.zoom})){
      g.restore();return;
    }
    if(alpha>.10){
      g.save();g.globalAlpha=alpha;
      g.fillStyle='#253c57';g.fillRect(STX+8,STY+8,1140,1023);
      g.fillStyle='#314d70';g.fillRect(STX+1158,STY+652,754,504);
      g.fillStyle='#455e7c';for(let yy=STY+27;yy<STY+1005;yy+=76)g.fillRect(STX+24,yy,1110,5);
      g.fillStyle='#748ea9';g.fillRect(STX+300,STY+725,365,124);
      g.fillStyle='#f0d28b';g.font='bold 62px Barlow Condensed,sans-serif';g.textAlign='center';g.fillText('PRECINCT 9',STX+565,STY+535);
      g.font='bold 24px Barlow Condensed,sans-serif';g.fillText('HARBOR CITY POLICE',STX+565,STY+575);
      g.font='bold 28px Barlow Condensed,sans-serif';g.fillText('GARAGE',STX+1538,STY+910);
      // Always show the true entrance as an open passage, not a new scene load.
      // Roof rectangle ends at the exterior threshold; keep the canvas opaque.
      g.restore();
    }
    g.save();g.globalAlpha=Math.min(.95,alpha);
    g.strokeStyle='rgba(255,225,142,.7)';g.lineWidth=3;
    g.strokeRect(STX+4,STY+4,1146,1020);
    g.strokeRect(STX+1159,STY+652,759,505);
    g.restore();
    g.restore(); // balanced station/garage world-space section clip
  }
  function drawOfficer(p,isPlayer,t){
    if(isPlayer&&story?.drawPlayer(p))return;
    const shared=window.ROOKIE_JAY;
    if(isPlayer)shared?.control?.('v117ConnectedRun',!!shared.eligible());
    if(isPlayer&&shared?.eligible()){
      // V119 connected-marina-only step accents and subtle sprite bob.
      // The existing shared Jay animation, pose, timing and physical feet remain authoritative.
      const marinaMotion=window.ROOKIE_V119_MOTION;
      const inMarina=!!(marinaMotion&&window.ROOKIE_V116_MARINA?.inMarina(p.x,p.y));
      const movement={x:p.x,y:p.y,dir:campus.dir,moving:campus.moved,distance:campus.stride/.055,run:campus.speed>235};
      if(inMarina)marinaMotion.footsteps(g,movement,t);
      g.save();
      if(inMarina)g.translate(0,-marinaMotion.characterBob(movement,t));
      shared.draw(g,'connected-jay',{x:p.x,y:p.y,dir:campus.dir,map:WORLD_ID});
      g.restore();
      // V126: no artificial golden selection halo under the playable character.
      return;
    }
    const marina=window.ROOKIE_V116_MARINA;
    if(isPlayer&&marina&&marina.inMarina(p.x,p.y)){
      marina.drawNpc(g,{x:p.x,y:p.y,npcStyle:0,phase:0,moving:campus.moved,dir:campus.dir,distance:campus.stride/.055},t);
      // V126: retain grounded sprite shadow, never a golden ring.
      return;
    }
    g.save();g.translate(p.x,p.y);
    g.fillStyle='rgba(6,15,24,.35)';g.beginPath();g.ellipse(0,7,16,6,0,0,7);g.fill();
    g.fillStyle=p.color||'#254a77';g.fillRect(-9,-20,18,25);
    g.fillStyle='#e5b889';g.fillRect(-7,-29,14,13);
    g.fillStyle='#172a4d';g.fillRect(-9,-32,18,6);
    g.fillStyle='#294c7d';g.fillRect(-14,-15,5,14);g.fillRect(9,-15,5,14);
    if(isPlayer&&campus.moved){
      const stride=Math.sin(campus.stride)*3;g.fillStyle='#152438';g.fillRect(-8,5+stride,6,12);g.fillRect(3,5-stride,6,12);
    } else {g.fillStyle='#152438';g.fillRect(-8,5,6,12);g.fillRect(2,5,6,12);}
    g.restore();
    if(isPlayer){
      // Only the small distance-zoom label remains; no character selection ring.
      if(campus.zoom<.11){g.font='800 '+Math.min(280,10/campus.zoom)+'px Barlow Condensed,sans-serif';g.textAlign='center';g.fillStyle='#ffdc86';g.fillText('YOU',p.x,p.y-30);}
    }
    else if(campus.zoom>.54){g.fillStyle='#faf0cb';g.font='bold 13px Barlow Condensed,sans-serif';g.textAlign='center';g.fillText(p.name,p.x,p.y-39);}
  }
  function drawEntityHighlights(t){
    const view={x:campus.camX-50,y:campus.camY-60,w:tw/campus.zoom+100,h:th/campus.zoom+120};
    function visible(e){return e.x>view.x&&e.x<view.x+view.w&&e.y>view.y&&e.y<view.y+view.h;}
    const marina=window.ROOKIE_V116_MARINA;
    // One depth queue: existing actors and new furnishing geometry share it.
    const entries=npcActors.filter(npc=>visible(npc)&&(!marina?.interiorActorVisible||marina.interiorActorVisible(npc))).map(npc=>({y:npc.y,actor:npc}));
    const bridge=window.ROOKIE_V131_PRECINCT_BRIDGE;
    for(const wall of bridge?.interiorDepthProps?.(stationWalls,stationRooms,ST.furn,view)||[])
      entries.push({y:wall.depthY,interiorWall:wall});
    const showCaperFridge=H.caper?.active();
    for(const f of ST.furn)if(!(showCaperFridge&&f.x===1780&&f.y===60)&&
      bridge?.interiorFurnitureActive?.(f,ST.rooms)&&nearViewport(STX+f.x-100,STY+f.y-140,f.w+200,f.h+240))
      entries.push({y:STY+f.y+f.h,stationFurniture:f});
    for(const d of ST.decors)if(d.t==='cellInterior')entries.push({y:STY+(d.dy??d.y),stationDecor:d});
    // Approved city pass: existing district silhouettes join the SAME queue
    // as actors. No new geometry, projection, camera or building instances.
    if(window.ROOKIE_CITY_PERSPECTIVE_ACTIVE&&campus.zoom>=.10)
      for(const d of districtEntries)if(nearViewport(d.x,d.y,d.w,d.h))
        for(const o of d.map.decors||[]){
          if(marina?.ownsDecor?.(d.id,o))continue;
          const b=districtBuildingBox(o),native=b?null:nativeDistrictProp(o);
          if(native){
            if(nearViewport(d.x+native.x,d.y+native.y,native.w,native.h))entries.push({y:d.y+native.depth,nativeProp:{...native,district:d}});
            continue;
          }
          const building=!!b;if(!building&&o.t!=='car')continue;
          const {x,y,w,h}=b||{x:o.x||0,y:o.y||0,w:o.w||70,h:o.h||36};
          const liveParked=parkedByObject.get(o),extent=liveParked?Math.max(liveParked.length,liveParked.width)*.65:0;
          if(liveParked?!nearViewport(liveParked.x-extent,liveParked.y-extent,extent*2,extent*2):!nearViewport(d.x+x-8,d.y+y-8,w+24,h+24))continue;
          if(building){
            if(!marina?.ownsSolid?.({x:d.x+x,y:d.y+y,w,h}))
              entries.push({y:d.y+(o.dy??y+h),districtBuilding:{object:o,district:d}});
          }else entries.push({y:parkedByObject.get(o)?.y??d.y+y+(o.h||36)/2,parkedVehicle:{object:o,district:d}});
        }
    for(const prop of window.ROOKIE_V134_PRECINCT?.communityProps?.(view)||[])
      entries.push({y:prop.y,communityProp:prop});
    // Bounded V133 precinct staff share the existing depth queue and classic
    // cast painter. No duplicated NPC engine or new citywide actor registry.
    if(window.ROOKIE_V133_PRECINCT?.actors)
      for(const a of window.ROOKIE_V133_PRECINCT.actors(t))
        if(visible(a)&&!story?.duplicate(a))entries.push({y:a.y,actor:a});
    // Vehicles join Jay, NPCs, roofs and trees in the SAME world-depth queue.
    if(campus.zoom>=.19)for(const car of streetTraffic)if(visible(car))
      entries.push({y:car.y,trafficCar:car});
    for(const car of H.campaignScenes?.vehicles()||[])if(visible(car))entries.push({y:car.y,trafficCar:car});
    for(const a of H.campaignScenes?.actors()||[])if(visible(a))entries.push({y:a.y,actor:a});
    if(marina?.interiorFurniture)for(const f of marina.interiorFurniture(view))entries.push({y:f.y+f.h,furniture:f});
    // V122: native marina piling bases join the SAME y-sorted draw queue as
    // Jay, ambient NPCs and interior furniture. This gives genuine occlusion:
    // an actor behind a piling is covered; in front of it, the actor covers it.
    if(marina?.active()&&marina.pierOccluders)
      for(const post of marina.pierOccluders(view))entries.push({y:post.depthY,pierPost:post});
    // V124 all structural silhouettes use the same sorted actor queue:
    // lamp behind player when Jay's feet are south of its base, roof behind
    // Jay outside the frontage, and only truly rear props occlude the player.
    if(marina?.active()&&marina.depthProps)
      for(const prop of marina.depthProps(view))entries.push({y:prop.depthY,depthProp:prop});
    if(window.ROOKIE_V127_CITY){
      for(const prop of window.ROOKIE_V127_CITY.depthProps(view,districtEntries))
        entries.push({y:prop.depthY,cityProp:prop});
    }
    // Precinct 9 belongs to the SAME feet-Y queue as Jay, officers and
    // scene props. It previously rendered AFTER every actor, covering Jay
    // even when he stood on the public sidewalk south of the main wall.
    // Sort the existing roof/facade at their TRUE southern baselines:
    // inside actors draw behind each shell; outside actors draw in front.
    entries.push({y:FRONT.y-1,precinctShell:'main'});
    entries.push({y:GARAGE.y-1,precinctShell:'garage'});
    entries.push({y:STY+636,precinctShell:'break'});
    if(cruiser){const p=cruiser.position();if(visible(p))entries.push({y:p.y,patrolCruiser:true});}
    if(!cruiser?.active())entries.push({y:campus.y,player:true});entries.sort((a,b)=>a.y-b.y);
    for(const entry of entries){
      if(entry.interiorWall){
        bridge.drawInteriorWall(g,entry.interiorWall,{room:ST.rooms.find(r=>r.label===interiorRoom(campus.x,campus.y)),
          player:{x:campus.x-STX,y:campus.y-STY},roofAlpha:roofAlpha()});continue;
      }
      if(entry.stationFurniture){
        g.save();g.translate(STX,STY);
        withOriginalContext(g,()=>{if(!bridge.furniture(g,entry.stationFurniture))drawFurn(entry.stationFurniture);});
        g.restore();continue;
      }
      if(entry.nativeProp){
        const p=entry.nativeProp,x=p.district.x+p.x,y=p.district.y+p.y;
        g.save();g.imageSmoothingEnabled=false;
        if(p.repeat){g.beginPath();g.rect(x,y,p.w,p.h);g.clip();for(let xx=x-25;xx<x+p.w;xx+=48)g.drawImage(p.im,xx,y);}
        else if(p.crop)g.drawImage(p.im,...p.crop,x,y,p.w,p.h);
        else g.drawImage(p.im,x,y,p.w,p.h);
        if(p.banner){
          // Compose existing civic crest art with the lamp in this same pass.
          // The cloth is a small ground-independent accent; no extra collider.
          const crest=connectedNativeImage('precinct-cinematic-v1/crest.png'),cx=x+p.w/2,top=y+38;
          g.strokeStyle='#bca25d';g.lineWidth=2;g.beginPath();g.moveTo(cx-29,top);g.lineTo(cx+29,top);g.stroke();
          for(const side of [-1,1]){const bx=cx+side*19;
            g.fillStyle='#174568';g.strokeStyle='#deb969';g.lineWidth=1.5;g.beginPath();g.moveTo(bx-9,top+2);g.lineTo(bx+9,top+2);g.lineTo(bx+9,top+32);g.lineTo(bx,top+37);g.lineTo(bx-9,top+32);g.closePath();g.fill();g.stroke();
            if(crest?.complete&&crest.naturalWidth)g.drawImage(crest,bx-7,top+9,14,17);
          }
        }
        g.restore();continue;
      }
      if(entry.stationDecor){withOriginalContext(g,()=>{const prior=state.map;state.map='station';g.save();g.translate(STX,STY);try{drawDecor(entry.stationDecor,t);}finally{g.restore();state.map=prior;}});continue;}
      if(entry.districtBuilding){
        const {object:o,district:d}=entry.districtBuilding;
        g.save();g.globalAlpha*=story?.roofFor(o)??1;g.translate(d.x,d.y);paintedBuilding(o,d.id);g.restore();continue;
      }
      if(entry.parkedVehicle){
        const {object:o,district:d}=entry.parkedVehicle,w=o.w||70,h=o.h||36;
        const dir=['up','down','left','right'].includes(o.dir)?o.dir:(w>=h?'right':'down');
        const horizontal=dir==='right'||dir==='left';
        const car=parkedByObject.get(o)||{x:d.x+(o.x||0)+w/2,y:d.y+(o.y||0)+h/2,dir,
          kind:o.police?'patrol':o.kind==='delivery'?'delivery':'civilian',color:o.c,
          length:horizontal?w:h,width:horizontal?h:w};
        if(!window.ROOKIE_V135_WALL_KIT?.drawPilotVehicle(g,car)){
          g.fillStyle=o.c||'#587aa1';g.fillRect(d.x+(o.x||0),d.y+(o.y||0),w,h);
        }continue;
      }
      if(entry.communityProp){window.ROOKIE_V134_PRECINCT.drawCommunityProp(g,entry.communityProp);continue;}
      if(entry.precinctShell){
        // Use the EXISTING roof texture, façade cache and camera transform.
        // No new sprite renderer, wall copy, NPC pass or animation loop.
        drawStationRoof(entry.precinctShell);
        if(entry.precinctShell!=='break')window.ROOKIE_V134_PRECINCT?.architecture(g,{
          zoom:campus.zoom,view,alpha:roofAlpha(),section:entry.precinctShell},t);
        continue;
      }
      if(entry.trafficCar){drawStreetTraffic(g,entry.trafficCar);continue;}
      if(entry.cityProp){window.ROOKIE_V127_CITY.drawDepthProp(g,entry.cityProp,t);continue;}
      if(entry.depthProp){
        marina.drawDepthProp(g,entry.depthProp,{zoom:campus.zoom,view,player:{x:campus.x,y:campus.y}},t);continue;
      }
      if(entry.pierPost){marina.drawPierPost(g,entry.pierPost);continue;}
      if(entry.patrolCruiser){cruiser.draw(g);continue;}
      if(entry.player){drawOfficer({x:campus.x,y:campus.y,color:'#2b467a'},true,t);continue;}
      if(entry.furniture){marina.drawInteriorFurniture(g,entry.furniture);continue;}
      const npc=entry.actor;
      if(H.campaignScenes?.suppress(npc))continue;
      if(H.campaignScenes?.drawActor(npc))continue;
      if(story?.drawActor(npc))continue;
      if(window.ROOKIE_CHICKEN?.draw(g,npc,t))continue;
      if(window.ROOKIE_BANANA?.draw(g,npc,t))continue;
      if(window.ROOKIE_CIVILIANS?.draw(g,npc))continue;
      if(marina&&(npc.npcStyle!==undefined||marina.inMarina(npc.x,npc.y))){if(marina.active())marina.drawNpc(g,npc.npcStyle!==undefined?npc:{...npc,npcStyle:1},t);}
      else if(!window.ROOKIE_V132_PRECINCT?.npc(g,{...npc,showLabel:campus.zoom>.54&&!npc.hideName}))drawOfficer(npc,false,t);
    }
    campus.near=null;let best=58;
    for(const sp of worldSpots){
      if(story&&!story.available(sp,campus.x,campus.y))continue;
      if(marina?.interactionAvailable&&!marina.interactionAvailable(sp,campus.x,campus.y))continue;
      const d=Math.hypot(sp.x-campus.x,sp.y-campus.y);
      if(d<best){best=d;campus.near=sp;}
      if(sp.building||!visible(sp)||campus.zoom<.38)continue;
      g.strokeStyle='rgba(234,193,88,.62)';g.lineWidth=2;g.beginPath();g.arc(sp.x,sp.y,8+2*Math.sin(t/410),0,7);g.stroke();
    }
  }
  function paint(t,dt){
    const paintStart=typeof performance!=='undefined'?performance.now():null;
    cameraFollow(dt);
    const viewW=tw/campus.zoom,viewH=th/campus.zoom;
    campus.visibleChunks=chunkWindow(campus.camX,campus.camY,viewW,viewH);
    g.save();g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#172e48';g.fillRect(0,0,tw,th);
    g.scale(campus.zoom,campus.zoom);g.translate(-campus.camX+(H.cityCollisions?.camera()||0),-campus.camY);
    // The same canvas and camera always draw both the campus and interior.
    // Visual presentation hooks are optional and must never change gameplay.
    // They receive a read-only view rectangle and the drawing context only.
    const art=window.ROOKIE_V115_SHOWCASE;
    const view={x:campus.camX,y:campus.camY,w:viewW,h:viewH};
    if(view.x<STX+ST.w&&view.x+view.w>STX&&view.y<STY+ST.h&&view.y+view.h>STY)
      window.ROOKIE_V135_WALL_KIT?.prepareInteriorWalls?.();
    window.ROOKIE_V135_WALL_KIT?.preparePerspectivePilot?.(view);
    drawCampusGround();
    // V133 owns the approved north-campus surface. Clip the historical
    // terrain painters at its boundary instead of repainting their old lots
    // and paving beneath it. Other districts and Harbor Avenue stay intact.
    g.save();
    if(window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE){
      g.beginPath();g.rect(MIN_X,MIN_Y,W-MIN_X,HGT-MIN_Y);
      g.rect(310,1110,2400,611);g.clip('evenodd');
    }
    if(art)art.ground(g,{zoom:campus.zoom,view},t);
    const pilot=window.ROOKIE_V115_PRECINCT_PILOT;
    if(pilot)pilot.ground(g,{zoom:campus.zoom,view},t);
    const reference=window.ROOKIE_V115_REFERENCE;
    if(reference)reference.terrain(g,{zoom:campus.zoom,view},t);
    const premium=window.ROOKIE_V115_PREMIUM;
    if(premium)premium.terrain(g,{zoom:campus.zoom,view},t);
    g.restore();
    drawLinkedDistricts(t);
    // Precinct 9 art sits over existing station/parking pavement only.
    // The adapter cannot move roads or change original district rendering.
    const precinctVisual=window.ROOKIE_V130_PRECINCT;
    if(precinctVisual&&!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE)precinctVisual.ground(g,{zoom:campus.zoom,view},t);
    if(reference)reference.gameOverlay(g,{zoom:campus.zoom,view,districts:districtEntries},t);
    if(premium)premium.overlay(g,{zoom:campus.zoom,view,districts:districtEntries},t);
    if(art)art.streets(g,{zoom:campus.zoom,view},t);
    // V133 original connected geometry remains under a cached civic-ground
    // visual layer; do not paint into active roads or create scene transitions.
    // The current park owns its ground; keep the older cached Civic Green
    // lawn/placard from repainting the new woodland and monument landing.
    g.save();const parkBounds=window.ROOKIE_V127_CITY?.parkBounds;
    if(parkBounds){g.beginPath();g.rect(MIN_X,MIN_Y,W-MIN_X,HGT-MIN_Y);g.rect(parkBounds.x,parkBounds.y,parkBounds.w,parkBounds.h);g.clip('evenodd');}
    window.ROOKIE_V133_PRECINCT?.ground(g,{zoom:campus.zoom,view},t);g.restore();
    // One connected-road finish after historical ground layers, before props
    // and actors. It reads the same immutable road graph used by traffic.
    window.ROOKIE_V135_WALL_KIT?.drawRoadNetwork?.(g,links,crossings,view,nativeRoadSurfaces);
    window.ROOKIE_V127_CITY?.midtownStreetFinish?.(g,connectedMidtown,view);
    // Actual reference-guided plaza details, after existing civic pavement.
    window.ROOKIE_V134_PRECINCT?.ground(g,{zoom:campus.zoom,view},t);
    window.ROOKIE_V127_CITY?.civicGround?.(g,view);
    window.ROOKIE_V127_CITY?.beachGround?.(g,view,t);
    drawOutdoorDecor();
    const marina=window.ROOKIE_V116_MARINA;
    if(marina)marina.background(g,{zoom:campus.zoom,view},t);
    // V118 optional camera-culled light/shadow pass; no gameplay state changes.
    const cinematic=window.ROOKIE_V118_CINEMATIC;
    if(cinematic)cinematic.ground(g,{zoom:campus.zoom,view},t);
    if(pilot&&!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE)pilot.props(g,{zoom:campus.zoom,view},t);
    drawStation(); // Original lobby, furnished rooms, walls and thresholds.
    // Draw walkable stone forecourt AFTER legacy station apron paint, BEFORE
    // the original depth-sorted player/NPC draw; don't paint over character art.
    window.ROOKIE_V134_PRECINCT?.forecourt(g,{zoom:campus.zoom,view},t);
    // V138: the ORIGINAL roof and architecturally cached facade now join
    // the one feet-depth queue above. Jay in front of Precinct 9 no longer
    // disappears behind the wall. Interior actors remain behind the facade
    // until the SAME original roof cutaway reveals the rooms.
    // Native clue props use their original coordinates and handlers.
    if(nearViewport(STX+1558,STY+12,366,624))withOriginalContext(g,()=>{const prior=state.map;state.map='station';g.save();g.translate(STX,STY);try{drawDecor({t:'caperFridge',x:1780,y:60},t);drawDecor({t:'caperCoffee',x:1608,y:82},t);drawFurn({x:1690,y:330,w:132,h:52,type:'table'});drawFurn({x:1785,y:420,w:90,h:34,type:'sofa'});}finally{g.restore();state.map=prior;}});
    cruiser?.bayMark(g);
    story?.ground(g);
    if(H.caper?.active())withOriginalContext(g,()=>{const prior=state.map;state.map='station';g.save();g.translate(STX,STY);try{for(const d of ST.decors)if(d.t.startsWith('caper'))drawDecor(d.t==='caperBreakSign'?{...d,x:1708}:d,t);}finally{g.restore();state.map=prior;}});
    window.ROOKIE_COMIC?.drawProps(g);
    drawEntityHighlights(t);
    // Contact flashes/debug labels must follow the cached road and actor
    // passes; drawing them under historical pavement made them disappear.
    H.cityCollisions?.draw(g);
    // The V115 showcase also drew roof vents; V132 owns that layer now.
    // Avoid double glazing/vents over the ported legacy material and signs.
    if(art&&!window.ROOKIE_V132_PRECINCT)art.precinct(g,{zoom:campus.zoom,view,STX,STY,alpha:roofAlpha()},t);
    // Precinct art respects the SAME roof alpha and existing native geometry.
    // V130 old entry label/sill would overwrite the actual new glass doors.
    // V134 owns the entire facade and the real vehicle threshold artwork;
    // keep only V130's original pavement/road-ground graphics.
    if(precinctVisual&&!window.ROOKIE_V134_PRECINCT)
      precinctVisual.frontage(g,{zoom:campus.zoom,view,roofAlpha:roofAlpha()},t);
    // Architectural wall band, public overhang and garage threshold details
    // fade with the SAME original station roof, never into the interior.
    if(!window.ROOKIE_V134_PRECINCT)
      window.ROOKIE_V133_PRECINCT?.facade(g,{zoom:campus.zoom,view,alpha:roofAlpha()},t);
    if(marina)marina.foreground(g,{zoom:campus.zoom,view,player:{x:campus.x,y:campus.y}},t);
    if(cinematic)cinematic.atmosphere(g,{zoom:campus.zoom,view},t);
    if(pilot&&!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE)pilot.animated(g,{zoom:campus.zoom,view},t);
    if(art)art.atmosphere(g,{zoom:campus.zoom,view},t);
    story?.fridgeGuide(g,view,roofAlpha()<.1,!priorOverlay()&&!csActive&&!H.profiles.isOpen()&&
      !H.speech?.current()&&!cruiser?.active()&&!window.ROOKIE_PARKING_ENCOUNTER?.locked()&&!window.ROOKIE_V116_HUD?.blocked());
    g.restore();
    H.connectedTactics?.paint();
    const region=interiorRoom(campus.x,campus.y);
    const district=districtAt(campus.x,campus.y);
    const desc=region ? 'PRECINCT 9 · '+region : district ? district.map.name : campus.y>1640?'HARBOR CITY · CONNECTED AVENUES':'PRECINCT 9 · GROUNDS';
    modal.querySelector('#v115CampusRegion').textContent=desc;
    modal.querySelector('#v115CampusCoords').textContent='World '+Math.round(campus.x)+', '+Math.round(campus.y)+'  · '+idOf(campus.x,campus.y)+'  · '+Math.round(campus.zoom*100)+'%';
    if(window.ROOKIE_V116_HUD)window.ROOKIE_V116_HUD.paint({x:campus.x,y:campus.y},t);
    const act=modal.querySelector('#v115CampusInteract');
    const near=campus.near,actor=near&&(near.ambientActor||marina?.actors?.some(a=>a.id===near.id));
    const vehicleAction=cruiser?.active()||cruiser?.near();
    window.ROOKIE_COMIC?.frame({host:modal,canvas:cv,view,actors:(H.campaignScenes?.actors()||[]).concat(npcActors),traffic:streetTraffic,player:{x:campus.x,y:campus.y,moving:campus.moved,speed:campus.speed},driving:!!cruiser?.active(),area:district?.id||(campus.x>=200&&campus.x<=2600&&campus.y>=1900&&campus.y<=3650?'coast-park':'precinct'),timeOfDay:(typeof H.worldClock?.phase==='function'?H.worldClock.phase():H.worldClock?.phase||state.timeOfDay||'day'),progress:{mission:currentMission(),briefed:!!state.camp?.m2?.brief,cameraFound:!!state.evidence?.m2camera,firstCaseComplete:!!state.caper?.complete},comedyNear:window.ROOKIE_COMIC?.nearComedy(campus.x,campus.y,640),ambientFree:!priorOverlay()&&!csActive&&!H.profiles.isOpen()&&!window.ROOKIE_PARKING_ENCOUNTER?.locked()&&!['hale','warehouse'].includes(story?.room()),visible:a=>a.x>=view.x-30&&a.x<=view.x+view.w+30&&a.y>=view.y&&a.y<=view.y+view.h+60&&(!interiorRoom(a.x,a.y)||roofAlpha()<.5)&&(!marina?.interiorActorVisible||marina.interiorActorVisible(a))&&(!a.storyInterior||story?.available(a,campus.x,campus.y))},t);
    const comicActive=window.ROOKIE_COMIC?.modalActive(),comicNear=!cruiser?.active()&&window.ROOKIE_COMIC?.nearComedy(campus.x,campus.y);
    const caption=comicActive?'Continue':comicNear?'Talk':vehicleAction?(cruiser.active()?'Exit':'Drive'):
      near?.nativeId==='caper:fridge'?'Check Fridge':near?(actor?'Talk':'Inspect'):'Action';
    if(act.textContent!==caption)act.textContent=caption;
    act.disabled=!(comicActive||comicNear||near||vehicleAction);
    if(paintStart!==null){campus.paintCount++;campus.paintCosts.push(performance.now()-paintStart);if(campus.paintCosts.length>180)campus.paintCosts.shift();}
  }
  function loop(timestamp){
    if(!campus.open)return;
    const dt=campus.last?clamp((timestamp-campus.last)/1000,0,.05):1/60;campus.last=timestamp;
    if(!document.hidden){if(!window.ROOKIE_V116_HUD?.blocked())simulate(dt);paint(timestamp,dt);H.mainCity?.tick(timestamp);H.cityAudio?.tick(timestamp);}
    campus.frame=requestAnimationFrame(loop);
  }
  function open(){
    if(campus.open)return;
    // Explicitly exclude the separated combat/Academy experience.
    if((typeof state!=='undefined' && state && state.map==='training') ||
       (H.academy&&typeof H.academy.active==='function'&&H.academy.active()) ||
       (H.outbreak&&typeof H.outbreak.active==='function'&&H.outbreak.active()))return;
    // Enter at the player's existing world-space location when available.
    // This is read-only; the real player's map and saves are not rewritten.
    if(typeof player!=='undefined' && player && typeof state!=='undefined' && state &&
       (state.map==='station'||state.map==='plaza')){
      const ox=state.map==='station'?STX:PLX,oy=state.map==='station'?STY:PLY;
      const x=ox+player.x+player.w/2,y=oy+player.y+player.h/2;
      if(!blocked(x,y)){campus.x=x;campus.y=y;}
      else {campus.x=FRONT.x;campus.y=FRONT.y+86;}
    }
    closeMap();story?.sync();
    campus.open=true;campus.firstPaint=true;campus.previousRoom=interiorRoom(campus.x,campus.y);
    modal.hidden=false;document.body.classList.add('v115-campus-open');
    // Main startup opens the city before deferred marina assets finish loading.
    // Activate the existing city HUD/control layout on that first open too.
    if(window.ROOKIE_MAIN_CITY_ACTIVE||window.ROOKIE_V116_MARINA)document.body.classList.add('v116-play-mode');
    clearInput();campus.last=0;resize();campus.frame=requestAnimationFrame(loop);
  }
  function close(){
    if(window.ROOKIE_MAIN_CITY_ACTIVE&&!H.academy?.active()&&!H.outbreak?.active()&&!H.mainCity?.activityActive()){H.mainCity?.openNative('menu');return;}
    if(!campus.open)return;if(cruiser&&cruiser.suspend()===false)return;campus.open=false;cancelAnimationFrame(campus.frame);clearInput();
    window.ROOKIE_PARKING_ENCOUNTER?.cancel();
    window.ROOKIE_COMIC?.close();
    window.ROOKIE_V116_HUD?.close();story?.restorePanels();
    H.cityAudio?.stop();H.campaignScenes?.suspend();H.connectedTactics?.reset();H.mainCity?.suspend();
    modal.hidden=true;document.body.classList.remove('v115-campus-open','v116-play-mode');
  }
  btn.addEventListener('click',open);
  modal.querySelector('#v115CampusExit').addEventListener('click',close);
  modal.querySelector('#v115CampusZoomOut').addEventListener('click',()=>pickZoom(campus.zoom/1.3));
  modal.querySelector('#v115CampusZoomIn').addEventListener('click',()=>pickZoom(campus.zoom*1.3));
  modal.querySelector('#v115CampusOverview').addEventListener('click',()=>{
    const fit=Math.min(tw/(W-MIN_X),th/(HGT-MIN_Y))*.96;
    if(campus.zoom<.09){pickZoom(1.15);campus.follow=true;}
    else {pickZoom(Math.min(tw/(W-MIN_X),th/(HGT-MIN_Y))*.96);campus.follow=false;campus.camX=(MIN_X+W-tw/campus.zoom)/2;campus.camY=(HGT-th/campus.zoom)/2;}
  });
  modal.querySelector('#v115CampusInteract').addEventListener('click',()=>{
    const comic=window.ROOKIE_COMIC;
    if(comic?.modalActive()){comic.advance();return;}
    if(window.ROOKIE_PARKING_ENCOUNTER?.locked())return;
    if(comic?.nearComedy(campus.x,campus.y)&&window.ROOKIE_PARKING_ENCOUNTER?.interact())return;
    if(comic?.nearComedy(campus.x,campus.y)&&comic.comedy())return;
    if(cruiser?.interact())return;
    const sp=campus.near;
    if(story?.interact(sp))return;
    if(comic?.converse(sp,npcActors))return;
    const marina=window.ROOKIE_V116_MARINA;
    if(sp?.ambientActor){
      const dialogue=modal.querySelector('#v116Dialogue');
      if(dialogue){dialogue.hidden=false;dialogue.textContent=sp.text;return;}
    }
    if(sp&&marina&&sp.id.startsWith('v116:')){
      const dialogue=modal.querySelector('#v116Dialogue');
      if(dialogue){dialogue.hidden=false;dialogue.textContent=sp.text||sp.label;}
      return;
    }
    modal.querySelector('#v115CampusNote').textContent=sp?
      sp.label:
      'Approach a person, case clue or precinct desk and use Action.';
  });
  const dialogue=document.createElement('output');dialogue.id='v116Dialogue';
  dialogue.hidden=true;dialogue.setAttribute('aria-live','polite');modal.appendChild(dialogue);
  // V125: retain the existing campus.stick movement vector. Only the touch
  // origin moves inside the lower-left pad; no second joystick/input loop.
  const pad=modal.querySelector('#v115CampusPad'),knob=modal.querySelector('#v115CampusKnob');
  const base=modal.querySelector('#v125CampusBase'),sprint=modal.querySelector('#v125CampusSprint');
  let pointer=null,stickOrigin=null,sprintPointer=null;
  const changeStick=e=>{
    if(!stickOrigin)return;
    let dx=(e.clientX-stickOrigin.x)/46,dy=(e.clientY-stickOrigin.y)/46;
    const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
    if(Math.hypot(dx,dy)<.13){dx=0;dy=0;}
    campus.stick={x:dx,y:dy};
    knob.style.transform='translate(calc(-50% + '+Math.round(dx*38)+'px),calc(-50% + '+Math.round(dy*38)+'px))';
  };
  const release=e=>{
    if(e&&e.pointerId!==pointer)return;
    pointer=null;stickOrigin=null;campus.stick=null;knob.style.transform='translate(-50%,-50%)';
    base.classList.remove('active');
  };
  pad.addEventListener('pointerdown',e=>{
    if(pointer!==null||window.ROOKIE_V116_HUD?.blocked()||window.ROOKIE_COMIC?.modalActive()||window.ROOKIE_PARKING_ENCOUNTER?.locked())return;
    e.preventDefault();e.stopPropagation();pointer=e.pointerId;
    pad.setPointerCapture?.(pointer);
    const r=pad.getBoundingClientRect();
    const localX=Math.max(53,Math.min(r.width-53,e.clientX-r.left));
    const localY=Math.max(53,Math.min(r.height-53,e.clientY-r.top));
    stickOrigin={x:r.left+localX,y:r.top+localY};
    base.style.left=localX+'px';base.style.top=localY+'px';base.classList.add('active');
    changeStick(e);
  });
  pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();changeStick(e);}});
  pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);
  pad.addEventListener('lostpointercapture',release);
  sprint.addEventListener('pointerdown',e=>{
    if(sprintPointer!==null||window.ROOKIE_V116_HUD?.blocked())return;
    e.preventDefault();e.stopPropagation();sprintPointer=e.pointerId;
    sprint.setPointerCapture?.(sprintPointer);campus.runHeld=true;sprint.classList.add('held');
  });
  const releaseSprint=e=>{
    if(e&&e.pointerId!==sprintPointer)return;
    sprintPointer=null;campus.runHeld=false;sprint.classList.remove('held');
  };
  sprint.addEventListener('pointerup',releaseSprint);sprint.addEventListener('pointercancel',releaseSprint);
  sprint.addEventListener('lostpointercapture',releaseSprint);
  // Accessible keyboard activation provides a release-safe hold; no auto-run.
  sprint.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();campus.runHeld=true;}});
  sprint.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();campus.runHeld=false;}});
  window.addEventListener('blur',()=>{release();releaseSprint();});
  function captureKey(e,down){
    if(!campus.open)return;
    const k=e.key.toLowerCase();
    if(H.campaignScenes?.active()){
      clearInput();if(e.ctrlKey||e.metaKey||/^f\d+$/.test(k))return;
      if(['w','a','s','d','arrowleft','arrowright','e','m','i','escape','+','=','-'].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(k==='escape'&&down)window.ROOKIE.cutscene.skip();}return;
    }
    if(window.ROOKIE_PARKING_ENCOUNTER?.locked()){
      clearInput();if(e.ctrlKey||e.metaKey||/^f\d+$/.test(k))return;
      e.preventDefault();e.stopImmediatePropagation();
      if(k==='tab'&&down)modal.querySelector('#parkingEncounterSkip')?.focus();
      if(down&&!e.repeat&&(k==='escape'||(k==='enter'||k===' ')&&document.activeElement?.id==='parkingEncounterSkip'))window.ROOKIE_PARKING_ENCOUNTER.skip();
      return;
    }
    if(window.ROOKIE_COMIC?.modalActive()){
      clearInput();if(['w','a','s','d','arrowleft','arrowright','escape'].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(k==='escape'&&down)H.comicDialogue.close();}return;
    }
    if(story?.blocked()) {clearInput();return;}
    if(window.ROOKIE_V116_HUD?.blocked()){
      clearInput();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','m','i','escape'].includes(k)){e.preventDefault();e.stopImmediatePropagation();}
      if(k==='escape'&&down)window.ROOKIE_V116_HUD.close();return;
    }
    if(cruiser?.key(k,down)){e.preventDefault();e.stopImmediatePropagation();return;}
    if(H.connectedTactics?.key(k,down)){e.preventDefault();e.stopImmediatePropagation();return;}
    if(H.mainCity&&['m','i'].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(down)H.mainCity.openNative(k==='m'?'map':'gear');return;}
    if(k==='e'){e.preventDefault();e.stopImmediatePropagation();if(down)modal.querySelector('#v115CampusInteract').click();return;}

    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','escape','+','=','-'].includes(k)){
      e.preventDefault();e.stopImmediatePropagation();
      if(k==='escape'&&down)close();
      else if((k==='+'||k==='=')&&down)pickZoom(campus.zoom*1.2);
      else if(k==='-'&&down)pickZoom(campus.zoom/1.2);
      else if(down)campus.keys.add(k);else campus.keys.delete(k);
    }
  }
  window.addEventListener('keydown',e=>captureKey(e,true),true);
  window.addEventListener('keyup',e=>captureKey(e,false),true);
  // Pointer pinch zooms the SAME canvas/world. It never changes map IDs.
  const fingers=new Map();let priorPinch=null;
  cv.addEventListener('pointerdown',e=>{
    fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(fingers.size===2)priorPinch=null;
  });
  cv.addEventListener('pointermove',e=>{
    if(!fingers.has(e.pointerId))return;
    fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(fingers.size!==2)return;
    const pts=[...fingers.values()],span=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
    if(priorPinch&&priorPinch>3)pickZoom(campus.zoom*span/priorPinch);
    priorPinch=span;
  });
  function endFinger(e){fingers.delete(e.pointerId);priorPinch=null;}
  cv.addEventListener('pointerup',endFinger);cv.addEventListener('pointercancel',endFinger);
  cv.addEventListener('wheel',e=>{e.preventDefault();pickZoom(campus.zoom*(e.deltaY>0?.88:1.12));},{passive:false});
  window.addEventListener('blur',clearInput);
  window.addEventListener('resize',resize);
  // Geography telemetry is read-only. Unit 9 parking is saved by its adapter;
  // no world state is synchronized over a network.
  // This schema is deterministic and uses the same world ID as the Phase 1 atlas.
  const api={version:'115-phase2-seamless-precinct-prototype',worldId:WORLD_ID,areaId:AREA_ID,
    width:W-MIN_X,height:HGT,chunkSize:CHUNK,entrances:Object.freeze({front:FRONT,garage:GARAGE}),
    districts:()=>districtEntries.map(d=>({id:d.id,x:d.x,y:d.y,w:d.w,h:d.h,instanceId:d.instanceId})),
    perspectiveQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?JSON.parse(JSON.stringify(districtEntries.map(d=>({
      id:d.id,x:d.x,y:d.y,w:d.w,h:d.h,decors:d.map.decors,connectedParking:d.map.connectedParking,
      solids:d.map.pedSolids||d.map.solids||[],ground:d.map.ground
    })))):null,
    links:()=>links.map(l=>({...l})),
    intersections:()=>crossings.map(c=>({...c})),
    roadTopologyVersion:roadNetwork.version,
    streetRepairs:()=>JSON.parse(JSON.stringify(streetRelocations)),
    sidewalkRepairs:()=>JSON.parse(JSON.stringify(retiredSidewalkBarriers)),
    cruiserQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?cruiser:null,
    trafficQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?streetTraffic.map(c=>({...c})):null,
    parkedQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?parkedBodies.map(b=>({...b})):null,
    trafficGraphQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)&&trafficRouter?{metrics:trafficRouter.metrics(),roads:trafficRouter.graph.roads,legs:trafficRouter.graph.legs,turns:trafficRouter.graph.turns,nodes:trafficRouter.graph.nodes}:null,
    trafficAdvanceQA:seconds=>{if(!/[?&]pilotQA=1(?:&|$)/.test(window.location.search))return false;for(let i=0;i<Math.min(60,Math.max(0,seconds))*30;i++){stepAmbientPedestrians(1/30);window.ROOKIE_V116_MARINA?.stepNPCs(1/30);stepStreetTraffic(1/30);}return true;},
    civilianQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?{
      actors:npcActors.map(n=>({id:n.id,name:n.name,role:window.ROOKIE_CIVILIANS?.roleFor(n)||null,
        protected:!!window.ROOKIE_CIVILIANS?.protectedActor(n),speed:n.speed||0,route:n.route?.map(p=>p.slice())||null,
        dir:n.dir,moving:!!n.moving,distance:n.distance||0,x:n.x,y:n.y})),
      interactions:worldSpots.map(s=>({id:s.id,label:s.label,text:s.text,building:s.building})),
      geometry:{walls:walls.length,furniture:furniture.length,rooms:roomRects.length}
    }:null,
    // Read-only query-gated telemetry. Existing camera, roof and player
    // state continue to be owned by the original connected game loop.
    entranceQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?
      {cameraX:campus.camX,cameraY:campus.camY,zoom:campus.zoom,
       follows:campus.follow,roofAlpha:roofAlpha(),
       playerX:campus.x,playerY:campus.y,dir:campus.dir,
       room:interiorRoom(campus.x,campus.y),crossings:campus.doorCrossings}:null,
    districtAt:(x,y)=>districtAt(x,y)?.id||'precinct-campus',
    travelStory:(map,x,y)=>story?.travel(map,x,y)||false,
    legacyLocation:(map,x,y)=>story?.locate(map,x,y)||null,
    storyRoom:()=>story?.room()||null,
    legacyManifest:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?Object.fromEntries(Object.entries(MAPS).map(([id,m])=>[id,{indoor:!!m.indoor,spots:m.spots.map(s=>({id:s.id,to:s.to,label:s.label})),npcs:m.npcs.map(n=>({name:n.name,talk:n.talk}))}])):null,
    storyQA:()=>/[?&]pilotQA=1(?:&|$)/.test(window.location.search)?story?.qa():null,
    open,close,isOpen:()=>campus.open,
    openAt:(x,y,z=1.1)=>{
      if(!Number.isFinite(x)||!Number.isFinite(y)||blocked(x,y))return false;
      open();if(!campus.open)return false;
      campus.x=x;campus.y=y;campus.zoom=clamp(z,.35,2.5);campus.autoZoom=true;campus.follow=true;
      campus.camX=x-tw/(2*campus.zoom);campus.camY=y-th/(2*campus.zoom);
      attachMarinaActors();
      return true;
    },
    toWorld:(areaId,x,y)=>areaId==='station'?{worldId:WORLD_ID,areaId,x:STX+x,y:STY+y}:
      areaId==='plaza'?{worldId:WORLD_ID,areaId:'precinct-campus-v115',x:PLX+x,y:PLY+y}:null,
    metrics:()=>{const times=campus.paintCosts.slice().sort((a,b)=>a-b);return {frames:campus.paintCount,paintP95Ms:times[Math.floor((times.length-1)*.95)]||0,paintMaxMs:times.at(-1)||0,samples:times.length,ambientPedestrians:ambientRoutes.length,ambientDistrictsInitialized:ambientInit,streetCars:streetTraffic.length,stoppedCars:streetTraffic.filter(c=>c.stopped).length};},
    snapshot:()=>Object.freeze({schema:1,worldId:WORLD_ID,areaId:districtAt(campus.x,campus.y)?.id||AREA_ID,
      playerId:H.profiles.current(),x:campus.x,y:campus.y,dir:campus.dir,zoom:campus.zoom,instanceId:districtAt(campus.x,campus.y)?.instanceId||'harbor-main:campus',
      transport:cruiser?.active()?'cruiser':'none',authoritativeServer:false,committedToSave:!!window.ROOKIE_MAIN_CITY_ACTIVE}),
    chunks:(x,y,vw,vh)=>chunkWindow(x,y,vw,vh),
    geometry:()=>({walls:walls.length,furniture:furniture.length,rooms:roomRects.length,spots:worldSpots.length,
      stationFootprint:{x:STX,y:STY,w:ST.w,h:ST.h},plazaPlacement:{x:PLX,y:PLY},
      separateSceneLoads:0,doorTransitions:'world-space-continuous'}),
    // Screenshot-only deterministic camera: query-gated, cannot mutate world state or saves.
    qaCamera:(x,y,z)=>{
      if(!/[?&]pilotQA=1(?:&|$)/.test(window.location.search)||!campus.open)return false;
      campus.zoom=clamp(z,.35,1.8);campus.follow=false;
      campus.camX=x-tw/(2*campus.zoom);campus.camY=y-th/(2*campus.zoom);
      return true;
    },
    test:{blocked,roadCollisionDiagnostic,interiorRoom,chunkAt,moveTo:(x,y)=>{if(blocked(x,y))return false;campus.x=x;campus.y=y;return true;},
      position:()=>({x:campus.x,y:campus.y}),doorCrossings:()=>campus.doorCrossings},
    scope:'Connected district geography and precinct foot exploration share one camera. Profile-owned precinct cast, case actions and seamless investigation interiors reuse native story handlers and saves; Academy keeps its original simulation lifecycle. Zombie remains excluded.'};
  H.seamlessCampusV115=Object.freeze(api);
  // Three native display vehicles sit inside solid building/garage footprints.
  // Keep those structures intact; only publicly reachable parked cars move.
  for(const b of parkedBodies){b.sheltered=blocked(b.x,b.y,4,true,true,true);if(!b.sheltered)movableParked.push(b);}
  if(window.ROOKIE_MAIN_CITY_ACTIVE)H.cityCollisions=window.ROOKIE_WILD_ARCADE?.create({qa:/[?&]pilotQA=1(?:&|$)/.test(location.search),debug:/[?&]collisionDebug=1(?:&|$)/.test(location.search),unit:()=>cruiser?.physicsBody(),fleet:()=>streetTraffic,parked:()=>movableParked,
    blocked:(x,y,angle,b)=>{const c=Math.cos(angle),s=Math.sin(angle),l=(b.length||86)/2-8,w=(b.width||38)/2-8;for(const lx of [-l,-l/2,0,l/2,l])for(const ly of [-w,0,w])if(blocked(x+lx*c-ly*s,y+lx*s+ly*c,8,true,true,true))return true;return false;},
    release:c=>trafficRouter?.release(c),rejoin:c=>trafficRouter?.rejoin(c),reenter:c=>trafficRouter?.reenter(c),
    impact:(e,a,b)=>{a.impactJolt=b.impactJolt=Math.min(1,e.closing/180);if(a.id==='precinct-unit-9'||b.id==='precinct-unit-9')cruiser?.vehicleImpact();}
  });
  if(window.ROOKIE_MAIN_CITY_ACTIVE)H.cityAudio=window.ROOKIE_CITY_AUDIO_FACTORY?.({
    context:()=>AC,unlock:ensureAudio,gain:avSfxGain,player:()=>campus,traffic:()=>streetTraffic,vehicle:()=>cruiser?.audioState(),
    allowed:()=>campus.open&&!H.profiles.isOpen()&&!H.academy.active()&&!H.outbreak.active(),
    environment:()=>{const park=window.ROOKIE_V127_CITY?.parkBounds;return{zone:park&&campus.x>=park.x&&campus.x<park.x+park.w&&campus.y>=park.y&&campus.y<park.y+park.h?'forest':campus.y>=3800?'coast':'city',indoors:!!interiorRoom(campus.x,campus.y)||!!story?.room()||!!window.ROOKIE_V116_MARINA?.interiorAt(campus.x,campus.y),paused:priorOverlay()||!!csActive||!!window.ROOKIE_V116_HUD?.blocked()||!!window.ROOKIE_PARKING_ENCOUNTER?.locked(),dialogue:!!H.speech?.current()};},
    surface:()=>{
      const x=campus.x,y=campus.y,marina=window.ROOKIE_V116_MARINA;
      if(marina?.interiorAt(x,y)?.kind==='bait'||marina?.arrivalDecks.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)||marina?.piers.some(px=>x>=px&&x<px+90&&y>=3800&&y<4100)||x>=2800&&x<4240&&y>=4104&&y<4174||x>=3560&&x<3620&&y>=4174&&y<4294)return 'wood';
      if(interiorRoom(x,y)||story?.room()||marina?.interiorAt(x,y))return 'pavement';
      const city=window.ROOKIE_V127_CITY,park=city?.parkBounds;if(park&&x>=park.x&&x<park.x+park.w&&y>=park.y&&y<park.y+park.h)return 'grass';
      if(links.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h))return 'pavement';
      const d=districtAt(x,y);if(d){let kind=city?.colorKind(d.map.base||'#729763');for(const r of d.map.ground||[])if(x>=d.x+r.x&&x<d.x+r.x+r.w&&y>=d.y+r.y&&y<d.y+r.y+r.h)kind=city?.colorKind(r.c);return kind==='grass'?'grass':'pavement';}
      return y>3880?'sand':'pavement';
    }
  });
  const tacticsFactory=/* CONNECTED_TACTICS */null;
  if(window.ROOKIE_MAIN_CITY_ACTIVE)H.connectedTactics=tacticsFactory?.({H,api,campus,maps:MAPS,modal,actors:npcActors,spots:worldSpots,room:()=>story?.roomData(),context:tacticalContext,blocked});
  const campaignFactory=/* CONNECTED_CAMPAIGN */null;
  if(window.ROOKIE_MAIN_CITY_ACTIVE)campaignFactory?.({H,api,campus,STX,STY,worldSpots,npcActors,cruiser,clearInput,streetGraph:()=>trafficRouter?.graph,paintActor:a=>withOriginalContext(g,()=>drawPerson(a.x,a.y,a.color,a.hat,a.name,a.dir||'down',false,true,0,a.moving?a.distance/22:null))});
  const mainFactory=/* CONNECTED_MAIN */null;
  if(window.ROOKIE_MAIN_CITY_ACTIVE)mainFactory?.({H,api,campus,state:()=>state,save:()=>save(),setSave:fn=>{save=fn;},getSave:()=>save,player,nativePlace:(map,x,y)=>{state.map=map;state.inCar=false;player.x=x;player.y=y;player.dir='up';updateLocLabel();updateCam();H.fit();}});
})();

/* ROOKIE: Harbor City — V116 Southbay Marina, actual connected-world module.
 * Same harbor-main world coordinates and camera as V115. Render layers and
 * actor data only; no classic MAPS/quest/save/vehicle/Zombie mutation.
 * Authored source sprites and native-space dock/shore layout. Mobile-aware.
 */
(function(){
'use strict';
const BASE='./assets/v116-marina/';
const WORLD='harbor-main';
const TERRAIN={x:4352,y:3220,w:1792,h:1436,cell:32,chunk:256};
const PIER_X=Object.freeze([4655,5105,5555]);
const images=Object.create(null),imageFiles=[
 'marina-reference-atlas.webp','marina-tiles.png','marina-detail-tiles.png','marina-cafe.png','bait-and-tackle.png','marina-office.png',
 'boat-service.png','marina-kiosk.png','boat-motor.png','boat-sail.png',
 'boat-fishing.png','marina-people.png','marina-gulls.png'];
const sourceFiles=['shade_tree','palm','bench','lamp','flower_planter','trash_bin','bollard','fence_horizontal'];
for(const file of imageFiles){const im=new Image();im.decoding='async';images[file]=im;im.src=BASE+file;}
for(const file of sourceFiles){const im=new Image();im.decoding='async';images[file+'.webp']=im;im.src='./assets/exterior/'+file+'.webp';}
const img=(key)=>{const im=images[key];return im&&im.complete&&im.naturalWidth>0?im:null;};
// Alpha-bound sprites from the reference-guided atlas; no scene-sized backdrop.
const DETAIL_SPRITES={"marina-office.png": [26, 53, 269, 227], "boat-service.png": [349, 58, 269, 221], "marina-cafe.png": [659, 53, 264, 230], "marina-kiosk.png": [980, 58, 247, 214], "shade_tree.webp": [28, 323, 262, 293], "palm.webp": [353, 329, 260, 285], "flower_planter.webp": [670, 429, 247, 122], "lamp.webp": [1073, 333, 50, 276], "boat-motor.png": [83, 657, 149, 281], "boat-sail.png": [402, 648, 158, 292], "boat-fishing.png": [710, 644, 143, 295], "bench.webp": [976, 759, 243, 142], "hero": [108, 1008, 102, 184], "fisher": [418, 940, 189, 256], "visitor": [736, 1018, 95, 171], "trash_bin.webp": [1059, 1038, 80, 140]};
DETAIL_SPRITES['bait-and-tackle.png']=DETAIL_SPRITES['marina-cafe.png'];
function paintSprite(g,key,x,y,w,h){
 const atlas=img('marina-reference-atlas.webp'),box=DETAIL_SPRITES[key];
 if(atlas&&box){g.imageSmoothingEnabled=false;g.drawImage(atlas,...box,x,y,w,h);return;}
 const fallback=img(key);if(fallback)g.drawImage(fallback,x,y,w,h);
}
let enabled=true,ready=false,cacheDraws=0,waterFrames=0,objectsDrawn=0,prepass=0;
const cached=new Map(),CAP=40; // 40 * 256² * 4 = 10 MiB max; avoids portrait viewport LRU rebuild thrashing
const objects=Object.freeze([
 // Original Waterfront MAPS: OFFICE x180,y140,w300,h200; SHED B x620,y180,w220,h150.
 {id:'marina:office',type:'building',image:'marina-office.png',x:4580,y:3360,w:300,h:200,solid:false},
 {id:'marina:shed-b',type:'building',image:'boat-service.png',x:5020,y:3400,w:220,h:150,solid:false},
 // Two additional coastal storefronts on existing grass, clear of mission doors.
 {id:'marina:cafe',type:'building',image:'marina-cafe.png',x:4460,y:3227,w:183,h:125,solid:true},
 {id:'marina:bait',type:'building',image:'bait-and-tackle.png',x:5425,y:3348,w:212,h:163,solid:true},
 {id:'marina:information',type:'kiosk',image:'marina-kiosk.png',x:5670,y:3540,w:88,h:96,solid:true},
 {id:'marina:shade-west',type:'tree',image:'shade_tree.webp',x:4400,y:3294,w:100,h:110},
 {id:'marina:shade-mid',type:'tree',image:'shade_tree.webp',x:4900,y:3280,w:145,h:154},
 {id:'marina:shade-east',type:'tree',image:'shade_tree.webp',x:5280,y:3286,w:145,h:154},
 ...[[4435,3440],[4840,3415],[5290,3410],[5710,3300],[5800,3410],[5660,3400],[4880,3500],[5320,3295],[4795,3270],[5490,3225],[5580,3227],[5680,3230],[5800,3260]].map(([x,y],i)=>({id:'marina:grove-'+i,type:'tree',image:'shade_tree.webp',x,y,w:142+(i%2)*18,h:150+(i%2)*18})),
 {id:'marina:palm-a',type:'palm',image:'palm.webp',x:4490,y:3615,w:90,h:91},
 {id:'marina:palm-b',type:'palm',image:'palm.webp',x:4805,y:3622,w:90,h:91},
 {id:'marina:palm-c',type:'palm',image:'palm.webp',x:5290,y:3610,w:90,h:91},
 {id:'marina:palm-d',type:'palm',image:'palm.webp',x:5635,y:3617,w:90,h:91},
 {id:'marina:bench-a',type:'bench',image:'bench.webp',x:4520,y:3690,w:90,h:27},
 {id:'marina:bench-b',type:'bench',image:'bench.webp',x:4920,y:3690,w:90,h:27},
 {id:'marina:bench-c',type:'bench',image:'bench.webp',x:5320,y:3690,w:90,h:27},
 ...[[4510,3715],[4880,3715],[5310,3715],[5650,3715]].map(([x,y],i)=>({id:'marina:flowers-'+i,type:'garden',image:'flower_planter.webp',x,y,w:72,h:35})),
 ...[4460,4760,5060,5360,5660].map((x,i)=>({id:'marina:lamp-'+i,type:'lamp',image:'lamp.webp',x,y:3655,w:27,h:85})),
 ...[4500,4900,5290,5680].map((x,i)=>({id:'marina:bin-'+i,type:'trash',image:'trash_bin.webp',x,y:3748,w:20,h:28}))
]);
// Building shells now share the existing world: walls, open doorway, furnishings.
// Coordinates derive from the approved exterior objects; no second scene/map.
const interiors=[];
function defineInterior(id,label,kind,doorFraction=.5){
 const exterior=objects.find(o=>o.id===id),floor={x:exterior.x+10,y:exterior.y+18,w:exterior.w-20,h:exterior.h-24,label,fill:kind==='workshop'?'#999b94':'#c9ad83'};
 const door={x:Math.round(exterior.x+exterior.w*doorFraction),y:floor.y+floor.h,w:kind==='workshop'?64:44};
 const b={id,label,kind,exterior,floor,door,roof:1,inside:false,furniture:[],walls:[]};
 const left=door.x-door.w/2,right=door.x+door.w/2;
 b.walls=[{x:floor.x,y:floor.y,w:floor.w,h:6},{x:floor.x,y:floor.y,w:6,h:floor.h},
  {x:floor.x+floor.w-6,y:floor.y,w:6,h:floor.h},{x:floor.x,y:door.y-6,w:left-floor.x,h:6},{x:right,y:door.y-6,w:floor.x+floor.w-right,h:6}];
 function item(key,type,x,y,w,h,art,text,solid=true){b.furniture.push({id:id+':'+key,type,x:floor.x+x,y:floor.y+y,w,h,art,text,solid});}
 if(kind==='cafe'){
  item('counter','counter',68,35,floor.w-78,16,null,'House coffee, cocoa, and cinnamon rolls. The barista recommends the harbor blend.');
  item('table-a','table',68,57,24,24,'cafeA','A cup, a receipt, and a folded napkin. The table is ready for the next customer.');
  item('table-b','table',123,73,24,24,'cafeB','The window table overlooks the marina. Please leave the gulls outside.');
  item('chair-a','bench',69,84,20,9,null,'A polished wooden café chair.');
  item('chair-b','bench',122,56,20,9,null,'A chair beside the window table.');
  item('espresso','machine',114,19,22,13,null,'The espresso machine is warm. A little sign says: GOOD COFFEE TAKES PATIENCE.',false);
  item('shelf','shelf',7,8,46,12,'shelf120','Cups, tea tins, and freshly stocked napkins.');
  item('plant','plant',floor.w-21,51,15,18,null,'A sunny little windowsill plant.');
  item('menu','board',61,8,39,14,null,'MARINA CAFÉ: coffee, cocoa, cinnamon rolls. Water is always free.',false);
 }else if(kind==='office'){
  item('desk','desk',22,59,62,28,null,'The harbormaster checks berth reservations and helps visitors find the correct pier.');
  item('log','board',22,15,55,16,null,'PUBLIC HARBOR BOARD: tide information, berth numbers, and visitor guidance. Official case records are unchanged.',false);
  item('shelf','shelf',147,14,91,20,'shelf120','Charts, safety binders, and neatly sorted harbor records.');
  item('meeting-table','table',180,98,46,29,'coffee','A harbor chart and a quiet place to plan a safe trip.');
  item('visitor-chair','bench',177,140,43,11,null,'Seating for marina visitors.');
  item('cabinet','counter',235,53,27,38,null,'Life-jacket forms and spare harbor guides.');
  item('plant','plant',20,132,19,23,null,'A well-watered office plant.');
 }else if(kind==='bait'){
  item('tackle-rack','shelf',88,14,91,20,'shelf120','Fishing line, hooks, and tackle sorted by size. Keep the sharp hooks in their cases.');
  item('counter','counter',91,56,88,18,null,'Ask the shopkeeper about local fishing rules and suitable tackle.');
  item('bait-crate','crate',142,102,32,26,'crate90','Sealed bait tubs. Please keep the lids closed.');
  item('seat','bench',83,105,36,11,null,'A short bench for trying on fishing boots.');
  item('notice','board',8,13,55,18,null,'FISH RESPONSIBLY: observe posted limits, collect your line, and keep the shoreline clean.',false);
  item('plant','plant',11,74,18,22,null,'A hardy little plant beside the shop window.');
 }else if(kind==='workshop'){
  item('workbench','table',10,44,62,32,'workbench','A clamped wooden part, hand tools, and a checklist. Ask before touching a repair.');
  item('tool-rack','shelf',142,28,45,18,'shelf120','Tools return to their marked places after every job.');
  item('parts','crate',147,90,32,25,'crate90','Labeled spare parts for routine boat maintenance.');
  item('stool','bench',13,92,23,10,null,'The mechanic keeps the center aisle clear.');
  item('safety','board',10,10,58,17,null,'WORKSHOP SAFETY: engine off, tools secured, and walkways clear.',false);
 }

 interiors.push(b);return b;
}
defineInterior('marina:cafe','Marina Café','cafe',.25);
defineInterior('marina:office','Marina Office','office');
defineInterior('marina:bait','Harbor Bait & Tackle','bait',.25);
defineInterior('marina:shed-b','Boat Service Workshop','workshop');
// The source district's old full-building solids are excluded only by exact
// footprint match in the connected-world collision loop. All other solids stay.
function ownsSolid(rect){return enabled&&(!rect.id||rect.id==='waterfront')&&interiors.some(b=>{
 const e=b.exterior;
 // The live classic renderer also supplies centered, alpha-trimmed building
 // bodies. Match only the same full-height envelope and center; small props,
 // walls, roads, water and unrelated buildings never meet this ownership rule.
 return Math.abs(rect.x+rect.w/2-e.x-e.w/2)<.01&&Math.abs(rect.y-e.y)<.01&&Math.abs(rect.h-e.h)<.01&&rect.w>=e.w*.5&&rect.w<=e.w+.01;
});}
function interiorAt(x,y){return interiors.find(b=>x>b.floor.x+5&&x<b.floor.x+b.floor.w-5&&y>b.floor.y+5&&y<b.door.y-5)||null;}
function updateInteriors(player,dt){
 const a=1-Math.exp(-12*Math.max(0,Math.min(.05,dt||0)));
 for(const b of interiors){
  const f=b.floor;b.inside=interiorAt(player.x,player.y)===b;
  // V124 reveal only on the real doorway, never along the rest of a building.
  const withinDoor=Math.abs(player.x-b.door.x)<=Math.max(8,b.door.w/2-5);
  const approach=withinDoor&&player.y>=b.door.y-6&&player.y<=b.door.y+18;
  const target=b.inside||approach?0:1;b.roof+=(target-b.roof)*a;
  if(Math.abs(b.roof-target)<.002)b.roof=target;
 }
}
const solidBoxes=Object.freeze(objects.filter(o=>o.solid&&!interiors.some(b=>b.id===o.id)).map(o=>Object.freeze({id:o.id,x:o.x+12,y:o.y+19,w:o.w-24,h:o.h-38})));
const interiorSolids=Object.freeze(solidBoxes.concat(interiors.flatMap(b=>b.walls.concat(b.furniture.filter(f=>f.solid)))));
// V123: precise feet-level collision instead of blocking the full sprite image.
const promenadeSolids=Object.freeze(objects.flatMap(o=>{
 let inset=null;
 switch(o.type){
 case 'tree':inset=[o.w*.38,o.h-25,o.w*.24,19];break;
 case 'palm':inset=[o.w*.35,o.h-28,o.w*.30,23];break;
 case 'bench':inset=[8,12,o.w-16,14];break;
 case 'garden':inset=[5,o.h-12,o.w-10,12];break;
 case 'lamp':inset=[5,o.h-18,o.w-10,16];break;
 case 'trash':inset=[2,o.h-15,o.w-4,13];break;
 default:return [];
 }
 const [dx,dy,w,h]=inset;
 return [{id:o.id,x:o.x+dx,y:o.y+dy,w,h}];
}));
const pilingSolids=Object.freeze(PIER_X.flatMap(px=>[3820,3945,4090].flatMap(py=>
 [px+3,px+86].map(x=>({id:'piling:'+x+':'+py,x:x-7,y:py+9,w:14,h:22})))));
// Fence gates are cut from both visible rails and solid footprints.
const fenceBases=[[4400,285],[4790,285],[5190,295],[5590,310]];
const fenceGates=interiors.map(b=>[b.door.x-b.door.w/2-18,b.door.x+b.door.w/2+18]);
const fenceSpans=Object.freeze(fenceBases.flatMap(([x,w])=>{
 let spans=[[x,x+w]];
 for(const [a,b] of fenceGates){
  spans=spans.flatMap(([start,end])=>{
   if(b<=start||a>=end)return [[start,end]];
   return [[start,Math.max(start,a)],[Math.min(end,b),end]].filter(([s,e])=>e-s>3);
  });
 }
 return spans.map(([start,end])=>[start,end-start]);
}));
const marinaFenceSolids=Object.freeze(fenceSpans.map(([x,w])=>
 ({id:'garden-fence',x,y:3606,w,h:32})));
const signLegSolids=Object.freeze([5395,5576].map(x=>({id:'waterfront-sign-leg',x:x-3,y:3603,w:15,h:40})));
const outdoorSolids=Object.freeze([...promenadeSolids,...pilingSolids,...marinaFenceSolids,...signLegSolids]);

function drawInteriorFloor(g,b){
 const f=b.floor;g.save();g.beginPath();g.rect(f.x,f.y,f.w,f.h);g.clip();
 g.fillStyle=f.fill;g.fillRect(f.x,f.y,f.w,f.h);
 const tiles=img('marina-detail-tiles.png');
 if(b.kind!=='workshop'&&tiles){for(let y=f.y;y<f.y+f.h;y+=32)for(let x=f.x;x<f.x+f.w;x+=32){const tid=12+hash(x,y,17)%4;g.drawImage(tiles,tid%8*32,Math.floor(tid/8)*32,32,32,x,y,32,32);}}
 else{g.strokeStyle='#777f7e';g.lineWidth=1;for(let x=f.x;x<f.x+f.w;x+=24){g.beginPath();g.moveTo(x,f.y);g.lineTo(x,f.y+f.h);g.stroke();}for(let y=f.y;y<f.y+f.h;y+=24){g.beginPath();g.moveTo(f.x,y);g.lineTo(f.x+f.w,y);g.stroke();}}
 g.restore();
 // Physical wall faces and caps, drawn in the same coordinate space as floors.
 for(const w of b.walls){g.fillStyle='#736047';g.fillRect(w.x,w.y-14,w.w,w.h+14);g.fillStyle='#dfccac';g.fillRect(w.x,w.y-14,w.w,3);g.fillStyle='#9e8464';g.fillRect(w.x,w.y+w.h-2,w.w,2);}
 g.fillStyle='#dac59e';g.fillRect(b.door.x-b.door.w/2,b.door.y-5,b.door.w,5);
 g.fillStyle='#81684b';g.fillRect(b.door.x-b.door.w/2,b.door.y-1,b.door.w,2);
}
function bLabel(f){return f.id.endsWith('menu')?'MENU':'HARBOR';}
function drawInteriorFurniture(g,f){
 const asset=window.HARBOR?.worldFurniture?.art[f.art];
 if(asset?.complete&&asset.naturalWidth){g.imageSmoothingEnabled=false;g.drawImage(asset,f.x,f.y-8,f.w,f.h+8);return;}
 if(f.type==='machine'){
  g.fillStyle='#213445';g.fillRect(f.x,f.y-12,f.w,f.h+12);g.fillStyle='#c7d2cf';g.fillRect(f.x+2,f.y-10,f.w-4,11);
  g.fillStyle='#ddf2df';g.fillRect(f.x+4,f.y-7,5,4);g.fillStyle='#c49342';g.fillRect(f.x+13,f.y-7,4,4);
  g.fillStyle='#111e2a';g.fillRect(f.x+3,f.y+3,f.w-6,5);g.fillStyle='#fff0d0';g.fillRect(f.x+7,f.y+2,6,6);return;
 }
 // Explicit footprint-sized fittings avoid the classic precinct's native-size
 // furniture overrides. Existing native world-table/shelf art is reused above.
 if(f.type==='plant'){
  const plant=window.HARBOR?.receptionRoom?.plant;
  if(plant?.complete&&plant.naturalWidth){g.drawImage(plant,91,82,842,1351,f.x,f.y-12,f.w,f.h+12);return;}
  g.fillStyle='#94613e';g.fillRect(f.x+3,f.y+f.h-7,f.w-6,7);g.fillStyle='#4a863d';g.fillRect(f.x,f.y,f.w,13);return;
 }
 if(f.type==='board'){g.fillStyle='#6e4932';g.fillRect(f.x,f.y-12,f.w,f.h+12);g.fillStyle='#193d3a';g.fillRect(f.x+2,f.y-10,f.w-4,f.h+8);g.fillStyle='#fff0bf';g.font='bold 6px sans-serif';g.textAlign='center';g.fillText(bLabel(f),f.x+f.w/2,f.y-3);for(let k=0;k<3;k++)g.fillRect(f.x+5,f.y+2+k*3,f.w-10,1);return;}
 if(f.type==='bench'){g.fillStyle='#473325';g.fillRect(f.x+2,f.y+f.h-3,3,5);g.fillRect(f.x+f.w-5,f.y+f.h-3,3,5);g.fillStyle='#805b39';g.fillRect(f.x,f.y-5,f.w,4);g.fillStyle='#bb8b52';g.fillRect(f.x,f.y,f.w,f.h-2);g.fillStyle='#dab37a';g.fillRect(f.x+1,f.y,f.w-2,2);return;}
 g.fillStyle='#5b4030';g.fillRect(f.x,f.y-7,f.w,f.h+7);g.fillStyle='#ab794b';g.fillRect(f.x+2,f.y+1,f.w-4,f.h-3);g.fillStyle='#e1c494';g.fillRect(f.x-1,f.y-9,f.w+2,10);g.fillStyle='#f8e4bd';g.fillRect(f.x,f.y-9,f.w,2);
 if(f.type==='desk'){g.fillStyle='#334d60';g.fillRect(f.x+6,f.y-17,20,13);g.fillStyle='#94c6c6';g.fillRect(f.x+8,f.y-15,16,9);g.fillStyle='#ede4ce';g.fillRect(f.x+f.w-22,f.y-7,15,8);}

}
const actors=[
 {id:'v116:fisher',name:'Fisherman',npcStyle:1,x:5142,y:3876,route:[[5142,3876],[5142,3944]],speed:11,phase:0,dialogue:'I almost caught a legendary fish. It was THIS big! ...Maybe.'},
 {id:'v116:worker',name:'Marina worker',npcStyle:2,x:5400,y:3758,route:[[5400,3758],[5480,3758],[5515,3758],[5400,3758]],speed:27,phase:1,dialogue:'The gulls stole another sandwich. I think they have a schedule.'},
 {id:'v116:visitor',name:'Visitor',npcStyle:3,x:4932,y:3764,route:[[4932,3764],[5010,3764],[4932,3764]],speed:15,phase:2,dialogue:'I have photographed the same boat eleven times. Art is patience.'},
 {id:'v116:customer',name:'Café customer',npcStyle:4,x:4558,y:3420,route:[[4558,3420]],speed:0,phase:0,dialogue:'Coffee and sea air. Best shift break ever.'},
 {id:'v116:stroller',name:'Pedestrian',npcStyle:5,x:5570,y:3758,route:[[5570,3758],[5480,3758],[5390,3758],[5570,3758]],speed:30,phase:3,dialogue:'Watch out for the seagull. It has a suspicious résumé.'}
].map(a=>({...a,step:0,routeClock:a.phase*2}));
const interactions=[
 {id:'v116:cafe',label:'Marina Café',x:4551,y:3390,text:'The café smells like cinnamon and sea salt. Someone named a muffin “The Great Wave.”'},
 {id:'v116:bait',label:'Harbor Bait & Tackle',x:5540,y:3540,text:'A sign reads: NO REFUNDS ON FISH STORIES.'},
 {id:'v116:office',label:'Marina Office',x:4730,y:3578,text:'The harbor notice board shows tides, weather, and a missing fishing hat.'},
 {id:'v116:kiosk',label:'Waterfront information',x:5710,y:3670,text:'Southbay Marina: three piers, a café, boat shed, and exceptionally confident seagulls.'},
 ...actors.map(a=>({id:a.id,label:a.name,x:a.x,y:a.y,text:a.dialogue}))
];
for(const b of interiors){
 const f=b.floor,staffPoint={cafe:[f.w-36,21],office:[114,45],bait:[55,36],workshop:[112,28]}[b.kind];
 const staff={building:b.id,id:'v116:'+b.kind+'-staff',name:{cafe:'Marina barista',office:'Harbor assistant',bait:'Tackle shopkeeper',workshop:'Boat mechanic'}[b.kind],npcStyle:b.kind==='workshop'?2:3,x:f.x+staffPoint[0],y:f.y+staffPoint[1],
  route:[[f.x+staffPoint[0],f.y+staffPoint[1]]],speed:0,phase:0,step:0,dir:'down',dialogue:'Welcome to '+b.label+'. Take your time and have a look around.'};
 staff.serviceOffset=b.kind==='cafe'?{x:f.x+68-staff.x,y:f.y+58-staff.y}:{x:0,y:0};
 actors.push(staff);interactions.push({id:staff.id,label:staff.name,x:staff.x+staff.serviceOffset.x,y:staff.y+staff.serviceOffset.y,text:staff.dialogue,building:b.id});
 for(const f of b.furniture)if(f.text)interactions.push({id:'v116:'+f.id,label:b.label+' · '+f.id.split(':').at(-1).replaceAll('-',' '),x:f.x+f.w/2,y:f.y+f.h+13,text:f.text,building:b.id});
}
const visible=(r,view,p=75)=>!view||(r.x<view.x+view.w+p&&r.x+(r.w||0)>view.x-p&&r.y<view.y+view.h+p&&r.y+(r.h||0)>view.y-p);
function hash(x,y,s){let a=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);a=(a^(a>>>13));a=Math.imul(a,1274126177);return (a^(a>>>16))>>>0;}
function tileIndex(x,y){
 // ORIGINAL native waterfront shoreline: sand at local y430–580 (world y3650–3800),
 // water at local y580–1000 (world y3800–4220), three piers y3800–4100.
 if(y>=3800){const n=hash(x,y,3)%4;return [8,9,10,25][n];}
 if(y>=3755)return hash(x,y,21)%3;
 if(y>=3650){const n=hash(x,y,4)%5;return [0,1,2,3,20][n];}
 if(y>=3510&&y<3650&&((x>=4690&&x<4780)||(x>=5080&&x<5180)||(x>=5490&&x<5580)))return hash(x,y,5)%4;
 return hash(x,y,7)%5===0?5:4;
}
function buildChunk(cx,cy){
 const off=document.createElement('canvas');off.width=off.height=256;
 const c=off.getContext('2d');c.imageSmoothingEnabled=false;
 const atlas=img('marina-detail-tiles.png');if(!atlas)return off;
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=cx+col*32,y=cy+row*32,tid=tileIndex(x,y);
  if(y>=3800&&window.ROOKIE_V120_ART)continue;
  // An existing north-south street joins the marina here: preserve its road art.
  if(y<3300&&((x>=5056&&x<5248)||(x>=5472&&x<5672)))continue;
  c.drawImage(atlas,(tid%8)*32,Math.floor(tid/8)*32,32,32,col*32,row*32,32,32);
 }
 // World-seeded long ripple bands break the 32px tile repetition at chunk boundaries.
 for(let yy=0;!window.ROOKIE_V120_ART&&yy<256;yy+=7){
  if(cy+yy<3800)continue;
  for(let xx=0;xx<256;xx+=24){const seed=hash(cx+xx,cy+yy,91),w=5+seed%19;
   c.fillStyle=seed%3===0?'#2486b1':'#0b639e';c.fillRect(xx+seed%7,yy,w,1);
   if(seed%5===0){c.fillStyle='#61b5cd';c.fillRect(xx+seed%7+3,yy+1,Math.max(2,w-7),1);}
  }
 }
 return off;
}
function chunkAt(cx,cy){
 // Do not retain transparent placeholders while the asynchronously decoded atlas loads.
 if(!img('marina-detail-tiles.png'))return null;
 const key=cx+':'+cy;
 if(!cached.has(key)){
  cached.set(key,buildChunk(cx,cy));
  if(cached.size>CAP)cached.delete(cached.keys().next().value);
 }
 return cached.get(key);
}
let animMs=0,frameCount=0,frameCost=0,maxCost=0,samples=[];
function measure(ms){frameCount++;frameCost+=ms;maxCost=Math.max(maxCost,ms);if(samples.length<240)samples.push(ms);else samples[frameCount%samples.length]=ms;}
function begin(g,opt,t){
 if(!enabled||!opt||opt.zoom<.095)return;
 const a=performance.now(),view=opt.view;
 const region={x:TERRAIN.x,y:TERRAIN.y,w:TERRAIN.w,h:TERRAIN.h};
 if(!visible(region,view,0))return;
 const premium=window.ROOKIE_V120_ART;
 if(premium)premium.water(g,opt,t);
 const x0=Math.max(TERRAIN.x,TERRAIN.x+Math.floor((Math.max(TERRAIN.x,view.x)-TERRAIN.x)/256)*256);
 const y0=Math.max(TERRAIN.y,TERRAIN.y+Math.floor((Math.max(TERRAIN.y,view.y)-TERRAIN.y)/256)*256);
 for(let y=y0;y<TERRAIN.y+TERRAIN.h&&y<view.y+view.h;y+=256){
  for(let x=x0;x<TERRAIN.x+TERRAIN.w&&x<view.x+view.w;x+=256){
   const tile=chunkAt(x,y);if(!tile)continue;g.save();g.imageSmoothingEnabled=false;g.drawImage(tile,x,y);g.restore();cacheDraws++;
  }
 }
 // V119 visible wave/depth pass is inside this renderer, before solid piers and boats.
 if(!premium)window.ROOKIE_V119_MOTION?.waterSurface(g,view,t);
 if(premium)premium.promenade(g,opt,t);
 // Foliage casts a small directional shadow onto lawns and paths beneath it.
 for(const o of objects)if((o.type==='tree'||o.type==='palm')&&visible(o,view,0)){
  g.fillStyle='rgba(14,46,24,.20)';g.beginPath();g.ellipse(o.x+o.w*.62,o.y+o.h-3,o.w*.48,o.h*.13,-.15,0,Math.PI*2);g.fill();
 }
 // Dark submerged beams and regularly spaced timber pilings make the quay dimensional.
 g.fillStyle='#062e53';g.fillRect(4400,3800,1500,20);
 for(let x=4408;x<5900;x+=44){
  if(PIER_X.some(px=>x>px-8&&x<px+98))continue;
  g.fillStyle='#3c3028';g.fillRect(x,3801,7,21);
  g.fillStyle='#b8844c';g.fillRect(x+1,3801,3,17);
 }
 // Raised pale granite edging separates planted lawns from the rose paving.
 for(const [x,w] of [[4400,285],[4790,285],[5190,295],[5590,310]]){
  g.fillStyle='#6d7156';g.fillRect(x,3642,w,8);
  g.fillStyle='#e2d5ae';g.fillRect(x,3642,w,3);
  for(let xx=x;xx<x+w;xx+=24){g.fillStyle='#aaa98c';g.fillRect(xx,3643,1,7);}
 }
 // Fine chain-link garden fencing with iron posts and a pale top rail.
 for(const [x,w] of fenceSpans){
  if(!visible({x,y:3604,w,h:40},view,0))continue;
  g.fillStyle='#233d3c';g.fillRect(x,3606,w,3);g.fillRect(x,3635,w,3);
  g.fillStyle='#93a98d';g.fillRect(x,3604,w,2);
  g.strokeStyle='rgba(153,182,158,.65)';g.lineWidth=1;
  for(let xx=x;xx<x+w-10;xx+=10){g.beginPath();g.moveTo(xx,3610);g.lineTo(Math.min(xx+19,x+w),3634);g.moveTo(xx,3634);g.lineTo(Math.min(xx+19,x+w),3610);g.stroke();}
  for(let xx=x;xx<=x+w;xx+=62){g.fillStyle='#243c36';g.fillRect(xx,3601,5,39);g.fillStyle='#d7c899';g.fillRect(xx,3601,5,3);}
 }
 // Palm planter foundations sit below foliage and actors.
 for(const o of objects)if(o.type==='palm'){
  const cx=o.x+o.w/2,cy=o.y+o.h-5;
  g.fillStyle='#51463f';g.fillRect(cx-23,cy-7,46,27);
  g.fillStyle='#e3c8a6';g.fillRect(cx-23,cy-8,46,4);
  g.fillStyle='#a49076';g.fillRect(cx-23,cy+15,46,5);
  g.fillStyle='#324e25';g.fillRect(cx-19,cy-4,38,16);
  for(let n=0;n<12;n++){g.fillStyle=n%2?'#ed7095':'#f9c46e';g.fillRect(cx-17+n*3,cy+4+(n%3)*2,3,3);}
 }
 // The native seawall has three 90px openings, matching the walkable piers.
 for(const [x,width] of [[4400,255],[4745,360],[5195,360],[5645,255]]){
  g.fillStyle='#4f5c58';g.fillRect(x,3794,width,12);
  g.fillStyle='#d6bea1';g.fillRect(x,3794,width,4);
 }
 // V122: disturbance belongs below the raised deck, never over planks.
 // Previously this call followed the dock draw and made the wood look submerged.
 if(premium)premium.contactWater(g,opt,t);
 // Cover the full native 90×300px footprint without drawing wood into blocked water.
 const dockAtlas=img('marina-detail-tiles.png');
 if(dockAtlas||premium?.ready())for(const px of PIER_X){
  if(premium?.dock(g,px,view))continue;
  if(!visible({x:px,y:3800,w:90,h:300},view,0))continue;
  for(let y=3800;y<4100;y+=32){
   const tid=[12,13,14,15][hash(px,y,11)%4],h=Math.min(32,4100-y);
   for(let dx=0;dx<90;dx+=32){
    const w=Math.min(32,90-dx);
    g.drawImage(dockAtlas,tid%8*32,Math.floor(tid/8)*32,w,h,px+dx,y,w,h);
   }
  }
 }
 // V122: piling sprites are drawn in the existing actor/furniture depth queue.
 // Do not draw them in the scenery pass or they'll always appear behind Jay.
 // Railing segments match native waterfront decors exactly, leaving the native pier mouths open.
 const fence=img('fence_horizontal.webp');
 if(fence){for(const [x,width] of [[4400,255],[4745,360],[5195,360],[5645,255]]){
   if(!visible({x,y:3787,w:width,h:18},view,0))continue;
   for(let xx=x;xx<x+width;xx+=64)g.drawImage(fence,xx,3785,Math.min(64,x+width-xx),16);
 }}
 if(premium)premium.seawall(g,opt,t);
 // Static shoreline and shop sprites, with world-locked shadows.
 for(const o of objects){
  if(!visible(o,view,0))continue;
  const sprite=img(o.image);if(!sprite)continue;
  if(o.type==='building'||o.type==='kiosk'){
   g.fillStyle='rgba(14,32,42,.25)';g.fillRect(o.x+7,o.y+10,o.w,o.h);
  }
  // V124: solid promenade furniture joins actor depth instead of always
  // painting behind Jay and letting him visually stand on top of a bench.
  if(['palm','tree','lamp','bench','garden','trash','kiosk'].includes(o.type))continue;
  const interior=interiors.find(b=>b.id===o.id);
  if(interior){drawInteriorFloor(g,interior);continue;}
  g.imageSmoothingEnabled=false;paintSprite(g,o.image,o.x,o.y,o.w,o.h);objectsDrawn++;
 }
 // Waterfront district placard, placed in the garden behind the walking lane.
 if(visible({x:5370,y:3575,w:240,h:70},view)){
  g.fillStyle='#544132';g.fillRect(5395,3600,9,43);g.fillRect(5576,3600,9,43);
  g.fillStyle='#1b2c3c';g.fillRect(5370,3575,240,37);
  g.strokeStyle='#d6b785';g.lineWidth=3;g.strokeRect(5370,3575,240,37);
  g.fillStyle='#fff0ce';g.font='bold 18px "Barlow Condensed",sans-serif';g.textAlign='center';g.fillText('WATERFRONT & DOCKS',5490,3600);
 }
 if(premium)premium.waterReflections(g,opt,t);
 const boats=[
  {id:'boat-motor.png',x:4524,y:3935,w:65,h:122,p:0},
  {id:'boat-fishing.png',x:4800,y:3950,w:76,h:140,p:1.7},
  {id:'boat-sail.png',x:5270,y:3890,w:82,h:150,p:2.4},
  {id:'boat-motor.png',x:5445,y:3940,w:65,h:120,p:3.1},
  {id:'boat-sail.png',x:5720,y:3900,w:82,h:150,p:5}
 ];
 for(const o of boats){if(!visible(o,view))continue;const sprite=img(o.id);if(!sprite)continue;
  const dy=Math.sin(t*.00145+o.p)*5;
  if(premium)premium.boat(g,o,t);
  else window.ROOKIE_V119_MOTION?.boatWake(g,o,t);
  g.strokeStyle='rgba(116,201,217,.35)';g.lineWidth=1;g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h-6+dy,o.w*.48,9+Math.sin(t*.001+o.p)*2,0,0,Math.PI*2);g.stroke();
  g.fillStyle='rgba(6,38,64,.24)';g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h/2+11,o.w*.34,11,0,0,Math.PI*2);g.fill();
  paintSprite(g,o.id,o.x,o.y+dy,o.w,o.h);objectsDrawn++;
 }
 // Legacy wave strokes and lamp-trails are disabled by V120 artwork.
 if(!premium){
 // Water motion: capped number of strokes; no per-pixel pixel data or particles.
 const tphase=Math.floor(t/155),bounds={x:4410,y:3830,w:1660,h:700};
 if(visible(bounds,view)){waterFrames++;
  const sx=Math.max(4410,Math.floor(view.x/90)*90);
  const ex=Math.min(6070,view.x+view.w+100);
  for(let x=sx;x<ex;x+=90)for(let y=3830;y<4590;y+=68){
   if(y+15<view.y||y>view.y+view.h)continue;
   const z=hash(x,y,18);let drift=(tphase+z)%54;
   const waveX=x+drift,waveY=y+(z%15),waveW=15+(z%8);
   if(waveY<4100&&PIER_X.some(px=>waveX<px+90&&waveX+waveW>px))continue;
   g.globalAlpha=.15+(z%5)*.035;g.strokeStyle=z%2?'#b5eadf':'#55c6da';g.lineWidth=2;
   g.beginPath();g.moveTo(waveX,waveY);g.lineTo(waveX+waveW,waveY);g.stroke();
  }
  g.globalAlpha=1;
 }
 // Broken golden lamp trails on water, with a soft rhythm instead of a flat glow disc.
 if(opt.zoom>.38)for(const lx of [4473,4773,5073,5373,5673]){
  if(lx<view.x-20||lx>view.x+view.w+20)continue;
  for(let k=0;k<12;k++){
   const yy=3820+k*13,xx=lx+Math.sin(t*.0015+k*2)*5;
   if(PIER_X.some(px=>xx>px-12&&xx<px+102))continue;
   g.globalAlpha=(1-k/14)*(.28+.1*Math.sin(t*.002+k));
   g.fillStyle=k%3?'#f6cf6c':'#fff2a9';g.fillRect(xx-(12-k*.6)/2,yy,12-k*.6,2);
  }
  g.globalAlpha=1;
 }
 }
 measure(performance.now()-a);
}
function drawNpc(g,a,t){
 const detail=img('marina-reference-atlas.webp'),p=a.npcStyle||0;
 g.fillStyle='rgba(9,28,40,.26)';g.beginPath();g.ellipse(a.x,a.y+6,13,5,0,0,Math.PI*2);g.fill();
 const motion=window.ROOKIE_V119_MOTION;
 motion?.footsteps(g,a,t);
 g.save();if(motion)g.translate(0,-motion.characterBob(a,t));
 if(window.ROOKIE_V116_WALK?.draw(g,a)){g.restore();return;}
 if(detail){const key=p===0?'hero':p===1||p===2?'fisher':'visitor';
  const bob=a.moving?Math.sin(t*.012)*1.1:0;
  paintSprite(g,key,a.x-20,a.y-48+bob,40,55);g.restore();return;}
 const im=img('marina-people.png');if(im)g.drawImage(im,p*32,0,32,48,a.x-15,a.y-38,32,48);
 g.restore();
}
// World-space post anchor acts as its depth key (never the white cap position).
function pierOccluders(view){
 if(!enabled)return [];
 const posts=[];
 for(const px of PIER_X)for(const py of [3820,3945,4090])for(const x of [px+3,px+86]){
  const rect={x:x-22,y:py-46,w:44,h:92};
  if(view&&!visible(rect,view,0))continue;
  posts.push({x,y:py,depthY:py+31,rect});
 }
 return posts;
}
function drawPierPost(g,post){
 if(!enabled||!post)return;
 g.save();
 const premium=window.ROOKIE_V120_ART;
 if(premium?.post(g,post.x,post.y)){g.restore();return;}
 const xx=post.x,py=post.y;
 g.fillStyle='#092b48';g.fillRect(xx-5,py+4,12,14);
 g.fillStyle='#4e3324';g.fillRect(xx-6,py-21,12,31);
 g.fillStyle='#be874a';g.fillRect(xx-3,py-20,4,29);
 g.fillStyle='#edbd72';g.fillRect(xx-2,py-18,2,24);
 g.fillStyle='#9ea9a6';g.fillRect(xx-6,py-17,12,3);
 g.fillStyle='#e2d6b3';g.beginPath();g.ellipse(xx,py-23,7,4,0,0,Math.PI*2);g.fill();
 g.strokeStyle='#b8a77c';g.lineWidth=2;g.beginPath();g.ellipse(xx,py-9,7,3,0,0,Math.PI*2);g.stroke();
 g.restore();
}
// V124: use a common world foot-depth for actors, lamp bases, trees and roofs.
function depthProps(view){
 if(!enabled)return [];
 const all=[];
 for(const b of interiors)if(b.roof>.001&&visible(b.exterior,view,60))
   all.push({kind:'roof',building:b,depthY:b.door.y-2});
 for(const o of objects){
  if(!['palm','tree','lamp','bench','garden','trash','kiosk'].includes(o.type)||!visible(o,view,40))continue;
  all.push({kind:'tall',object:o,depthY:o.y+o.h-3});
 }
 return all;
}
function drawDepthProp(g,entry,opt,t){
 if(!enabled||!entry||!opt||opt.zoom<.14)return;
 g.save();
 if(entry.kind==='roof'){
  const b=entry.building,o=b.exterior;
  g.globalAlpha=opt.zoom<.3?1:b.roof;
  paintSprite(g,o.image,o.x,o.y,o.w,o.h);
  g.restore();return;
 }
 const o=entry.object;
 if(!img(o.image)){g.restore();return;}
 if(o.type==='lamp'){
  paintSprite(g,o.image,o.x,o.y,o.w,o.h);
  if(opt.zoom>.38){
   g.globalAlpha=.13+.05*Math.sin(t*.002+o.x);
   g.fillStyle='#ffe2a3';g.beginPath();g.arc(o.x+o.w/2,o.y+18,30,0,Math.PI*2);g.fill();
  }
  g.restore();return;
 }
 if(o.type!=='tree'&&o.type!=='palm'){
  g.imageSmoothingEnabled=false;paintSprite(g,o.image,o.x,o.y,o.w,o.h);
  objectsDrawn++;g.restore();return;
 }
 const phase=o.x*.007+o.y*.009;
 const sway=Math.sin(t*.00065+phase)*(o.type==='palm'?2.0:1.15);
 for(const b of interiors){
  const f=b.floor;
  if(b.roof<.995&&o.x<f.x+f.w&&o.x+o.w>f.x&&o.y<f.y+f.h&&o.y+o.h>f.y){
   g.beginPath();g.rect(o.x-20,o.y-20,o.w+40,o.h+40);
   g.rect(f.x,f.y,f.w,f.h);g.clip('evenodd');
  }
 }
 g.translate(o.x+o.w/2,o.y+o.h);g.rotate(sway*.0038);g.imageSmoothingEnabled=false;
 paintSprite(g,o.image,-o.w/2,-o.h,o.w,o.h);
 objectsDrawn++;g.restore();
}
function foreground(g,opt,t){
 if(!enabled||!opt||opt.zoom<.14)return;
 const view=opt.view,a=performance.now();
 // Ambient birds remain on the original layer. Large scenery is now y-sorted
 // alongside Jay, rather than painted unconditionally on top of his face.
 const bird=img('marina-gulls.png');if(bird){
  const gulls=[[4660,3833],[5109,3908],[5576,3844],[5818,3805]];
  for(let i=0;i<gulls.length;i++){
   const [x,y]=gulls[i];if(!visible({x,y,w:36,h:32},view))continue;
   const frame=Math.floor(t/600+i*2)%2;
   g.drawImage(bird,frame*32,0,32,28,x,y+Math.sin(t*.0015+i)*1.5,32,28);
  }
 }
 measure(performance.now()-a);
}
function waterBlocked(x,y,r=12){
 if(!enabled||x<4400||x>5900||y<3806||y>4656)return false;
 // Match original native waterfront walkability: all water except 3 native piers,
 // and the last 120px below the piers remain blocked by source geometry.
 const onPier=PIER_X.some(px=>x>=px-r&&x<=px+90+r&&y<=4094);
 return !onPier;
}
function circleBlocks(x,y,r,b){
 const ax=Math.max(b.x,Math.min(x,b.x+b.w));
 const ay=Math.max(b.y,Math.min(y,b.y+b.h));
 return (x-ax)**2+(y-ay)**2<r*r;
}
function blocksScenery(x,y,r=12){
 if(!enabled||x<4380||x>5920||y<3200||y>4680)return false;
 return outdoorSolids.some(b=>circleBlocks(x,y,r,b))||interiorSolids.some(b=>circleBlocks(x,y,r,b))||waterBlocked(x,y,r);
}
function blocksProp(x,y,r=12){
 if(blocksScenery(x,y,r))return true;
 if(!enabled||x<4400||x>5900||y<3220||y>4220)return false;
 // Dynamic NPC feet circles prevent walking right through other people.
 for(const a of actors){
  if(a.building&&interiorAt(x,y)?.id!==a.building)continue;
  if(Math.hypot(a.x-x,a.y-y)<r+11)return true;
 }
 return false;
}
function stepNPCs(dt){
 if(!enabled)return;
 for(const a of actors){a.moving=false;if(!a.speed||a.route.length===1)continue;
  const next=a.route[(a.step+1)%a.route.length];const dx=next[0]-a.x,dy=next[1]-a.y,len=Math.hypot(dx,dy);
  if(len<2){a.step=(a.step+1)%a.route.length;continue;}
  const step=Math.max(0,Math.min(len,a.speed*Math.min(.05,dt)));
  const nx=a.x+dx/len*step,ny=a.y+dy/len*step;
  // Environmental collision also governs ambient routines.
  if(blocksScenery(nx,ny,8)){a.step=(a.step+1)%a.route.length;continue;}
  a.x=nx;a.y=ny;
  a.moving=step>.001;a.distance=(a.distance||0)+step;a.stepLength=Math.max(4,a.speed*.13);
  if(a.moving)a.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
 }
 for(const s of interactions){if(!s.id.startsWith('v116:'))continue;
  const a=actors.find(p=>p.id===s.id);if(a){s.x=a.x+(a.serviceOffset?.x||0);s.y=a.y+(a.serviceOffset?.y||0);}
 }
}
function metrics(){const sorted=samples.slice().sort((a,b)=>a-b);return Object.freeze({version:'116-marina-1',worldId:WORLD,
 enabled,assets:imageFiles.length+sourceFiles.length,decoded:Object.values(images).filter(im=>im.complete&&im.naturalWidth>0).length,
 actorCount:actors.length,solidCount:solidBoxes.length,chunkCacheCount:cached.size,chunkBudgetBytes:CAP*256*256*4,
 renderSamples:frameCount,avgPaintMs:frameCount?+(frameCost/frameCount).toFixed(3):0,
 p95PaintMs:sorted.length?+sorted[Math.floor((sorted.length-1)*.95)].toFixed(3):0,
 maxPaintMs:+maxCost.toFixed(3),drawnChunks:cacheDraws,drawnObjects:objectsDrawn,waterFrames,
 sceneryColliders:outdoorSolids.length,postColliders:pilingSolids.length,
 campaignEngineModified:false,zombieOutbreakModified:false,multiplayerTransport:'none'});}
const api={inMarina:(x,y)=>enabled&&x>4400&&x<5900&&y>3220&&y<4220,version:'116-marina-1',worldId:WORLD,region:Object.freeze(TERRAIN),piers:PIER_X,objects,actors,interactions,
 background:begin,foreground,depthProps,drawDepthProp,stepNPCs,drawNpc,blocksProp,blocksScenery,metrics,
 pierOccluders,drawPierPost,
 interiors,interiorAt,updateInteriors,ownsSolid,drawInteriorFurniture,
 interiorFurniture:(view)=>interiors.flatMap(b=>b.roof<.995&&visible(b.exterior,view,60)?b.furniture:[]),
 interiorActorVisible:(npc)=>!npc.building||interiors.some(b=>b.id===npc.building&&b.roof<.995),
 interactionAvailable:(sp,x,y)=>!sp.building||interiorAt(x,y)?.id===sp.building,
 active:()=>enabled,
 // Only enabled for browser evidence, never a production interaction.
 setTestEnabled:(bool)=>{if(!/[?&]v116QA=1(?:&|$)/.test(location.search))return false;enabled=!!bool;cached.clear();return true;}};
window.ROOKIE_V116_MARINA=Object.freeze(api);
const onReady=()=>{
 if(!window.HARBOR||!window.HARBOR.seamlessCampusV115)return;
 const campus=window.HARBOR.seamlessCampusV115;
 const toolbar=document.querySelector('#mapOverlay .maptools');
 if(toolbar&&!document.getElementById('v116MarinaLaunch')){
  const button=document.createElement('button');button.id='v116MarinaLaunch';button.type='button';
  button.textContent='PLAY SOUTHBAY MARINA · V116';button.title='Walk the real connected-world Southbay Marina (no loading screen)';
  button.addEventListener('click',()=>{for(const [x,y] of [[5150,3720],[4980,3710],[5340,3720],[4790,3720],[5600,3730]])if(campus.openAt(x,y,window.innerWidth>window.innerHeight?Math.max(.5,Math.min(1.1,window.innerWidth/1688)):.85))return;});toolbar.appendChild(button);
 }
 if(/[?&]v116QA=1(?:&|$)/.test(location.search)){
  document.documentElement.dataset.v116Qa='1';
 }
 ready=true;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
})();
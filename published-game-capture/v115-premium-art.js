/* ROOKIE: Harbor City — V115 Premium Environment Assets, Pass 2.
 * Source-linked art over the SAME coordinates used by the playfield and atlas.
 * Visual renderer only: never mutates physics, missions, saves, NPCs,
 * camera position, network state, or any Academy/Zombie Outbreak content.
 * Imported ONLY by /preview/v115-premium/ after the existing reference art.
 */
(function () {
  'use strict';
  const WORLD = Object.freeze({minX:-3100,maxX:9656,minY:0,maxY:4680});
  const SOURCE = Object.freeze({
    mountain: {id:'north-peaks',x:7420,y:110,w:2210,h:950,file:'mountain-north.svg'},
    waterfall:{id:'west-waterfall',x:-2830,y:310,w:510,h:590,file:'waterfall-cliff.svg'},
    lighthouse:{id:'marina-lighthouse',x:7270,y:4110,w:260,h:380,file:'marina-lighthouse.svg'}
  });
  const BOATS=Object.freeze([
    {id:'slip-01',x:4535,y:4280,file:'marina-sailboat-1.svg'},
    {id:'slip-02',x:4872,y:4430,file:'marina-sailboat-2.svg'},
    {id:'slip-03',x:5132,y:4320,file:'marina-sailboat-1.svg'},
    {id:'slip-04',x:5460,y:4470,file:'marina-sailboat-2.svg'},
    {id:'slip-05',x:5860,y:4265,file:'marina-sailboat-1.svg'}
  ]);
  const SEAWALL=Object.freeze([[4210,4200],[4350,4235],[4600,4240],[4820,4245],[5050,4245],[5270,4235],[5620,4200],[6050,4305],[6410,4160],[6810,4240],[7200,4165],[7610,4270]]);
  const PIER_X=Object.freeze([4590,4850,5140,5420,5660,5920]);
  const palette=Object.freeze({wood:'#a77e55',woodBright:'#d5a77c',woodDark:'#664a41',sand:'#ddc893',surf:'#d9fff0',deep:'#124c70',foam:'#91e4e5'});
  let decoded=0,failed=0;
  const assets=Object.create(null);
  for(const file of Object.values(SOURCE).map(x=>x.file).concat(BOATS.map(x=>x.file))){
    if(assets[file])continue;
    const asset={file,ready:false,failed:false,img:null};
    assets[file]=asset;
    // Preload asynchronously; no network calls to external hosts.
    if(typeof Image!=='undefined'){
      const img=new Image();img.decoding='async';asset.img=img;
      img.onload=()=>{asset.ready=img.naturalWidth>0;decoded+=Number(asset.ready);};
      img.onerror=()=>{asset.failed=true;failed++;};
      img.src='./assets/v115-premium/'+file;
    }
  }
  const has=(x,y,w,h,view,p=65)=>!view||x<view.x+view.w+p&&x+w>view.x-p&&y<view.y+view.h+p&&y+h>view.y-p;
  const tiny=(z)=>z<.105;
  function mix(x,y,s=0){let t=Math.imul(x|0,73856093)^Math.imul(y|0,19349663)^Math.imul(s|0,83492791);t^=t>>>13;t=Math.imul(t,1274126177);return (t^(t>>>16))>>>0;}
  function pic(g,anchor,options){
    if(!has(anchor.x,anchor.y,anchor.w,anchor.h,options.view,100))return;
    const asset=assets[anchor.file];
    if(asset&&asset.ready) {
      g.save();g.imageSmoothingEnabled=false;
      g.drawImage(asset.img,anchor.x,anchor.y,anchor.w,anchor.h);
      g.restore();
    }
    // A missing asset never blanks the underlying recovered artwork.
  }
  function terrain(g,options={}){
    if(!options||!Number.isFinite(options.zoom))return;
    pic(g,SOURCE.mountain,options);pic(g,SOURCE.waterfall,options);
    // The old reference's river and mountain blocks still render under the
    // premium sprite silhouettes, retaining water continuity when loading.
  }
  function coastalFoam(g,options){
    const view=options.view,z=options.zoom;
    if(!has(WORLD.minX,4160,WORLD.maxX-WORLD.minX,520,view))return;
    const x0=Math.max(WORLD.minX,view?Math.floor((view.x-250)/85)*85:WORLD.minX);
    const x1=Math.min(WORLD.maxX,view?view.x+view.w+250:WORLD.maxX);
    const stride=z<.085?310:z<.20?165:85;
    g.save();g.lineCap='round';
    for(let x=x0;x<x1;x+=stride){
      const h=mix(x/stride|0,17);const waveY=4350+(h%230);
      g.globalAlpha=z<.09?.68:.88;
      g.strokeStyle=h%3?'#c5f7e9':'#62c7dc';g.lineWidth=z<.11?12:4;
      g.beginPath();g.moveTo(x,waveY);g.quadraticCurveTo(x+stride*.34,waveY-8-h%13,x+stride*.75,waveY-1);g.stroke();
      if(z>.17){
        g.fillStyle='#eafff6';
        for(let j=0;j<3;j++){g.fillRect(x+9+j*13,waveY-3-(h%9),4+(h%4),2);}
      }
    }
    g.restore();
    // Fine shore pebble/sand glints only within the active camera footprint.
    if(z<.14)return;
    for(let x=x0;x<x1;x+=45){
      const h=mix(x/45|0,72);const y=4195+(h%140);
      g.fillStyle=(h&1)?'rgba(253,239,188,.56)':'rgba(72,112,116,.27)';
      g.fillRect(x,y,(h%7)+4,2);
    }
  }
  function pier(g,x,options){
    if(!has(x-30,4180,135,455,options.view))return;
    g.fillStyle='rgba(10,34,44,.52)';g.fillRect(x+15,4230,65,360);
    g.fillStyle=palette.woodDark;g.fillRect(x-4,4200,73,372);
    g.fillStyle=palette.wood;g.fillRect(x,4203,61,357);
    g.fillStyle=palette.woodBright;g.fillRect(x+2,4205,8,350);
    g.fillStyle='#684d42';g.fillRect(x+55,4205,5,350);
    for(let y=4210;y<4560;y+=21){
      const dark=mix(x,y,3)%4;
      g.fillStyle=dark?'#c49b6a':'#dcbb83';g.fillRect(x+9,y,45,15);
      g.fillStyle='#775848';g.fillRect(x+10,y+14,45,3);
      if(!tiny(options.zoom)){
        g.fillStyle='#e6cc9b';g.fillRect(x+13,y+4,21,2);
        g.fillStyle='#625a57';g.fillRect(x+12,y+12,3,2);g.fillRect(x+47,y+12,3,2);
      }
    }
    for(const y of [4250,4410,4550]){
      g.fillStyle='#4d4b42';g.fillRect(x-11,y,10,33);g.fillRect(x+63,y,11,33);
      g.fillStyle='#e9c482';g.fillRect(x-11,y,10,5);g.fillRect(x+63,y,11,5);
    }
  }
  function boat(g,item,options){
    if(!has(item.x-65,item.y-145,145,160,options.view))return;
    const asset=assets[item.file];
    if(asset&&asset.ready){
      g.fillStyle='rgba(9,53,77,.45)';g.beginPath();g.ellipse(item.x+6,item.y+1,51,17,0,0,Math.PI*2);g.fill();
      g.save();g.imageSmoothingEnabled=false;g.drawImage(asset.img,item.x-53,item.y-135,105,145);g.restore();
    }
  }
  function harbor(g,options){
    const zoom=options.zoom;
    if(!has(4100,4030,3690,650,options.view))return;
    coastalFoam(g,options);
    // Boardwalk transitions follow the pre-existing marina footprint.
    for(const x of PIER_X)pier(g,x,options);
    for(const entry of BOATS)boat(g,entry,options);
    pic(g,SOURCE.lighthouse,options);
    // A sequence of warm lamps makes the boat-slip path read in city overview.
    for(let i=0;i<11;i++){
      const x=4400+i*230, y=4155+Math.sin(i*.63)*17;
      if(!has(x-24,y-100,48,110,options.view,0))continue;
      g.fillStyle='#203747';g.fillRect(x-3,y-37,6,37);
      g.fillStyle='#f4c780';g.fillRect(x-8,y-43,16,11);
      if(zoom>.13){
        const glow=g.createRadialGradient(x,y-40,0,x,y-40,56);
        glow.addColorStop(0,'rgba(255,223,151,.24)');glow.addColorStop(1,'rgba(255,223,151,0)');
        g.fillStyle=glow;g.beginPath();g.arc(x,y-40,56,0,7);g.fill();
      }
    }
  }
  function buildingBox(o){
    if(!o)return null;
    const t=o.t||'';
    if(t==='mtbldg')return {x:o.bx??o.x,y:o.btop??o.y,w:o.bw??o.dw,h:o.bh??o.dh};
    if(t==='mchouse')return {x:o.dx??o.x,y:o.dyTop??o.y,w:o.dw??o.w,h:o.dh??o.h};
    if(['worldBuilding','dtBuilding','bldg','house'].includes(t))return {x:o.x,y:o.y,w:o.w,h:o.h};
    return null;
  }
  const roofColors=['#c56d5e','#d89854','#4d8495','#bc9672','#6c8f7b','#b76e81','#739fb3'];
  function roof(g,b,color,seed,z){
    if(b.w<22||b.h<22)return;
    const x=b.x,y=b.y,w=b.w,h=b.h;
    g.fillStyle='rgba(11,32,48,.35)';g.fillRect(x+12,y+9,w,h);
    g.fillStyle='#e5c4a1';g.fillRect(x,y+11,w,h-9);
    g.fillStyle=color;g.fillRect(x-4,y,w+8,h*.77);
    g.fillStyle='rgba(237,212,169,.65)';g.fillRect(x-4,y+2,w+8,6);
    g.fillStyle='rgba(30,51,66,.35)';g.fillRect(x+w*.07,y+h*.7,w*.86,6);
    const ridges=Math.max(2,Math.min(8,Math.floor(w/26)));
    for(let i=1;i<ridges;i++){
      const xx=x+(w*i)/ridges;
      g.fillStyle='rgba(63,48,59,.22)';g.fillRect(xx,y+9,3,h*.58);
      if(z>.1){g.fillStyle='rgba(255,239,179,.48)';g.fillRect(xx+3,y+11,2,h*.44);}
    }
    if(z>.085){
      const cols=Math.max(2,Math.floor(w/32));
      for(let j=0;j<cols;j++){
        const wx=x+(j+.5)*w/cols-6;
        g.fillStyle='#314e69';g.fillRect(wx,y+h*.8,12,13);
        g.fillStyle='#a9dfd8';g.fillRect(wx+2,y+h*.82,8,6);
      }
      if(seed%3===0){
        g.fillStyle='#a3b0a8';g.fillRect(x+w*.6,y+h*.25,w*.12,h*.2);
        g.fillStyle='#394a5c';g.fillRect(x+w*.6,y+h*.25,w*.12,4);
      }
    }
  }
  function downtown(g,options){
    const z=options.zoom;
    // At ordinary walking zoom use the game's original highly detailed
    // Midtown/Downtown sprites. Upgrade only the *distant* building LOD.
    if(z>.215||!options.districts)return;
    for(const district of options.districts){
      if(!district||!district.map||!has(district.x,district.y,district.w,district.h,options.view))continue;
      if(!['downtown','midtown','eastside','southbay'].includes(district.id))continue;
      g.save();g.translate(district.x,district.y);
      let i=0;
      for(const o of district.map.decors||[]){
        const b=buildingBox(o);i++;
        if(!b||![b.x,b.y,b.w,b.h].every(Number.isFinite))continue;
        if(!has(district.x+b.x,district.y+b.y,b.w,b.h,options.view))continue;
        roof(g,b,roofColors[(i*13+district.id.length)%roofColors.length],i,z);
      }
      g.restore();
    }
  }
  function overlay(g,options){
    if(!options||!Number.isFinite(options.zoom))return;
    harbor(g,options);
    downtown(g,options);
  }
  function atlasTerrain(g,options){terrain(g,{zoom:options.zoom||.11,view:null});}
  function atlasOverlay(g,options){overlay(g,{zoom:options.zoom||.11,view:null,districts:options.districts});}
  function status(){return Object.freeze({version:'v115-premium-environment-art-2',worldId:'harbor-main',
    assets:Object.keys(assets).length,decoded,failed,ready:decoded===Object.keys(assets).length,
    coast:'same-geometry',marina:'same-world-anchors',cityBuildings:'source-decoration-footprints',
    renderOnly:true,multiplayerState:'unchanged',protectedModes:'untouched'});}
  window.ROOKIE_V115_PREMIUM=Object.freeze({terrain,overlay,atlasTerrain,atlasOverlay,status,
    anchors:Object.freeze({mountain:SOURCE.mountain,waterfall:SOURCE.waterfall,lighthouse:SOURCE.lighthouse,boats:BOATS}),
    inspect:()=>({version:'v115-premium-environment-art-2',worldId:'harbor-main',sameWorldCoordinates:true,
      noCollisionMutation:true,noGameplayMutation:true,noZombieOutbreakMutation:true})});
  if(typeof document!=='undefined'){
    const modal=document.getElementById('v115Campus');
    if(modal){
      const tag=document.createElement('span');tag.id='v115PremiumTag';
      tag.textContent='PREMIUM ART · ENVIRONMENT PASS 02';modal.appendChild(tag);
      const brand=modal.querySelector('.v115-campus-brand span');
      if(brand)brand.textContent='PREMIUM COAST, MARINA, NORTH HIGHLANDS & CITY ROOFS';
      const note=modal.querySelector('#v115CampusNote');
      if(note)note.textContent='Environment artwork follows the same world grid. Mission interactions, vehicles and multiplayer still require integration.';
    }
  }
})();
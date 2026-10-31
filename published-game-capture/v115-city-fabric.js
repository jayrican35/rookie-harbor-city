/* V115 city-fabric layer: shared STREET-VISUAL geometry and cartographic LOD.
 * Draws on the existing single-world canvas. No physics, map, quest, save,
 * vehicle, Academy, or Zombie Outbreak state changes.
 * The original authored district origins and collisions remain authoritative.
 */
(function () {
  'use strict';
  const H = window.HARBOR;
  if (!H) return;
  const WORLD = Object.freeze({minX:-3100,minY:0,maxX:9656,maxY:4680});
  const AVENUE = Object.freeze({name:'HARBOR AVENUE',y:1721,h:127,center:1784.5});
  const CROSSINGS = Object.freeze([
    {id:'westfield-maple', x:-1500, y:1721, w:54, h:127, type:'avenue'},
    {id:'maple-campus', x:0, y:1721, w:54, h:127, type:'avenue'},
    {id:'campus-midtown', x:2800, y:1721, w:54, h:127, type:'avenue'},
    {id:'midtown-downtown', x:5056, y:1721, w:54, h:127, type:'avenue'},
    {id:'downtown-eastside', x:6556, y:1721, w:54, h:127, type:'avenue'},
    {id:'eastside-industrial', x:8156, y:1721, w:54, h:127, type:'avenue'},
    {id:'northgate-link', x:5800, y:1265, w:110, h:46, type:'connector'},
    {id:'southbay-link', x:3460, y:3135, w:170, h:85, type:'connector'},
    {id:'waterfront-link', x:5720, y:3218, w:150, h:66, type:'connector'}
  ]);
  const COMPACT_NAMES = Object.freeze({
    westfield:'WEST',residential:'MAPLE',plaza:'PRECINCT',
    midtown:'MIDTOWN',downtown:'DTWN',eastside:'EAST',industrial:'INDUSTRIAL',
    northgate:'NORTH',southbay:'SOUTH BAY',waterfront:'MARINA'
  });
  const hash=(x,y)=>(((Math.imul((x|0),73856093)^Math.imul((y|0),19349663))>>>0));
  const within=(r,v,pad=0)=>!v||(
    r.x < v.x+v.w+pad && r.x+r.w > v.x-pad &&
    r.y < v.y+v.h+pad && r.y+r.h > v.y-pad);

  // The same coastal terrain is used on the walkable canvas and atlas.
  // It sits UNDER real district source art, so it cannot erase buildings.
  function backdrop(g, view, zoom) {
    g.save();
    const coast=[
      {x:WORLD.minX,y:4360,w:WORLD.maxX-WORLD.minX,h:320,c:'#215c76'},
      {x:WORLD.minX,y:4425,w:WORLD.maxX-WORLD.minX,h:255,c:'#17465e'},
      {x:WORLD.minX,y:4308,w:WORLD.maxX-WORLD.minX,h:56,c:'#d2c39d'},
      {x:WORLD.minX,y:4280,w:WORLD.maxX-WORLD.minX,h:30,c:'#8da777'},
      {x:WORLD.minX,y:0,w:85,h:4360,c:'#215c76'},
      {x:WORLD.minX+85,y:0,w:38,h:4360,c:'#d2c39d'}
    ];
    for(const r of coast){if(!within(r,view))continue;g.fillStyle=r.c;g.fillRect(r.x,r.y,r.w,r.h);}
    // Natural-looking vegetated blocks in the intentionally unoccupied spaces.
    // In the full-city zoom, use larger patches instead of costly tiny blades.
    const step=zoom<.12?390:240;
    const minX=Math.max(WORLD.minX,Math.floor((view?view.x:WORLD.minX)/step)*step);
    const maxX=Math.min(WORLD.maxX,view?view.x+view.w+step:WORLD.maxX);
    const minY=Math.max(0,Math.floor((view?view.y:0)/step)*step);
    const maxY=Math.min(4260,view?view.y+view.h+step:4260);
    for(let y=minY;y<maxY;y+=step)for(let x=minX;x<maxX;x+=step){
      const n=hash(x,y);
      // Low-opacity, irregular park patches; leave route and district art readable.
      if(n%4===0){g.fillStyle='rgba(30,76,54,.095)';
        g.fillRect(x+24+(n%19),y+18+(n%17),step*.61,step*.48);}
      if(zoom>=.12&&n%7===0){g.fillStyle='rgba(215,206,148,.12)';
        g.fillRect(x+54,y+42,step*.21,step*.21);}
    }
    g.restore();
  }

  function streetSeams(g,view,zoom) {
    g.save();
    for(const c of CROSSINGS){
      const b={x:c.x-c.w/2,y:c.y,w:c.w,h:c.h};
      if(!within(b,view,75))continue;
      // Keep the native side-exit road asphalt connected at the seam.
      g.fillStyle='#424c55';g.fillRect(b.x,b.y,b.w,b.h);
      if(zoom<.055)continue;
      g.fillStyle='rgba(245,232,200,.45)';
      if(c.type==='avenue'){
        // Two short zebra crossings; no fake walls or collision rectangles.
        for(let yy=c.y+12;yy<c.y+c.h-11;yy+=17){
          g.fillRect(c.x-18,yy,36,7);
        }
        g.fillStyle='rgba(238,207,117,.72)';
        g.fillRect(c.x-c.w/2,c.y+c.h/2-1,c.w,2);
      } else {
        for(let xx=b.x+10;xx<b.x+b.w-8;xx+=17)g.fillRect(xx,c.y+9,8,c.h-18);
      }
    }
    g.restore();
  }

  function overviewDistrictLabel(g,d,zoom) {
    const label=COMPACT_NAMES[d.id] || String(d.id).toUpperCase();
    const full=(d.map&&d.map.name) || label;
    const useCompact=zoom<.105;
    const name=useCompact?label:full;
    const regionWidth=d.w*zoom;
    const maxScreenSize=useCompact?Math.min(12,Math.max(8,regionWidth/(label.length*.70))):18;
    const fontWorld=useCompact?maxScreenSize/zoom:26;
    g.save();g.font='800 '+Math.round(fontWorld)+'px Barlow Condensed,system-ui,sans-serif';
    g.textAlign='center';g.textBaseline='middle';
    g.lineWidth=Math.max(5,fontWorld*.21);
    g.strokeStyle='rgba(9,27,42,.91)';g.fillStyle='#ffefbd';
    const midX=d.w/2,midY=d.h/2;
    g.strokeText(name,midX,midY);g.fillText(name,midX,midY);
    g.restore();
  }

  function atlasRoads(g,scale,view){
    // Called inside the atlas world-coordinate transform; use the same crossing
    // table as the active camera. Preview-only decoration, not navigation.
    g.save();
    for(const c of CROSSINGS){
      const x=(c.x-c.w/2)*scale,y=c.y*scale;
      g.fillStyle='#65717c';g.fillRect(x,y,Math.max(1,c.w*scale),Math.max(1,c.h*scale));
    }
    g.restore();
  }

  H.cityFabricV115=Object.freeze({
    version:'115-road-fabric-1',world:WORLD,avenue:AVENUE,crossings:CROSSINGS,
    compactNames:COMPACT_NAMES,backdrop,streetSeams,overviewDistrictLabel,atlasRoads,
    readOnly:true
  });
})();
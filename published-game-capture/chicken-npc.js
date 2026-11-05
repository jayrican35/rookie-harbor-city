/* Owner-supplied Chicken art, using the connected world's native actor queue,
 * pedestrian simulation, feet coordinates and comic dialogue. No extra loop. */
(()=>{'use strict';
 const pack=window.ROOKIE_CHICKEN_PACK;if(!pack)return;
 const root='./assets/chicken-npc/',images=new Map(),seen=new Set();
 let actor=null,lastPose=null,draws=0,errors=0;
 function enabled(){const h=window.HARBOR;return !!h?.seamlessCampusV115?.isOpen()&&!h.outbreak?.active?.()&&!h.academy?.active?.();}
 function image(file){if(!images.has(file)){const im=new Image();im.decoding='async';im.onerror=()=>errors++;im.src=root+file;images.set(file,im);}return images.get(file);}
 function createActor(){if(actor)return actor;
  actor={id:pack.id,name:pack.name,npcStyle:3,x:720,y:1376,head:62,dir:'right',moving:false,
   distance:0,speed:30,stepLength:30*pack.walk.durationMsPerFrame/1000,
   route:[[720,1376],[770,1376],[770,1312],[720,1312]]};return actor;
 }
 function talking(){const s=window.HARBOR?.speech?.current();return enabled()&&!!s&&['Chicken','Banana'].includes(s.speaker);}
 function pose(a,t){const speech=window.HARBOR?.speech?.current(),hint=window.ROOKIE_PARKING_ENCOUNTER?.poseFor(a),argue=hint==='argue'||hint!=='walk'&&talking()&&speech.speaker==='Chicken';
  const set=argue?pack.argue:pack.walk,dir=pack.walk.directions.includes(a.dir)?a.dir:'down';
  return{kind:argue?'argue':'walk',dir,row:argue?0:pack.walk.directions.indexOf(dir),
   frame:argue?Math.floor(t/set.durationMsPerFrame)%4:a.moving?Math.floor(a.distance/a.stepLength)%4:0,
   // Supplied opaque body heights are 80 / 134px. Both render ~60px tall;
   // wings may spread without changing body scale, feet or collision radius.
   scale:argue ? 0.45 : 0.75,set};
 }
 function draw(g,a,t){if(a?.id!==pack.id||!enabled())return false;const p=pose(a,t),s=p.set,im=image(s.file);
  if(!im.complete||!im.naturalWidth)return true; // Never fall back to an unrelated person sprite.
  const [ax,ay]=s.footAnchor;g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(9,28,40,.26)';g.beginPath();g.ellipse(a.x,a.y+2,13,4,0,0,Math.PI*2);g.fill();
  const x=a.x-ax*p.scale,y=a.y-ay*p.scale;
  g.drawImage(im,p.frame*s.frameWidth,p.row*s.frameHeight,s.frameWidth,s.frameHeight,x,y,s.frameWidth*p.scale,s.frameHeight*p.scale);g.restore();
  draws++;seen.add(p.dir);lastPose={kind:p.kind,dir:p.dir,row:p.row,frame:p.frame,scale:p.scale,x:a.x,y:a.y,foot:[x+ax*p.scale,y+ay*p.scale],worldFrame:[s.frameWidth*p.scale,s.frameHeight*p.scale]};return true;
 }
 function portrait(active,type){if(!enabled()||active?.speaker!==pack.name)return null;const mood=window.ROOKIE_PARKING_ENCOUNTER?.portraitMood(active.speaker)||(type==='angry'?'angry':type==='excited'?'surprised':'talking');return root+pack.portraits[mood];}
 window.ROOKIE_CHICKEN=Object.freeze({createActor,actor:()=>actor,draw,talking,portrait,
  qa:()=>new URLSearchParams(location.search).has('pilotQA')?{id:pack.id,draws,errors,lastPose,seenDirections:[...seen],requested:images.size,loaded:[...images.values()].filter(i=>i.complete&&i.naturalWidth).length,decodedBytes:[...images.values()].reduce((n,i)=>n+i.naturalWidth*i.naturalHeight*4,0),actor:actor?{id:actor.id,x:actor.x,y:actor.y,dir:actor.dir,moving:actor.moving,distance:actor.distance,route:actor.route.map(p=>p.slice())}:null}:null});
})();

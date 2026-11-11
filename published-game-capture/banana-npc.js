/* Banana skin: same atlas/feet contract as Chicken. Actor movement, collision,
 * depth sorting and dialogue remain owned by the existing connected systems. */
(()=>{'use strict';
 const pack=window.ROOKIE_BANANA_PACK;if(!pack)return;
 const root='./assets/banana-npc/',images=new Map(),directions=new Set();
 let actor=null,draws=0,errors=0,lastPose=null;
 function enabled(){const h=window.HARBOR;return !!h?.seamlessCampusV115?.isOpen()&&!h.outbreak?.active?.()&&!h.academy?.active?.();}
 function image(file){if(!images.has(file)){const im=new Image();im.decoding='async';im.onerror=()=>errors++;im.src=root+file+(file===pack.talk.file?'?art=a4720ba2c4ba':'');images.set(file,im);}return images.get(file);}
 function createActor(){return actor||(actor={id:pack.id,name:pack.name,npcStyle:3,x:620,y:1376,head:64,dir:'right',moving:false,distance:0,
  speed:30,stepLength:30*pack.walk.durationMsPerFrame/1000,route:[[620,1376],[670,1376],[670,1348],[620,1348]]});}
 function talking(){return enabled()&&['Chicken','Banana'].includes(window.HARBOR?.speech?.current()?.speaker);}
 function pose(a,t){const s=window.HARBOR?.speech?.current(),speaks=talking()&&s.speaker===pack.name;
  const mood=speaks?document.getElementById('dlgPanel')?.dataset.comicStyle:null;
  const hint=window.ROOKIE_PARKING_ENCOUNTER?.poseFor(a),kind=hint||(speaks?(['angry','excited'].includes(mood)?'argue':'talk'):a.moving?'walk':'idle'),set=pack[kind];
  const dir=pack.walk.directions.includes(a.dir)?a.dir:'down',phase=Math.floor(t/set.durationMsPerFrame)%4;
  // Owner-supplied repair restores all four complete talking cells.
  const frame=kind==='walk'?(a.moving?Math.floor(a.distance/a.stepLength)%4:0):phase;
  // Idle/talk art is taller inside the SAME cells. Normalize visible height,
  // not the frame rectangle, so switching states doesn't enlarge the body.
  return{kind,set,dir,row:kind==='walk'?pack.walk.directions.indexOf(dir):0,frame,scale:kind==='walk'?0.75:kind==='argue'?0.45:60/102};
 }
 function draw(g,a,t){if(a?.id!==pack.id||!enabled())return false;const p=pose(a,t),s=p.set,im=image(s.file);if(!im.complete||!im.naturalWidth)return true;
  const [ax,ay]=s.footAnchor,x=a.x-ax*p.scale,y=a.y-ay*p.scale;
  g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(9,28,40,.26)';g.beginPath();g.ellipse(a.x,a.y+2,13,4,0,0,Math.PI*2);g.fill();
  g.drawImage(im,p.frame*s.frameWidth,p.row*s.frameHeight,s.frameWidth,s.frameHeight,x,y,s.frameWidth*p.scale,s.frameHeight*p.scale);g.restore();
  draws++;directions.add(p.dir);lastPose={kind:p.kind,dir:p.dir,row:p.row,frame:p.frame,scale:p.scale,x:a.x,y:a.y,foot:[x+ax*p.scale,y+ay*p.scale],worldFrame:[s.frameWidth*p.scale,s.frameHeight*p.scale]};return true;
 }
 function portrait(active,type){if(!enabled()||active?.speaker!==pack.name)return null;const mood=window.ROOKIE_PARKING_ENCOUNTER?.portraitMood(active.speaker)||(type==='angry'?'annoyed':type==='excited'?'surprised':type==='thought'?'thinking':'smug');return root+pack.portraits[mood];}
 window.ROOKIE_BANANA=Object.freeze({createActor,actor:()=>actor,draw,talking,portrait,
  qa:()=>new URLSearchParams(location.search).has('pilotQA')?{id:pack.id,draws,errors,lastPose,seenDirections:[...directions],withheldTalkFrames:[],talkFrames:[0,1,2,3],requested:images.size,actor:actor?{id:actor.id,x:actor.x,y:actor.y,dir:actor.dir,moving:actor.moving,distance:actor.distance,route:actor.route.map(p=>p.slice())}:null}:null});
})();

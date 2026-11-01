/* Runs inside the existing campaign scope; registers with its one dispatcher. */
(function(){
 function active(){return window.ROOKIE_JAY?.eligible()&&state.map!=='training';}
 function cityOpen(){return !!window.HARBOR?.seamlessCampusV115?.isOpen();}
 const before=movePlayer;
 movePlayer=function(dt){
  if(!active()||cityOpen())return before.apply(this,arguments);
  const speed=player.speed,run=window.ROOKIE_JAY.requestRun();
  try{if(run)player.speed=speed*1.55;return before.apply(this,arguments);}
  finally{player.speed=speed;window.ROOKIE_JAY.update('campaign-jay',{map:state.map,x:player.x+player.w/2,y:player.y+player.h/2,dir:player.dir,run},dt);}
 };
 characterRenderers.add('person','jay-shared-v117',100,function(x,y,color,hat,name,dir,isPlayer){
  if(!isPlayer)return false;
  const enabled=active();window.ROOKIE_JAY?.control('v117CampaignRun',enabled&&!dlgOpen&&!overlayOpen()&&!isDriving()&&!cityOpen());
  if(!enabled)return false;
  return window.ROOKIE_JAY.draw(ctx,'campaign-jay',{x,y,dir,map:state.map,...((dlgOpen||overlayOpen())?{mode:'idle'}:{})});
 });
})();

/* Preserve the original profile bytes before the engine's startup importer
 * can normalize them. Never replace a previous recovery backup. */
(function(){
 'use strict';if(!window.ROOKIE_MAIN_CITY_ACTIVE)return;
 const ids=['jay','rosa','kaleb','gigi','lingling'],prefix='rookie:v116-marina-sandbox:';
 window.ROOKIE_MAIN_SAVES={};
 try{for(const key of ['rookie-harbor-city-save-v2',...ids.map(id=>'rookie:profile:v1:'+id)]){
  const raw=localStorage.getItem(key),backup=key+':before-connected-main';
  if(raw!==null&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
  const preview=localStorage.getItem(prefix+key),previewBackup=prefix+key+':before-connected-main';
  if(preview!==null&&localStorage.getItem(previewBackup)===null)localStorage.setItem(previewBackup,preview);
  const id=ids.find(id=>key==='rookie:profile:v1:'+id);if(id&&preview!==null)window.ROOKIE_MAIN_SAVES[id]=preview;
 }
 if(!localStorage.getItem('rookie:connected-main:initialized')){
  const active=localStorage.getItem(prefix+'rookie:active-player');if(ids.includes(active))localStorage.setItem('rookie:active-player',active);
  localStorage.setItem('rookie:connected-main:initialized','1');
 }
 }catch(error){window.ROOKIE_MAIN_BACKUP_ERROR=error.message;}
})();

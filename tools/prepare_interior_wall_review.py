"""Local interior-wall review over the existing connected precinct."""
from pathlib import Path
import os,subprocess,shutil,sys,json,hashlib
repo=Path(__file__).resolve().parent.parent;source=repo/'published-game-capture';baseline='7da37f1'
after=repo/'site/preview/precinct-interior-walls';before=repo/'site/preview/precinct-interior-before';pilot=repo/'site/preview/precinct-interior-wall-pilot'
os.environ['PYTHONUTF8']='1';shutil.copytree(source,after,dirs_exist_ok=True)
subprocess.run([sys.executable,str(repo/'tools/build_v140_precinct_approved_layout_preview.py'),str(after)],check=True)
shutil.copytree(after,before,dirs_exist_ok=True)
for name in ['v115-campus.js','v131-precinct-legacy-bridge.js','v135-precinct-wallkit-test.js']:
 original=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo).decode('utf-8')
 if name=='v115-campus.js':
  p=before/'game-v115.bundle.js';s=p.read_text('utf-8');current=(source/name).read_text('utf-8');assert s.count(current)==1;p.write_text(s.replace(current,original),encoding='utf-8')
 (before/name).write_text(original,encoding='utf-8')
shutil.copytree(after,pilot,dirs_exist_ok=True)
for folder,flag in [(before,''),(after,'window.ROOKIE_INTERIOR_WALLS_ACTIVE=true;'),(pilot,'window.ROOKIE_INTERIOR_WALLS_ACTIVE=true;window.ROOKIE_INTERIOR_WALL_ROOMS=["LOBBY"];')]:
 html=folder/'index.html';s=html.read_text('utf-8');anchor='<script src="./v135-precinct-wallkit-test.js';assert s.count(anchor)==1
 s=s.replace(anchor,'<script>window.ROOKIE_CITY_PERSPECTIVE_ACTIVE=true;window.ROOKIE_PERSPECTIVE_PILOT_ACTIVE=true;'+flag+'</script>\n'+anchor);html.write_text(s,encoding='utf-8')
wrapper=(repo/'tools/review_index.html').read_text('utf-8').replace('Precinct 9 — Layout Review','Precinct 9 — Interior Walls').replace('<h1>Precinct 9</h1>','<h1>Precinct 9 · Interior walls</h1>')
wrapper=wrapper.replace('Updated layout','Improved walls').replace('Previous layout','Before walls').replace('precinct9-audit-before','precinct-interior-before').replace('precinct9-v140-approved-layout','precinct-interior-walls' if '--full' in sys.argv else 'precinct-interior-wall-pilot').replace('./evidence/','./evidence/interior-walls/')
wrapper=wrapper.replace('if(game&&game.openAt(948,1430,.8))','if(game&&openInteriorReview(game))')
select='<label>Review room <select id="reviewRoom">'+''.join(f'<option>{n}</option>' for n in ['LOBBY','OPERATIONS','EVIDENCE','RECORDS','INTERVIEW','BRIEFING','SGT. BROOKS — OFFICE','LOCKER ROOM','INTAKE','HOLDING CELLS','GARAGE'])+'</select></label>'
wrapper=wrapper.replace('<small id="status">',select+'<small id="status">')
wrapper=wrapper.replace("load('after');",'''function openInteriorReview(game){
 if(!game)return false;
 const label=document.querySelector('#reviewRoom').value;
 const rooms=frame.contentWindow.HARBOR?.cellblock?.map?.rooms||[];
 const room=rooms.find(r=>r.label===label);if(!room)return false;
 const x=380+room.x+room.w/2,y=96+room.y+room.h/2;
 for(let r=0;r<=168;r+=24)for(let dy=-r;dy<=r;dy+=24)for(let dx=-r;dx<=r;dx+=24){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
  if(game.openAt(x+dx,y+dy,1.05))return true;
 }return false;
}
 document.querySelector('#reviewRoom').addEventListener('change',()=>openInteriorReview(frame.contentWindow.HARBOR?.seamlessCampusV115));
 load('after');''')
(repo/'site/index.html').write_text(wrapper,encoding='utf-8')
hashes={}
for name in ['game.js','outbreak.css','v115-world.js','v117-jay.js','v116-marina.js','v127-citywide-art.js','v134-precinct-reference.js']:
 data=(source/name).read_bytes();old=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo)
 assert data.replace(b'\r\n',b'\n')==old.replace(b'\r\n',b'\n');assert data==(before/name).read_bytes()==(after/name).read_bytes();hashes[name]=hashlib.sha256(data).hexdigest()
(repo/'site/interior-wall-protection.json').write_text(json.dumps({'baseline':baseline,'protectedSHA256':hashes},indent=2),encoding='utf-8')
print('Local lobby pilot and same-system full-precinct review prepared; original gameplay sources protected.')

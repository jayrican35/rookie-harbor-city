"""Build a local locker-furniture comparison over the completed interior walls."""
from pathlib import Path
import subprocess,sys,shutil,json,hashlib
r=Path(__file__).resolve().parent.parent;base=r/'site/preview/precinct-interior-walls';baseline='7cbd1ea'
if not base.exists():subprocess.run([sys.executable,str(r/'tools/prepare_interior_wall_review.py'),'--full'],check=True)
before=r/'site/preview/locker-room-before';after=r/'site/preview/locker-room-updated'
for folder in [before,after]:shutil.copytree(base,folder,dirs_exist_ok=True)
for name in ['v131-precinct-legacy-bridge.js','assets/precinct-interior-walls/manifest.json','assets/precinct-interior-walls/walls-atlas.png']:
 (before/name).write_bytes(subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=r))
 shutil.copy2(r/'published-game-capture'/name,after/name)
p=after/'index.html';s=p.read_text('utf-8');s=s.replace('window.ROOKIE_INTERIOR_WALLS_ACTIVE=true;','window.ROOKIE_INTERIOR_WALLS_ACTIVE=true;window.ROOKIE_LOCKER_FURNITURE_ACTIVE=true;');p.write_text(s,encoding='utf-8')
wrapper=(r/'site/index.html').read_text('utf-8').replace('precinct-interior-before','locker-room-before').replace('precinct-interior-walls','locker-room-updated').replace('Improved walls','Updated locker room').replace('Before walls','Before').replace('Precinct 9 · Interior walls','Precinct 9 · Locker room').replace('Precinct 9 — Interior Walls','Precinct 9 — Locker Room').replace('./evidence/interior-walls/','./evidence/locker-room/').replace('<option>LOCKER ROOM</option>','<option selected>LOCKER ROOM</option>')
(r/'site/index.html').write_text(wrapper,encoding='utf-8')
protected={}
for name in ['game.js','v115-campus.js','v135-precinct-wallkit-test.js','outbreak.css','v115-world.js','v117-jay.js','v116-marina.js','v127-citywide-art.js','v134-precinct-reference.js']:
 data=(r/'published-game-capture'/name).read_bytes();old=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=r);assert data.replace(b'\r\n',b'\n')==old.replace(b'\r\n',b'\n');assert data==(before/name).read_bytes()==(after/name).read_bytes();protected[name]=hashlib.sha256(data).hexdigest()
(r/'site/locker-room-protection.json').write_text(json.dumps({'baseline':baseline,'protectedSHA256':protected},indent=2),encoding='utf-8')
print('Local locker-room review ready; existing layout, controls and wall system preserved.')

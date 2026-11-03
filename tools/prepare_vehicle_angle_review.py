"""Local raised-angle vehicle art review, preserving current interiors and gameplay."""
from pathlib import Path
import shutil,subprocess,sys,json,hashlib
r=Path(__file__).resolve().parent.parent;base=r/'site/preview/locker-room-updated';baseline='a547e57'
if not base.exists():subprocess.run([sys.executable,str(r/'tools/prepare_locker_room_review.py')],check=True)
overhead=r/'site/preview/precinct9-perspective-before'
if not overhead.exists():
 shutil.copytree(base,overhead,dirs_exist_ok=True)
 for name in ['v115-campus.js','v131-precinct-legacy-bridge.js','v134-precinct-reference.js','v135-precinct-wallkit-test.js']:
  old=subprocess.check_output(['git','show',f'be45a62:published-game-capture/{name}'],cwd=r).decode('utf-8')
  if name=='v115-campus.js':
   p=overhead/'game-v115.bundle.js';s=p.read_text('utf-8');current=(base/name).read_text('utf-8');assert s.count(current)==1;p.write_text(s.replace(current,old),encoding='utf-8')
  (overhead/name).write_text(old,encoding='utf-8')
before=r/'site/preview/vehicle-perspective-before';after=r/'site/preview/vehicle-perspective-updated'
for folder in [before,after]:shutil.copytree(base,folder,dirs_exist_ok=True)
for name in ['v135-precinct-wallkit-test.js','assets/perspective-pilot/manifest.json','assets/perspective-pilot/vehicles-atlas.png']:
 (before/name).write_bytes(subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=r))
 shutil.copy2(r/'published-game-capture'/name,after/name)
shutil.copy2(r/'published-game-capture/assets/perspective-pilot/vehicles-source-raised.png',after/'assets/perspective-pilot/vehicles-source-raised.png')
# Keep the interior review available without relative-path breakage.
interior=r/'site/interior-review';interior.mkdir(exist_ok=True)
old=(r/'site/index.html').read_text('utf-8')
if 'reviewRoom' in old:
 old=old.replace("frame.src='./preview/'","frame.src='/preview/'").replace('href="./evidence/','href="/evidence/').replace('href="./vehicle-review/','href="/vehicle-review/')
 (interior/'index.html').write_text(old,encoding='utf-8')
review=r/'site/vehicle-review';review.mkdir(exist_ok=True)
for dest in [review/'index.html',r/'site/index.html']:shutil.copy2(r/'tools/vehicle_review.html',dest)
protected={}
for name in ['game.js','outbreak.css','v115-campus.js','v115-world.js','v117-jay.js','v116-marina.js','v127-citywide-art.js','v131-precinct-legacy-bridge.js','v134-precinct-reference.js']:
 data=(r/'published-game-capture'/name).read_bytes();old=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=r)
 assert data.replace(b'\r\n',b'\n')==old.replace(b'\r\n',b'\n');assert data==(before/name).read_bytes()==(after/name).read_bytes();protected[name]=hashlib.sha256(data).hexdigest()
(r/'site/vehicle-angle-protection.json').write_text(json.dumps({'baseline':baseline,'protectedSHA256':protected},indent=2),encoding='utf-8')
print('Raised-angle vehicle review ready; original world, physics, interiors and protected modes unchanged.')

"""Build one local pilot and an exact last-committed comparison. No publishing."""
from pathlib import Path
import os,subprocess,shutil,sys,json,hashlib

repo=Path(__file__).resolve().parent.parent
baseline='be45a62'
source=repo/'published-game-capture'
after=repo/'site/preview/precinct9-perspective-pilot'
before=repo/'site/preview/precinct9-perspective-before'
os.environ['PYTHONUTF8']='1'
shutil.copytree(source,after,dirs_exist_ok=True)
subprocess.run([sys.executable,str(repo/'tools/build_v140_precinct_approved_layout_preview.py'),str(after)],check=True)
shutil.copytree(after,before,dirs_exist_ok=True)
for name in ['v115-campus.js','v134-precinct-reference.js','v135-precinct-wallkit-test.js']:
 original=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo).decode('utf-8')
 if name=='v115-campus.js':
  path=before/'game-v115.bundle.js';combined=path.read_text('utf-8');current=(source/name).read_text('utf-8')
  assert combined.count(current)==1
  path.write_text(combined.replace(current,original),encoding='utf-8')
 (before/name).write_text(original,encoding='utf-8')
html=after/'index.html';text=html.read_text('utf-8');anchor='<script src="./v135-precinct-wallkit-test.js'
assert text.count(anchor)==1
text=text.replace(anchor,'<script>window.ROOKIE_PERSPECTIVE_PILOT_ACTIVE=true;</script>\n'+anchor)
html.write_text(text,encoding='utf-8')
# No game release/version identifiers are changed by the local pilot flag.
wrapper=(repo/'tools/review_index.html').read_text('utf-8')
wrapper=wrapper.replace('Precinct 9 — Layout Review','Precinct 9 — Perspective Pilot')
wrapper=wrapper.replace('Updated layout','3/4 pilot').replace('Previous layout','Before')
wrapper=wrapper.replace('precinct9-audit-before','precinct9-perspective-before').replace('precinct9-v140-approved-layout','precinct9-perspective-pilot')
wrapper=wrapper.replace('./evidence/','./evidence/perspective-pilot/')
(repo/'site/index.html').write_text(wrapper,encoding='utf-8')
hashes={}
for name in ['game.js','outbreak.css','v115-world.js','v117-jay.js','v116-marina.js','v127-citywide-art.js']:
 current=(source/name).read_bytes();original=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo)
 assert current.replace(b'\r\n',b'\n')==original
 assert current==(before/name).read_bytes()==(after/name).read_bytes()
 hashes[name]=hashlib.sha256(current).hexdigest()
(repo/'site/perspective-source-protection.json').write_text(json.dumps({'baseline':baseline,'protectedSHA256':hashes},indent=2),encoding='utf-8')
print('Local perspective pilot ready; exact committed comparison and protected source verified.')

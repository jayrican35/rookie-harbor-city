"""Approved citywide presentation build; local only, no release/version change."""
from pathlib import Path
import os,subprocess,shutil,sys,json,hashlib
repo=Path(__file__).resolve().parent.parent
baseline='63a8016'; source=repo/'published-game-capture'
after=repo/'site/preview/harbor-city-perspective';before=repo/'site/preview/harbor-city-before'
os.environ['PYTHONUTF8']='1'
shutil.copytree(source,after,dirs_exist_ok=True)
subprocess.run([sys.executable,str(repo/'tools/build_v140_precinct_approved_layout_preview.py'),str(after)],check=True)
shutil.copytree(after,before,dirs_exist_ok=True)
for name in ['v115-campus.js','v135-precinct-wallkit-test.js']:
 original=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo).decode('utf-8')
 if name=='v115-campus.js':
  path=before/'game-v115.bundle.js';combined=path.read_text('utf-8');current=(source/name).read_text('utf-8')
  assert combined.count(current)==1
  path.write_text(combined.replace(current,original),encoding='utf-8')
 (before/name).write_text(original,encoding='utf-8')
for name in ['assets/perspective-pilot/vehicles-atlas.png','assets/perspective-pilot/manifest.json']:
 (before/name).write_bytes(subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo))
for folder,flag in [(before,'window.ROOKIE_PERSPECTIVE_PILOT_ACTIVE=true;'),(after,'window.ROOKIE_CITY_PERSPECTIVE_ACTIVE=true;window.ROOKIE_PERSPECTIVE_PILOT_ACTIVE=true;')]:
 html=folder/'index.html';text=html.read_text('utf-8');anchor='<script src="./v135-precinct-wallkit-test.js'
 assert text.count(anchor)==1
 html.write_text(text.replace(anchor,'<script>'+flag+'</script>\n'+anchor),encoding='utf-8')
wrapper=(repo/'tools/review_index.html').read_text('utf-8')
wrapper=wrapper.replace('Precinct 9 — Layout Review','Harbor City — Perspective Review').replace('<h1>Precinct 9</h1>','<h1>Harbor City</h1>')
wrapper=wrapper.replace('Updated layout','Citywide 3/4').replace('Previous layout','Approved pilot')
wrapper=wrapper.replace('precinct9-audit-before','harbor-city-before').replace('precinct9-v140-approved-layout','harbor-city-perspective')
wrapper=wrapper.replace('./evidence/','./evidence/city-perspective/')
locations=[['Precinct 9',948,1430],['Westfield',-2450,1784],['Maple Court',-1180,1620],
 ['Midtown',3930,1784],['Downtown',5880,1750],['Northgate',5850,950],['Eastside',7350,1784],
 ['Industrial',8800,1500],['Southbay',4185,3700],['Marina',5200,3758]]
select='<label>Review location <select id="reviewLocation">'+''.join(f'<option value="{x},{y}">{name}</option>' for name,x,y in locations)+'</select></label>'
wrapper=wrapper.replace('<small id="status">',select+'<small id="status">')
wrapper=wrapper.replace('if(game&&game.openAt(948,1430,.8))', '''if(game&&openReviewLocation(game))''')
wrapper=wrapper.replace("load('after');",'''function openReviewLocation(game){
 if(!game)return false;
 const [x,y]=document.querySelector('#reviewLocation').value.split(',').map(Number);
 for(let r=0;r<=192;r+=24)for(let dy=-r;dy<=r;dy+=24)for(let dx=-r;dx<=r;dx+=24){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
  if(game.openAt(x+dx,y+dy,.85))return true;
 }return false;
}
document.querySelector('#reviewLocation').addEventListener('change',()=>openReviewLocation(frame.contentWindow.HARBOR?.seamlessCampusV115));
load('after');''')
(repo/'site/index.html').write_text(wrapper,encoding='utf-8')
hashes={}
for name in ['game.js','outbreak.css','v115-world.js','v117-jay.js','v116-marina.js','v127-citywide-art.js','v134-precinct-reference.js']:
 current=(source/name).read_bytes();original=subprocess.check_output(['git','show',f'{baseline}:published-game-capture/{name}'],cwd=repo)
 assert current.replace(b'\r\n',b'\n')==original.replace(b'\r\n',b'\n')
 assert current==(before/name).read_bytes()==(after/name).read_bytes()
 hashes[name]=hashlib.sha256(current).hexdigest()
(repo/'site/city-perspective-protection.json').write_text(json.dumps({'baseline':baseline,'protectedSHA256':hashes},indent=2),encoding='utf-8')
print('Citywide local presentation ready. Protected sources match approved pilot.')


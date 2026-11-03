"""Save corrected-atlas visual evidence and the local review page."""
from pathlib import Path
import json
import shutil
import hashlib
import subprocess

r=Path.cwd();src=r/'civilian-evidence';dst=r/'docs/civilian-corrected/evidence'
dst.mkdir(parents=True,exist_ok=True)
for name in ['before','updated']:shutil.copytree(src/name,dst/name,dirs_exist_ok=True)
for name in ['results.json','coverage.json']:shutil.copy2(src/name,dst/name)
for name in ['corrected-atlas-review.png','corrected-alpha-review.png','reported-chopping.png']:
    if (src/name).exists():shutil.copy2(src/name,dst/name)
shutil.copy2(src/'corrected-inspection/all-directions.png',dst/'all-directions.png')
hashes={}
for name in ['game.js','outbreak.css','v116-marina.js','v116-marina-walk.js','v117-jay.js','v132-precinct-heritage.js','v133-precinct-campus.js','v115-world.js']:
    path='published-game-capture/'+name;data=(r/path).read_bytes().replace(b'\r\n',b'\n')
    assert data==subprocess.check_output(['git','show','e8bc907:'+path]).replace(b'\r\n',b'\n'),path
    hashes[path]=hashlib.sha256(data).hexdigest()
(dst/'protected-files.json').write_text(json.dumps({'baseline':'e8bc907','normalization':'CRLF to LF','unchanged':hashes},indent=2))
parts=[]
for w in [1280,390]:
    for scene in ['waterfront','marina','precinct','downtown','midtown']:
        parts.append(f'<h2>{scene.title()} · {w}px</h2><div class="pair">'+''.join(f'<figure><figcaption>{t.title()}</figcaption><img loading="lazy" src="{t}/{w}-{scene}.png" alt="{t} {scene}"></figure>' for t in ['before','updated'])+'</div>')
body='''<h1>Corrected civilian atlas review</h1><p>The corrected ZIP uses 192×240 source frames with feet at (96,225). Whole-frame exports use 128×160 cells and feet at (64,150); the renderer reads this metadata. Complete gloves, shoes and limb gaps are retained. Tiny detached outer header fragments were removed; original source PNGs are archived unchanged.</p>
<p>26 outfits are enabled. Chef, Construction Worker, Artist and Child are held because their four front-facing hats are clipped in the source files. 31 existing civilians use corrected art; the construction worker keeps the previous coherent fallback. Only these 16 front frames need source correction.</p>
<p>The pack uses shared vendor-pilot anatomy with modular wardrobe/headwear, as stated by its author. This is not a claim of 30 individually painted turnarounds.</p>
<p><a href="../validation.json">Source and frame validation</a> · <a href="protected-files.json">Protected sources</a></p>
<h2>Hands, clothing and limb transparency</h2><img loading="lazy" src="corrected-alpha-review.png" alt="Enlarged corrected sprites on checkerboard">
<h2>Shop staff and customer in the game</h2><img loading="lazy" src="updated/shop-interior.png" alt="Corrected shop civilians, Jay unchanged">
'''+''.join(parts)
html=(r/'tools/civilian_atlas_gallery.html').read_text(encoding='utf-8').replace('<!-- EVIDENCE -->',body)
(dst/'index.html').write_text(html,encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/civilian-corrected',dirs_exist_ok=True)
shutil.copy2(r/'docs/civilian-corrected/validation.json',r/'site/evidence/validation.json')
print('Packaged corrected civilian artwork, alpha review and gameplay checks.')

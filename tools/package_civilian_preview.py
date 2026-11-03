"""Publish local evidence only; no hosted deployment or remote changes."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

r=Path.cwd()
src=r/'civilian-evidence'
dst=r/'docs/civilian-preview/evidence'
dst.mkdir(parents=True,exist_ok=True)
status=json.loads((r/'published-game-capture/assets/civilian-approved/review-status.json').read_text())
if not status['approvedForPlayback']:
    shutil.copy2(r/'tools/civilian_art_hold.html',dst/'index.html')
    target=r/'site/evidence/civilian-preview'
    target.mkdir(parents=True,exist_ok=True)
    shutil.copy2(r/'tools/civilian_art_hold.html',target/'index.html')
    print('Artwork is withdrawn; published the repair status page instead of the damaged walk demo.')
    raise SystemExit(0)
for name in ['before','updated']:
    shutil.copytree(src/name,dst/name,dirs_exist_ok=True)
for name in ['results.json','coverage.json']:
    shutil.copy2(src/name,dst/name)
for name in ['review.png','atlas-review.png']:
    if (src/name).exists():
        shutil.copy2(src/name,dst/name)
hashes={}
for name in ['game.js','outbreak.css','v116-marina.js','v116-marina-walk.js','v117-jay.js','v132-precinct-heritage.js','v133-precinct-campus.js','v135-precinct-wallkit-test.js','v115-world.js']:
    path='published-game-capture/'+name
    data=(r/path).read_bytes().replace(b'\r\n',b'\n')
    baseline=subprocess.check_output(['git','show','943065e:'+path]).replace(b'\r\n',b'\n')
    assert data==baseline,path
    hashes[path]=hashlib.sha256(data).hexdigest()
(dst/'protected-files.json').write_text(json.dumps({'baseline':'943065e','normalization':'CRLF to LF','unchanged':hashes},indent=2))
results=json.loads((src/'results.json').read_text(encoding='utf-8'))
perf=''.join(f'<tr><td>{v["tag"]}</td><td>{v["width"]}×{v["height"]}</td><td>{v["performance"]["fps"]}</td></tr>' for v in results['runs'])
panels=[]
for width in [1280,390]:
    for scene in ['waterfront','marina','precinct','downtown','midtown']:
        panels.append(f'<h2>{scene.title()} · {width}px</h2><div class="pair">'+''.join(f'<figure><figcaption>{tag.title()}</figcaption><img loading="lazy" src="{tag}/{width}-{scene}.png" alt="{tag} {scene}"></figure>' for tag in ['before','updated'])+'</div>')
body='''<h1>Connected-world civilian artwork</h1><p>All 30 original atlases / 480 frames are imported without repainting. Four-direction profiles in the supplied pack are composited approximations, retained unchanged. No generated replacement artwork is used.</p>
<p>All 32 existing connected-world civilians rendered with assigned roles during coverage testing. Eleven protected actors in the base actor registry stayed on their original art; the player and additional precinct officer layer are also excluded by the adapter. NPC identities, speeds, routes, dialogue and geometry match before/after. Pier walks, seamless shop entry/exit and mobile movement pass. Zombie startup and seeded maps match; no civilian atlases are requested in that mode.</p>
<p><a href="protected-files.json">Protected source hashes</a> · <a href="../asset-validation.json">Exact asset hashes</a></p>
<h2>Local performance samples</h2><p>Matching headless Chrome camera/zoom, no recording; mobile dimensions are emulated. Short samples are not physical-device benchmarks.</p><table><tr><th>Build</th><th>Viewport</th><th>FPS</th></tr>'''+perf+'''</table><h2>Shop staff and customer</h2><img loading="lazy" src="updated/shop-interior.png" alt="Civilian shopkeeper and customer; Jay unchanged">'''+''.join(panels)
html=(r/'tools/civilian_atlas_gallery.html').read_text(encoding='utf-8').replace('<!-- EVIDENCE -->',body)
(dst/'index.html').write_text(html,encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/civilian-preview',dirs_exist_ok=True)
shutil.copy2(r/'docs/civilian-preview/asset-validation.json',r/'site/evidence/asset-validation.json')
print('Packaged all-30 atlas viewer, before/after gameplay and verification results.')

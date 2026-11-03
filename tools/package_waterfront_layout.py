"""Package the approved corner reconstruction and wider dock-lane evidence."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

r = Path.cwd()
src = r / 'waterfront-layout-evidence'
dst = r / 'docs/waterfront-layout/evidence'
dst.mkdir(parents=True, exist_ok=True)
reference = Path('C:/Users/marre/AppData/Local/Temp/codex-clipboard-8bddae72-3516-4f40-ac68-8946797d33a4.png')
if reference.exists():
    shutil.copy2(reference, dst / 'user-layout-reference.png')
for name in ['before', 'after']:
    shutil.copytree(src / name, dst / name, dirs_exist_ok=True)
for name in ['results.json', 'performance.json', 'after-1280-audit.json', 'after-390-audit.json']:
    shutil.copy2(src / name, dst / name)
shutil.copy2(r / 'marina-integration-evidence/isolation.json', dst / 'isolation.json')
protected = ['game.js', 'outbreak.css', 'v117-jay.js', 'v116-marina-walk.js',
             'v120-marina-art.js', 'v131-precinct-legacy-bridge.js', 'v135-precinct-wallkit-test.js']
hashes = {}
for name in protected:
    path = 'published-game-capture/' + name
    data = (r / path).read_bytes().replace(b'\r\n', b'\n')
    before = subprocess.check_output(['git', 'show', '2db4c37:' + path]).replace(b'\r\n', b'\n')
    assert data == before, path
    hashes[path] = hashlib.sha256(data).hexdigest()
(dst / 'protected-files.json').write_text(json.dumps({'baseline': '2db4c37', 'normalization': 'CRLF to LF', 'unchanged': hashes}, indent=2))
panels = []
for width in [1280, 390]:
    for scene in ['corner', 'marina', 'bay-pier']:
        panels.append(f'<h2>{scene.replace("-", " ").title()} · {width}px</h2><div class="pair">' + ''.join(
            f'<figure><figcaption>{tag.title()}</figcaption><img loading="lazy" src="{tag}/{width}-{scene}.png" alt="{tag} {scene}"></figure>'
            for tag in ['before', 'after']) + '</div>')
perf = json.loads((dst / 'performance.json').read_text())
rows = ''.join(f'<tr><td>{p["tag"]}</td><td>{p["width"]}×{p["height"]}</td><td>{p["fps"]}</td></tr>' for p in perf['runs'])
(dst / 'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Bayview corner reconstruction and clear dock routes</title><style>body{background:#102238;color:#eee;font:16px system-ui;margin:24px}a{color:#f6cf80}.pair{display:flex;gap:16px;align-items:start}figure{margin:0;flex:1;min-width:0}img{max-width:100%;height:auto}figcaption,td,th{padding:8px}@media(max-width:650px){.pair{display:block}}</style>
<h1>Bayview bait shop, marina gateway and open boardwalk</h1>
<p>The two pictured homes are replaced by the approved bait shop and marina entrance. A connected access street fronts the store; the broad timber deck joins the waterfront and original piers. Furniture is grouped at the edges, mooring fittings and pilings sit outboard, and fishermen leave the narrow center lanes free.</p>
<p>2,344 sampled positions across the wider walking bands have zero fixed obstruction hits. Actual keyboard movement passes all four pier centers and returns, crosses the full promenade and gateway, follows the new street and enters/exits the relocated shop. Mobile pointer input passes. Native district datasets and Zombie behavior remain unchanged.</p>
<p><a href="/">Play the local layout</a> · <a href="results.json">Gameplay results</a> · <a href="after-1280-audit.json">Clearance sweep</a> · <a href="isolation.json">Protected mode check</a> · <a href="performance.json">Performance</a> · <a href="protected-files.json">Protected source hashes</a></p>
<h2>Supplied layout reference</h2><img src="user-layout-reference.png" alt="The user's bait shop and marina entrance composition reference">
<h2>Relocated shop interior</h2><img src="after/shop-interior.png" alt="Jay inside the relocated shop">
<h2>Matching performance sample</h2><p>Headless Chrome, matching camera/zoom, no recording. Emulated viewport measurements; physical-device testing remains outstanding.</p><table><tr><th>Build</th><th>Viewport</th><th>FPS</th></tr>
''' + rows + '</table>' + ''.join(panels), encoding='utf-8')
shutil.copytree(dst, r / 'site/evidence/waterfront-layout', dirs_exist_ok=True)
print('Packaged waterfront layout and walking evidence.')

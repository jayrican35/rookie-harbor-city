"""Package the completed local road QA; run from the repository root."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

r = Path.cwd()
out = r / 'docs/road-repairs/evidence'
out.mkdir(parents=True, exist_ok=True)
for name in ['before', 'after']:
    shutil.copytree(r / 'road-repair-evidence' / name, out / name, dirs_exist_ok=True)
for name in ['results.json', 'isolation.json', 'review.png']:
    shutil.copy2(r / 'road-repair-evidence' / name, out / name)
shutil.copy2(r / 'roads-audit.json', out / 'collision-audit.json')
protected = ['game.js', 'outbreak.css', 'v116-marina.js', 'v127-citywide-art.js',
             'v135-precinct-wallkit-test.js', 'v131-precinct-legacy-bridge.js']
hashes = {}
for name in protected:
    path = 'published-game-capture/' + name
    current = (r / path).read_bytes()
    baseline = subprocess.check_output(['git', 'show', '957a4db:' + path])
    # Git checks out CRLF on this Windows workspace; compare source content.
    normalized = current.replace(b'\r\n', b'\n')
    assert normalized == baseline.replace(b'\r\n', b'\n'), path
    hashes[path] = hashlib.sha256(normalized).hexdigest()
(out / 'protected-files.json').write_text(json.dumps({'baseline': '957a4db', 'normalization': 'CRLF to LF', 'unchanged': hashes}, indent=2))
panels = []
for width in [1280, 390]:
    for scene in ['north', 'junction', 'maple']:
        panels.append(f'<h2>{scene.title()} · {width}px</h2><div class="pair">' + ''.join(
            f'<figure><figcaption>{tag.title()}</figcaption><img loading="lazy" src="{tag}/{width}-{scene}.png" alt="{tag} {scene}"></figure>'
            for tag in ['before', 'after']) + '</div>')
(out / 'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Harbor City road repair evidence</title><style>body{background:#102238;color:#eee;font:16px system-ui;margin:24px}a{color:#f6cf80}.pair{display:flex;gap:16px;align-items:start}figure{margin:0;flex:1;min-width:0}img{max-width:100%;height:auto}figcaption{padding:8px}@media(max-width:650px){.pair{display:block}}</style>
<h1>Connected street repairs</h1><p>22 canonical road segments; 21 merged painted surfaces in one connected network. Zero fixed obstruction hits in 8,382 street-interior samples (player radius 11). Moving traffic retains collision.</p>
<p>Ordinary movement input passed both northern connections and the Maple bypass. Desktop and mobile-size captures had no browser exceptions. Seeded Zombie maps matched, startup passed, and the connected world stayed unavailable during Zombie mode.</p>
<p><a href="/">Open local road review</a> · <a href="collision-audit.json">Collision audit</a> · <a href="results.json">Movement results</a> · <a href="isolation.json">Mode isolation</a> · <a href="protected-files.json">Protected source hashes</a></p>
''' + ''.join(panels), encoding='utf-8')
shutil.copytree(out, r / 'site/evidence/road-repairs', dirs_exist_ok=True)
print('Packaged road evidence; protected sources match baseline 957a4db.')

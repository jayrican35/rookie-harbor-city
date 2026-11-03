"""Save the verified waterfront review and its original supplied references."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

r = Path.cwd()
src = r / 'marina-integration-evidence'
dst = r / 'docs/marina-integration/evidence'
dst.mkdir(parents=True, exist_ok=True)
for name in ['before', 'updated']:
    shutil.copytree(src / name, dst / name, dirs_exist_ok=True)
for name in ['results.json', 'navigation.json', 'isolation.json', 'performance.json']:
    shutil.copy2(src / name, dst / name)
if (src / 'review.png').exists():
    shutil.copy2(src / 'review.png', dst / 'review.png')
video = max((src / 'video').glob('*.webm'), key=lambda p: p.stat().st_mtime)
shutil.copy2(video, dst / 'waterfront-walk-and-shop.webm')
concept = r / 'docs/marina-integration/references/Bayview Waterfront Pixel-Art Concept Board.png'
if not concept.exists():
    shutil.copy2(Path('C:/Users/marre/Downloads/Bayview Waterfront Pixel-Art Concept Board.png'), concept)
protected = ['game.js', 'outbreak.css', 'v115-world.js', 'v117-jay.js',
             'v116-marina-walk.js', 'v135-precinct-wallkit-test.js', 'v131-precinct-legacy-bridge.js']
hashes = {}
for name in protected:
    path = 'published-game-capture/' + name
    data = (r / path).read_bytes().replace(b'\r\n', b'\n')
    baseline = subprocess.check_output(['git', 'show', '21be433:' + path]).replace(b'\r\n', b'\n')
    assert data == baseline, path
    hashes[path] = hashlib.sha256(data).hexdigest()
(dst / 'protected-files.json').write_text(json.dumps({'baseline': '21be433', 'normalization': 'CRLF to LF', 'unchanged': hashes}, indent=2))
perf = json.loads((dst / 'performance.json').read_text())
rows = ''.join(f'<tr><td>{p["tag"]}</td><td>{p["width"]}×{p["height"]}</td><td>{p["fps"]}</td><td>{p["frameP95Ms"]:.1f}</td></tr>' for p in perf['runs'])
panels = []
for width in [1280, 390]:
    scenes = ['bayview', 'shop-exterior', 'connection', 'docks'] if width == 1280 else ['bayview', 'connection', 'docks']
    for scene in scenes:
        panels.append(f'<h2>{scene.replace("-", " ").title()} · {width}px</h2><div class="pair">' + ''.join(
            f'<figure><figcaption>{tag.title()}</figcaption><img loading="lazy" src="{tag}/{width}-{scene}.png" alt="{tag} {scene}"></figure>'
            for tag in ['before', 'updated']) + '</div>')
(dst / 'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Bayview waterfront — gameplay evidence</title><style>body{background:#102238;color:#eee;font:16px system-ui;margin:24px}a{color:#f6cf80}.pair{display:flex;gap:16px;align-items:start}figure{margin:0;flex:1;min-width:0}img,video{max-width:100%;height:auto}figcaption{padding:8px}td,th{padding:8px;text-align:left}@media(max-width:650px){.pair{display:block}}</style>
<h1>Bayview waterfront & Marina Bait & Tackle</h1><p><a href="/">Play the local continuous world</a> · <a href="navigation.json">Collision & navigation</a> · <a href="results.json">Gameplay checks</a> · <a href="performance.json">Performance</a> · <a href="isolation.json">Zombie isolation</a> · <a href="protected-files.json">Protected source hashes</a></p>
<p>Ordinary movement input passes the Bayview–Marina promenade, the Bayview pier, all three original Marina piers, and the bait shop entrance/exit. 1,188 route samples at player radius 12 found zero fixed obstructions; the shop has 1,167 reachable floor cells. Furniture is solid and reachable. Source district map data matches before/after.</p>
<h2>Recorded local demonstration</h2><p>The recording includes the matching views, connecting route, pier walks and seamless shop entry/exit. Initial placement is used at each separate route's start; entry and exit use ordinary movement.</p><video controls preload="metadata" src="waterfront-walk-and-shop.webm"></video>
<h2>Shop interior</h2><img loading="lazy" src="updated/1280-shop-interior.png" alt="Jay inside Marina Bait and Tackle">
<h2>Matching performance sample</h2><p>Headless Chrome, no video recording, same camera and zoom. Mobile viewports are emulated. Short local samples are not physical-device benchmarks.</p><table><tr><th>Build</th><th>Viewport</th><th>FPS</th><th>Frame p95 ms</th></tr>
''' + rows + '</table>' + ''.join(panels), encoding='utf-8')
shutil.copytree(dst, r / 'site/evidence/marina-integration', dirs_exist_ok=True)
print('Packaged waterfront screenshots, video, navigation, performance and isolation results.')

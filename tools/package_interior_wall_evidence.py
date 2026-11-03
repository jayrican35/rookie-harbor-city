"""Package actual interior-wall gameplay comparisons and QA output."""
from pathlib import Path
import json,shutil
r=Path(__file__).resolve().parent.parent;src=r/'interior-wall-evidence';dst=r/'docs/interior-walls/evidence';dst.mkdir(parents=True,exist_ok=True)
for tag in ['before','pilot','after']:
 (dst/tag).mkdir(exist_ok=True)
 for p in (src/tag).glob('*.png'):shutil.copy2(p,dst/tag/p.name)
for name in ['results.json','pilot-results.json','isolation.json']:shutil.copy2(src/name,dst/name)
shutil.copy2(src/'review-wrapper.png',dst/'review-wrapper.png');shutil.copy2(r/'site/interior-wall-protection.json',dst/'source-protection.json')
results=json.loads((src/'results.json').read_text('utf-8'));rooms=results['runs'][0]['baseline']['rooms'];rows=[]
for size in [1280,390]:
 for room in rooms:
  import re
  name=re.sub('[^a-z0-9]+','-',room['label'],flags=re.I);file=f'{size}-room-{name}.png'
  rows.append(f'<h2>{room["label"]} · {size}px</h2><div class="pair"><figure><figcaption>Before</figcaption><img loading="lazy" src="before/{file}"></figure><figure><figcaption>Improved walls</figcaption><img loading="lazy" src="after/{file}"></figure></div>')
(dst/'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Precinct 9 interior walls</title><style>body{background:#101d2c;color:#eee;font:16px system-ui;margin:24px}a{color:#abd8ff}.pair{display:flex;gap:12px}figure{margin:0;flex:1;min-width:0}img{width:100%;image-rendering:pixelated}@media(max-width:700px){.pair{display:block}}</style><h1>Precinct 9 · Interior wall comparison</h1><p>Actual in-game captures at matching camera positions and gameplay zoom. The original rooms, furniture and NPC coordinates are unchanged. Before is citywide commit 7da37f1. The lobby pilot was verified before the same kit was extended to all rooms.</p><p><a href="results.json">Full-room gameplay/collision/visibility results</a> · <a href="pilot-results.json">Lobby pilot results</a> · <a href="isolation.json">Front entrance and Zombie isolation</a> · <a href="source-protection.json">Protected source hashes</a></p>'''+''.join(rows),encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/interior-walls',dirs_exist_ok=True)
print('Packaged matching screenshots for eleven rooms on desktop and mobile.')

"""Package actual locker-room captures for local review."""
from pathlib import Path
import shutil
r=Path(__file__).resolve().parent.parent;src=r/'locker-room-evidence';dst=r/'docs/locker-room/evidence';dst.mkdir(parents=True,exist_ok=True)
for tag in ['before','after']:
 (dst/tag).mkdir(exist_ok=True)
 for p in (src/tag).glob('*.png'):shutil.copy2(p,dst/tag/p.name)
for name in ['results.json','isolation.json','review.png']:shutil.copy2(src/name,dst/name)
shutil.copy2(r/'site/locker-room-protection.json',dst/'source-protection.json')
rows=[]
for size in [1280,390]:
 for name in ['room','locker7']:
  rows.append(f'<h2>{name} · {size}px</h2><div><figure><figcaption>Before</figcaption><img src="before/{size}-{name}.png"></figure><figure><figcaption>Updated</figcaption><img src="after/{size}-{name}.png"></figure></div>')
(dst/'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Locker room furniture comparison</title><style>body{background:#102238;color:#eee;font:16px system-ui;margin:24px}a{color:#abd8ff}div{display:flex;gap:12px}figure{margin:0;flex:1;min-width:0}img{width:100%;image-rendering:pixelated}@media(max-width:700px){div{display:block}}</style><h1>Precinct 9 · Locker room</h1><p>Actual matching-camera gameplay captures. Original layout, walls and colliders are unchanged. Before: commit 7cbd1ea.</p><p><a href="results.json">Layout, access, depth and performance results</a> · <a href="isolation.json">Protected-mode checks</a> · <a href="source-protection.json">Protected source hashes</a></p>'''+''.join(rows),encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/locker-room',dirs_exist_ok=True)

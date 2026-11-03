"""Package actual raised-angle versus previous-angle vehicle captures."""
from pathlib import Path
import shutil
r=Path(__file__).resolve().parent.parent;src=r/'vehicle-angle-evidence';dst=r/'docs/vehicle-angle/evidence';dst.mkdir(parents=True,exist_ok=True)
for tag in ['before','after']:
 (dst/tag).mkdir(exist_ok=True)
 for p in (src/tag).glob('*.png'):shutil.copy2(p,dst/tag/p.name)
for name in ['results.json','review.png']:shutil.copy2(src/name,dst/name)
shutil.copy2(r/'site/vehicle-angle-protection.json',dst/'source-protection.json')
rows=[]
for width in [1280,390]:
 for name in ['street','detail']:
  rows.append(f'<h2>{width}px · {name}</h2><div><figure><figcaption>Previous shallow angle</figcaption><img src="before/{width}-{name}.png"></figure><figure><figcaption>Raised 3/4 angle</figcaption><img src="after/{width}-{name}.png"></figure></div>')
(dst/'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Vehicle angle comparison</title><style>body{background:#102238;color:#eee;font:16px system-ui;margin:24px}a{color:#abd8ff}div{display:flex;gap:12px}figure{margin:0;flex:1;min-width:0}img{width:100%;image-rendering:pixelated}@media(max-width:700px){div{display:block}}</style><h1>Stronger 3/4 vehicle perspective</h1><p>Actual game captures at matching camera positions and zoom. Street is 1.0×; detail is 1.3× in both builds. Live traffic continues, so vehicle positions differ. The generated sprite sheet is not used as gameplay evidence.</p><p><a href="/vehicle-review/">Playable street comparison</a> · <a href="results.json">Tests and performance</a> · <a href="source-protection.json">Protected source hashes</a></p>'''+''.join(rows)+'<h2>Actual patrol car</h2><img src="after/1280-patrol.png">',encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/vehicle-angle',dirs_exist_ok=True)
print('Packaged actual raised-angle vehicle evidence')

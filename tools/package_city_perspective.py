"""Package actual city comparison evidence, never generated gameplay mockups."""
from pathlib import Path
import shutil,json
r=Path(__file__).resolve().parent.parent;src=r/'city-perspective-evidence';dst=r/'docs/city-perspective/evidence';dst.mkdir(parents=True,exist_ok=True)
for tag in ['before','after']:
 (dst/tag).mkdir(exist_ok=True)
 for p in (src/tag).glob('*.png'):shutil.copy2(p,dst/tag/p.name)
for name in ['results.json','depth-and-turns.json','district-audit.json']:shutil.copy2(src/name,dst/name)
shutil.copy2(r/'site/city-perspective-protection.json',dst/'source-protection.json')
shutil.copy2(src/'review-wrapper.png',dst/'review-wrapper.png')
rows=[]
for size in [1280,390]:
 for name in ['precinct','westfield','residential','midtown','downtown','northgate','eastside','industrial','southbay','marina']:
  file=f'{size}-{name}.png';rows.append(f'<h2>{name} · {size}px</h2><div class="pair"><figure><figcaption>Approved pilot baseline</figcaption><img loading="lazy" src="before/{file}"></figure><figure><figcaption>Citywide 3/4</figcaption><img loading="lazy" src="after/{file}"></figure></div>')
(dst/'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Harbor City perspective comparison</title><style>body{background:#101d2c;color:#eee;font:16px system-ui;margin:24px}a{color:#abd8ff}.pair{display:flex;gap:12px}figure{margin:0;flex:1;min-width:0}img{width:100%;image-rendering:pixelated}@media(max-width:700px){.pair{display:block}}</style><h1>Harbor City · local perspective pass</h1><p>Actual gameplay screenshots at matching camera coordinates and scale, compared with approved pilot commit 63a8016. Live traffic and animation continue between captures. Review location selection is a development inspection aid; it does not add in-game fast travel.</p><p><a href="results.json">Gameplay, collision and performance results</a> · <a href="depth-and-turns.json">Building occlusion and natural vehicle turns</a> · <a href="source-protection.json">Protected source hashes</a></p>'''+''.join(rows),encoding='utf-8')
results=json.loads((src/'results.json').read_text('utf-8'))
summary=[]
for run in results['runs']:
 summary.append({'tag':run['tag'],'width':run['width'],'collisionSamples':len(run['baseline']['collisions']),
 'maximumSettledPaintP95Ms':round(max(s['performance']['paintP95Ms'] for s in run['shots']),2),
 'maximumSettledPaintMs':round(max(s['performance']['paintMaxMs'] for s in run['shots']),2),
 'maximumColdPaintMs':round(max(s['cold']['paintMaxMs'] for s in run['shots']),2),'errors':run['errors']})
(dst/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/city-perspective',dirs_exist_ok=True)
print(json.dumps(summary,indent=2))

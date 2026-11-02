from pathlib import Path
import json,shutil
r=Path.cwd(); dst=r/'docs/perspective-pilot/evidence'; dst.mkdir(parents=True,exist_ok=True)
for tag in ['before','after']:
 (dst/tag).mkdir(exist_ok=True)
 for p in (r/'perspective-evidence'/tag).glob('*.png'): shutil.copy2(p,dst/tag/p.name)
for name in ['results.json','supplement.json']: shutil.copy2(r/'perspective-evidence'/name,dst/name)
shutil.copy2(r/'site/perspective-source-protection.json',dst/'source-protection.json')
video=max((r/'perspective-evidence/after/video').glob('*.webm'),key=lambda p:p.stat().st_mtime)
shutil.copy2(video,dst/'pilot-gameplay.webm')
rows=[]
for name in ['1280-campus','1280-normal-gameplay','1280-traffic','390-normal-gameplay','1280-running','1280-lobby','1280-behind-tree','1280-in-front-of-tree']:
 rows.append(f'<h2>{name}</h2><div class="pair"><figure><figcaption>Before: be45a62</figcaption><img src="before/{name}.png"></figure><figure><figcaption>3/4 pilot</figcaption><img src="after/{name}.png"></figure></div>')
(dst/'index.html').write_text('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Precinct perspective comparison</title><style>body{background:#101d2c;color:#eee;font:16px system-ui;margin:24px}a{color:#abd8ff}.pair{display:flex;gap:12px}figure{margin:0;flex:1;min-width:0}img{width:100%;image-rendering:pixelated}video{max-width:100%}@media(max-width:700px){.pair{display:block}}</style><h1>Precinct 9: local perspective pilot</h1><p>Actual gameplay captures. Each pair uses the same viewport and camera coordinates. Live traffic and animation continue between captures, so actor poses differ. No image generation was used on these screenshots.</p><p><a href="results.json">Gameplay results</a> · <a href="supplement.json">Building occlusion and directional diagnostics</a> · <a href="source-protection.json">Protected source hashes</a></p>'''+''.join(rows)+'<h2>Recorded gameplay</h2><p>Automated desktop route, including initial QA camera placements; movement scenarios use real keys.</p><video controls src="pilot-gameplay.webm"></video>',encoding='utf-8')
shutil.copytree(dst,r/'site/evidence/perspective-pilot',dirs_exist_ok=True)

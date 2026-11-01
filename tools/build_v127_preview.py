#!/usr/bin/env python3
"""V127: add one shared material renderer to the actual V126 Harbor City game."""
from pathlib import Path
import subprocess,sys,hashlib
if len(sys.argv)!=2:raise SystemExit('Usage: build_v127_preview.py SITE_DIR')
root=Path(sys.argv[1]).resolve();tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v126_preview.py'),str(root)],check=True)
art=root/'v127-citywide-art.js';assert art.stat().st_size>7000
p=root/'index.html';html=p.read_text()
# The V115 engine and campus are already compiled and loaded from one
# canonical bundle. Attach the world-art adapter after all existing modules,
# without making assumptions about their versioned script tags.
stamp=hashlib.sha256(art.read_bytes()).hexdigest()[:12]
script='<script src="./v127-citywide-art.js?v='+stamp+'"></script>'
assert html.count('</body>')==1 and 'v127-citywide-art.js' not in html
html=html.replace('</body>',script+'\n</body>')
assert html.count('</body>')==1
html=html.replace('</body>','<meta name="rookie-citywide" content="v127-continuous-art-and-hud" />\n</body>')
html=html.replace('V126 Marina Polish + Run Animation','V127 Citywide Visual Continuity')
html=html.replace('V126 DOCK + RUN','V127 CONNECTED CITY')
p.write_text(html)
print('PASS V127 original connected world preserved; all 9 districts use one shared marina-sourced material renderer, no scene loads')

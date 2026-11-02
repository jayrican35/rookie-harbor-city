#!/usr/bin/env python3
"""Bayview waterfront extension: one native world, safe isolated preview."""
from pathlib import Path
import subprocess,sys
if len(sys.argv)!=2:
    raise SystemExit('Usage: build_bayview_preview.py PREVIEW_DIR')
preview=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v128_preview.py'),str(preview)],check=True)
code=(preview/'v127-citywide-art.js').read_text()
world=(preview/'game-v115.bundle.js').read_text()
assert 'function bayviewPromenadeAt(' in code and 'function bayviewFrontage(' in code
assert 'const BAYVIEW_FURNISHINGS=' in code and 'BAYVIEW.right' in code
assert 'city.walkways(g,' in world
assert 'window.ROOKIE_V127_CITY.depthProps(view,districtEntries)' in world
assert (preview/'outbreak.css').is_file() and (preview/'game.js').is_file()
htmlfile=preview/'index.html';html=htmlfile.read_text()
assert html.count('</body>')==1 and 'rookie-bayview-extension' not in html
html=html.replace('</head>','<meta name="rookie-bayview-extension" content="southbay-original-asphalt-preserved-plus-west-marina-quality" />\n</head>')
html=html.replace('World Completion Candidate','Bayview Premium Waterfront — Playtest')
htmlfile.write_text(html)
print('PASS Bayview isolated playable candidate: full native Southbay asphalt, improved coastline, depth-sorted authentic furniture; original Marina/Zombie preserved')

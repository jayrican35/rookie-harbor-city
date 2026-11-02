#!/usr/bin/env python3
"""Build one isolated V135 real-game preview on V134 existing Canvas systems."""
from pathlib import Path
import json,subprocess,sys,hashlib
if len(sys.argv)!=2:raise SystemExit('Usage: build_v135_precinct_wallkit_preview.py SITE_DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v134_precinct_preview.py'),str(root)],check=True)
kit=root/'v135-precinct-wallkit-test.js'
assets=root/'assets/precinct9-wall-kit-phase1'
assert kit.is_file() and assets.is_dir()
m=json.loads((assets/'manifest.json').read_text())
assert m['tileSize']==32 and m['worldPixelsPerAssetPixel']==1
assert len(m['frames'])==26 and (assets/m['atlas']).is_file()
for f in m['frames'].values():
    assert (assets/f['file']).is_file()
world=(root/'game-v115.bundle.js').read_text()
assert 'ROOKIE_V135_WALL_KIT?.drawTest' in (root/'v134-precinct-reference.js').read_text()
assert 'drawStationRoof()' in world and 'drawEntityHighlights(t)' in world
for n in ('game.js','outbreak.css','v116-marina.js','v127-citywide-art.js','v115-world.js'):
    assert (root/n).is_file(),n
html_path=root/'index.html';html=html_path.read_text()
assert html.count('</body>')==1 and 'v134-precinct-reference.js' in html
html=html.replace('</body>','<script src="./v135-precinct-wallkit-test.js?v='+
 hashlib.sha256(kit.read_bytes()).hexdigest()[:12]+'"></script>\n</body>')
html=html.replace('V134 Precinct 9 Reference-Quality Headquarters — Review Only',
                  'V135 Precinct 9 Wall Kit — Phase 1 Test Assembly')
html_path.write_text(html)
print('PASS isolated V135 Phase-1 wall-kit connected-world preview')

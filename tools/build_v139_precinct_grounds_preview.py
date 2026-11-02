#!/usr/bin/env python3
"""ROOKIE Phase-5: original connected game + modular precinct-only ground art."""
from pathlib import Path
import subprocess,sys,json,hashlib
if len(sys.argv)!=2:raise SystemExit('Usage: build_v139_precinct_grounds_preview.py SITE_DIR')
root=Path(sys.argv[1]).resolve();tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v138_precinct_depth_preview.py'),str(root)],check=True)
assets=root/'assets/precinct9-ground-phase5'
m=json.loads((assets/'manifest.json').read_text('utf8'))
assert m['version']=='precinct9-phase5-ground' and m['tileSize']==32
assert m['worldPixelsPerAssetPixel']==1 and len(m['frames'])>=34
assert (assets/m['atlas']).is_file()
for f in m['frames'].values():assert (assets/f['file']).is_file()
v133=(root/'v133-precinct-campus.js').read_text('utf8')
v134=(root/'v134-precinct-reference.js').read_text('utf8')
loader=(root/'v135-precinct-wallkit-test.js').read_text('utf8')
assert "function roadPhase5(g)" in v133 and "function pavers(g" in v133
assert "plazaPavers(g,x,y,w,h)" in v134 and "forecourt" in v134
assert "function fillGround(g,id,x,y,w,h)" in loader
assert "drawStationRoof(entry.precinctShell)" in (root/'game-v115.bundle.js').read_text('utf8')
html=root/'index.html';body=html.read_text('utf8')
anchor='<script src="./v135-precinct-wallkit-test.js'
assert body.count(anchor)==1 and 'ROOKIE_V139_GROUND_ACTIVE' not in body
body=body.replace(anchor,'<script>window.ROOKIE_V139_GROUND_ACTIVE=true;</script>\n'+anchor)
body=body.replace('V138 Precinct 9 — Character / Facade Depth Fix — Review Only',
                  'V139 Precinct 9 — Phase 5 Modular Grounds — Review Only')
body=body.replace('</body>','<meta name="rookie-v139" content="existing-world-precinct-ground-tiles-no-zombie-changes"></body>')
html.write_text(body,'utf8')
for f in ['game.js','outbreak.css','v116-marina.js','v115-world.js','v117-jay.js']:
 assert (root/f).is_file(),f
print('PASS V139 exact original precinct geometry + native 32px atlas inside V133/V134 existing caches')

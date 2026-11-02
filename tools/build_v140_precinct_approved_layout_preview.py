#!/usr/bin/env python3
"""V140: approved OPTION A precinct campus design on existing continuous V139 game.

Only enables V140 coordinates in the original cached V133 terrain and V134
flag artwork. Does not introduce a scene, map, physics or a new renderer.
"""
from pathlib import Path
import subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: build_v140_precinct_approved_layout_preview.py SITE_DIR')
root=Path(sys.argv[1]).resolve();tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v139_precinct_grounds_preview.py'),str(root)],check=True)
v133=(root/'v133-precinct-campus.js').read_text('utf-8')
v115=(root/'v115-campus.js').read_text('utf-8')
v134=(root/'v134-precinct-reference.js').read_text('utf-8')
assert 'function approvedNorthGround(g)' in v133
assert 'approvedParking=Object.freeze({x:1640,y:1464,w:670,h:237})' in v133
assert 'approvedDrive=Object.freeze({x:1856,y:1450,w:146,h:271})' in v133
assert 'const trees=window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE?' in v115
assert 'if(!window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE)' in v134
html=root/'index.html';s=html.read_text('utf-8')
needle='<script src="./v135-precinct-wallkit-test.js'
assert s.count(needle)==1
assert 'window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE=true' not in s
s=s.replace(needle,'<script>window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE=true;</script>\n'+needle)
s=s.replace('V139 Precinct 9 — Phase 5 Modular Grounds — Review Only',
   'V140 Precinct 9 — Approved Campus & Clear Garage Parking — Review Only')
s=s.replace('</body>','<meta name="rookie-v140-layout" content="approved-campus-vehicle-lane-clear-plaza-native-world" /></body>')
html.write_text(s,'utf-8')
for f in ('game.js','outbreak.css','v116-marina.js','v115-world.js','v117-jay.js','v132-precinct-heritage.js'):
 assert (root/f).is_file(),f
print('PASS V140 approved Option A composition, existing game and protected systems unchanged')

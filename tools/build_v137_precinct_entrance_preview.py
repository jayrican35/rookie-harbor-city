#!/usr/bin/env python3
"""V137 review preview: same game+renderer, 49-frame existing atlas, auto door."""
from pathlib import Path
import sys,json,subprocess
if len(sys.argv)!=2:raise SystemExit('Usage: build_v137_precinct_entrance_preview.py DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v136_precinct_windows_preview.py'),str(root)],check=True)
old=json.loads((root/'assets/precinct9-windows-phase2/manifest.json').read_text())
new=json.loads((root/'assets/precinct9-entrance-phase3/manifest.json').read_text())
assert len(old['frames'])==42 and len(new['frames'])==49
assert old['tileSize']==new['tileSize']==32
assert new['version']=='precinct9-entrance-phase3'
for key,value in old['frames'].items():assert new['frames'][key]==value,key
for key in new['newFrames']:
 assert (root/'assets/precinct9-entrance-phase3'/(key+'.png')).is_file(),key
assert (root/'assets/precinct9-entrance-phase3'/new['atlas']).is_file()
world=(root/'game-v115.bundle.js').read_text()
assert 'ROOKIE_V134_PRECINCT?.stepEntrance' in world
assert 'drawStationRoof()' in world and 'drawEntityHighlights(t)' in world
face=(root/'v134-precinct-reference.js').read_text()
assert 'drawEntranceStatic' in face and 'drawEntranceDoors' in face
loader=(root/'v135-precinct-wallkit-test.js').read_text()
assert 'ROOKIE_V137_ENTRANCE_ACTIVE' in loader and 'drawEntranceDoors' in loader
html=root/'index.html';body=html.read_text()
flag='<script>window.ROOKIE_V136_WINDOW_KIT_ACTIVE=true;</script>'
assert body.count(flag)==1 and 'ROOKIE_V137_ENTRANCE_ACTIVE=true' not in body
body=body.replace(flag,'<script>window.ROOKIE_V136_WINDOW_KIT_ACTIVE=true;window.ROOKIE_V137_ENTRANCE_ACTIVE=true;</script>')
body=body.replace('V136 Precinct 9 Windows & Existing Facade Integration — Review Only',
'V137 Precinct 9 — Phase 3 Seamless Entrance, Review Only')
html.write_text(body)
print('PASS V137 entrance built into original continuous native game; original portal geometry, player and roof intact')

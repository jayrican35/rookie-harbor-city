#!/usr/bin/env python3
"""Create isolated playable V136 using existing V135 wall & V134 facade pipeline."""
from pathlib import Path
import json,subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: build_v136_precinct_windows_preview.py SITE_DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v135_precinct_wallkit_preview.py'),str(root)],check=True)
old=json.loads((root/'assets/precinct9-wall-kit-phase1/manifest.json').read_text())
new=json.loads((root/'assets/precinct9-windows-phase2/manifest.json').read_text())
assert len(old['frames'])==26 and len(new['frames'])==42
assert set(old['frames']).issubset(set(new['frames']))
for name in old['frames']:
    assert new['frames'][name]==old['frames'][name],name
for name in new['newFrames']:
    assert (root/'assets/precinct9-windows-phase2'/(name+'.png')).is_file(),name
assert (root/'assets/precinct9-windows-phase2'/new['atlas']).is_file()
old_game=(root/'game-v115.bundle.js').read_text()
assert "drawStationRoof(section='main')" in old_game and 'drawEntityHighlights(t)' in old_game
js=(root/'v134-precinct-reference.js').read_text()
assert 'drawFacadeWindow(g,x,y,w,h)' in js and 'invalidateFacade:' in js
base=(root/'v135-precinct-wallkit-test.js').read_text()
assert 'ROOKIE_V136_WINDOW_KIT_ACTIVE' in base and 'drawFacadeWindow' in base
html=root/'index.html';body=html.read_text()
anchor='<script src="./v135-precinct-wallkit-test.js'
assert body.count(anchor)==1 and 'ROOKIE_V136_WINDOW_KIT_ACTIVE=true' not in body
body=body.replace(anchor,'<script>window.ROOKIE_V136_WINDOW_KIT_ACTIVE=true;</script>\n'+anchor)
body=body.replace('V135 Precinct 9 Wall Kit — Phase 1 Test Assembly',
 'V136 Precinct 9 Windows & Existing Facade Integration — Review Only')
html.write_text(body)
print('PASS isolated V136 40-frame combined atlas, V134 existing facade, original roof and door system')

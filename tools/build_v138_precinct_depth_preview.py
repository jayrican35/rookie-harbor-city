#!/usr/bin/env python3
"""Single existing V137 Canvas world with only precinct façade actor depth fixed."""
from pathlib import Path
import subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: build_v138_precinct_depth_preview.py DIR')
root=Path(sys.argv[1]).resolve()
subprocess.run([sys.executable,str(Path(__file__).resolve().parent/'build_v137_precinct_entrance_preview.py'),str(root)],check=True)
world=(root/'game-v115.bundle.js').read_text('utf8')
facade=(root/'v134-precinct-reference.js').read_text('utf8')
assert "precinctShell:'main'" in world and "precinctShell:'garage'" in world
assert "drawStationRoof(entry.precinctShell)" in world
assert "entries.sort((a,b)=>a.y-b.y)" in world
assert "o.section!=='garage'" in facade and "o.section!=='main'" in facade
assert "ROOKIE_V137_ENTRANCE_ACTIVE" in facade
html=root/'index.html'
body=html.read_text('utf8').replace('V137 Precinct 9 — Phase 3 Seamless Entrance, Review Only',
 'V138 Precinct 9 — Character / Facade Depth Fix — Review Only')
body=body.replace('</body>','<meta name="rookie-v138-precinct" content="feet-based-shell-occlusion-no-gameplay-changes" /></body>')
html.write_text(body,'utf8')
print('PASS original continuous world, original roof/facade joined existing actor feet-depth queue')

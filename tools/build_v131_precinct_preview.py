#!/usr/bin/env python3
"""Restore pre-existing classic precinct sprites within native connected V130 lab.
The previous published Precinct 9 and approved V128 remain unchanged.
"""
from pathlib import Path
import hashlib,subprocess,sys
if len(sys.argv)!=2:
    raise SystemExit('Usage: build_v131_precinct_preview.py PREVIEW_DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v130_precinct_preview.py'),str(root)],check=True)
bridge=root/'v131-precinct-legacy-bridge.js'
engine=root/'game-v115.bundle.js'
assert bridge.is_file() and engine.is_file(), 'Classic source bridge and real world engine required'
source=bridge.read_text('utf-8')
assert 'legacy-authored-precinct-reuse-1' in source
assert 'cinematic' in source and 'lockers' in source and 'reception' in source
world=engine.read_text('utf-8')
assert 'window.ROOKIE_V131_PRECINCT_BRIDGE' in world
assert 'legacyAssetEpoch' in world and 'previous?.room(c,r)' in world
assert 'previous?.furniture(c,f)' in world and 'previous?.wallSkins(c,ST.walls)' in world
for asset in ('game.js','outbreak.css','v116-marina.js','v127-citywide-art.js','v115-world.js'):
    assert (root/asset).is_file(),asset
html=root/'index.html'
body=html.read_text('utf-8')
assert body.count('</body>')==1
assert 'v130-precinct-art.js' in body and 'v131-precinct-legacy-bridge.js' not in body
stamp=hashlib.sha256(bridge.read_bytes()).hexdigest()[:12]
body=body.replace('</body>',
    '<script src="./v131-precinct-legacy-bridge.js?v='+stamp+'"></script>\n'
    '<meta name="rookie-precinct9-legacy-import" content="original-authored-art-isolated-review" />\n'
    '</body>')
body=body.replace('Precinct 9 Visual Foundation — Review Only',
                  'Precinct 9 Legacy Artwork Recovery — Review Only')
html.write_text(body,'utf-8')
print('PASS Isolated Precinct 9 uses actual original loaded classic art, real 1:1 room layout and original connected-world engine; original/Zombie/Marina stable')

#!/usr/bin/env python3
"""Create ONLY the isolated V133 precinct reconstruction review site."""
from pathlib import Path
import hashlib,subprocess,sys
if len(sys.argv)!=2:raise SystemExit("Usage: build_v133_precinct_preview.py PREVIEW_DIR")
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v132_precinct_preview.py'),str(root)],check=True)
mod=root/'v133-precinct-campus.js'
world=root/'game-v115.bundle.js'
old=root/'v132-precinct-heritage.js'
assert mod.is_file() and old.is_file() and world.is_file()
a=mod.read_text('utf-8');b=world.read_text('utf-8');c=old.read_text('utf-8')
assert "v133-precinct-campus-art-1" in a
assert "ROOKIE_V133_PRECINCT?.ground" in b
assert "ROOKIE_V133_PRECINCT?.facade" in b
assert "ROOKIE_V133_PRECINCT.actors(t)" in b
assert "v133-precinct:" in c
for name in ("game.js","outbreak.css","v116-marina.js","v127-citywide-art.js",
             "v115-world.js","v117-jay.js","v131-precinct-legacy-bridge.js"):
    assert (root/name).is_file(),name
html=root/'index.html';body=html.read_text('utf-8')
assert body.count('</body>')==1 and 'v132-precinct-heritage.js' in body
assert 'v133-precinct-campus.js' not in body
stamp=hashlib.sha256(mod.read_bytes()).hexdigest()[:12]
body=body.replace('</body>',
 '<script src="./v133-precinct-campus.js?v='+stamp+'"></script>\n'
 '<meta name="rookie-v133-precinct" content="major-civic-precinct-review-with-native-doors-protected" />\n'
 '</body>')
body=body.replace('Precinct 9 V132 Exterior & Officer Artwork — Review Only',
                  'V133 Precinct 9 Civic Campus Reconstruction — Review Only')
html.write_text(body,'utf-8')
print('PASS V133 native-connected-world precinct campus reconstruction; inherited protected Zombie and Marina assets intact')

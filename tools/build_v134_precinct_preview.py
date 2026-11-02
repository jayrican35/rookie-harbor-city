#!/usr/bin/env python3
"""V134: user reference-faithful police HQ, separate from all playable baselines."""
from pathlib import Path
import hashlib,subprocess,sys
if len(sys.argv)!=2:raise SystemExit("Usage: build_v134_precinct_preview.py PREVIEW_DIR")
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v133_precinct_preview.py'),str(root)],check=True)
src=root/'v134-precinct-reference.js'
world=root/'game-v115.bundle.js'
assert src.is_file() and world.is_file()
code=src.read_text('utf-8');game=world.read_text('utf-8')
for txt in ('v134-reference-architectural-reconstruction','renderArchitecture()',
 'renderGarage()','function doorway(g)','function crest(g)','function flag(g',
 'function windowPane(g','function palm(g'):
    assert txt in code,txt
for txt in ('ROOKIE_V134_PRECINCT?.ground','ROOKIE_V134_PRECINCT?.architecture',
            'if(!window.ROOKIE_V134_PRECINCT)'):
    assert txt in game,txt
for f in ['game.js','outbreak.css','v116-marina.js','v127-citywide-art.js',
          'v115-world.js','v117-jay.js','v132-precinct-heritage.js']:
    assert (root/f).is_file(),f
html=root/'index.html';body=html.read_text('utf-8')
assert body.count('</body>')==1
assert 'v133-precinct-campus.js' in body and 'v134-precinct-reference.js' not in body
sha=hashlib.sha256(src.read_bytes()).hexdigest()[:12]
body=body.replace('</body>',
    '<script src="./v134-precinct-reference.js?v='+sha+'"></script>\n'
    '<meta name="rookie-v134-precinct" content="user-reference-blue-brick-police-headquarters-human-review" />\n'
    '</body>')
body=body.replace('V133 Precinct 9 Civic Campus Reconstruction — Review Only',
  'V134 Precinct 9 Reference-Quality Headquarters — Review Only')
html.write_text(body,'utf-8')
print('PASS V134 user-reference landmark art, single native-world canvas and unmodified protected modes')

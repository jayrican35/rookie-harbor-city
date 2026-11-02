#!/usr/bin/env python3
"""Precinct 9 visual lab, based on the last browser-verified V128 build.
This writes ONLY a separate test site; V128/game.js/Zombie/Marina are untouched.
"""
from pathlib import Path
import hashlib,subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: build_v130_precinct_preview.py PREVIEW_DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v128_preview.py'),str(root)],check=True)
adapter=root/'v130-precinct-art.js'
compiled=root/'game-v115.bundle.js'
assert adapter.is_file() and compiled.is_file()
text=adapter.read_text('utf-8')
bundle=compiled.read_text('utf-8')
assert "version:'precinct9-visual-foundation-1'" in text
assert 'precinctVisual.ground(g,' in bundle
assert 'precinctVisual.frontage(g,' in bundle
for name in ['game.js','outbreak.css','v116-marina.js','v127-citywide-art.js']:
    assert (root/name).is_file(),name
htmlFile=root/'index.html'
html=htmlFile.read_text('utf-8')
assert html.count('</body>')==1 and 'v130-precinct-art.js' not in html
stamp=hashlib.sha256(adapter.read_bytes()).hexdigest()[:12]
html=html.replace('</body>',
    '<script src="./v130-precinct-art.js?v='+stamp+'"></script>\n'
    '<meta name="rookie-precinct9-lab" content="isolated-visual-review-not-approved" />\n'
    '</body>')
html=html.replace('Harbor City World Completion Candidate',
                  'Precinct 9 Visual Foundation — Review Only')
htmlFile.write_text(html,'utf-8')
print('PASS Precinct 9 lab only: source-protected V128 single world, isolated native-coordinate frontage/parking art')

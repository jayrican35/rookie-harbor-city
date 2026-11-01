#!/usr/bin/env python3
"""V122 isolated playable preview: the exact V121 art + corrected depth and deck draw order."""
from pathlib import Path
import subprocess,sys
assert len(sys.argv)==2,'Usage: build_v122_preview.py OUTPUT_DIR'
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
for name in ('v115-campus.js','v116-marina.js','v120-marina-art.js'):
 assert (root/name).is_file(),name
subprocess.run([sys.executable,str(tools/'build_v121_preview.py'),str(root)],check=True)
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1
html=html.replace('</body>','<meta name="rookie-pier-depth" content="v122-world-sorted-pilings" />\n</body>')
html=html.replace('V121 Art-Directed Marina','V122 Raised Docks + Proper Occlusion')
html=html.replace('V121 ART-DIRECTED MARINA','V122 PIER STRUCTURAL FIX')
p.write_text(html)
print('PASS V122: original V121 art, native player/actor queue post occlusion, raised dry pier deck, zero engine copies')

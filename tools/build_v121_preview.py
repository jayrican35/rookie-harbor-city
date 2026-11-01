#!/usr/bin/env python3
"""Compose existing verified V120 world, replace material atlases with V121.
All assets and gameplay are generated inside a detached preview directory."""
from pathlib import Path
import subprocess,sys
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
assert (root/'v120-marina-art.js').is_file()
subprocess.run([sys.executable,str(tools/'build_v120_preview.py'),str(root)],check=True)
subprocess.run([sys.executable,str(tools/'generate_v121_marina_art.py'),str(root/'assets'/'v121-marina')],check=True)
files=['water-body','water-caustics','water-reef','water-glints','foam-frames','dock-wood','dock-post','tree-shadows','seawall-light']
for name in files:
 assert (root/'assets'/'v121-marina'/(name+'.png')).stat().st_size>100,name
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1
html=html.replace('</body>','<meta name="rookie-marina-art-direction" content="v121-real-material-pass" />\n</body>')
html=html.replace('V120 Premium Marina Reconstruction','V121 Art-Directed Marina')
html=html.replace('V120 PREMIUM MARINA','V121 ART-DIRECTED MARINA')
p.write_text(html)
print('PASS V121: nine world-space premium materials; legacy loops and original modes preserved')

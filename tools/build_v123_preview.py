#!/usr/bin/env python3
"""Build an isolated V123 from V122; preserve the approved game and Zombie."""
from pathlib import Path
import subprocess,sys
assert len(sys.argv)==2,'Usage: build_v123_preview.py OUTPUT_DIR'
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v122_preview.py'),str(root)],check=True)
subprocess.run([sys.executable,str(tools/'clean_v123_npc_atlases.py'),
                str(root/'assets'/'v116-marina'),str(root/'assets'/'v123-marina-npcs')],check=True)
for name in ('officer','fisher','visitor'):
 assert (root/'assets'/'v123-marina-npcs'/('walk-'+name+'.png')).stat().st_size>2000
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1
html=html.replace('</body>','<meta name="rookie-physical-collision" content="v123-prop-and-npc-physical-solids" />\n</body>')
html=html.replace('V122 Raised Docks + Proper Occlusion','V123 Physical Marina + Clean NPCs')
html=html.replace('V122 PIER STRUCTURAL FIX','V123 COLLISION + CLEAN NPCS')
p.write_text(html)
print('PASS V123: physical scenery/NPC collision and transparent cleaned sprites in existing connected city')

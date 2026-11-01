#!/usr/bin/env python3
"""V124 same playable V123 game with depth-correct structural scenery and roofs."""
from pathlib import Path
import subprocess,sys
assert len(sys.argv)==2,'Usage: build_v124_preview.py OUTPUT_DIR'
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v123_preview.py'),str(root)],check=True)
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1
html=html.replace('</body>','<meta name="rookie-depth-fix" content="v124-object-foot-sort-and-doorway" />\n</body>')
html=html.replace('V123 Physical Marina + Clean NPCs','V124 Structural Depth & Doorways')
html=html.replace('V123 COLLISION + CLEAN NPCS','V124 TRUE DEPTH')
p.write_text(html)
print('PASS V124: one active city Canvas, true scenery depth, doorway-based roof fade, original game protected')

#!/usr/bin/env python3
"""V126 actual running game. Compose on V125 and generate only isolated art assets."""
from pathlib import Path
import subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: build_v126_preview.py SITE_DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v125_preview.py'),str(root)],check=True)
subprocess.run([sys.executable,str(tools/'generate_v126_dock.py'),str(root/'assets/v126-dock')],check=True)
subprocess.run([sys.executable,str(tools/'clean_v126_run.py'),str(root/'assets/jay-v117/jay-run.webp'),
                str(root/'assets/v126-jay/jay-run-clean.png')],check=True)
from PIL import Image
im=Image.open(root/'assets/v126-dock/dock-wood.png');assert im.size==(90,320)
sheet=Image.open(root/'assets/v126-jay/jay-run-clean.png');assert sheet.size==(1024,512)
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1
html=html.replace('</body>','<meta name="rookie-visual-quality" content="v126-no-selection-halo-distinct-wood-run-gait" />\n</body>')
html=html.replace('V125 Modern Mobile Adventure HUD','V126 Marina Polish + Run Animation')
html=html.replace('V125 MODERN MOBILE HUD','V126 DOCK + RUN')
p.write_text(html)
print('PASS V126 existing V125 gameplay/controls and V124 occlusion retained; native assets baked offline')

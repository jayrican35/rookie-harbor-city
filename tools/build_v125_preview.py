#!/usr/bin/env python3
"""V125: one actual playable connected Harbor City world, with only its campaign UI restyled."""
from pathlib import Path
import subprocess,sys,hashlib
if len(sys.argv)!=2:raise SystemExit('Usage: build_v125_preview.py OUTPUT_DIR')
root=Path(sys.argv[1]).resolve();tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v124_preview.py'),str(root)],check=True)
css=root/'v125-mobile-hud.css'
assert css.stat().st_size>2000
p=root/'index.html';html=p.read_text()
assert html.count('</head>')==1 and 'v125-mobile-hud.css' not in html
stamp=hashlib.sha256(css.read_bytes()).hexdigest()[:12]
html=html.replace('</head>',f'<link rel="stylesheet" href="./v125-mobile-hud.css?v={stamp}" />\n</head>')
html=html.replace('</body>','<meta name="rookie-hud" content="v125-native-campaign-ui" />\n</body>')
html=html.replace('V124 Structural Depth & Doorways','V125 Modern Mobile Adventure HUD')
html=html.replace('V124 TRUE DEPTH','V125 MODERN MOBILE HUD')
p.write_text(html)
print('PASS V125: existing game HTML/Canvas, existing canonical HUD and joystick state; one CSS layer only; no Zombie modifications')

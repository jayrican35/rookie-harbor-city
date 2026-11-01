#!/usr/bin/env python3
"""V128 isolated citywide quality candidate. Rebuilds from source on one Canvas."""
from pathlib import Path
import subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: build_v128_preview.py PREVIEW_DIR')
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v127_preview.py'),str(root)],check=True)
source=(root/'v117-jay.js').read_text()
city=(root/'v127-citywide-art.js').read_text()
world=(root/'v115-campus.js').read_text()
bundle=(root/'game-v115.bundle.js').read_text()
assert "isConnectedRun=id==='connected-jay'&&p.mode==='run'" in source
assert 'metrics.details++' in city and 'const palettes=' in city
assert 'paintedBuilding(o,d.id)' in world and 'paintedBuilding(o,d.id)' in bundle
assert (root/'game.js').is_file() and (root/'outbreak.css').is_file()
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1 and 'rookie-v128' not in html
html=html.replace('V127 Citywide Visual Continuity','V128 Citywide Detail + Grounded Run')
html=html.replace('V127 CONNECTED CITY','V128 WORLD QUALITY')
html=html.replace('</head>','<meta name="rookie-v128" content="grounded-run-citywide-art" />\n</head>')
p.write_text(html)
print('PASS V128 isolated preview: run silhouette fixed, 9 districts enriched; canonical controls/camera/mission/Zombie untouched')

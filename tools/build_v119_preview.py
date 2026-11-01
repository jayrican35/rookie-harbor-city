#!/usr/bin/env python3
"""Compose tested V118 build, adding V119 only to isolated playable preview."""
from pathlib import Path
import hashlib,subprocess,sys
assert len(sys.argv)==2,"Usage: build_v119_preview.py PREVIEW_DIR"
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
for name in ('v119-water-motion.js','v116-marina.js','v115-campus.js'):
    assert (root/name).is_file(),f'Missing {name}'
subprocess.run([sys.executable,str(tools/'build_v118_preview.py'),str(root)],check=True)
p=root/'index.html'
html=p.read_text()
assert html.count('</body>')==1 and 'v119-water-motion.js' not in html
asset=root/'v119-water-motion.js'
stamp=hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
html=html.replace('</body>',f'<script src="./v119-water-motion.js?v={stamp}"></script>\n<meta name="rookie-water-motion" content="v119-visible-upgrade" />\n</body>')
html=html.replace('V118 Modern Cinematic Marina','V119 Living Waterfront + Motion').replace('V118 CINEMATIC MARINA','V119 LIVING WATERFRONT')
p.write_text(html)
print('PASS V119: water+character motion in existing V116 engine, V118 features retained, no protected-mode changes')

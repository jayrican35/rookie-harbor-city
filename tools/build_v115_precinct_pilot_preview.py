#!/usr/bin/env python3
"""Extend one isolated V115 reference build with an authored Precinct 9 tilemap.
Does not touch original game.js, collision, campaign, other previews or Zombie.
"""
from pathlib import Path
import sys
if len(sys.argv)!=2:raise SystemExit('Usage: ... SITE_PREVIEW_DIR')
root=Path(sys.argv[1]);html=(root/'index.html').read_text()
assert html.count('<script src="./v115-premium-art.js"></script>')==1
assert html.count('</head>')==1
assert 'src="./v115-precinct-pilot.js"' not in html
save=(root/'v115-preview-save-isolation.js').read_text()
assert any(p in save for p in ('rookie:v115-precinct-pilot-sandbox:', 'rookie:v116-marina-sandbox:'))
html=html.replace('</head>', '<link rel="stylesheet" href="./v115-precinct-pilot.css" />\n</head>')
html=html.replace('<script src="./v115-premium-art.js"></script>',
 '<script src="./v115-premium-art.js"></script>\n<script src="./v115-precinct-pilot.js"></script>')
html=html.replace('V115 DEV BUILD','V115 PRECINCT ART PILOT')
(root/'index.html').write_text(html)
assert 'v115-precinct-pilot.js' in html and 'v115-precinct-pilot.css' in html
print('V115 PRECINCT PILOT: isolated preview entrypoint enabled')
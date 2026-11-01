#!/usr/bin/env python3
"""Inject isolated V116 Southbay renderer; all previous features and source remain unchanged."""
from pathlib import Path
import sys
assert len(sys.argv)==2,'Usage: build_v116_preview.py SITE_PREVIEW_DIR'
root=Path(sys.argv[1]);p=root/'index.html';html=p.read_text()
for name in ['v116-marina.js','v116-marina-hud.js','v116-marina.css','v115-campus.js','game-v115.bundle.js','v115-precinct-pilot.js']:
 assert (root/name).is_file(),f'Missing {name}'
assert 'rookie:v116-marina-sandbox:' in (root/'v115-preview-save-isolation.js').read_text()
needle='<script src="./v115-precinct-pilot.js"></script>'
assert html.count(needle)==1
assert 'src="./v116-marina.js"' not in html
html=html.replace('</head>','<link rel="stylesheet" href="./v116-marina.css" />\n<meta name="rookie-build" content="v116-southbay-marina" />\n</head>')
html=html.replace(needle,needle+'\n<script src="./v116-marina.js"></script>\n<script src="./v116-marina-hud.js"></script>')
html=html.replace('V115 PRECINCT ART PILOT','V116 MARINA PLAYTEST')
p.write_text(html)
print('V116_MARINA_BUILD_OK — connected gameplay city, independent saves, engine unchanged')
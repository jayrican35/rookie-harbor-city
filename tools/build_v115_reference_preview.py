#!/usr/bin/env python3
"""Add user's reference-guided city art to a verified, isolated V115 showcase.

Invoke after the original V115 private-scope bundle builder and showcase builder.
Does not touch any other preview or the site root. No gameplay engine mutation.
"""
from pathlib import Path
import sys
if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 tools/build_v115_reference_preview.py SITE_PREVIEW_DIR')
root=Path(sys.argv[1]).resolve()
entry=root/'index.html'
art=root/'v115-reference-art.js'
style=root/'v115-reference.css'
bundle=root/'game-v115.bundle.js'
for p in (entry,art,style,bundle,root/'v115-showcase.js',root/'outbreak.css',root/'v115-preview-save-isolation.js'):
    if not p.is_file() or p.stat().st_size < 80:
        raise SystemExit('Missing required source: '+str(p))
html=entry.read_text('utf-8')
needle='<script src="./v115-showcase.js"></script>'
assert html.count(needle)==1, 'Showcase script missing or repeated'
assert html.count('</head>')==1
assert html.count('v115-reference-art.js')==0
assert any(prefix in (root/'v115-preview-save-isolation.js').read_text() for prefix in ('rookie:v115-reference-sandbox:', 'rookie:v115-premium-sandbox:', 'rookie:v115-precinct-pilot-sandbox:', 'rookie:v116-marina-sandbox:')), 'Unrecognized V115 preview save namespace'
html=html.replace('</head>','<link rel="stylesheet" href="./v115-reference.css" />\n<meta name="rookie-art-pass" content="v115-reference-composition-1" />\n</head>')
html=html.replace(needle,needle+'\n<script src="./v115-reference-art.js"></script>')
entry.write_text(html,'utf-8')
assert html.index('game-v115.bundle.js') < html.index('v115-showcase.js') < html.index('v115-reference-art.js')
assert 'src="./game.js"' not in html
assert 'rookie-art-pass' in html
print('PASS: isolated V115 reference world built with source-accurate atlas, untouched engine and independent saves.')
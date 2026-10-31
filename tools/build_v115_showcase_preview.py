#!/usr/bin/env python3
"""Add visual benchmark to an ALREADY isolated V115 preview.
Usage: python3 tools/build_v115_showcase_preview.py <site/preview/v115-showcase>
Production /, V113/V114, ordinary V115, and Zombie Outbreak are never edited.
"""
from pathlib import Path
import sys
if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 tools/build_v115_showcase_preview.py SITE_PREVIEW_DIR')
root=Path(sys.argv[1]).resolve()
index=root/'index.html'
addon=root/'v115-showcase.js'
style=root/'v115-showcase.css'
bundle=root/'game-v115.bundle.js'
for p in (index,addon,style,bundle):
    if not p.is_file() or p.stat().st_size<300:
        raise SystemExit('Missing V115 showcase file: '+str(p))
html=index.read_text('utf-8')
bundle_script='<script src="./game-v115.bundle.js"></script>'
assert html.count(bundle_script)==1,'Expected private-scope V115 bundle exactly once'
assert html.count('</head>')==1 and html.count('</body>')==1
assert 'v115-preview-save-isolation.js' in html
assert html.index('v115-preview-save-isolation.js')<html.index(bundle_script)
assert 'v115-showcase.js' not in html and 'v115-showcase.css' not in html
html=html.replace('</head>',
    '<link rel="stylesheet" href="./v115-showcase.css" />\n'
    '<meta name="rookie-visual-benchmark" content="v115-precinct-midtown-1" />\n</head>')
html=html.replace(bundle_script,bundle_script+'\n<script src="./v115-showcase.js"></script>')
index.write_text(html,'utf-8')
assert html.index(bundle_script)<html.index('v115-showcase.js')
assert 'src="./game.js"' not in html
print('PASS: visual showcase scoped to isolated /preview/v115-showcase/')
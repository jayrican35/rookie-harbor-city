#!/usr/bin/env python3
"""Inject V115 premium environment assets into isolated reference-world preview.
Run AFTER build_v115_preview.py, build_v115_showcase_preview.py and
build_v115_reference_preview.py. Never edits the root site or other previews.
"""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 tools/build_v115_premium_preview.py SITE_PREVIEW_DIR')
root=Path(sys.argv[1]).resolve()
files=['v115-premium-art.js','v115-premium.css','v115-reference-art.js','v115-preview-save-isolation.js','game-v115.bundle.js']
for file in files:
    item=root/file
    assert item.exists() and item.stat().st_size>80,f'Missing required file: {item}'
assets=['mountain-north.svg','waterfall-cliff.svg','marina-lighthouse.svg','marina-sailboat-1.svg','marina-sailboat-2.svg']
for file in assets:
    p=root/'assets'/'v115-premium'/file
    assert p.is_file() and p.stat().st_size>350,f'Missing visual asset: {p}'
    parsed=ET.parse(p)
    assert parsed.getroot().tag.endswith('svg'),f'Invalid SVG: {p}'
    raw=p.read_text()
    assert '<script' not in raw and 'http://' not in raw and '<foreignObject' not in raw, f'Unsafe SVG: {p}'
htmlpath=root/'index.html';html=htmlpath.read_text()
needle='<script src="./v115-reference-art.js"></script>'
assert html.count(needle)==1,'Reference world script missing or repeated'
assert html.count('</head>')==1
assert 'v115-premium-art.js' not in html
assert 'rookie:v115-premium-sandbox:' in (root/'v115-preview-save-isolation.js').read_text()
html=html.replace('</head>','<link rel="stylesheet" href="./v115-premium.css" />\n<meta name="rookie-art-pass" content="v115-premium-environment-2" />\n</head>')
html=html.replace(needle,needle+'\n<script src="./v115-premium-art.js"></script>')
assert html.index('game-v115.bundle.js')<html.index('v115-reference-art.js')<html.index('v115-premium-art.js')
htmlpath.write_text(html)
print('PASS: V115 premium environment sprites integrated with independent save namespace.')